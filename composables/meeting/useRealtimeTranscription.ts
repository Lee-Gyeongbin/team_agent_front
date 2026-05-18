/**
 * OpenAI Realtime API WebSocket 기반 실시간 음성 인식
 *
 * 흐름:
 * 1. 백엔드에서 ephemeral token 발급 (GET /api/meeting/realtime-token)
 * 2. WebSocket → wss://api.openai.com/v1/realtime?intent=transcription
 * 3. AudioContext PCM16(24kHz mono) → WebSocket 스트리밍 (실시간 자막)
 * 4. MediaRecorder(webm) → 전체 세션 녹음 → 회의 종료 시 백엔드 일괄 전사
 *
 * 자막 블록 2단계:
 * - interim  : delta 이벤트 수신 중 (회색, 이탤릭, 흐릿)
 * - confirmed: completed 수신 완료 (검정, 정상)
 *
 * 화자 분리는 청크 단위로 하지 않고, 회의 종료 후 전체 오디오를 백엔드에서 일괄 처리한다.
 * (청크별 diarize는 매 청크마다 화자 레이블이 리셋되어 일관성 없음)
 */

import type { TranscriptBlock } from '~/types/meeting'
import { useMeetingApi } from '~/composables/meeting/useMeetingApi'

const REALTIME_WS_URL = 'wss://api.openai.com/v1/realtime?intent=transcription'
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000 // 10분

// ─── module-scope 상태 (컴포넌트 간 공유) ─────────────────────────
const isRecording = ref(false)
const isConnecting = ref(false)
const isSupported = ref(false)
const blocks = ref<TranscriptBlock[]>([])

// ─── 내부 변수 ─────────────────────────────────────────────────────
let ws: WebSocket | null = null
let audioCtx: AudioContext | null = null
let mediaStream: MediaStream | null = null
let scriptProcessor: ScriptProcessorNode | null = null

// mainRecorder: 전체 세션 녹음 (finishMeetingWithAudio용 전체 Blob)
let mainRecorder: MediaRecorder | null = null
let mainChunks: Blob[] = []

// 자동 저장 (백업)
let autoSaveTimer: ReturnType<typeof setInterval> | null = null
let autoSaveIndex: number = 0
let lastSavedChunkCount: number = 0 // 마지막 저장 시점의 mainChunks 길이

/**
 * WebM 헤더 청크 — MediaRecorder 첫 번째 ondataavailable 청크에만 포함됨
 * (EBML header + Segment Info + Tracks 등)
 * 이후 incremental 백업 파일 생성 시 반드시 앞에 붙여야 재생 가능한 WebM이 됨
 */
let headerChunk: Blob | null = null

let mimeType = ''
let currentInterimId: string | null = null

// 재연결 관련
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts: number = 0
const MAX_RECONNECT_ATTEMPTS = 5

const { fetchRealtimeToken } = useMeetingApi()

// ─── 유틸 ──────────────────────────────────────────────────────────
const genId = () => `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/** Float32Array → PCM16 Int16Array */
const float32ToPcm16 = (input: Float32Array): Int16Array => {
  const out = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

/** ArrayBufferLike → base64 string */
const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** 브라우저에서 지원하는 webm MIME 타입 선택 */
const getSupportedMimeType = (): string => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

/** transcription_session.update 전송 */
const sendSessionUpdate = () => {
  ws?.send(
    JSON.stringify({
      type: 'session.update',
      session: {
        audio: {
          input: {
            transcription: {
              model: 'gpt-4o-mini-transcribe',
              language: 'ko',
            },
            noise_reduction: { type: 'far_field' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        },
      },
    }),
  )
}

// ─── WebSocket 초기화 ──────────────────────────────────────────────
const initWebSocket = (token: string) => {
  ws = new WebSocket(REALTIME_WS_URL, ['realtime', `openai-insecure-api-key.${token}`])

  ws.onopen = () => {
    // onopen 시점에는 아직 session.created 이전이므로 연결 상태만 유지
    // isConnecting 해제는 session.created / transcription_session.created 수신 시 처리
  }

  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data as string)
      const type: string = msg.type ?? ''

      if (type === 'session.created' || type === 'transcription_session.created') {
        isConnecting.value = false
        sendSessionUpdate()
      } else if (type === 'error') {
        console.error('[Realtime] 서버 에러:', msg.error?.message ?? JSON.stringify(msg.error))
      } else if (type === 'conversation.item.input_audio_transcription.delta') {
        const delta: string = msg.delta ?? ''
        if (!delta) return

        if (!currentInterimId) {
          const id = genId()
          blocks.value.push({ id, status: 'interim', text: delta })
          currentInterimId = id
        } else {
          const idx = blocks.value.findIndex((b) => b.id === currentInterimId)
          if (idx !== -1) {
            blocks.value[idx] = { ...blocks.value[idx], text: blocks.value[idx].text + delta }
          }
        }
      } else if (type === 'conversation.item.input_audio_transcription.completed') {
        const finalText: string = msg.transcript ?? msg.text ?? ''
        if (currentInterimId) {
          const idx = blocks.value.findIndex((b) => b.id === currentInterimId)
          if (idx !== -1) {
            blocks.value[idx] = { ...blocks.value[idx], status: 'confirmed', text: finalText }
          }
          currentInterimId = null
        }
      }
    } catch (e) {
      console.warn('[Realtime] WS 메시지 파싱 실패:', e)
    }
  }

  ws.onerror = () => {
    isConnecting.value = false
    console.warn('[Realtime] WebSocket 연결 오류')
  }

  ws.onclose = () => {
    isConnecting.value = false
    // 녹음 중에 WS가 끊기면 재연결 시도 (자동저장 시 네트워크 부하 등으로 끊길 수 있음)
    if (isRecording.value && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(2000 * 2 ** reconnectAttempts, 30000)
      console.warn(
        `[Realtime] WS 끊김 — ${delay}ms 후 재연결 시도 (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
      )
      reconnectTimer = setTimeout(async () => {
        reconnectAttempts++
        try {
          const tokenRes = await fetchRealtimeToken()
          if (!tokenRes.token) throw new Error('토큰 발급 실패')
          initWebSocket(tokenRes.token)
          console.info('[Realtime] WS 재연결 성공')
          reconnectAttempts = 0
        } catch (e) {
          console.warn('[Realtime] WS 재연결 실패:', e)
        }
      }, delay)
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Realtime] WS 재연결 한도 초과 — 재연결 중단')
    }
  }
}

// ─── AudioContext PCM16 스트리밍 ────────────────────────────────────
const initAudioStreaming = () => {
  if (!mediaStream) return

  audioCtx = new AudioContext({ sampleRate: 24000 })
  const source = audioCtx.createMediaStreamSource(mediaStream)

  // ScriptProcessorNode: deprecated 이나 모든 브라우저에서 지원
  scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1)
  source.connect(scriptProcessor)
  scriptProcessor.connect(audioCtx.destination)

  scriptProcessor.onaudioprocess = (e) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const float32 = e.inputBuffer.getChannelData(0)
    const pcm16 = float32ToPcm16(float32)
    const base64 = arrayBufferToBase64(pcm16.buffer)
    ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }))
  }
}

// ─── MediaRecorder 초기화 ─────────────────────────────────────────
const initMediaRecorder = () => {
  if (!mediaStream) return

  mimeType = getSupportedMimeType()

  // 전체 세션 녹음용 (finishMeetingWithAudio에 전달할 전체 Blob)
  mainChunks = []
  headerChunk = null
  mainRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)
  mainRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      mainChunks.push(e.data)
      // 첫 번째 청크에 WebM EBML 헤더가 포함됨 — incremental 백업 시 재사용
      if (headerChunk === null) headerChunk = e.data
    }
  }
  mainRecorder.start(1000)
}

// ─── 자동 저장 (백업) ──────────────────────────────────────────────

/**
 * 10분마다 마지막 저장 이후 새로 쌓인 청크를 NCP에 업로드
 *
 * backup_0.webm = 0~10분 (헤더 포함, 그대로 재생 가능)
 * backup_1.webm = 헤더 + 10~20분 청크 (헤더를 앞에 붙여야 재생 가능한 WebM이 됨)
 * backup_2.webm = 헤더 + 20~30분 청크
 *
 * WebM은 첫 청크에만 EBML 헤더가 들어가므로, 이후 구간 파일에는
 * headerChunk를 앞에 붙여야 독립적으로 재생 가능한 파일이 됨
 * → ffmpeg concat 시 각 파일을 개별 input으로 처리하면 중복 헤더도 문제 없음
 */
const startAutoSave = (meetingId: string) => {
  stopAutoSave()
  const { fetchUploadBackupAudio } = useMeetingApi()
  autoSaveTimer = setInterval(async () => {
    const newChunks = mainChunks.slice(lastSavedChunkCount)
    if (newChunks.length === 0) return

    const filename = `backup_${autoSaveIndex++}.webm`

    // 첫 번째 구간(backup_0)은 헤더가 이미 포함되어 있음
    // 이후 구간은 headerChunk를 앞에 붙여 독립 재생 가능한 파일로 만듦
    const chunksToSave = lastSavedChunkCount > 0 && headerChunk ? [headerChunk, ...newChunks] : newChunks
    const blob = new Blob(chunksToSave, { type: mimeType || 'audio/webm' })

    try {
      await fetchUploadBackupAudio(Number(meetingId), blob, filename)
      lastSavedChunkCount = mainChunks.length // 저장 완료 지점 갱신
      console.info('[AutoSave] 백업 완료:', filename)
    } catch (e) {
      console.warn('[AutoSave] 백업 업로드 실패:', e)
      // 실패 시 lastSavedChunkCount 미갱신 → 다음 주기에 재시도
      autoSaveIndex-- // 실패한 인덱스 되돌리기
    }
  }, AUTO_SAVE_INTERVAL_MS)
}

/**
 * 페이지 이탈 시 마지막 auto-save 이후 남은 청크를 sendBeacon으로 즉시 전송
 * beforeunload 핸들러에서 동기적으로 호출해야 함
 * sendBeacon은 브라우저가 비동기 큐에 넣어 전송 보장 (단, 페이로드 크기 제한 있음)
 */
const sendRemainingChunksBeacon = (meetingId: string): boolean => {
  const remainingChunks = mainChunks.slice(lastSavedChunkCount)
  if (remainingChunks.length === 0) return true

  // 이전에 저장된 구간이 있으면 헤더 청크를 앞에 붙여 독립 재생 가능하게 함
  const chunksToSend = lastSavedChunkCount > 0 && headerChunk ? [headerChunk, ...remainingChunks] : remainingChunks
  const blob = new Blob(chunksToSend, { type: mimeType || 'audio/webm' })
  const filename = `backup_${autoSaveIndex}.webm`
  const formData = new FormData()
  formData.append('audioFile', blob, filename)
  const sent = navigator.sendBeacon(`/api/meeting/${meetingId}/backup-audio`, formData)
  if (sent) {
    console.info('[UnloadSave] 남은 청크 beacon 전송:', filename, `${blob.size}bytes`)
  } else {
    console.warn('[UnloadSave] beacon 전송 실패 (페이로드 초과 가능성)')
  }
  return sent
}

/**
 * 이어서 녹음 후 종료 시 — auto-save 이후 남은 청크를 마지막 백업 파일로 업로드
 * sendRemainingChunksBeacon의 async 버전 (회의 종료 플로우에서 사용)
 * stopRecording() 호출 이후 mainChunks가 확정된 시점에 호출해야 함
 */
const uploadRemainingChunks = async (meetingId: string): Promise<boolean> => {
  const remainingChunks = mainChunks.slice(lastSavedChunkCount)
  if (remainingChunks.length === 0) return true

  const chunksToSend = lastSavedChunkCount > 0 && headerChunk ? [headerChunk, ...remainingChunks] : remainingChunks
  const blob = new Blob(chunksToSend, { type: mimeType || 'audio/webm' })
  const filename = `backup_${autoSaveIndex}.webm`

  const { fetchUploadBackupAudio } = useMeetingApi()
  try {
    await fetchUploadBackupAudio(Number(meetingId), blob, filename)
    console.info('[FinishSave] 마지막 청크 업로드 완료:', filename, `${blob.size}bytes`)
    return true
  } catch (e) {
    console.warn('[FinishSave] 마지막 청크 업로드 실패:', e)
    return false
  }
}

/** 자동 저장 중지 */
const stopAutoSave = () => {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// ─── Public API ───────────────────────────────────────────────────

/** 브라우저 지원 여부 확인 — onMounted에서 호출 */
const checkSupport = () => {
  isSupported.value = !!(window.WebSocket && navigator.mediaDevices?.getUserMedia)
}

/**
 * 녹음 시작: 토큰 발급 → 마이크 획득 → WS 연결 → 스트리밍 시작
 * @param initialBackupIndex 이어서 녹음 시 기존 백업 파일 개수 (auto-save 인덱스 연속성 유지)
 */
const startRecording = async (meetingId: string, initialBackupIndex = 0): Promise<boolean> => {
  if (isRecording.value || isConnecting.value) return false

  isConnecting.value = true
  blocks.value = []
  currentInterimId = null
  mainChunks = []
  headerChunk = null
  autoSaveIndex = initialBackupIndex
  lastSavedChunkCount = 0

  // fetchRealtimeToken()          // 백엔드 → OpenAI ephemeral token 발급
  //     ↓ 성공
  // initWebSocket(token)          // wss://api.openai.com/v1/realtime 연결
  //     ↓ ws.onopen → session.created 수신
  // sendSessionUpdate()           // 언어(ko), VAD 설정 등 전송
  //     ↓
  // initAudioStreaming()           // 마이크 PCM16 → ws.send() 실시간 전송
  //     ↓
  // ws.onmessage                  // OpenAI → 자막 이벤트 수신

  try {
    // 1. 백엔드에서 ephemeral token 발급
    const tokenRes = await fetchRealtimeToken()
    if (!tokenRes.token) throw new Error('임시 토큰 발급 실패')

    // 2. 마이크 스트림 획득
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 3. WebSocket 연결
    initWebSocket(tokenRes.token)

    // 4. AudioContext PCM16 스트리밍
    initAudioStreaming()

    // 5. MediaRecorder 시작 (전체 세션 녹음)
    initMediaRecorder()

    // 6. 자동 저장 (10분마다 백업 업로드)
    startAutoSave(meetingId)

    isRecording.value = true
    return true
  } catch (e) {
    console.warn('[Realtime] 녹음 시작 실패:', e)
    isConnecting.value = false
    await cleanup()
    return false
  }
}

/**
 * 녹음 종료
 * - WebSocket / AudioContext 정리
 * - MediaRecorder 정지 후 전체 오디오 Blob 반환 (finishMeetingWithAudio용)
 */
const stopRecording = (): Promise<Blob | null> => {
  isRecording.value = false

  // 재연결 타이머 취소 (의도적 종료이므로 재연결 불필요)
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0

  // 자동 저장 중지
  stopAutoSave()

  // WebSocket 종료
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close()
    ws = null
  }

  // AudioContext 정리
  if (scriptProcessor) {
    scriptProcessor.disconnect()
    scriptProcessor = null
  }
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }

  return new Promise((resolve) => {
    if (!mainRecorder || mainRecorder.state === 'inactive') {
      mediaStream?.getTracks().forEach((t) => t.stop())
      mediaStream = null
      resolve(mainChunks.length > 0 ? new Blob(mainChunks, { type: mimeType || 'audio/webm' }) : null)
      return
    }

    mainRecorder.onstop = () => {
      const finalBlob = mainChunks.length > 0 ? new Blob(mainChunks, { type: mimeType || 'audio/webm' }) : null
      mediaStream?.getTracks().forEach((t) => t.stop())
      mediaStream = null
      resolve(finalBlob)
    }
    mainRecorder.stop()
  })
}

/** 전체 정리 (페이지 이탈 시) */
const cleanup = async () => {
  // 재연결 타이머 취소
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0

  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close()
    ws = null
  }

  if (scriptProcessor) {
    scriptProcessor.disconnect()
    scriptProcessor = null
  }
  if (audioCtx) {
    await audioCtx.close()
    audioCtx = null
  }
  if (mainRecorder && mainRecorder.state !== 'inactive') {
    mainRecorder.stop()
  }
  mainRecorder = null
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

/** 상태 초기화 (녹음 종료 + 페이지 이동 후) */
const resetRecording = () => {
  blocks.value = []
  currentInterimId = null
  mainChunks = []
}

export const useRealtimeTranscription = () => ({
  isRecording,
  isConnecting,
  isSupported,
  blocks,
  checkSupport,
  startRecording,
  stopRecording,
  cleanup,
  resetRecording,
  startAutoSave,
  stopAutoSave,
  sendRemainingChunksBeacon,
  uploadRemainingChunks,
})
