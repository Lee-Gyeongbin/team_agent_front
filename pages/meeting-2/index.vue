<template>
  <div class="meeting-list-page">
    <!-- 헤더 -->
    <div class="meeting-list-header">
      <h2 class="meeting-list-title">회의록</h2>
      <div class="meeting-list-toolbar">
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

    <!-- 빈 상태 -->
    <UiEmpty
      v-if="filteredList.length === 0"
      icon="icon-search"
      title="등록된 회의록이 없습니다."
    />

    <!-- 목록 -->
    <div
      v-else
      class="meeting-list-grid"
    >
      <div
        v-for="meeting in filteredList"
        :key="meeting.id"
        class="meeting-list-card"
        @click="onClickCard(meeting.id)"
      >
        <p class="meeting-list-card-title">{{ meeting.title }}</p>
        <p class="meeting-list-card-date">{{ meeting.date }}</p>
        <div class="meeting-list-card-meta">
          <UiBadge
            v-for="step in progressBadges(meeting.steps)"
            :key="step.key"
            :variant="step.variant"
            size="sm"
          >
            {{ step.label }}
          </UiBadge>
        </div>
        <div class="meeting-list-card-actions">
          <UiButton
            variant="ghost"
            size="sm"
            icon-only
            @click.stop="doDelete(meeting.id)"
          >
            <template #icon-left>
              <i class="icon-trashcan size-16" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'
import type { MeetingStep } from '~/types/meeting2'

// 라우트는 /meeting-2로 노출 (다른팀 /meeting과 분리)
definePageMeta({ path: '/meeting-2' })

const { meetingList, handleSelectMeetingList, handleSaveMeeting, handleDeleteMeeting } = useMeeting2Store()

const searchKeyword = ref('')

onMounted(async () => {
  await handleSelectMeetingList()
})

const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return meetingList.value
  return meetingList.value.filter((m) => m.title.toLowerCase().includes(kw))
})

/** 진행 상태 뱃지 — 진행 중 단계만 노출 */
const progressBadges = (steps: MeetingStep[]) => {
  return steps
    .filter((s) => s.status !== 'wait')
    .map((s) => ({
      key: s.key,
      label: s.label,
      variant: s.status === 'done' ? ('success' as const) : ('basic-chat' as const),
    }))
}

/** 새 회의 생성 → 상세로 이동 */
const onClickNew = async () => {
  // 응답으로 받은 신규 회의의 id로 이동 (정렬/페이지네이션 영향 X)
  const created = await handleSaveMeeting({})
  if (!created?.id) return
  navigateTo(`/meeting-2/${created.id}`)
}

const onClickCard = (id: string) => {
  navigateTo(`/meeting-2/${id}`)
}

const doDelete = async (id: string) => {
  await handleDeleteMeeting(id)
}
</script>
