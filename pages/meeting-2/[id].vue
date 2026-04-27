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
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

// 라우트는 /meeting-2/:id로 노출 (다른팀 /meeting과 분리)
definePageMeta({ path: '/meeting-2/:id' })

const route = useRoute()
const { currentMeeting, handleSelectMeetingDetail, handleResetRecord, handleSaveMeeting } = useMeeting2Store()

// 제목 인라인 편집
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
  // 변경된 경우에만 저장 — 자동 저장처럼 silent 처리(토스트 X)
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

// 좌/우 너비 비율 (% — 데스크탑 전용)
const leftWidth = ref(32)
const rightWidth = ref(18)
const resizingTarget = ref<'left' | 'right' | null>(null)

const layoutStyle = computed(() => ({
  '--meeting2-left': `${leftWidth.value}%`,
  '--meeting2-right': `${rightWidth.value}%`,
}))

// 반응형 — 1023px 이하 탭 전환
const isMobile = ref(false)
const activeMobileTab = ref<'left' | 'center' | 'right'>('center')

const updateMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(async () => {
  const id = String(route.params.id || '')
  if (id) await handleSelectMeetingDetail(id)
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
    const meetingId = String(id || '')
    if (meetingId) await handleSelectMeetingDetail(meetingId)
  },
)

/** 좌/우 리사이즈 시작 */
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

const onClickBack = () => {
  navigateTo('/meeting-2')
}
</script>
