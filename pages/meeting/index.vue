<template>
  <div class="meeting2-list-page">
    <!-- 헤더 -->
    <div class="meeting2-list-header">
      <h2 class="meeting2-list-title">회의록</h2>
      <div class="meeting2-list-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="회의명 검색"
        />
        <UiButton
          variant="primary"
          size="md"
          @click="onClickIntegrate"
        >
          <template #icon-left>
            <i class="icon-meeting-generate size-16" />
          </template>
          {{ integrateButtonLabel }}
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onClickNew"
        >
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          새 회의
        </UiButton>
      </div>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingList"
      class="meeting2-list-grid"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="meeting2-list-card is-skeleton"
      >
        <UiSkeleton
          height="20px"
          width="60%"
        />
        <UiSkeleton
          height="14px"
          width="40%"
        />
        <UiSkeleton
          height="14px"
          width="30%"
        />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmpty
      v-else-if="filteredList.length === 0"
      icon="icon-search"
      title="등록된 회의록이 없습니다."
    />

    <!-- 목록 -->
    <div
      v-else
      class="meeting2-list-grid"
    >
      <div
        v-for="meeting in filteredList"
        :key="meeting.id"
        :class="[
          'meeting2-list-card',
          { 'is-integrate-mode': isIntegrateMode, 'is-selected': isMeetingSelected(meeting.id) },
        ]"
        @click="onClickCard(meeting)"
      >
        <div
          v-if="isIntegrateMode"
          class="meeting2-list-card-check"
        >
          {{ isMeetingSelected(meeting.id) ? 'O' : '' }}
        </div>
        <p class="meeting2-list-card-title">{{ meeting.title }}</p>
        <p class="meeting2-list-card-date">{{ meeting.date }}</p>
        <div class="meeting2-list-card-meta">
          <UiBadge
            v-if="meeting.integrateYn === 'Y'"
            variant="manual-ai"
            size="sm"
          >
            통합 회의록
          </UiBadge>
          <template v-else>
            <UiBadge
              v-for="step in progressBadges(meeting.steps)"
              :key="step.key"
              :variant="step.variant"
              size="sm"
            >
              {{ step.label }}
            </UiBadge>
          </template>
        </div>
        <div
          v-if="!isIntegrateMode"
          class="meeting2-list-card-actions"
        >
          <UiButton
            variant="ghost"
            size="sm"
            icon-only
            @click.stop="doDelete(meeting.meetingId)"
          >
            <template #icon-left>
              <i class="icon-trashcan size-16" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 새 회의 시작 모달 -->
    <MeetingStartModal
      v-if="isModalOpen"
      @close="isModalOpen = false"
      @confirm="onConfirmStart"
    />

    <!-- 비정상종료 회의 복구 모달 (페이지 진입 시 자동 조회) -->
    <MeetingRecoverModal
      v-model="isRecoverModalOpen"
      @recover="onRecover"
    />
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingStep } from '~/types/meeting'

definePageMeta({ path: '/meeting' })

const {
  meetingList,
  isLoadingList,
  handleSelectMeetingList,
  handleDeleteMeeting,
  handleCreateMeeting,
  handleIntegrateMeeting,
} = useMeetingStore()

const searchKeyword = ref('')
const isModalOpen = ref(false)
const isRecoverModalOpen = ref(false)
const isIntegrateMode = ref(false)
const selectedMeetingIds = ref<string[]>([])

const integrateButtonLabel = computed(() => {
  return isIntegrateMode.value ? '통합 진행하기' : '회의 통합하기'
})

onMounted(() => {
  handleSelectMeetingList()
})

/**
 * API(meeting.ts) 타입의 meetingList → 템플릿 표시용 형식으로 변환 + 키워드 필터
 * steps는 meeting API 미지원 — 상태값에서 파생
 */
const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  const list = meetingList.value
  const filtered = kw ? list.filter((m) => m.meetingTitle.toLowerCase().includes(kw)) : list
  return filtered.map((m) => ({
    meetingId: m.meetingId, // 삭제/이동 시 원본 ID 사용
    id: String(m.meetingId),
    title: m.meetingTitle,
    date: m.startDt,
    status: m.status,
    integrateYn: m.integrateYn ?? 'N',
    steps: deriveDisplaySteps(m.status) satisfies MeetingStep[],
  }))
})

/** 회의 상태값 → 표시용 MeetingStep 배열 */
const deriveDisplaySteps = (status: string): MeetingStep[] => {
  if (status === '001') {
    return [{ key: 'record', label: '녹음 중', status: 'progress' }]
  }
  if (status === '002') {
    return [
      { key: 'record', label: '녹음', status: 'done' },
      { key: 'generate', label: '회의록 생성', status: 'done' },
    ]
  }
  return []
}

/** 진행 상태 뱃지 — 진행 중/완료 단계만 노출 */
const progressBadges = (steps: MeetingStep[]) => {
  return steps
    .filter((s) => s.status !== 'wait')
    .map((s) => ({
      key: s.key,
      label: s.label,
      variant: s.status === 'done' ? ('success' as const) : ('basic-chat' as const),
    }))
}

/** 새 회의 시작 모달 열기 */
const onClickNew = () => {
  isModalOpen.value = true
}

/** 카드 클릭 — 진행중인 회의(status 001)는 녹음 화면으로 이동 */
const onClickCard = (meeting: { id: string; status: string; integrateYn: string }) => {
  if (isIntegrateMode.value) {
    if (meeting.integrateYn === 'Y') {
      openToast({ message: '통합 회의록은 다시 통합할 수 없습니다.', type: 'warning' })
      return false
    }
    onToggleMeetingSelect(meeting.id)
    return
  }

  navigateTo(`/meeting/${meeting.id}`)
}

const onToggleMeetingSelect = (meetingId: string) => {
  const selectedIndex = selectedMeetingIds.value.indexOf(meetingId)

  if (selectedIndex > -1) {
    selectedMeetingIds.value.splice(selectedIndex, 1)
    return
  }

  selectedMeetingIds.value.push(meetingId)
}

const isMeetingSelected = (meetingId: string) => {
  return selectedMeetingIds.value.includes(meetingId)
}

const doDelete = (meetingId: number) => {
  handleDeleteMeeting(meetingId)
}

/** 새 회의 생성 확인 → 녹음 화면으로 이동 */
const onConfirmStart = async (params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N' }) => {
  isModalOpen.value = false
  const meetingId = await handleCreateMeeting(params)
  if (meetingId) {
    navigateTo(`/meeting/${meetingId}`)
  }
}

/** 복구하기 클릭 → 해당 회의 상세 페이지로 이동 */
const onRecover = ({ meetingId }: { meetingId: number }) => {
  navigateTo(`/meeting/${meetingId}`)
}

const onClickIntegrate = async () => {
  if (!isIntegrateMode.value) {
    isIntegrateMode.value = true
    selectedMeetingIds.value = []
    return
  }

  if (selectedMeetingIds.value.length === 0) {
    openToast({ message: '통합할 회의록을 선택해주세요.', type: 'warning' })
    return false
  }

  const success = await handleIntegrateMeeting(selectedMeetingIds.value.map(Number))
  if (success) {
    isIntegrateMode.value = false
    selectedMeetingIds.value = []
  }

  console.warn('통합 진행할 회의 ID', selectedMeetingIds.value)
}
</script>
