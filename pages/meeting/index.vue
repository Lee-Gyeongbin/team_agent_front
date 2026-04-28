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
        class="meeting2-list-card"
        @click="onClickCard(meeting)"
      >
        <p class="meeting2-list-card-title">{{ meeting.title }}</p>
        <p class="meeting2-list-card-date">{{ meeting.date }}</p>
        <div class="meeting2-list-card-meta">
          <UiBadge
            v-for="step in progressBadges(meeting.steps)"
            :key="step.key"
            :variant="step.variant"
            size="sm"
          >
            {{ step.label }}
          </UiBadge>
        </div>
        <div class="meeting2-list-card-actions">
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
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingStep } from '~/types/meeting2'

definePageMeta({ path: '/meeting' })

const { meetingList, isLoadingList, handleSelectMeetingList, handleDeleteMeeting, handleCreateMeeting } =
  useMeetingStore()

const searchKeyword = ref('')
const isModalOpen = ref(false)

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
const onClickCard = (meeting: { id: string; status: string }) => {
  if (meeting.status === '001') {
    navigateTo(`/meeting/record?meetingId=${meeting.id}`)
    return
  }
  navigateTo(`/meeting/${meeting.id}`)
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
</script>
