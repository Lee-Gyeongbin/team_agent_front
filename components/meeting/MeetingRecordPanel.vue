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
        <span class="meeting2-panel-title">{{ view === 'speaker' ? '화자 분리' : '실시간 녹음 / STT' }}</span>
        <!-- 재연결 중일 때만 배지 표시 (녹음 중/연결 중/타이머는 하단 MeetingRecordControl에서 표시) -->
        <span
          v-if="isRecording && connectionStatus === 'reconnecting'"
          class="meeting2-record-badge is-reconnecting"
        >
          <i class="meeting2-record-dot" />
          자막 재연결 중...
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

      <!-- 본문 — split: 좌(STT 목록) / 우(컨트롤·안내·툴바·화자), 아니면 위아래 배치(회의록 생성 단계) -->
      <div
        v-else
        class="meeting2-record-body"
        :class="{ 'is-split': split }"
      >
        <!-- 좌측: 실시간 STT 목록 -->
        <section class="meeting2-record-main">
          <MeetingSttList />
        </section>

        <!-- 우측: 상황별 안내 + 녹음 컨트롤 + 툴바 + 화자 목록 + 녹음 중 안내 -->
        <aside class="meeting2-record-side">
          <div class="meeting2-record-side-notices">
            <!-- 녹음 중 로그인 끊김 / 업로드 실패 안내 -->
            <div
              v-if="isRecording && isSessionLost"
              class="meeting2-record-notice is-warning"
            >
              <UiIcon
                name="triangle-alert"
                size="14"
              />
              로그인이 끊겼습니다. 녹음은 계속되고 있습니다. 다른 탭에서 다시 로그인하면 이어서 저장됩니다. 이 화면은
              닫지 마세요.
            </div>
            <div
              v-else-if="isRecording && failedBackupCount > 0"
              class="meeting2-record-notice is-warning"
            >
              <UiIcon
                name="triangle-alert"
                size="14"
              />
              서버에 저장하지 못한 구간이 있습니다. 연결이 돌아오면 자동으로 다시 올립니다.
            </div>

            <!-- 실시간 STT 모드 안내 (에러가 아닌 현재 인식 방식 설명) -->
            <div
              v-if="sttModeNotice"
              class="meeting2-record-notice is-mode"
            >
              <UiIcon
                :name="sttModeNotice.icon"
                size="14"
              />
              {{ sttModeNotice.text }}
            </div>

            <!-- 비정상 종료 안내 -->
            <div
              v-if="isAbnormalView"
              class="meeting2-record-notice is-warning"
            >
              <UiIcon
                name="triangle-alert"
                size="14"
              />
              <span>
                <template
                  v-for="(line, idx) in abnormalGuideLines"
                  :key="idx"
                >
                  <br v-if="idx > 0" />{{ line }}
                </template>
              </span>
            </div>

            <!-- 화자 분리 중단 · 실패 안내 (처리 중 서버 재기동 · STT 오류) — CMB 와 같이 다시 시도 또는 오디오 다시 첨부 -->
            <div
              v-if="isDiarizeFailedView"
              class="meeting2-record-notice is-warning has-action"
            >
              <UiIcon
                name="triangle-alert"
                size="14"
              />
              <span class="meeting2-record-notice-text">
                {{ minutesStatusMessage || '화자 분리가 중단되었습니다. 다시 시도하거나 오디오를 다시 첨부해 주세요.' }}
              </span>
              <UiButton
                variant="outline"
                size="xs"
                :disabled="isFinishing"
                @click="onRetryDiarize"
              >
                <template #icon-left>
                  <UiIcon
                    name="refresh-cw"
                    size="14"
                  />
                </template>
                다시 시도
              </UiButton>
            </div>
          </div>

          <!-- 녹음 컨트롤 + 파형 + STT 툴바 -->
          <div class="meeting2-record-fixed">
            <MeetingRecordControl
              v-show="view === 'record'"
              :is-recording="isRecording"
              :is-connecting="isConnecting"
              :is-finishing="isFinishing || isLeaving"
              :is-abnormal="isAbnormalView"
              :is-paused="isPausedView"
              :backup-cnt="backupIndexes.length"
              :elapsed="elapsed"
              @start="onClickStart"
              @pause="onClickPause"
              @finish="onClickFinish"
              @resume="onResume"
              @generate-from-backup="onGenerateFromBackup"
              @attach-missing="onClickAttachMissing"
              @replace-audio="onClickReplaceAudio"
            />
            <MeetingWaveform v-show="view === 'record'" />
            <MeetingSttToolbar
              :meeting-id="meetingId"
              :view="view"
            />
          </div>

          <!-- 화자 목록 -->
          <div class="meeting2-record-speakers">
            <MeetingSpeakerList />
          </div>

          <!-- 녹음 중 안내 (화자 목록 아래 고정 — 위에 두면 나타날 때 화면이 밀림) — 제목 + 항목(아이콘 · 한 줄 요약 · 설명, 핵심어 강조) -->
          <div
            v-if="isRecording"
            class="meeting2-record-guide"
          >
            <p class="meeting2-record-guide-title">
              <UiIcon
                name="info"
                size="16"
              />
              녹음 중 확인해 주세요
            </p>
            <div
              v-for="guide in recordGuides"
              :key="guide.key"
              class="meeting2-record-guide-item"
            >
              <span :class="['meeting2-record-guide-icon', `is-${guide.tone}`]">
                <UiIcon
                  :name="guide.icon"
                  size="14"
                />
              </span>
              <div class="meeting2-record-guide-body">
                <p class="meeting2-record-guide-head">{{ guide.head }}</p>
                <p class="meeting2-record-guide-sub">
                  <template
                    v-for="(part, idx) in guide.sub"
                    :key="idx"
                  >
                    <strong v-if="part.strong">{{ part.text }}</strong>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </p>
              </div>
            </div>
          </div>
        </aside>

        <!-- 누락 구간 첨부 / 다른 오디오로 대체 파일 선택 (버튼으로만 열기) -->
        <input
          ref="missingFileInputRef"
          type="file"
          accept=".webm,audio/webm"
          multiple
          hidden
          @change="onMissingFilesChange"
        />
        <input
          ref="replaceFileInputRef"
          type="file"
          accept="audio/*"
          hidden
          @change="onReplaceFileChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { onBeforeRouteLeave } from 'vue-router'
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useSpeechRecognition } from '~/composables/meeting/useSpeechRecognition'
import { useSttMode, type SttMode } from '~/composables/meeting/useSttMode'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { useMeetingRecordGuard, isMeetingSessionLost } from '~/composables/meeting/useMeetingRecordGuard'
import { openToast } from '~/composables/useToast'
import { openAlert, openConfirm } from '~/composables/useDialog'
import type { MeetingBackupSegment, MeetingSttItem } from '~/types/meeting'

const props = withDefaults(
  defineProps<{
    /** record: 녹음 단계 화면 / speaker: 화자 분리·회의록 생성 단계 화면 (녹음 컨트롤·파형 숨김) */
    view?: 'record' | 'speaker'
    /** 좌(STT 목록) / 우(컨트롤·툴바·화자) 분할 — 녹음·화자 분리 단계. 회의록 생성 단계(좁은 왼쪽 칸)는 false */
    split?: boolean
  }>(),
  { view: 'record', split: false },
)
const view = computed(() => props.view)

const route = useRoute()
/** 현재 회의 ID — 라우트 파라미터에서 추출 */
const meetingId = computed(() => Number(route.params.id))

// ── 실시간 STT (WebSocket 기반) + 녹음 ───────────────────────────────
const {
  isRecording,
  isConnecting,
  connectionStatus,
  isSupported,
  blocks,
  checkSupport,
  startRecording,
  stopRecording,
  cleanup,
  resetRecording,
  getCurrentSegmentBlob,
} = useRealtimeTranscription()

// ── 녹음 보호 (백업 조각 / heartbeat / 로그인 끊김 / 이탈 / 화면 꺼짐 방지) ──
const {
  isSessionLost,
  failedBackupCount,
  isWakeLockSupported,
  checkWakeLockSupport,
  startRecordGuard,
  stopRecordGuard,
  resetRecordGuard,
  tryReconnect,
  peekNextIndex,
  takeNextIndex,
  flushBackups,
  downloadUnsentSegments,
  markAbnormalOnServer,
  pauseOnServer,
  uploadFinishAudio,
} = useMeetingRecordGuard()

// ── Web Speech API (fallback) ────────────────────────────────────────
const {
  isSupported: isSpeechSupported,
  checkSupport: checkSpeechSupport,
  startRecognition,
  stopRecognition,
  resetRecognition,
  segments: speechSegments,
} = useSpeechRecognition()

// ── 실시간 STT 모드 (OpenAI / 브라우저 음성 인식 / 재연결 / 자막 없음) ──
const { sttMode } = useSttMode()

const STT_MODE_NOTICES: Partial<Record<SttMode, { icon: string; text: string }>> = {
  webspeech: {
    icon: 'info',
    text: '실시간 자막을 OpenAI 대신 브라우저 음성 인식(Chrome)으로 표시하고 있습니다. 자막 정확도는 조금 낮을 수 있지만, 녹음은 그대로 저장됩니다. 회의를 마치면 화자 분리와 회의록은 저장된 녹음 파일로 만들어지므로 결과 품질에는 영향이 없습니다.',
  },
  reconnecting: {
    icon: 'refresh-cw',
    text: 'OpenAI 실시간 자막 연결이 잠시 끊겨 다시 연결하고 있습니다. 녹음은 계속 저장되고 있으며, 연결되면 자막이 이어서 표시됩니다.',
  },
  none: {
    icon: 'info',
    text: '지금은 실시간 자막을 표시할 수 없습니다. 녹음은 정상적으로 저장되고 있으며, 회의를 마치면 녹음 파일로 회의록이 만들어집니다.',
  },
}

/** 녹음 중 안내 — 화면 유지 / 실시간 문장 한계 (화면 꺼짐 방지 미지원 브라우저는 한 줄 추가) */
interface RecordGuide {
  key: string
  icon: string
  tone: 'warn' | 'info'
  head: string
  /** 설명 — strong 인 조각은 굵게 */
  sub: Array<{ text: string; strong?: boolean }>
}

const recordGuides = computed<RecordGuide[]>(() => {
  const guides: RecordGuide[] = [
    {
      key: 'keep-open',
      icon: 'monitor',
      tone: 'warn',
      head: '회의가 끝날 때까지 이 화면을 열어 두세요',
      sub: [
        { text: '다른 메뉴 이동·탭 닫기', strong: true },
        { text: '는 녹음이 바로 중단되고, ' },
        { text: '덮개 닫기·절전·잠금(Win+L)', strong: true },
        { text: '이나 다른 창을 오래 띄워 두면 중단될 수 있어요.' },
      ],
    },
    {
      key: 'realtime-text',
      icon: 'pencil-line',
      tone: 'info',
      head: '실시간 문장은 불완전할 수 있어요',
      sub: [
        { text: '회의 종료 후 녹음 파일로 다시 전사해 ' },
        { text: '화자 분리와 회의록에는 정확히 반영', strong: true },
        { text: '됩니다.' },
      ],
    },
  ]
  if (!isWakeLockSupported.value) {
    guides.push({
      key: 'wake-lock',
      icon: 'battery-warning',
      tone: 'warn',
      head: '이 브라우저는 화면 꺼짐 방지를 지원하지 않아요',
      sub: [
        { text: 'Chrome', strong: true },
        { text: '을 사용하거나 전원 설정에서 ' },
        { text: '화면 끄기·절전 시간', strong: true },
        { text: '을 늘려 주세요.' },
      ],
    })
  }
  return guides
})

const sttModeNotice = computed(() => STT_MODE_NOTICES[sttMode.value] ?? null)

/** OpenAI 자막 실패 시 브라우저 음성 인식으로 전환 (중복 호출 안전 — startRecognition 내부 가드) */
const startSpeechFallback = () => {
  if (!isSpeechSupported.value) return
  startRecognition()
}

// 녹음 도중 OpenAI 재연결 한도 초과로 끊긴 경우에도 브라우저 음성 인식으로 이어서 자막 표시
watch(connectionStatus, (status) => {
  if (status === 'failed' && isRecording.value) startSpeechFallback()
})

// ── 스토어 ───────────────────────────────────────────────────────────
const {
  currentMeeting,
  meetingDetail,
  isFinishing,
  handleFinishMeetingWithAudio,
  handleProcessUploadedMeeting,
  handleSelectMeetingDetail,
  handleRecoverMeeting,
  handleRetryDiarize,
  handleAttachMissingSegments,
  minutesState,
  minutesStatusMessage,
  minutesStatusStep,
} = useMeetingStore()

// ── 비정상 종료 / 백업 상태 (상세 응답 기준) ──────────────────────────
/** 서버에 백업된 녹음 조각 번호 */
const backupIndexes = computed(() => meetingDetail.value.backupIndexes ?? [])
/** 0번부터 마지막 번호 사이에 비어 있는 구간 번호 (1부터) */
const backupGapNos = computed(() => {
  const indexes = backupIndexes.value
  if (indexes.length === 0) return []
  const gaps: number[] = []
  for (let i = 0; i < indexes[indexes.length - 1]; i++) {
    if (!indexes.includes(i)) gaps.push(i + 1)
  }
  return gaps
})
/** 녹음 중 이탈 처리 중 (업로드 마무리) */
const isLeaving = ref(false)
/** 비정상 종료 화면 여부 — 녹음 중이 아닐 때만 */
const isAbnormalView = computed(
  () => currentMeeting.value?.abnormalYn === 'Y' && !isRecording.value && !isConnecting.value,
)

/** 일시정지 화면 여부 — 녹음 중이 아니고 비정상 종료가 아닐 때 (비정상 종료가 우선) */
const isPausedView = computed(
  () => currentMeeting.value?.pauseYn === 'Y' && !isRecording.value && !isConnecting.value && !isAbnormalView.value,
)

/**
 * 화자 분리 중단 · 실패 화면 — 오디오는 올라갔는데 화자 분리가 끝나지 않은 상태 (서버 판정 state=error, step=transcribe)
 * 녹음 중 · 처리 중 · 비정상 종료 안내가 보일 때는 숨김
 */
const isDiarizeFailedView = computed(
  () =>
    minutesState.value === 'error' &&
    minutesStatusStep.value === 'transcribe' &&
    !isRecording.value &&
    !isConnecting.value &&
    !isFinishing.value &&
    !isAbnormalView.value,
)

/** [다시 시도] — 같은 오디오로 화자 분리를 다시 실행 (다른 오디오로 하려면 툴바의 오디오 첨부) */
const onRetryDiarize = async () => {
  const confirmed = await openConfirm({
    title: '화자 분리 다시 시도',
    message:
      '올려 둔 오디오로 화자 분리를 다시 진행합니다. 이전 화자 분리 결과와 회의록은 지워집니다. 계속하시겠습니까?',
  })
  if (!confirmed) return
  await handleRetryDiarize(meetingId.value)
  await reloadDetail()
}

/** 비정상 종료 안내 문구 (줄 단위) */
const abnormalGuideLines = computed((): string[] => {
  const indexes = backupIndexes.value
  if (indexes.length === 0) {
    return [
      '녹음이 비정상 종료되었고 서버에 백업된 녹음이 없습니다.',
      `• 회의 종료 때 내려받은 누락 구간 파일(…_누락구간_1_mt${meetingId.value}.webm)이 있으면 [누락 구간 첨부]로 올려 주세요.`,
    ]
  }
  const lines = [
    `녹음이 비정상 종료되었습니다. 서버에 백업된 녹음 ${indexes.length}구간(${indexes.map((i) => i + 1).join(', ')}번)이 있습니다.`,
  ]
  if (backupGapNos.value.length > 0) {
    lines.push(
      `• ${backupGapNos.value.join(', ')}번 구간이 비어 있습니다. 회의 종료 때 내려받은 누락 구간 파일이 있으면 [누락 구간 첨부]로 올려 주세요.`,
    )
  }
  lines.push(`• 이어서 녹음하면 ${(meetingDetail.value.backupNextIndex ?? indexes.length) + 1}번 구간부터 저장됩니다.`)
  return lines
})

/** Realtime/WebSpeech 결과를 STT 리스트 UI 데이터로 변환 */
const buildRealtimeSttList = (): MeetingSttItem[] =>
  blocks.value
    .filter((b) => !!b.text?.trim())
    .map((b) => ({
      id: b.id,
      speakerId: 'realtime',
      speakerName: b.speaker || '화자 미확정',
      time: getSttTime(b.id),
      text: b.text.trim(),
      isLive: b.status === 'interim',
    }))

const buildFallbackSttList = (): MeetingSttItem[] =>
  speechSegments.value
    .filter((s) => !!s.text?.trim())
    .map((s) => ({
      id: `speech-${s.seq}`,
      speakerId: 'realtime',
      speakerName: '화자 미확정',
      time: getSttTime(`speech-${s.seq}`),
      text: s.text.trim(),
    }))

/**
 * 실시간 발화 시각 — 문장이 처음 화면에 나타난 시점의 녹음 경과 시간 (HH:MM:SS)
 * OpenAI · 브라우저 음성 인식 · 일시정지 후 이어서 녹음에서 같은 기준이 되도록 화면 타이머로 기록
 */
const sttTimeById = new Map<string, string>()
const formatElapsed = (sec: number) => {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
const getSttTime = (id: string) => {
  let time = sttTimeById.get(id)
  if (!time) {
    time = formatElapsed(elapsed.value)
    sttTimeById.set(id, time)
  }
  return time
}

/** 일시정지 전까지의 실시간 STT — 같은 화면에서 이어서 녹음하면 앞에 붙여 계속 보여줌 (새로고침하면 비워짐) */
const pausedSttItems = ref<MeetingSttItem[]>([])
let pauseSeq = 0

watch(
  [blocks, speechSegments, pausedSttItems],
  () => {
    if (!currentMeeting.value) return
    // 일시정지 전 구간 + 녹음 도중 OpenAI → 브라우저 음성 인식으로 전환되면 앞 구간(OpenAI) + 뒤 구간(브라우저)
    currentMeeting.value.sttList = [...pausedSttItems.value, ...buildRealtimeSttList(), ...buildFallbackSttList()]
  },
  { deep: true },
)

// ── 타이머 ───────────────────────────────────────────────────────────
const elapsed = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

/** @param keepElapsed 같은 화면에서 일시정지 후 이어서 녹음하면 시간을 이어서 셈 */
const startTimer = (keepElapsed = false) => {
  if (!keepElapsed) elapsed.value = 0
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
  checkWakeLockSupport()
})

onBeforeUnmount(async () => {
  stopTimer()
  stopRecordGuard()
  await cleanup()
  resetRecording()
  resetRecognition()
})

// ── 공통 처리 ────────────────────────────────────────────────────────

/** 녹음·타이머·자막 정지 → 현재 구간 Blob (백업 조각이 없으면 녹음 전체) */
const stopAll = async (): Promise<Blob | null> => {
  stopTimer()
  stopRecordGuard()
  stopRecognition()
  return stopRecording()
}

/** 상세 재조회 (비정상 종료 표시·백업 번호 갱신) */
const reloadDetail = () => handleSelectMeetingDetail(meetingId.value)

/**
 * 끝내 못 올린 구간 처리 — 내려받기 + 비정상 종료 표시 + 안내
 * @param reason 안내 첫 줄
 */
const handleUnsentSegments = async (unsent: MeetingBackupSegment[], reason: string) => {
  const title = currentMeeting.value?.title || '회의'
  const names = downloadUnsentSegments(meetingId.value, title, unsent)
  await markAbnormalOnServer(meetingId.value)
  const isLost = unsent.some((item) => isMeetingSessionLost(item.error)) || isSessionLost.value
  await openAlert({
    title: '서버에 저장하지 못한 녹음이 있습니다',
    message:
      `${reason}${isLost ? ' (로그인 끊김)' : ''}\n녹음 파일을 이 PC에 내려받았습니다.\n` +
      names.map((n) => `• ${n}`).join('\n') +
      `\n\n${isLost ? '다시 로그인한 뒤 ' : ''}회의 화면의 [누락 구간 첨부]로 올리면 회의록을 만들 수 있습니다.`,
  })
}

/**
 * SPA 내부 라우트 이탈 감지 (뒤로가기, 다른 메뉴 클릭 등)
 * - 녹음 중이 아니면 자유롭게 이탈
 * - 녹음 중이면 확인 후: 진행 중이던 업로드를 기다리고 실패 조각·마지막 구간까지 올린 뒤 비정상 종료 표시
 *   끝내 못 올린 구간(로그인 끊김 등)은 내려받아 [누락 구간 첨부]로 다시 올릴 수 있게 함
 * (탭 닫기·새로고침은 useMeetingRecordGuard 의 beforeunload/pagehide 가 처리)
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

  isLeaving.value = true
  openLoading({ text: '녹음을 서버에 저장하는 중...' })
  try {
    const lastIndex = takeNextIndex()
    const lastBlob = await stopAll()
    const unsent = await flushBackups({ index: lastIndex, blob: lastBlob ?? new Blob() })
    closeLoading()
    if (unsent.length > 0) {
      await handleUnsentSegments(unsent, `녹음 중 화면을 나가 ${unsent.length}개 구간을 서버에 올리지 못했습니다.`)
    } else {
      await markAbnormalOnServer(meetingId.value)
    }
  } catch (e) {
    closeLoading()
    console.warn('[RouteLeave] 이탈 처리 실패:', e)
    await markAbnormalOnServer(meetingId.value)
  } finally {
    resetRecordGuard()
    resetRecording()
    resetRecognition()
    isLeaving.value = false
  }
  next()
})

// ── 이벤트 핸들러 ────────────────────────────────────────────────────

/**
 * 녹음 시작 — 녹음(마이크)을 먼저 시작하고 자막은 Realtime WebSocket 우선, 실패 시 Web Speech API
 * @param startIndex 첫 백업 조각 번호 (이어서 녹음이면 서버의 마지막 번호 + 1)
 */
const onClickStart = async (startIndex = 0, isResumeFromPause = false) => {
  const { started, captionOk } = await startRecording(meetingId.value)
  if (!started) {
    openToast({ message: '녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.', type: 'error' })
    return
  }
  // 새로 시작하면 일시정지 전 자막은 비움
  if (!isResumeFromPause) pausedSttItems.value = []
  // 이어서 녹음해도 자막 id(speech-1 등)가 다시 쓰이므로 시각 기록은 매번 비움 (이전 구간 시각은 보관 목록에 있음)
  sttTimeById.clear()
  // 자막 실패 → 브라우저 음성 인식 전환 (경고 대신 툴바 모드 배지 + 안내 카드로 표시)
  if (!captionOk) startSpeechFallback()
  // heartbeat(PAUSE_YN 해제 포함) · 10분 백업 번호 · 탭 닫기 감지 · 화면 꺼짐 방지
  startRecordGuard(meetingId.value, typeof startIndex === 'number' ? startIndex : 0, getCurrentSegmentBlob)
  startTimer(isResumeFromPause)
  if (currentMeeting.value) currentMeeting.value.pauseYn = 'N'
}

/** 이어서 녹음 — 서버 백업의 마지막 번호 다음부터 (비정상 종료 · 일시정지 공통, 중간이 비어도 덮어쓰지 않음) */
const onResume = async () => {
  await onClickStart(meetingDetail.value.backupNextIndex ?? 0, isPausedView.value)
}

/**
 * 일시정지 — 녹음·자막을 멈추고 지금까지의 마지막 구간을 백업 조각으로 올린 뒤 서버에 일시정지 표시
 * 이어서 녹음하면 다음 조각 번호부터 녹음하고, 회의 종료하면 서버가 조각을 합쳐 회의록을 만듦
 */
const onClickPause = async () => {
  const lastIndex = peekNextIndex()
  // resetRecording 이 자막을 비우기 전에 지금까지 자막을 보관 (id 중복 방지용 접두어)
  pauseSeq++
  const snapshot = (currentMeeting.value?.sttList ?? []).map((item) => ({
    ...item,
    id: `p${pauseSeq}-${item.id}`,
    isLive: false,
  }))
  const lastBlob = await stopAll()

  // 시작하자마자 멈춰 녹음된 내용이 전혀 없으면 처음 상태로
  if (lastIndex === 0 && (!lastBlob || lastBlob.size === 0)) {
    resetRecordGuard()
    resetRecording()
    resetRecognition()
    openToast({ message: '녹음된 내용이 없어 일시정지하지 않았습니다.', type: 'warning' })
    return
  }

  isLeaving.value = true
  openLoading({ text: '지금까지 녹음을 서버에 저장하는 중...' })
  if (lastBlob && lastBlob.size > 0) takeNextIndex()
  const unsent =
    lastBlob && lastBlob.size > 0 ? await flushBackups({ index: lastIndex, blob: lastBlob }) : await flushBackups()
  if (unsent.length > 0) {
    closeLoading()
    isLeaving.value = false
    await handleUnsentSegments(unsent, `일시정지하는 중 ${unsent.length}개 구간을 서버에 올리지 못했습니다.`)
    resetRecordGuard()
    resetRecording()
    resetRecognition()
    await reloadDetail()
    return
  }

  try {
    await pauseOnServer(meetingId.value)
  } catch (error) {
    // 녹음은 서버에 올라갔으므로 3분 뒤 비정상 종료 화면에서 이어서 녹음 · 회의록 생성 가능
    console.error('[onClickPause] 일시정지 표시 실패:', error)
    openToast({ message: '일시정지 상태를 저장하지 못했습니다. 녹음은 서버에 저장되었습니다.', type: 'warning' })
  }
  closeLoading()
  isLeaving.value = false

  pausedSttItems.value = snapshot
  resetRecordGuard()
  resetRecording()
  resetRecognition()
  await reloadDetail()
}

/** 일시정지 상태에서 회의 종료 — 서버에 올라간 조각을 합쳐 회의록 생성 */
const finishFromPause = async () => {
  const confirmed = await openConfirm({
    title: '회의 종료',
    message: `일시정지 전까지 녹음된 ${backupIndexes.value.length}개 구간을 하나로 합쳐 회의록을 생성합니다.\n계속하시겠습니까?`,
  })
  if (!confirmed) return
  const success = await handleRecoverMeeting({ meetingId: meetingId.value })
  pausedSttItems.value = []
  await reloadDetail()
  if (success) navigateTo(`/meeting/${meetingId.value}`)
}

/** 회의 종료 — 백업 조각이 없으면 전체 업로드, 있으면 마지막 구간도 조각으로 올려 서버에서 병합 */
const onClickFinish = async () => {
  if (isPausedView.value) {
    await finishFromPause()
    return
  }
  if (isSessionLost.value) {
    // 로그인이 끊긴 채 종료하면 녹음을 올리지 못하므로, 다시 로그인했는지 먼저 확인
    const reconnected = await tryReconnect()
    if (!reconnected) {
      const proceed = await openConfirm({
        title: '로그인이 끊긴 상태입니다',
        message:
          '다른 탭에서 다시 로그인한 뒤 종료하면 녹음이 정상적으로 처리됩니다.\n지금 종료하면 서버에 올리지 못한 녹음은 이 PC로 내려받아집니다.\n그래도 종료하시겠습니까?',
      })
      if (!proceed) return
    }
  } else {
    const confirmed = await openConfirm({
      title: '회의 종료',
      message: '녹음을 종료하고 회의록을 생성하시겠습니까?',
    })
    if (!confirmed) return
  }

  // 마지막 구간 번호는 녹음을 멈추기 전에 확보 (번호가 0보다 크면 앞 구간이 조각으로 올라가 있음)
  const lastIndex = peekNextIndex()
  const hasBackup = lastIndex > 0
  const hadCaption = blocks.value.length > 0 || speechSegments.value.length > 0
  const lastBlob = await stopAll()
  // 종료 후에는 화자 분리 결과로 목록을 다시 채우므로 일시정지 전 자막은 비움
  pausedSttItems.value = []

  // ── 10분 넘는 녹음 / 이어서 녹음: 마지막 구간도 조각으로 올리고 서버에서 병합 ──
  if (hasBackup) {
    takeNextIndex()
    isLeaving.value = true
    openLoading({ text: '녹음을 서버에 저장하는 중...' })
    const unsent = await flushBackups({ index: lastIndex, blob: lastBlob ?? new Blob() })
    closeLoading()
    isLeaving.value = false
    if (unsent.length > 0) {
      await handleUnsentSegments(unsent, `녹음 업로드에 실패해 ${unsent.length}개 구간을 서버에 올리지 못했습니다.`)
      resetRecordGuard()
      resetRecording()
      resetRecognition()
      await reloadDetail()
      return
    }
    resetRecordGuard()
    const success = await handleRecoverMeeting({ meetingId: meetingId.value })
    resetRecording()
    resetRecognition()
    await reloadDetail()
    if (success) navigateTo(`/meeting/${meetingId.value}`)
    return
  }

  // ── 10분 미만 녹음: 전체를 한 번에 업로드 ──
  resetRecordGuard()
  if (!lastBlob || lastBlob.size === 0) {
    openToast({ message: '녹음된 오디오가 없습니다. 녹음 후 종료해 주세요.', type: 'warning' })
    resetRecording()
    resetRecognition()
    return
  }

  // 발화 내용 없이 종료 시 확인 (무음 녹음으로 빈 회의록 생성 방지)
  if (!hadCaption) {
    const proceed = await openConfirm({
      title: '발화 내용 없음',
      message: '실시간 자막에 표시된 발화가 없습니다.\n그래도 회의록을 생성하시겠습니까?',
    })
    if (!proceed) {
      // 녹음은 사라지지 않도록 내려받아 두고 비정상 종료로 남김
      await handleUnsentSegments([{ index: 0, blob: lastBlob }], '회의록 생성을 취소했습니다.')
      resetRecording()
      resetRecognition()
      await reloadDetail()
      return
    }
  }

  isLeaving.value = true
  openLoading({ text: '오디오 파일을 업로드하는 중...' })
  try {
    await uploadFinishAudio(meetingId.value, lastBlob)
  } catch (error) {
    // 업로드 실패 — 1구간 누락 파일로 내려받고 비정상 종료 표시 → [누락 구간 첨부] 또는 [다른 오디오로 대체]
    closeLoading()
    isLeaving.value = false
    console.error('[onClickFinish] 오디오 업로드 실패:', error)
    await handleUnsentSegments([{ index: 0, blob: lastBlob, error }], '오디오 업로드에 실패했습니다.')
    resetRecording()
    resetRecognition()
    await reloadDetail()
    return
  }
  closeLoading()
  isLeaving.value = false

  const success = await handleProcessUploadedMeeting(meetingId.value)
  resetRecording()
  resetRecognition()
  // 동일 라우트면 onMounted가 안 돌아가므로 상세·에디터 HTML 재조회
  await reloadDetail()
  if (success) navigateTo(`/meeting/${meetingId.value}`)
}

/** 백업 음성으로 회의록 생성 확인 — 중간에 비어 있는 구간이 있으면 함께 안내 */
const confirmGenerateFromBackup = async (prefixMsg = '') => {
  const gaps = backupGapNos.value
  const confirmed = await openConfirm({
    title: '기존 음성으로 회의록 생성',
    message:
      `${prefixMsg}백업된 녹음(${backupIndexes.value.length}개 구간)을 하나로 합쳐 회의록을 생성합니다.\n` +
      (gaps.length > 0
        ? `${gaps.join(', ')}구간이 비어 있습니다. 내려받은 누락 구간 파일이 있으면 먼저 [누락 구간 첨부]로 올려 주세요.`
        : '마지막 백업 이후 녹음된 내용은 포함되지 않을 수 있습니다.') +
      '\n계속하시겠습니까?',
  })
  if (!confirmed) return

  const success = await handleRecoverMeeting({ meetingId: meetingId.value })
  await reloadDetail()
  if (success) navigateTo(`/meeting/${meetingId.value}`)
}

/** 기존 음성으로 회의록 생성 — 백업 조각 병합 후 처리 */
const onGenerateFromBackup = () => confirmGenerateFromBackup()

// ── 누락 구간 첨부 / 다른 오디오로 대체 ──────────────────────────────
const missingFileInputRef = ref<HTMLInputElement | null>(null)
const replaceFileInputRef = ref<HTMLInputElement | null>(null)

const onClickAttachMissing = () => missingFileInputRef.value?.click()
const onClickReplaceAudio = () => replaceFileInputRef.value?.click()

/** 누락 구간 파일 선택 → 검사·확인·업로드 → 회의록 생성 확인 */
const onMissingFilesChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return

  const uploaded = await handleAttachMissingSegments({
    meetingId: meetingId.value,
    meetingTitle: currentMeeting.value?.title ?? '',
    files,
    backupIndexes: backupIndexes.value,
  })
  // 올라간 구간을 화면에 반영 (일부만 올라갔어도 반영)
  await reloadDetail()
  if (!uploaded || uploaded.length !== files.length) return
  await confirmGenerateFromBackup(`누락 구간 ${uploaded.length}개를 올렸습니다.\n`)
}

/** 다른 오디오로 대체 — 서버 백업을 지우고 첨부 파일 하나로 처리 */
const onReplaceFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const backupCnt = backupIndexes.value.length
  const confirmed = await openConfirm({
    title: '다른 오디오로 대체',
    message:
      backupCnt > 0
        ? `백업된 녹음(${backupCnt}개 구간)이 지워지고 첨부한 오디오로 회의록을 생성합니다.\n회의 종료 때 내려받은 누락 구간 파일이라면 [누락 구간 첨부]를 사용해 주세요.\n계속하시겠습니까?`
        : '첨부한 오디오로 회의록을 생성합니다.\n계속하시겠습니까?',
  })
  if (!confirmed) return

  const success = await handleFinishMeetingWithAudio({ meetingId: meetingId.value, audioBlob: file })
  await reloadDetail()
  if (success) navigateTo(`/meeting/${meetingId.value}`)
}
</script>
