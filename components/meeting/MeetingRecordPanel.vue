<template>
  <div class="meeting2-panel">
    <!-- ── 통합 회의록: 원본 회의 목록 표시 ── -->
    <template v-if="currentMeeting?.integrateYn === 'Y'">
      <div class="meeting2-panel-header">
        <span class="meeting2-panel-title">통합된 회의 목록</span>
      </div>
      <MeetingIntegratedSources />
    </template>

    <!-- ── 일반 회의: 실시간 녹음 / STT ── -->
    <template v-else>
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
            :is-abnormal="isAbnormal && !isRecording && !isConnecting"
            :elapsed="elapsed"
            @start="onClickStart"
            @finish="onClickFinish"
            @resume="onResume"
            @generate-from-backup="onGenerateFromBackup"
          />
          <MeetingWaveform />
          <MeetingSttToolbar :meeting-id="meetingId" />
        </div>

        <!-- 스크롤 영역: 발화 리스트 + 화자 목록 -->
        <div class="meeting2-record-scroll">
          <MeetingSttList />
          <MeetingSpeakerList />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useSpeechRecognition } from '~/composables/meeting/useSpeechRecognition'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { useHeartbeat } from '~/composables/meeting/useHeartbeat'
import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import type { MeetingSttItem } from '~/types/meeting'
import type { Ref } from 'vue'

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
  sendRemainingChunksBeacon,
  uploadRemainingChunks,
} = useRealtimeTranscription()

// ── Heartbeat / Beacon ───────────────────────────────────────────────
const { startHeartbeat, stopHeartbeat, registerUnloadBeacon, unregisterUnloadBeacon } = useHeartbeat()

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
const {
  currentMeeting,
  isFinishing,
  handleFinishMeetingWithAudio,
  handleFinishResumedMeeting,
  handleSelectMeetingDetail,
  handleRecoverMeeting,
} = useMeetingStore()

const { fetchBackupFileCount } = useMeetingApi()

// ── 비정상 종료 상태 (pages/meeting/[id].vue에서 provide) ────────────
const isAbnormal = inject<Ref<boolean>>('isAbnormal', ref(false))

/** 이어서 녹음 모드 — 기존 백업 파일이 있는 상태에서 추가 녹음 후 종료 시 사용 */
const isResumeMode = ref(false)

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
  stopHeartbeat()
  unregisterUnloadBeacon()
  await cleanup()
  resetRecording()
  resetRecognition()
})

/**
 * SPA 내부 라우트 이탈 감지 (뒤로가기, 다른 메뉴 클릭 등)
 * - 녹음 중이 아니면 자유롭게 이탈
 * - 녹음 중이면 확인 후 비정상종료 처리
 *
 * beforeunload(탭/브라우저 닫기)와 함께 모든 이탈 경로를 커버
 */
onBeforeRouteLeave(async (_to, _from, next) => {
  if (!isRecording.value && !isConnecting.value) {
    next()
    return
  }

  const confirmed = await openConfirm({
    title: '회의 진행 중',
    message: '회의가 진행 중입니다.\n지금 나가면 비정상 종료로 처리되며, 복구할 수 있습니다.\n계속 나가시겠습니까?',
  })

  if (!confirmed) {
    next(false)
    return
  }

  const idStr = String(meetingId.value)

  // 1. 남은 오디오 청크 즉시 전송 (sendBeacon: 페이지 컨텍스트 살아있는 시점)
  sendRemainingChunksBeacon(idStr)

  // 2. Heartbeat/beacon 정리 (beforeunload 이벤트 해제 → 중복 처리 방지)
  stopTimer()
  stopHeartbeat()
  unregisterUnloadBeacon()

  // 3. 비정상종료 cancel API 호출 (라우트 이탈 전이므로 fetch 사용 가능)
  try {
    await fetch(`/api/meeting/${idStr}/cancel`, { method: 'POST' })
  } catch (e) {
    console.warn('[RouteLeave] cancel 호출 실패:', e)
  }

  next()
})

// ── 이벤트 핸들러 ────────────────────────────────────────────────────

/**
 * 이어서 녹음 — 비정상 종료 후 이어서 녹음 시작
 * 기존 백업 파일 개수를 조회해 auto-save 인덱스를 이어서 시작
 */
const onResume = async () => {
  let initialBackupIndex = 0
  try {
    const res = await fetchBackupFileCount(meetingId.value)
    initialBackupIndex = res.count ?? 0
  } catch {
    // 조회 실패 시 0부터 시작 (기존 파일 덮어쓰기 위험 있으나 최선)
    console.warn('[onResume] 백업 파일 개수 조회 실패 — 인덱스 0부터 시작')
  }
  isAbnormal.value = false
  isResumeMode.value = true
  await onClickStart(initialBackupIndex)
}

/** 기존 음성으로 회의록 생성 — 백업 파일 복구 후 SSE 처리 */
const onGenerateFromBackup = async () => {
  const confirmed = await openConfirm({
    title: '기존 음성으로 회의록 생성',
    message: '백업된 음성 파일로 회의록을 생성하시겠습니까?',
  })
  if (!confirmed) return

  const success = await handleRecoverMeeting({ meetingId: meetingId.value })
  if (success) {
    isAbnormal.value = false
    await handleSelectMeetingDetail(meetingId.value)
  }
}

/** 녹음 시작 — Realtime WebSocket 우선, 실패 시 Web Speech API fallback */
const onClickStart = async (initialBackupIndex = 0) => {
  const idStr = String(meetingId.value)
  const started = await startRecording(idStr, initialBackupIndex)
  if (!started) {
    if (isSpeechSupported.value) {
      startRecognition()
      openToast({ message: 'WebSocket 연결 실패 — Web Speech API로 전환합니다.', type: 'warning' })
    } else {
      openToast({ message: '녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.', type: 'error' })
      return
    }
  }
  // Heartbeat 시작 + 페이지 이탈 감지 등록
  // onBeforeCancel: 탭 닫기 전 마지막 auto-save 이후 남은 청크를 sendBeacon으로 전송
  startHeartbeat(idStr)
  registerUnloadBeacon(idStr, () => sendRemainingChunksBeacon(idStr))
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
  stopHeartbeat()
  unregisterUnloadBeacon()

  stopRecognition()

  // ── 이어서 녹음 모드: 기존 백업 + 이번 세션 청크를 모두 병합해 처리 ──
  if (isResumeMode.value) {
    // MediaRecorder를 먼저 중지해 모든 ondataavailable 이벤트가 flush되도록 함
    await stopRecording()

    const idStr = String(meetingId.value)
    const success = await handleFinishResumedMeeting({
      meetingId: meetingId.value,
      uploadRemainingChunks: () => uploadRemainingChunks(idStr),
    })

    if (success) {
      isResumeMode.value = false
      resetRecording()
      resetRecognition()
      await handleSelectMeetingDetail(meetingId.value)
      navigateTo(`/meeting/${meetingId.value}`)
    }
    return
  }

  // ── 일반 종료 모드: 현재 세션 전체 Blob을 직접 업로드 ──
  const audioBlob = await stopRecording()

  if (!audioBlob) {
    openToast({ message: '녹음된 오디오가 없습니다. 녹음 후 종료해 주세요.', type: 'warning' })
    return
  }

  const success = await handleFinishMeetingWithAudio({
    meetingId: meetingId.value,
    audioBlob,
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
