/**
 * OpenAI Realtime Transcription API — WebSocket 기반 실시간 음성 전사
 *
 * ── 흐름 ──────────────────────────────────────────────────────────────
 * 1. 백엔드에서 ephemeral token 발급 (type: "transcription" 세션)
 * 2. WebSocket → wss://api.openai.com/v1/realtime?intent=transcription
 * 3. AudioContext PCM16(24kHz mono) → WebSocket 스트리밍 (실시간 자막)
 * 4. MediaRecorder(webm) → 10분 단위 독립 파일 자동 백업
 * 5. 회의 종료 시 전체 청크 Blob → 백엔드 Python 후처리 (faster-whisper + pyannote)
 *
 * ── 자막 블록 ─────────────────────────────────────────────────────────
 * - interim  : delta 이벤트 수신 중 (회색, 이탤릭)
 * - confirmed: completed 수신 완료 (검정, 정상)
 *
 * ── 핵심 변경 사항 ────────────────────────────────────────────────────
 * - gpt-realtime-2.1-mini 완전 제거 (백엔드 세션 type: "transcription")
 * - sendSessionUpdate() 제거 (백엔드 토큰 발급 시 세션 완전 설정)
 * - item_id 기반 Map으로 delta/completed 블록 관리 (교차 발화 안전)
 * - speech_started/speech_stopped → 발화 타이밍(ms) 기록
 * - AudioWorkletNode 기반 PCM 처리 (메인 스레드 부하 분리)
 * - ScriptProcessorNode 폴백 포함 (AudioWorklet 미지원 환경)
 * - 48kHz → 24kHz 리샘플링 (worklet 내부 처리)
 * - 10분마다 MediaRecorder stop/restart → 독립 재생 가능한 WebM 파일
 * - 재연결 정책: 연속 실패 횟수 기준 (성공 시 리셋), 세션 총량 상한 병행
 */

import type { TranscriptBlock, SpeechTiming, TranscriptionConnectionStatus } from '~/types/meeting'
import { useMeetingApi } from '~/composables/meeting/useMeetingApi'

// ─── 상수 ──────────────────────────────────────────────────────────────
const REALTIME_WS_URL = 'wss://api.openai.com/v1/realtime?intent=transcription'
const TARGET_SAMPLE_RATE = 24000
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000 // 10분
const MAX_CONSECUTIVE_RECONNECTS = 5 // 연속 실패 허용 횟수
const MAX_SESSION_RECONNECTS = 10 // 세션 전체 허용 재연결 총량
const RECONNECT_BASE_DELAY_MS = 2000
const RECONNECT_MAX_DELAY_MS = 30000

// ─── module-scope 상태 (컴포넌트 간 공유) ────────────────────────────
const isRecording = ref(false)
const connectionStatus = ref<TranscriptionConnectionStatus>('idle')
const isSupported = ref(false)
const blocks = ref<TranscriptBlock[]>([])

/** 녹음 시작 기준 시각 (Date.now()) — 타임스탬프 계산용 */
let recordingStartMs: number = 0

// ─── 내부: WebSocket ──────────────────────────────────────────────────
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
/** 연속 실패 횟수 — 재연결 성공 시 0으로 리셋 */
let consecutiveReconnectFailures: number = 0
/** 세션 전체 재연결 총량 — 녹음 종료 시 리셋 */
let totalSessionReconnects: number = 0

// ─── 내부: 오디오 ─────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null
let mediaStream: MediaStream | null = null
/** AudioWorkletNode (권장 방식) */
let workletNode: AudioWorkletNode | null = null
/** ScriptProcessorNode (폴백) */
let scriptProcessor: ScriptProcessorNode | null = null
/** MediaStreamSourceNode — disconnectAudio()에서 명시적 해제용 */
let audioSource: MediaStreamAudioSourceNode | null = null
/** 실제 사용 중인 방식 */
let audioMode: 'worklet' | 'script' | null = null

// ─── 내부: MediaRecorder (10분 단위 교체) ────────────────────────────
let activeRecorder: MediaRecorder | null = null
let activeChunks: Blob[] = []
let mimeType = ''
let autoSaveTimer: ReturnType<typeof setInterval> | null = null
let autoSaveIndex: number = 0
/** finishMeetingWithAudio용 전체 청크 누적 */
let allChunks: Blob[] = []

// ─── 내부: 전사 블록 관리 ────────────────────────────────────────────
/**
 * item_id → 임시 블록 id Map
 * delta 이벤트 수신 시 item_id별로 블록을 생성하고, completed 시 확정 후 삭제
 */
const interimBlockByItemId = new Map<string, string>()

/**
 * item_id → VAD 타이밍 Map
 * speech_started/stopped 이벤트에서 발화 시작/종료 시각 기록
 */
const speechTimingByItemId = new Map<string, SpeechTiming>()

const { fetchRealtimeToken } = useMeetingApi()

// ─── 유틸 ──────────────────────────────────────────────────────────────

const genId = () => `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/** 회의 시작 기준 경과 ms → "HH:MM:SS" */
const formatElapsedTime = (elapsedMs: number): string => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return '00:00:00'
  const totalSec = Math.floor(elapsedMs / 1000)
  const hh = Math.floor(totalSec / 3600)
    .toString()
    .padStart(2, '0')
  const mm = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const ss = (totalSec % 60).toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/** Float32Array → PCM16 Int16Array (ScriptProcessor 폴백용) */
const float32ToPcm16 = (input: Float32Array): Int16Array => {
  const out = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

/**
 * 선형 보간 다운샘플링 (ScriptProcessor 폴백용)
 * AudioWorklet에서는 worklet 내부에서 처리
 */
const downsampleLinear = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const outputLen = Math.floor(input.length / ratio)
  const output = new Float32Array(outputLen)
  for (let i = 0; i < outputLen; i++) {
    const srcIdx = i * ratio
    const lo = Math.floor(srcIdx)
    const hi = Math.min(lo + 1, input.length - 1)
    const frac = srcIdx - lo
    output[i] = input[lo] * (1 - frac) + input[hi] * frac
  }
  return output
}

/** ArrayBufferLike → base64 */
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

/** WebSocket으로 PCM16 base64 전송 */
const sendPcmToWs = (pcm16Buffer: ArrayBufferLike) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  const base64 = arrayBufferToBase64(pcm16Buffer)
  ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }))
}

// ─── A. AudioWorkletNode 초기화 (권장) ───────────────────────────────

/**
 * AudioWorklet 프로세서 코드 (인라인 Blob URL 방식)
 * 파일 경로 로드 시 인증 미들웨어에 차단되는 문제를 방지
 */
const PCM_WORKLET_CODE = `
class PcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this._targetRate = options.processorOptions?.targetSampleRate ?? 24000
    this._sourceRate = sampleRate
    this._ratio = this._sourceRate / this._targetRate
  }
  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true
    const inputData = input[0]
    let samples
    if (Math.abs(this._ratio - 1) < 0.001) {
      samples = inputData
    } else {
      const outputLen = Math.floor(inputData.length / this._ratio)
      samples = new Float32Array(outputLen)
      for (let i = 0; i < outputLen; i++) {
        const srcIdx = i * this._ratio
        const lo = Math.floor(srcIdx)
        const hi = Math.min(lo + 1, inputData.length - 1)
        const frac = srcIdx - lo
        samples[i] = inputData[lo] * (1 - frac) + inputData[hi] * frac
      }
    }
    const pcm16 = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    this.port.postMessage({ pcm16: pcm16.buffer }, [pcm16.buffer])
    return true
  }
}
registerProcessor('pcm-processor', PcmProcessor)
`

/**
 * AudioWorkletNode 방식 초기화
 * - Blob URL 인라인 방식으로 로드 (HTTP 요청 없음 → 인증 차단 없음)
 * - 메인 스레드 부하 없이 PCM 변환 및 다운샘플링 처리
 * @returns 초기화 성공 여부
 */
const initAudioWorklet = async (): Promise<boolean> => {
  if (!audioCtx || !mediaStream) return false

  let blobUrl: string | null = null
  try {
    const blob = new Blob([PCM_WORKLET_CODE], { type: 'application/javascript' })
    blobUrl = URL.createObjectURL(blob)
    await audioCtx.audioWorklet.addModule(blobUrl)

    workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor', {
      processorOptions: { targetSampleRate: TARGET_SAMPLE_RATE },
    })

    audioSource = audioCtx.createMediaStreamSource(mediaStream)
    audioSource.connect(workletNode)
    // workletNode은 스피커로 연결하지 않음 (출력 없이 port.postMessage만 사용)

    workletNode.port.onmessage = (e: MessageEvent<{ pcm16: ArrayBuffer }>) => {
      sendPcmToWs(e.data.pcm16)
    }

    audioMode = 'worklet'
    console.info('[Realtime] AudioWorkletNode 초기화 완료 (targetSampleRate:', TARGET_SAMPLE_RATE, ')')
    return true
  } catch (e) {
    console.warn('[Realtime] AudioWorklet 초기화 실패 — ScriptProcessor로 폴백:', e)
    workletNode?.disconnect()
    workletNode = null
    return false
  } finally {
    // Blob URL은 addModule 완료 후 즉시 해제 (메모리 누수 방지)
    if (blobUrl) URL.revokeObjectURL(blobUrl)
  }
}

// ─── B. ScriptProcessorNode 초기화 (폴백) ────────────────────────────

/**
 * ScriptProcessorNode 방식 초기화 (AudioWorklet 미지원 환경 폴백)
 * - deprecated이나 모든 브라우저에서 작동
 * - 실제 sampleRate 검증 후 필요 시 리샘플링 적용
 */
const initScriptProcessor = () => {
  if (!audioCtx || !mediaStream) return

  const actualRate = audioCtx.sampleRate
  if (actualRate !== TARGET_SAMPLE_RATE) {
    console.warn(
      `[Realtime] AudioContext sampleRate 불일치: 요청=${TARGET_SAMPLE_RATE}, 실제=${actualRate}`,
      '— ScriptProcessor에서 소프트웨어 리샘플링 적용',
    )
  } else {
    console.info(`[Realtime] AudioContext sampleRate: ${actualRate}Hz (일치)`)
  }

  audioSource = audioCtx.createMediaStreamSource(mediaStream)
  scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1)
  audioSource.connect(scriptProcessor)
  scriptProcessor.connect(audioCtx.destination)

  scriptProcessor.onaudioprocess = (e) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const rawFloat32 = e.inputBuffer.getChannelData(0)
    const resampled = downsampleLinear(rawFloat32, actualRate, TARGET_SAMPLE_RATE)
    const pcm16 = float32ToPcm16(resampled)
    sendPcmToWs(pcm16.buffer)
  }

  audioMode = 'script'
  console.info('[Realtime] ScriptProcessorNode 초기화 완료')
}

// ─── AudioContext 생성 ────────────────────────────────────────────────

const initAudioContext = () => {
  // sampleRate 요청: 브라우저가 거부할 수 있으므로 실제 값은 initAudioStreaming에서 확인
  audioCtx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
  const actual = audioCtx.sampleRate
  if (actual !== TARGET_SAMPLE_RATE) {
    console.warn(
      `[Realtime] AudioContext 생성 sampleRate: 요청=${TARGET_SAMPLE_RATE}, 실제=${actual}`,
      '— 소프트웨어 리샘플링이 적용됩니다',
    )
  } else {
    console.info(`[Realtime] AudioContext sampleRate=${actual}Hz`)
  }
}

/**
 * 오디오 스트리밍 초기화
 * AudioWorklet 우선 시도 → 실패 시 ScriptProcessor 폴백
 */
const initAudioStreaming = async () => {
  if (!mediaStream) return

  initAudioContext()
  const workletOk = await initAudioWorklet()
  if (!workletOk) {
    initScriptProcessor()
  }
}

// ─── MediaRecorder (10분 단위 stop/restart) ───────────────────────────

/**
 * 현재 구간 MediaRecorder 정지 후 청크를 서버에 업로드하고 새 Recorder 시작
 *
 * [선택된 방식: Option A — 10분마다 stop/restart]
 * 각 구간이 독립적인 WebM 파일이 됨 (헤더 포함, 단독 재생 가능)
 * headerChunk 방식의 첫 1초 음성 중복 문제 완전 해결
 * 서버에서 ffmpeg concat 없이 각 파일을 순서대로 처리 가능
 */
const rotateRecorder = async (meetingId: string) => {
  const { fetchUploadBackupAudio } = useMeetingApi()

  if (!activeRecorder || activeRecorder.state === 'inactive') return

  // 현재 구간 정지 → onstop에서 청크 업로드
  await new Promise<void>((resolve) => {
    if (!activeRecorder) {
      resolve()
      return
    }

    activeRecorder.onstop = async () => {
      if (activeChunks.length > 0) {
        const blob = new Blob(activeChunks, { type: mimeType || 'audio/webm' })
        const filename = `backup_${autoSaveIndex++}.webm`
        try {
          await fetchUploadBackupAudio(Number(meetingId), blob, filename)
          console.info('[AutoSave] 구간 백업 완료:', filename, `${blob.size}bytes`)
        } catch (e) {
          console.warn('[AutoSave] 구간 백업 실패:', e)
          autoSaveIndex-- // 실패 시 인덱스 롤백
        }
      }
      resolve()
    }
    activeRecorder!.stop()
  })

  // 새 Recorder 시작
  if (!mediaStream || !isRecording.value) return
  startNewRecorder()
}

/** 새로운 MediaRecorder 구간 시작 */
const startNewRecorder = () => {
  if (!mediaStream) return

  activeChunks = []
  activeRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)

  activeRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      activeChunks.push(e.data)
      allChunks.push(e.data) // finishMeetingWithAudio용 전체 누적
    }
  }

  activeRecorder.start(1000)
}

/** MediaRecorder 초기화 (녹음 시작 시) */
const initMediaRecorder = () => {
  if (!mediaStream) return
  mimeType = getSupportedMimeType()
  allChunks = []
  autoSaveIndex = 0
  startNewRecorder()
}

/** 자동 저장 시작 (10분마다 구간 교체) */
const startAutoSave = (meetingId: string) => {
  stopAutoSave()
  autoSaveTimer = setInterval(() => {
    rotateRecorder(meetingId)
  }, AUTO_SAVE_INTERVAL_MS)
}

/** 자동 저장 중지 */
const stopAutoSave = () => {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// ─── WebSocket 초기화 ─────────────────────────────────────────────────

const initWebSocket = (token: string) => {
  ws = new WebSocket(REALTIME_WS_URL, ['realtime', `openai-insecure-api-key.${token}`])

  ws.onopen = () => {
    // session.created / transcription_session.created 수신 전까지 대기
  }

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string)
      const type: string = msg.type ?? ''

      // ── 세션 준비 완료 ──────────────────────────────────────────────
      if (type === 'session.created' || type === 'transcription_session.created') {
        // 백엔드 토큰 발급 시 세션 설정이 완전히 지정됨
        // sendSessionUpdate() 불필요 — type:transcription 세션은 session.update 없이 동작
        connectionStatus.value = 'connected'
        consecutiveReconnectFailures = 0 // 연결 성공 시 연속 실패 카운터 리셋
        console.info('[Realtime] 전사 세션 준비 완료')
      }

      // ── 오류 ────────────────────────────────────────────────────────
      else if (type === 'error') {
        console.error('[Realtime] 서버 에러:', msg.error?.message ?? JSON.stringify(msg.error))
      }

      // ── VAD: 발화 시작 ───────────────────────────────────────────────
      else if (type === 'input_audio_buffer.speech_started') {
        const itemId: string = msg.item_id ?? ''
        if (itemId) {
          // audio_start_ms: OpenAI 세션 내 오디오 위치 (ms) — 회의 타임스탬프로 직접 사용
          const startMs = typeof msg.audio_start_ms === 'number' ? msg.audio_start_ms : undefined
          speechTimingByItemId.set(itemId, { startMs })
        }
      }

      // ── VAD: 발화 종료 ───────────────────────────────────────────────
      else if (type === 'input_audio_buffer.speech_stopped') {
        const itemId: string = msg.item_id ?? ''
        if (itemId) {
          const existing = speechTimingByItemId.get(itemId) ?? {}
          // audio_end_ms: OpenAI 세션 내 오디오 위치 (ms)
          const endMs = typeof msg.audio_end_ms === 'number' ? msg.audio_end_ms : undefined
          speechTimingByItemId.set(itemId, { ...existing, endMs })
        }
      }

      // ── 전사 delta (스트리밍 중간 텍스트) ────────────────────────────
      else if (type === 'conversation.item.input_audio_transcription.delta') {
        const itemId: string = msg.item_id ?? ''
        const delta: string = msg.delta ?? ''
        if (!delta) return

        const existingBlockId = interimBlockByItemId.get(itemId)

        if (!existingBlockId) {
          // 해당 item_id 최초 delta — 새 임시 블록 생성
          const id = genId()
          const timing = itemId ? speechTimingByItemId.get(itemId) : undefined
          blocks.value.push({
            id,
            itemId: itemId || undefined,
            status: 'interim',
            text: delta,
            startMs: timing?.startMs,
            endMs: timing?.endMs,
          })
          if (itemId) interimBlockByItemId.set(itemId, id)
        } else {
          // 동일 item_id 후속 delta — 기존 블록에 이어 붙임
          const idx = blocks.value.findIndex((b) => b.id === existingBlockId)
          if (idx !== -1) {
            blocks.value[idx] = {
              ...blocks.value[idx],
              text: blocks.value[idx].text + delta,
            }
          }
        }
      }

      // ── 전사 completed (확정 텍스트) ─────────────────────────────────
      else if (type === 'conversation.item.input_audio_transcription.completed') {
        const itemId: string = msg.item_id ?? ''
        const finalText: string = msg.transcript ?? msg.text ?? ''
        const timing = itemId ? speechTimingByItemId.get(itemId) : undefined

        const existingBlockId = itemId ? interimBlockByItemId.get(itemId) : undefined

        if (existingBlockId) {
          // 기존 interim 블록을 confirmed로 업데이트
          const idx = blocks.value.findIndex((b) => b.id === existingBlockId)
          if (idx !== -1) {
            blocks.value[idx] = {
              ...blocks.value[idx],
              status: 'confirmed',
              // finalText가 비어 있으면 기존 delta 누적 텍스트 유지
              text: finalText.trim() || blocks.value[idx].text,
              startMs: timing?.startMs ?? blocks.value[idx].startMs,
              endMs: timing?.endMs ?? blocks.value[idx].endMs,
            }
          }
          interimBlockByItemId.delete(itemId)
        } else if (finalText.trim()) {
          // delta 없이 completed만 수신된 경우 신규 confirmed 블록 생성
          const id = genId()
          blocks.value.push({
            id,
            itemId: itemId || undefined,
            status: 'confirmed',
            text: finalText.trim(),
            startMs: timing?.startMs,
            endMs: timing?.endMs,
          })
        }

        // 타이밍 Map 정리 (메모리 누수 방지)
        if (itemId) speechTimingByItemId.delete(itemId)
      }
    } catch (e) {
      console.warn('[Realtime] WS 메시지 파싱 실패:', e)
    }
  }

  ws.onerror = () => {
    console.warn('[Realtime] WebSocket 연결 오류')
  }

  ws.onclose = () => {
    if (connectionStatus.value === 'connected') {
      connectionStatus.value = 'reconnecting'
    }
    scheduleReconnect()
  }
}

/**
 * 재연결 스케줄링 (onclose + 토큰 발급 실패 시 공통 호출)
 * ws.onclose가 트리거되지 않는 실패(토큰 발급 실패 등)에서도 연속 재시도 보장
 */
const scheduleReconnect = () => {
  // 의도적 종료(isRecording=false) 또는 재연결 한도 초과 시 중단
  const canReconnect =
    isRecording.value &&
    consecutiveReconnectFailures < MAX_CONSECUTIVE_RECONNECTS &&
    totalSessionReconnects < MAX_SESSION_RECONNECTS

  if (!canReconnect) {
    if (isRecording.value) {
      connectionStatus.value = 'failed'
      console.warn(
        '[Realtime] WS 재연결 한도 초과 — 실시간 자막 중단 (MediaRecorder 녹음은 계속됨)',
        `연속실패=${consecutiveReconnectFailures}, 총재연결=${totalSessionReconnects}`,
      )
    }
    return
  }

  const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** consecutiveReconnectFailures, RECONNECT_MAX_DELAY_MS)
  console.warn(
    `[Realtime] WS 끊김 — ${delay}ms 후 재연결 (연속=${consecutiveReconnectFailures + 1}/${MAX_CONSECUTIVE_RECONNECTS}, 총=${totalSessionReconnects + 1}/${MAX_SESSION_RECONNECTS})`,
  )

  reconnectTimer = setTimeout(async () => {
    consecutiveReconnectFailures++
    totalSessionReconnects++
    try {
      const tokenRes = await fetchRealtimeToken()
      if (!tokenRes.token) throw new Error('토큰 발급 실패')
      initWebSocket(tokenRes.token)
      // ✅ 연결 성공 후 consecutiveReconnectFailures는 session.created 수신 시 리셋
      console.info(`[Realtime] WS 재연결 시도 중 (총=${totalSessionReconnects}/${MAX_SESSION_RECONNECTS})`)
    } catch (e) {
      console.warn('[Realtime] WS 재연결 실패:', e)
      // 새 ws가 생성되지 않았으므로 onclose가 안 터짐 → 직접 다음 재시도 스케줄링
      scheduleReconnect()
    }
  }, delay)
}

// ─── 녹음 시작 ──────────────────────────────────────────────────────

/**
 * 녹음 시작: 토큰 발급 → 마이크 획득 → WS 연결 → 오디오 스트리밍 → MediaRecorder
 * @param meetingId 회의 ID
 * @param initialBackupIndex 이어서 녹음 시 기존 백업 파일 개수 (auto-save 인덱스 연속성)
 */
const startRecording = async (meetingId: string, initialBackupIndex = 0): Promise<boolean> => {
  if (isRecording.value || connectionStatus.value === 'connecting') return false

  connectionStatus.value = 'connecting'
  blocks.value = []
  interimBlockByItemId.clear()
  speechTimingByItemId.clear()
  allChunks = []
  autoSaveIndex = initialBackupIndex
  consecutiveReconnectFailures = 0
  totalSessionReconnects = 0
  recordingStartMs = Date.now()

  try {
    // 1. 백엔드에서 transcription 세션 ephemeral token 발급
    const tokenRes = await fetchRealtimeToken()
    if (!tokenRes.token) throw new Error('임시 토큰 발급 실패')

    // 2. 마이크 스트림 획득
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 3. WebSocket 연결 (session.created 수신 시 connectionStatus → 'connected')
    initWebSocket(tokenRes.token)

    // 4. AudioContext + PCM16 스트리밍 (Worklet 우선, 폴백 ScriptProcessor)
    await initAudioStreaming()

    // 5. MediaRecorder 시작 (10분 단위 구간 교체)
    initMediaRecorder()

    // 6. 자동 저장 인터벌 시작
    startAutoSave(meetingId)

    isRecording.value = true
    return true
  } catch (e) {
    console.warn('[Realtime] 녹음 시작 실패:', e)
    connectionStatus.value = 'idle'
    await cleanup()
    return false
  }
}

// ─── 녹음 종료 ──────────────────────────────────────────────────────

/**
 * 녹음 종료
 * - WS / AudioContext / AudioWorklet / ScriptProcessor 정리
 * - 현재 구간 MediaRecorder 정지 후 전체 오디오 Blob 반환 (finishMeetingWithAudio용)
 */
const stopRecording = (): Promise<Blob | null> => {
  isRecording.value = false
  connectionStatus.value = 'idle'

  // 재연결 타이머 취소 (의도적 종료)
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  // 자동 저장 중지
  stopAutoSave()

  // WebSocket 종료
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close()
    ws = null
  }

  // 오디오 정리
  disconnectAudio()

  return new Promise((resolve) => {
    if (!activeRecorder || activeRecorder.state === 'inactive') {
      finalizeMediaStream()
      const blob = allChunks.length > 0 ? new Blob(allChunks, { type: mimeType || 'audio/webm' }) : null
      resolve(blob)
      return
    }

    activeRecorder.onstop = () => {
      // 마지막 구간 청크도 allChunks에 포함됨 (ondataavailable에서 누적)
      const finalBlob = allChunks.length > 0 ? new Blob(allChunks, { type: mimeType || 'audio/webm' }) : null
      activeRecorder = null
      finalizeMediaStream()
      resolve(finalBlob)
    }
    activeRecorder.stop()
  })
}

// ─── 정리 유틸 ──────────────────────────────────────────────────────

const disconnectAudio = () => {
  // AudioWorklet 정리
  if (workletNode) {
    workletNode.port.onmessage = null
    workletNode.disconnect()
    workletNode = null
  }
  // ScriptProcessor 정리
  if (scriptProcessor) {
    scriptProcessor.onaudioprocess = null
    scriptProcessor.disconnect()
    scriptProcessor = null
  }
  // MediaStreamSourceNode 명시적 해제 (AudioContext GC 방해 방지)
  if (audioSource) {
    audioSource.disconnect()
    audioSource = null
  }
  // AudioContext 종료
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
  audioMode = null
}

const finalizeMediaStream = () => {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

/** 전체 정리 (페이지 이탈 / 컴포넌트 언마운트) */
const cleanup = async () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  stopAutoSave()

  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close()
    ws = null
  }

  disconnectAudio()

  if (activeRecorder && activeRecorder.state !== 'inactive') {
    activeRecorder.stop()
  }
  activeRecorder = null

  finalizeMediaStream()

  interimBlockByItemId.clear()
  speechTimingByItemId.clear()

  isRecording.value = false
  connectionStatus.value = 'idle'
}

// ─── 이어서 녹음: 마지막 청크 업로드 ───────────────────────────────

/**
 * 이어서 녹음 후 종료 시 — 현재 구간 미업로드 청크를 마지막 백업 파일로 업로드
 * stopRecording() 호출 이전에 호출 (activeChunks 확정 전에 recorder stop이 필요하면 rotateRecorder 사용)
 */
const uploadRemainingChunks = async (meetingId: string): Promise<boolean> => {
  if (activeChunks.length === 0) return true

  const { fetchUploadBackupAudio } = useMeetingApi()
  const blob = new Blob(activeChunks, { type: mimeType || 'audio/webm' })
  const filename = `backup_${autoSaveIndex}.webm`

  try {
    await fetchUploadBackupAudio(Number(meetingId), blob, filename)
    console.info('[FinishSave] 마지막 청크 업로드 완료:', filename, `${blob.size}bytes`)
    return true
  } catch (e) {
    console.warn('[FinishSave] 마지막 청크 업로드 실패:', e)
    return false
  }
}

/**
 * 페이지 이탈 시 마지막 구간 청크 sendBeacon 전송
 * beforeunload 핸들러에서 동기 호출
 */
const sendRemainingChunksBeacon = (meetingId: string): boolean => {
  if (activeChunks.length === 0) return true

  const blob = new Blob(activeChunks, { type: mimeType || 'audio/webm' })
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

// ─── 기타 Public API ─────────────────────────────────────────────────

/** 브라우저 지원 여부 확인 — onMounted에서 호출 */
const checkSupport = () => {
  isSupported.value = !!(window.WebSocket && navigator.mediaDevices?.getUserMedia)
}

/** 상태 초기화 (녹음 종료 + 페이지 이동 후) */
const resetRecording = () => {
  blocks.value = []
  interimBlockByItemId.clear()
  speechTimingByItemId.clear()
  allChunks = []
}

/** 타임스탬프 포맷 유틸 (UI에서 직접 사용 가능) */
const formatTimestamp = (elapsedMs?: number): string => {
  if (elapsedMs == null) return '--:--:--'
  return formatElapsedTime(elapsedMs)
}

// ─── 하위 호환: isConnecting computed ───────────────────────────────
const isConnecting = computed(
  () => connectionStatus.value === 'connecting' || connectionStatus.value === 'reconnecting',
)

export const useRealtimeTranscription = () => ({
  isRecording,
  isConnecting,
  connectionStatus,
  isSupported,
  blocks,
  audioMode: computed(() => audioMode),
  checkSupport,
  startRecording,
  stopRecording,
  cleanup,
  resetRecording,
  startAutoSave,
  stopAutoSave,
  sendRemainingChunksBeacon,
  uploadRemainingChunks,
  formatTimestamp,
})
