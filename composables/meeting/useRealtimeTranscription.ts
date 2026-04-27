/**
 * OpenAI Realtime API WebSocket 기반 실시간 음성 인식
 *
 * 흐름:
 * 1. 백엔드에서 ephemeral token 발급 (GET /api/meeting/realtime-token)
 * 2. WebSocket → wss://api.openai.com/v1/realtime?intent=transcription
 * 3. AudioContext PCM16(24kHz mono) → WebSocket 스트리밍 (임시 자막)
 * 4. MediaRecorder(webm) → 주기적 청크 → POST /api/meeting/transcribe-chunk (화자 분리)
 *
 * 자막 블록 3단계:
 * - interim  : delta 이벤트 수신 중 (회색, 이탤릭, 흐릿)
 * - waiting  : completed 이후 diarize 대기 중 (회색, 이탤릭)
 * - confirmed: diarize 완료, 화자 레이블 확정 (검정, 정상)
 */

import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import type { TranscriptBlock, DiarizedSegment } from '~/types/meeting'

const REALTIME_WS_URL = 'wss://api.openai.com/v1/realtime?intent=transcription'
const CHUNK_MIN_MS = 5_000 // 최소 10초 누적 후 전송
const CHUNK_MAX_MS = 10_000 // 최대 30초 → 강제 전송

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

// chunkRecorder: 청크 전송용 — 전송 후 재시작하여 매번 완전한 WebM 헤더 보장
let chunkRecorder: MediaRecorder | null = null
let chunkBuffer: Blob[] = []

let mimeType = ''

let pendingWaitingIds: string[] = [] // 마지막 전송 이후 confirmed 대기 블록 ID
let chunkBufferStart = 0 // 현재 버퍼 시작 타임스탬프
let chunkMaxTimer: ReturnType<typeof setTimeout> | null = null
let currentInterimId: string | null = null // 현재 스트리밍 중인 interim 블록 ID

const { fetchRealtimeToken, fetchTranscribeChunk } = useMeetingApi()

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

// ─── 청크 레코더 관리 ──────────────────────────────────────────────

/** chunkRecorder 시작 (매번 새 인스턴스 → 완전한 WebM 헤더 포함) */
const startChunkRecorder = () => {
  if (!mediaStream) return
  chunkBuffer = []
  chunkRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)
  chunkRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunkBuffer.push(e.data)
  }
  chunkRecorder.start(1000)
}

/** chunkRecorder 정지 후 현재 버퍼를 Blob으로 반환 */
const stopChunkRecorder = (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    if (!chunkRecorder || chunkRecorder.state === 'inactive') {
      resolve(chunkBuffer.length > 0 ? new Blob(chunkBuffer, { type: mimeType || 'audio/webm' }) : null)
      return
    }
    chunkRecorder.onstop = () => {
      resolve(chunkBuffer.length > 0 ? new Blob(chunkBuffer, { type: mimeType || 'audio/webm' }) : null)
    }
    chunkRecorder.stop()
  })
}

// ─── 청크 전송 (화자 분리 diarize) ─────────────────────────────────
const sendChunk = async () => {
  if (pendingWaitingIds.length === 0) return

  const inflightIds = [...pendingWaitingIds]
  pendingWaitingIds = []
  chunkBufferStart = Date.now()

  // chunkRecorder 정지 후 재시작 (mainRecorder는 계속 누적)
  await stopChunkRecorder()
  if (isRecording.value) startChunkRecorder()

  // diarize 호출 없이 바로 confirmed 처리
  inflightIds.forEach((id) => {
    const idx = blocks.value.findIndex((b) => b.id === id)
    if (idx !== -1) {
      blocks.value[idx] = { ...blocks.value[idx], status: 'confirmed' }
    }
  })
}
// 텍스트 겹치는 segment 찾기
const findBestMatchSegment = (blockText: string, segments: DiarizedSegment[]): DiarizedSegment | undefined => {
  if (!segments.length) return undefined

  let bestScore = -1
  let bestSeg: DiarizedSegment | undefined

  for (const seg of segments) {
    const score = calcOverlapScore(blockText, seg.text ?? '')
    if (score > bestScore) {
      bestScore = score
      bestSeg = seg
    }
  }
  return bestSeg
}

// 두 문자열의 공통 글자 비율
const calcOverlapScore = (a: string, b: string): number => {
  const setA = new Set(a.replace(/\s/g, ''))
  const setB = new Set(b.replace(/\s/g, ''))
  let common = 0
  setA.forEach((ch) => {
    if (setB.has(ch)) common++
  })
  return common / Math.max(setA.size, setB.size, 1)
}

/** 최대 30초 강제 전송 타이머 */
const scheduleChunkMaxTimer = () => {
  if (chunkMaxTimer) clearTimeout(chunkMaxTimer)
  chunkMaxTimer = setTimeout(async () => {
    if (isRecording.value) {
      await sendChunk()
      scheduleChunkMaxTimer()
    }
  }, CHUNK_MAX_MS)
}

const clearChunkMaxTimer = () => {
  if (chunkMaxTimer) {
    clearTimeout(chunkMaxTimer)
    chunkMaxTimer = null
  }
}

/**
 * completed 이벤트 처리
 * - 현재 interim → waiting 전환
 * - 10초 이상 누적 시 청크 전송
 */
const handleTranscriptionCompleted = async (finalText: string) => {
  if (currentInterimId) {
    const idx = blocks.value.findIndex((b) => b.id === currentInterimId)
    if (idx !== -1) {
      blocks.value[idx] = { ...blocks.value[idx], status: 'waiting', text: finalText }
      pendingWaitingIds.push(currentInterimId)
    }
    currentInterimId = null
  }

  // 최소 10초 누적 시 전송
  if (Date.now() - chunkBufferStart >= CHUNK_MIN_MS) {
    await sendChunk()
  }
}

/** transcription_session.update 전송 */
const sendSessionUpdate = () => {
  ws?.send(
    JSON.stringify({
      type: 'transcription_session.update',
      session: {
        input_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'gpt-4o-mini-transcribe',
          language: 'ko',
        },
        input_audio_noise_reduction: { type: 'far_field' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    }),
  )
}

// ─── WebSocket 초기화 ──────────────────────────────────────────────
const initWebSocket = (token: string) => {
  ws = new WebSocket(REALTIME_WS_URL, ['realtime', `openai-insecure-api-key.${token}`, 'openai-beta.realtime-v1'])

  ws.onopen = () => {
    // onopen 시점에는 아직 session.created 이전이므로 연결 상태만 유지
    // isConnecting 해제는 session.created / transcription_session.created 수신 시 처리
  }

  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data as string)
      const type: string = msg.type ?? ''

      if (type === 'session.created' || type === 'transcription_session.created') {
        // 세션 준비 완료 → isConnecting 해제 + 설정 전송
        // transcription_sessions 엔드포인트는 transcription_session.created를 보냄
        isConnecting.value = false
        sendSessionUpdate()
      } else if (type === 'error') {
        // 서버 에러 수신 (세션 설정 오류, 인증 실패 등)
        console.error('[Realtime] 서버 에러:', msg.error?.message ?? JSON.stringify(msg.error))
      } else if (type === 'conversation.item.input_audio_transcription.delta') {
        const delta: string = msg.delta ?? ''
        if (!delta) return

        if (!currentInterimId) {
          // 새 interim 블록 생성
          const id = genId()
          blocks.value.push({ id, status: 'interim', text: delta })
          currentInterimId = id
        } else {
          // 기존 interim 블록에 텍스트 누적
          const idx = blocks.value.findIndex((b) => b.id === currentInterimId)
          if (idx !== -1) {
            blocks.value[idx] = { ...blocks.value[idx], text: blocks.value[idx].text + delta }
          }
        }
      } else if (type === 'conversation.item.input_audio_transcription.completed') {
        const finalText: string = msg.transcript ?? msg.text ?? ''
        await handleTranscriptionCompleted(finalText)
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
  mainRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)
  mainRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) mainChunks.push(e.data)
  }
  mainRecorder.start(1000)

  // 청크 전송용 (전송마다 재시작 → 매번 완전한 WebM 파일)
  startChunkRecorder()
}

// ─── Public API ───────────────────────────────────────────────────

/** 브라우저 지원 여부 확인 — onMounted에서 호출 */
const checkSupport = () => {
  isSupported.value = !!(window.WebSocket && navigator.mediaDevices?.getUserMedia)
}

/** 녹음 시작: 토큰 발급 → 마이크 획득 → WS 연결 → 스트리밍 시작 */
const startRecording = async (): Promise<boolean> => {
  if (isRecording.value || isConnecting.value) return false

  isConnecting.value = true
  blocks.value = []
  pendingWaitingIds = []
  currentInterimId = null
  mainChunks = []
  chunkBuffer = []
  chunkBufferStart = Date.now()

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

    // 5. MediaRecorder 시작
    initMediaRecorder()

    // 6. 최대 청크 타이머
    scheduleChunkMaxTimer()

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
  clearChunkMaxTimer()

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

  // chunkRecorder는 cleanup만 (전체 Blob 불필요)
  if (chunkRecorder && chunkRecorder.state !== 'inactive') {
    chunkRecorder.stop()
    chunkRecorder = null
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
  clearChunkMaxTimer()

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
  if (chunkRecorder && chunkRecorder.state !== 'inactive') {
    chunkRecorder.stop()
  }
  chunkRecorder = null
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
  pendingWaitingIds = []
  currentInterimId = null
  mainChunks = []
  chunkBuffer = []
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
})
