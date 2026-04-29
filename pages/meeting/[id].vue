<template>
  <div class="meeting2-page">
    <!-- 페이지 헤더 (좌측 정렬: 백버튼 + 구분선 + 제목) -->
    <div class="meeting2-detail-header">
      <button
        type="button"
        class="meeting2-detail-back"
        @click="onClickBack"
      >
        <i class="icon-arrow-left-sm size-16" />
        회의 목록
      </button>
      <span class="meeting2-detail-header-divider"></span>
      <template v-if="currentMeeting">
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
            <i class="icon-edit size-16" />
          </button>
        </div>
      </template>
    </div>

    <!-- 5단계 진행바 -->
    <MeetingStepper
      v-if="currentMeeting"
      :steps="currentMeeting.steps"
    />

    <!-- 모바일 탭 (1023px 이하) -->
    <div
      v-if="isMobile"
      class="meeting2-layout-tabs"
    >
      <button
        :class="{ 'is-active': activeMobileTab === 'left' }"
        @click="activeMobileTab = 'left'"
      >
        녹음/STT
      </button>
      <button
        :class="{ 'is-active': activeMobileTab === 'center' }"
        @click="activeMobileTab = 'center'"
      >
        회의록
      </button>
      <button
        :class="{ 'is-active': activeMobileTab === 'right' }"
        @click="activeMobileTab = 'right'"
      >
        공유
      </button>
    </div>

    <!-- 3분할 레이아웃 -->
    <div
      class="meeting2-layout"
      :style="layoutStyle"
    >
      <div
        class="meeting2-layout-left"
        :class="{ 'is-active': activeMobileTab === 'left' }"
      >
        <MeetingRecordPanel v-if="currentMeeting" />
      </div>

      <div
        class="meeting2-layout-resizer"
        :class="{ 'is-resizing': resizingTarget === 'left' }"
        @mousedown="onResizeStart('left', $event)"
      ></div>

      <div
        class="meeting2-layout-center"
        :class="{ 'is-active': activeMobileTab === 'center' }"
      >
        <MeetingEditorPanel v-if="currentMeeting" />
      </div>

      <div
        class="meeting2-layout-resizer"
        :class="{ 'is-resizing': resizingTarget === 'right' }"
        @mousedown="onResizeStart('right', $event)"
      ></div>

      <div
        class="meeting2-layout-right"
        :class="{ 'is-active': activeMobileTab === 'right' }"
      >
        <MeetingSidePanel v-if="currentMeeting" />
      </div>
    </div>

    <!-- 모달 -->
    <MeetingSpeakerEditModal />
    <MeetingMailSendModal />
    <MeetingInfoEditModal />
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingUser } from '~/types/meeting'

definePageMeta({ path: '/meeting/:id' })

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))

const { currentMeeting, meetingDetail, handleSelectMeetingDetail, handleResetRecord, handleSaveMeeting } =
  useMeetingStore()

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

// ── 레이아웃 리사이즈 ────────────────────────────────────────────────
const leftWidth = ref(32)
const rightWidth = ref(18)
const resizingTarget = ref<'left' | 'right' | null>(null)

const layoutStyle = computed(() => ({
  '--meeting2-left': `${leftWidth.value}%`,
  '--meeting2-right': `${rightWidth.value}%`,
}))

const onResizeStart = (target: 'left' | 'right', e: MouseEvent) => {
  e.preventDefault()
  resizingTarget.value = target
  document.body.classList.add('is-resizing')

  const onMouseMove = (ev: MouseEvent) => {
    const vw = window.innerWidth
    if (target === 'left') {
      const percent = (ev.clientX / vw) * 100
      leftWidth.value = Math.min(42, Math.max(24, percent))
    } else {
      const percent = ((vw - ev.clientX) / vw) * 100
      rightWidth.value = Math.min(28, Math.max(14, percent))
    }
  }

  const onMouseUp = () => {
    resizingTarget.value = null
    document.body.classList.remove('is-resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// ── 반응형 (모바일 탭) ───────────────────────────────────────────────
const isMobile = ref(false)
const activeMobileTab = ref<'left' | 'center' | 'right'>('center')

const updateMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

// ── 라이프사이클 ─────────────────────────────────────────────────────
onMounted(async () => {
  if (meetingId.value) await handleSelectMeetingDetail(meetingId.value)
  updateMobile()
  window.addEventListener('resize', updateMobile)
})

onBeforeUnmount(() => {
  handleResetRecord()
  window.removeEventListener('resize', updateMobile)
})

watch(
  () => route.params.id,
  async (id) => {
    const numId = Number(id)
    if (numId) await handleSelectMeetingDetail(numId)
  },
)

// ── 네비게이션 ───────────────────────────────────────────────────────
const onClickBack = () => {
  navigateTo('/meeting')
}

// attendeeList, onSavedSpeakerMapping은 MeetingSpeakerEditModal 등 자식 컴포넌트에서
// provide/inject 또는 props로 연결 시 활용
provide('attendeeList', attendeeList)
provide('onSavedSpeakerMapping', onSavedSpeakerMapping)
</script>
