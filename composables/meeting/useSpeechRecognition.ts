/**
 * Web Speech API 래퍼
 * - 한국어 실시간 음성 인식
 * - Chrome 전용 (SpeechRecognition / webkitSpeechRecognition)
 * - 화자 분리용 발화 단락(segments) 수집
 */

import type { SpeechSegment } from '~/types/meeting'

const isRecording = ref(false)
const interimText = ref('') // 인식 중인 임시 텍스트 (실시간 자막)
const finalText = ref('') // 확정된 전체 텍스트 누적
const isSupported = ref(false)
const segments = ref<SpeechSegment[]>([]) // 화자 분리용 발화 단락

let recognition: SpeechRecognition | null = null
let segSeq = 0 // 발화 단락 시퀀스
let isStarting = false // start() 중복 호출 방지
let restartTimer: ReturnType<typeof setTimeout> | null = null
let restartAttempt = 0
const MAX_RESTART_ATTEMPT = 5

const clearRestartTimer = () => {
  if (!restartTimer) return
  clearTimeout(restartTimer)
  restartTimer = null
}

const scheduleRestart = (r: SpeechRecognition) => {
  if (!isRecording.value) return
  if (isStarting) return
  if (restartAttempt >= MAX_RESTART_ATTEMPT) {
    console.warn('[SpeechRecognition] 자동 재시작 최대 횟수 초과')
    return
  }

  // 연속 onend/start 충돌 방지를 위해 짧은 지연 후 재시작
  const delay = Math.min(300 + restartAttempt * 250, 1500)
  restartAttempt += 1
  clearRestartTimer()
  restartTimer = setTimeout(() => {
    if (!isRecording.value || isStarting) return
    try {
      isStarting = true
      r.start()
    } catch (error) {
      isStarting = false
      console.warn('[SpeechRecognition] 재시작 실패:', error)
      scheduleRestart(r)
    }
  }, delay)
}

const initRecognition = () => {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognitionApi) {
    isSupported.value = false
    return null
  }

  isSupported.value = true
  const r = new SpeechRecognitionApi() as SpeechRecognition
  r.lang = 'ko-KR'
  r.continuous = true // 말이 끊겨도 계속 인식
  r.interimResults = true // 확정 전 중간 결과 반환

  r.onstart = () => {
    isStarting = false
    restartAttempt = 0
  }

  r.onresult = (event: SpeechRecognitionEvent) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalText.value += transcript
        // 확정된 발화 단락을 segments에 추가
        segments.value.push({ seq: segSeq++, text: transcript.trim() })
      } else {
        interim += transcript
      }
    }
    interimText.value = interim
  }

  // Chrome은 일정 시간 후 자동 종료 → 녹음 중이면 재시작
  r.onend = () => {
    isStarting = false
    scheduleRestart(r)
  }

  r.onerror = (event: SpeechRecognitionErrorEvent) => {
    // 'no-speech'는 정상 (말 없을 때) → 무시
    if (event.error === 'no-speech') return

    if (event.error === 'audio-capture') {
      isRecording.value = false
      clearRestartTimer()
      console.warn('[SpeechRecognition] 마이크에 접근할 수 없습니다. 권한을 확인해주세요.')
      return
    }

    if (event.error === 'not-allowed') {
      isRecording.value = false
      clearRestartTimer()
      console.warn('[SpeechRecognition] 마이크 권한이 거부되었습니다.')
      return
    }

    if (event.error === 'aborted' || event.error === 'network') {
      isStarting = false
      scheduleRestart(r)
      return
    }

    console.warn('[SpeechRecognition] error:', event.error)
  }

  return r
}

const startRecognition = () => {
  if (isRecording.value || isStarting) return

  if (!recognition) {
    recognition = initRecognition()
  }
  if (!recognition) return

  clearRestartTimer()
  restartAttempt = 0
  finalText.value = ''
  interimText.value = ''
  segments.value = []
  segSeq = 0
  isRecording.value = true
  try {
    isStarting = true
    recognition.start()
  } catch (error) {
    isStarting = false
    console.warn('[SpeechRecognition] 시작 실패:', error)
  }
}

const stopRecognition = () => {
  isRecording.value = false
  isStarting = false
  restartAttempt = 0
  clearRestartTimer()
  interimText.value = ''
  recognition?.stop()
}

const resetRecognition = () => {
  stopRecognition()
  finalText.value = ''
  segments.value = []
  segSeq = 0
  recognition = null
}

/** 브라우저 지원 여부 체크 — onMounted에서 호출 */
const checkSupport = () => {
  isSupported.value = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export const useSpeechRecognition = () => {
  return {
    isRecording,
    interimText,
    finalText,
    segments,
    isSupported,
    checkSupport,
    startRecognition,
    stopRecognition,
    resetRecognition,
  }
}
