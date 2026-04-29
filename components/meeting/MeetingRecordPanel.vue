<template>
  <div class="meeting2-panel">
    <div class="meeting2-panel-header">
      <span class="meeting2-panel-title">실시간 녹음 / STT</span>
      <!-- 녹음 상태 배지 -->
      <span
        v-if="isRecording"
        class="meeting2-record-badge is-recording"
      >
        <i class="meeting2-record-dot" />
        녹음 중
      </span>
      <span
        v-else-if="isConnecting"
        class="meeting2-record-badge is-connecting"
      >
        연결 중...
      </span>
      <!-- 타이머 -->
      <span
        v-if="isRecording || isConnecting"
        class="meeting2-record-timer"
      >
        {{ timerDisplay }}
      </span>
    </div>

    <!-- 미지원 안내 -->
    <div
      v-if="!isSupported"
      class="meeting2-record-unsupported"
    >
      <i class="icon-warning size-24" />
      <p>이 브라우저는 음성 인식을 지원하지 않습니다.<br />Chrome 브라우저를 사용해 주세요.</p>
    </div>

    <template v-else>
      <!-- 상단 고정 영역: 녹음 컨트롤 + 파형 + STT 툴바 -->
      <div class="meeting2-record-fixed">
        <MeetingRecordControl
          :is-recording="isRecording"
          :is-connecting="isConnecting"
          :is-finishing="isFinishing"
          :elapsed="elapsed"
          @start="onClickStart"
          @finish="onClickFinish"
        />
        <MeetingWaveform />
        <MeetingSttToolbar />
      </div>

      <!-- 스크롤 영역: 발화 리스트 + 화자 목록 -->
      <div class="meeting2-record-scroll">
        <MeetingSttList />
        <MeetingSpeakerList />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useSpeechRecognition } from '~/composables/meeting/useSpeechRecognition'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import type { SpeechSegment } from '~/types/meeting'
import type { MeetingSttItem } from '~/types/meeting2'

const route = useRoute()
/** 현재 회의 ID — 라우트 파라미터에서 추출 */
const meetingId = computed(() => Number(route.params.id))

// ── 실시간 STT (WebSocket 기반) ──────────────────────────────────────
const {
  isRecording,
  isConnecting,
  isSupported,
  blocks,
  checkSupport,
  startRecording,
  stopRecording,
  cleanup,
  resetRecording,
} = useRealtimeTranscription()

// ── Web Speech API (fallback) ────────────────────────────────────────
const {
  isSupported: isSpeechSupported,
  checkSupport: checkSpeechSupport,
  startRecognition,
  stopRecognition,
  resetRecognition,
  segments: speechSegments,
} = useSpeechRecognition()

// ── 스토어 ───────────────────────────────────────────────────────────
const { currentMeeting, isFinishing, handleFinishMeetingWithAudio, handleSelectMeetingDetail } = useMeetingStore()

/** Realtime/WebSpeech 결과를 STT 리스트 UI 데이터로 변환 */
const buildRealtimeSttList = (): MeetingSttItem[] =>
  blocks.value
    .filter((b) => !!b.text?.trim())
    .map((b) => ({
      id: b.id,
      speakerId: 'realtime',
      speakerName: b.speaker || '화자 미확정',
      time: '-',
      text: b.text.trim(),
    }))

const buildFallbackSttList = (): MeetingSttItem[] =>
  speechSegments.value
    .filter((s) => !!s.text?.trim())
    .map((s) => ({
      id: `speech-${s.seq}`,
      speakerId: 'realtime',
      speakerName: '화자 미확정',
      time: '-',
      text: s.text.trim(),
    }))

watch(
  [blocks, speechSegments],
  () => {
    if (!currentMeeting.value) return
    const nextList = buildRealtimeSttList()
    currentMeeting.value.sttList = nextList.length > 0 ? nextList : buildFallbackSttList()
  },
  { deep: true },
)

// ── 타이머 ───────────────────────────────────────────────────────────
const elapsed = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const timerDisplay = computed(() => {
  const m = Math.floor(elapsed.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (elapsed.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const startTimer = () => {
  elapsed.value = 0
  timerInterval = setInterval(() => elapsed.value++, 1000)
}

const stopTimer = () => {
  if (!timerInterval) return
  clearInterval(timerInterval)
  timerInterval = null
}

// ── 라이프사이클 ─────────────────────────────────────────────────────
onMounted(() => {
  checkSupport()
  checkSpeechSupport()
})

onBeforeUnmount(async () => {
  stopTimer()
  await cleanup()
  resetRecording()
  resetRecognition()
})

// ── 이벤트 핸들러 ────────────────────────────────────────────────────

/** 녹음 시작 — Realtime WebSocket 우선, 실패 시 Web Speech API fallback */
const onClickStart = async () => {
  const started = await startRecording()
  if (!started) {
    if (isSpeechSupported.value) {
      startRecognition()
      openToast({ message: 'WebSocket 연결 실패 — Web Speech API로 전환합니다.', type: 'warning' })
    } else {
      openToast({ message: '녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.', type: 'error' })
      return
    }
  }
  startTimer()
}

/** 회의 종료 — 녹음 중단 후 회의록 생성 */
const onClickFinish = async () => {
  const confirmed = await openConfirm({
    title: '회의 종료',
    message: '녹음을 종료하고 회의록을 생성하시겠습니까?',
  })
  if (!confirmed) return

  stopTimer()

  // Realtime 블록 기반 segments
  const realtimeSegments: SpeechSegment[] = blocks.value
    .filter((b) => b.status === 'confirmed')
    .map((b, idx) => ({ seq: idx, text: b.text }))

  // Web Speech API segments (fallback 경우 활용)
  const fallbackSegments: SpeechSegment[] = speechSegments.value.map((s) => ({ seq: s.seq, text: s.text }))

  const segments = realtimeSegments.length > 0 ? realtimeSegments : fallbackSegments

  // 전체 오디오 Blob 확보 (Realtime 녹음)
  const audioBlob = await stopRecording()
  stopRecognition()

  if (!audioBlob && segments.length === 0) {
    openToast({ message: '녹음된 내용이 없습니다.', type: 'warning' })
    return
  }

  if (!audioBlob) {
    openToast({ message: '오디오 파일이 없습니다. 녹음 후 종료해주세요.', type: 'warning' })
    return
  }

  const success = await handleFinishMeetingWithAudio({
    meetingId: meetingId.value,
    audioBlob,
    segments,
  })

  if (success) {
    resetRecording()
    resetRecognition()
    // 동일 라우트면 onMounted가 안 돌아가므로 상세·에디터 HTML 재조회
    await handleSelectMeetingDetail(meetingId.value)
    navigateTo(`/meeting/${meetingId.value}`)
  }
}
</script>
