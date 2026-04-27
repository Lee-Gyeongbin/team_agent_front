<template>
  <div class="meeting-list-page">
    <div class="meeting-list-header">
      <h2 class="meeting-list-title">회의록</h2>
      <button
        type="button"
        class="btn btn-primary"
        @click="onClickNewMeeting"
      >
        <i class="icon-plus size-16" />
        새 회의 시작
      </button>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingList"
      class="meeting-list-grid"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="meeting-card is-skeleton"
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
      v-else-if="meetingList.length === 0"
      icon="icon-microphone"
      title="진행한 회의가 없습니다."
    >
      <button
        type="button"
        class="btn btn-primary"
        @click="onClickNewMeeting"
      >
        첫 회의 시작하기
      </button>
    </UiEmpty>

    <!-- 목록 -->
    <div
      v-else
      class="meeting-list-grid"
    >
      <div
        v-for="meeting in meetingList"
        :key="meeting.meetingId"
        class="meeting-card"
        @click="onClickMeeting(meeting)"
      >
        <div class="meeting-card-top">
          <span
            class="meeting-card-status"
            :class="`status-${meeting.status}`"
          >
            {{ meeting.statusNm }}
          </span>
          <button
            type="button"
            class="meeting-card-delete"
            @click.stop="onClickDelete(meeting.meetingId)"
          >
            <i class="icon-trashcan size-16" />
          </button>
        </div>
        <p class="meeting-card-title">{{ meeting.meetingTitle }}</p>
        <p
          v-if="meeting.attendees"
          class="meeting-card-attendees"
        >
          <i class="icon-user size-14" />
          {{ meeting.attendees }}
        </p>
        <p class="meeting-card-date">{{ meeting.startDt }}</p>
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
import type { Meeting } from '~/types/meeting'

const { meetingList, isLoadingList, handleSelectMeetingList, handleDeleteMeeting, handleCreateMeeting } =
  useMeetingStore()

const isModalOpen = ref(false)

onMounted(() => {
  handleSelectMeetingList()
})

const onClickNewMeeting = () => {
  isModalOpen.value = true
}

const onClickMeeting = (meeting: Meeting) => {
  if (meeting.status === '001') {
    // 진행중인 회의 → 녹음 화면으로
    navigateTo(`/meeting/record?meetingId=${meeting.meetingId}`)
    return
  }
  navigateTo(`/meeting/${meeting.meetingId}`)
}

const onClickDelete = async (meetingId: number) => {
  await handleDeleteMeeting(meetingId)
}

const onConfirmStart = async (params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N' }) => {
  isModalOpen.value = false
  const meetingId = await handleCreateMeeting(params)
  if (meetingId) {
    navigateTo(`/meeting/record?meetingId=${meetingId}`)
  }
}
</script>
