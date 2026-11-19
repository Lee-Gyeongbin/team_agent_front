<template>
  <div class="meeting2-page">
    <!-- 페이지 헤더 (좌측 정렬: 백버튼 + 구분선 + 제목) -->
    <div class="meeting2-detail-header">
      <button
        type="button"
        class="meeting2-detail-back"
        @click="onClickBack"
      >
        <i class="icon-arrow-left-sm size-16"></i>
        돌아가기
      </button>
      <span class="meeting2-detail-header-divider"></span>
      <template v-if="currentMeeting">
        <!-- 제목 인라인 편집: 커스텀 스타일·select() 포커스 유지 — native input 유지 -->
        <input
          v-if="isEditingTitle"
          ref="titleInputRef"
          v-model="editingTitle"
          class="meeting2-detail-title-input"
          maxlength="100"
          @keydown.enter.prevent="onSaveTitle"
          @keydown.esc.prevent="onCancelTitle"
          @blur="onSaveTitle"
        />
        <div
          v-else
          class="meeting2-detail-title-wrap"
        >
          <h2
            class="meeting2-detail-title"
            @dblclick="onClickEditTitle"
          >
            {{ currentMeeting.title }}
          </h2>
          <button
            type="button"
            class="meeting2-detail-title-edit"
            title="제목 편집"
            @click="onClickEditTitle"
          >
            <i class="icon-edit size-16"></i>
          </button>
        </div>
      </template>
    </div>

    <!-- 5단계 진행바 — 클릭하면 해당 단계 화면으로 이동 -->
    <MeetingStepper
      v-if="currentMeeting"
      :steps="detailSteps"
      @select="goStep"
    />

    <!-- 1. 음성 등록 -->
    <MeetingVoiceEnrollPanel
      v-if="currentStepKey === 'voiceEnroll'"
      :meeting-id="meetingId"
      @close="onVoiceEnrollClose"
    />

    <!-- 2~5. 단계별 화면 — 녹음 상태·에디터 내용이 유지되도록 v-show 로 전환
         녹음: 녹음 패널 / 화자 분리: 녹음 패널(화자 분리 보기) / 회의록 생성: 화자 분리 + 에디터 / 공유: 공유 패널 -->
    <div
      v-show="currentStepKey !== 'voiceEnroll'"
      class="meeting2-layout"
      :class="currentStepKey === 'generate' ? 'is-step-split' : 'is-step-single'"
      :style="layoutStyle"
    >
      <div
        v-show="isLeftVisible"
        class="meeting2-layout-left"
        :class="{ 'is-active': currentStepKey === 'record' || currentStepKey === 'speaker' }"
      >
        <MeetingRecordPanel
          v-if="currentMeeting"
          :view="currentStepKey === 'record' ? 'record' : 'speaker'"
        />
      </div>

      <div
        v-show="currentStepKey === 'generate'"
        class="meeting2-layout-resizer"
        :class="{ 'is-resizing': isResizing }"
        @mousedown="onResizeStart"
      ></div>

      <div
        v-show="currentStepKey === 'generate'"
        class="meeting2-layout-center"
        :class="{ 'is-active': currentStepKey === 'generate' }"
      >
        <MeetingEditorPanel v-if="currentMeeting" />
      </div>

      <div
        v-show="currentStepKey === 'share'"
        class="meeting2-layout-right"
        :class="{ 'is-active': currentStepKey === 'share' }"
      >
        <MeetingSidePanel v-if="currentMeeting" />
      </div>
    </div>

    <!-- 단계 이동 -->
    <div
      v-if="currentMeeting"
      class="meeting2-step-nav"
    >
      <span class="meeting2-step-nav-hint">{{ stepNavHint }}</span>
      <div class="meeting2-step-nav-btns">
        <UiButton
          v-if="prevStepKey"
          variant="line-secondary"
          size="md"
          @click="goStep(prevStepKey)"
        >
          <template #icon-left>
            <UiIcon
              name="chevron-left"
              size="16"
            />
          </template>
          이전 단계
        </UiButton>
        <UiButton
          v-if="nextStepKey"
          variant="primary"
          size="md"
          @click="currentStepKey === 'voiceEnroll' ? onVoiceEnrollSkip() : goStep(nextStepKey)"
        >
          {{ currentStepKey === 'voiceEnroll' && !voiceEnrollDone ? '건너뛰기' : '다음 단계' }}
          <template #icon-right>
            <UiIcon
              name="chevron-right"
              size="16"
            />
          </template>
        </UiButton>
      </div>
    </div>

    <!-- 모달 -->
    <MeetingMailSendModal />
    <MeetingInfoEditModal />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import type { MeetingStepKey, MeetingUser } from '~/types/meeting'

definePageMeta({ path: '/meeting/:id' })

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))

const {
  currentMeeting,
  meetingDetail,
  // infographicList, activeTab, // [인포그래픽 일시 중지 2026-11-19]
  voiceEnrollDone,
  isFinishing,
  currentStepKey,
  detailSteps,
  initDetailStep,
  getStepBlockMsg,
  handleSelectMeetingDetail,
  handleResetRecord,
  stopMinutesPolling,
  handleSaveMeeting,
} = useMeetingStore()
// 비정상 종료 여부·백업 구간은 상세 응답(meeting.abnormalYn, backupIndexes)으로 판단 — MeetingRecordPanel 참고

const { isRecording } = useRealtimeTranscription()

// ── 단계 이동 (CMB goStep / handlePrevStep / handleNextStep) ─────────────
/** 진행바에 보이는 단계 순서 (통합 회의록은 회의록 생성·공유만) */
const visibleStepKeys = computed(() => detailSteps.value.map((s) => s.key))
const currentVisibleIdx = computed(() => visibleStepKeys.value.indexOf(currentStepKey.value))
const prevStepKey = computed(() => visibleStepKeys.value[currentVisibleIdx.value - 1] ?? null)
const nextStepKey = computed(() => visibleStepKeys.value[currentVisibleIdx.value + 1] ?? null)

/** 녹음 패널 표시 — 녹음·화자 분리 화면 전체, 회의록 생성 화면 왼쪽 */
const isLeftVisible = computed(() => ['record', 'speaker', 'generate'].includes(currentStepKey.value))

const goStep = (target: MeetingStepKey | null) => {
  if (!target || target === currentStepKey.value) return
  const msg = getStepBlockMsg(target, {
    isRecording: isRecording.value,
    hasAttendees: attendeeList.value.length > 0 || (meetingDetail.value.speakers?.length ?? 0) > 0,
  })
  if (msg) {
    openToast({ message: msg, type: 'warning' })
    return
  }
  currentStepKey.value = target
}

/** 하단 안내 문구 (CMB stepNavHint 기준) */
const stepNavHint = computed(() => {
  const status = meetingDetail.value.meeting?.status
  switch (currentStepKey.value) {
    case 'voiceEnroll':
      return voiceEnrollDone.value
        ? '음성 등록이 끝났습니다. 다음 단계에서 녹음을 시작하세요.'
        : '참석자 음성을 등록하면 화자 분리 정확도가 높아집니다. 등록하지 않아도 다음 단계로 이동할 수 있습니다.'
    case 'record':
      if (isRecording.value) return '회의를 마치면 회의 종료 버튼을 눌러 주세요. 녹음 파일로 화자 분리를 진행합니다.'
      if (isFinishing.value) return '화자 분리가 끝나면 회의록 생성 단계로 이동합니다.'
      if (status === '002') return '녹음이 완료되었습니다. 다음 단계에서 화자 분리 결과를 확인하세요.'
      return '녹음 시작 또는 오디오 첨부로 회의를 기록합니다.'
    case 'speaker':
      return '화자가 맞지 않으면 편집으로 수정하세요. 수정하지 않아도 다음 단계로 이동할 수 있습니다.'
    case 'generate':
      return meetingDetail.value.minutes
        ? '회의록을 확인하고 편집한 뒤 저장하세요.'
        : '회의록이 아직 생성되지 않았습니다.'
    default:
      return '회의록을 공유하거나 메일로 발송하세요.'
  }
})

// ── 참석자 목록 (meeting 기존 로직 흡수) ────────────────────────────
/** 화자-참석자 매핑 모달용 — meetingDetail의 attendees JSON 파싱 */
const attendeeList = computed((): Array<Pick<MeetingUser, 'userNm'> & { userId: string }> => {
  const attendees = meetingDetail.value.meeting?.attendees
  if (!attendees) return []
  try {
    const parsed = JSON.parse(attendees)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item?.userId && item?.userNm)
      .map((item) => ({ userId: item.userId, userNm: item.userNm }))
  } catch {
    return []
  }
})

/** 화자 매핑 저장 후 상세 재조회 (meeting 기존 로직 흡수) */
const onSavedSpeakerMapping = async () => {
  await handleSelectMeetingDetail(meetingId.value)
}

// ── 제목 인라인 편집 ─────────────────────────────────────────────────
const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)

const onClickEditTitle = async () => {
  if (!currentMeeting.value) return
  editingTitle.value = currentMeeting.value.title
  isEditingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

const onSaveTitle = async () => {
  if (!isEditingTitle.value || !currentMeeting.value) return
  const newTitle = editingTitle.value.trim()
  if (!newTitle) {
    openToast({ message: '제목을 입력해주세요.', type: 'warning' })
    titleInputRef.value?.focus()
    return
  }
  if (newTitle !== currentMeeting.value.title) {
    currentMeeting.value.title = newTitle
    await handleSaveMeeting({ id: currentMeeting.value.id, title: newTitle }, { silent: true })
  }
  isEditingTitle.value = false
}

const onCancelTitle = () => {
  isEditingTitle.value = false
  editingTitle.value = ''
}

// ── 레이아웃 리사이즈 (회의록 생성 화면: 화자 분리 | 에디터) ────────────
const leftWidth = ref(30)
const isResizing = ref(false)

const layoutStyle = computed(() => ({
  '--meeting2-left': `${leftWidth.value}%`,
}))

const onResizeStart = (e: MouseEvent) => {
  e.preventDefault()
  isResizing.value = true
  document.body.classList.add('is-resizing')

  const onMouseMove = (ev: MouseEvent) => {
    const percent = (ev.clientX / window.innerWidth) * 100
    leftWidth.value = Math.min(45, Math.max(20, percent))
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.body.classList.remove('is-resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// ── 라이프사이클 ─────────────────────────────────────────────────────
onMounted(async () => {
  if (meetingId.value) {
    await handleSelectMeetingDetail(meetingId.value)
    initDetailStep()
  }

  // [인포그래픽 일시 중지 2026-11-19] 다시 쓰려면 주석 해제
  // // 인포그래픽 데이터가 있으면 인포그래픽 탭 활성화
  // if (infographicList.value.length > 0) {
  //   activeTab.value = 'infographic'
  // }
})

onBeforeUnmount(() => {
  handleResetRecord()
  // 회의록 생성 상태 확인 중지 (서버 생성은 계속되고, 다시 들어오면 상태부터 확인)
  stopMinutesPolling()
})

watch(
  () => route.params.id,
  async (id) => {
    const numId = Number(id)
    if (!numId) return
    await handleSelectMeetingDetail(numId)
    initDetailStep()
  },
)

// ── 네비게이션 ───────────────────────────────────────────────────────
const onClickBack = () => {
  navigateTo('/meeting')
}

/** 음성 등록 건너뛰기 → 녹음 단계 (등록 상태는 DB 에 저장하지 않음 — CMB 와 같음) */
const onVoiceEnrollSkip = () => {
  currentStepKey.value = 'record'
}

/** 음성 등록 완료 후 닫기 — 등록 상태 재조회 후 녹음 단계 */
const onVoiceEnrollClose = async () => {
  if (meetingId.value) await handleSelectMeetingDetail(meetingId.value)
  currentStepKey.value = 'record'
}

// attendeeList, onSavedSpeakerMapping은 자식 컴포넌트에서
// provide/inject 또는 props로 연결 시 활용
provide('attendeeList', attendeeList)
provide('onSavedSpeakerMapping', onSavedSpeakerMapping)
</script>
