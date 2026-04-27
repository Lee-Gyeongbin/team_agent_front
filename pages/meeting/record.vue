<template>
  <div class="meeting-record-page">
    <!-- 헤더 -->
    <div class="meeting-record-header">
      <button
        type="button"
        class="meeting-record-back"
        @click="onClickBack"
      >
        <i class="icon-arrow-left-sm size-20" />
      </button>
      <div class="meeting-record-header-info">
        <h2 class="meeting-record-title">{{ meetingTitle }}</h2>
        <span class="meeting-record-timer">{{ timerDisplay }}</span>
      </div>
      <span
        v-if="isRecording"
        class="meeting-record-badge is-recording"
      >
        <i class="meeting-record-dot" />
        녹음 중
      </span>
      <span
        v-else-if="isConnecting"
        class="meeting-record-badge is-connecting"
      >
        연결 중...
      </span>
    </div>

    <!-- 미지원 안내 -->
    <div
      v-if="!isSupported"
      class="meeting-record-unsupported"
    >
      <i class="icon-warning size-24" />
      <p>이 브라우저는 음성 인식을 지원하지 않습니다.<br />Chrome 브라우저를 사용해 주세요.</p>
    </div>

    <!-- 실시간 자막 -->
    <MeetingTranscript v-else />

    <!-- 컨트롤 버튼 -->
    <div
      v-if="isSupported"
      class="meeting-record-controls"
    >
      <button
        v-if="!isRecording && !isConnecting"
        type="button"
        class="btn btn-primary meeting-record-btn"
        @click="onClickStart"
      >
        <i class="icon-microphone size-20" />
        녹음 시작
      </button>
      <button
        v-else-if="isConnecting"
        type="button"
        class="btn btn-secondary meeting-record-btn"
        disabled
      >
        연결 중...
      </button>
      <button
        v-else
        type="button"
        class="btn btn-danger meeting-record-btn"
        :disabled="isFinishing"
        @click="onClickFinish"
      >
        <i class="icon-stop size-20" />
        {{ isFinishing ? '회의록 생성 중...' : '회의 종료' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import type { SpeechSegment } from '~/types/meeting'

const route = useRoute()
const meetingId = Number(route.query.meetingId)

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
const { isFinishing, handleFinishMeetingWithAudio, handleSelectMeetingDetail, meetingDetail } = useMeetingStore()

const meetingTitle = ref('')

// ── 타이머 ─────────────────────────────────────────────────────────
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

// ── 라이프사이클 ────────────────────────────────────────────────────
onMounted(async () => {
  checkSupport()
  if (!meetingId) {
    openToast({ message: '유효하지 않은 회의입니다.', type: 'error' })
    navigateTo('/meeting')
    return
  }
  await handleSelectMeetingDetail(meetingId)
  meetingTitle.value = meetingDetail.value.meeting?.meetingTitle ?? ''
})

onBeforeUnmount(async () => {
  stopTimer()
  await cleanup()
  resetRecording()
})

// ── 이벤트 핸들러 ───────────────────────────────────────────────────
const onClickStart = async () => {
  const started = await startRecording()
  if (!started) {
    openToast({ message: '녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.', type: 'error' })
    return
  }
  startTimer()
}

const onClickFinish = async () => {
  const confirmed = await openConfirm({
    title: '회의 종료',
    message: '녹음을 종료하고 회의록을 생성하시겠습니까?',
  })
  if (!confirmed) return

  stopTimer()

  // 전체 오디오 Blob 확보
  const audioBlob = await stopRecording()
  if (!audioBlob) {
    openToast({ message: '녹음된 내용이 없습니다.', type: 'warning' })
    return
  }

  const success = await handleFinishMeetingWithAudio({
    meetingId,
    audioBlob,
    segments: [],
  })
  if (success) {
    resetRecording()
    navigateTo(`/meeting/${meetingId}`)
  }
}

const onClickBack = async () => {
  if (isRecording.value || isConnecting.value) {
    const confirmed = await openConfirm({
      title: '녹음 중단',
      message: '녹음을 중단하고 나가시겠습니까? 저장되지 않은 내용은 사라집니다.',
    })
    if (!confirmed) return
    stopTimer()
  }
  await cleanup()
  resetRecording()
  navigateTo('/meeting')
}
</script>
