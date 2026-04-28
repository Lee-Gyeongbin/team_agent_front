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

let mimeType = ''
let currentInterimId: string | null = null

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
  currentInterimId = null
  mainChunks = []

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
})
