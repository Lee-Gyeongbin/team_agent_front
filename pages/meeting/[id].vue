<template>
  <div class="meeting-detail-page">
    <!-- 헤더 -->
    <div class="meeting-detail-header">
      <button
        type="button"
        class="meeting-detail-back"
        @click="navigateTo('/meeting')"
      >
        <i class="icon-arrow-left-sm size-20" />
      </button>
      <h2 class="meeting-detail-title">{{ meetingDetail.meeting?.meetingTitle }}</h2>
      <span class="meeting-detail-date">{{ meetingDetail.meeting?.startDt }}</span>
      <button
        v-if="meetingDetail.speakers.length > 0"
        type="button"
        class="btn btn-ghost"
        @click="isSpeakerMapModalOpen = true"
      >
        화자 매핑
      </button>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingDetail"
      class="meeting-detail-body"
    >
      <UiSkeleton
        height="24px"
        width="40%"
      />
      <UiSkeleton height="16px" />
      <UiSkeleton
        height="16px"
        width="80%"
      />
      <UiSkeleton
        height="16px"
        width="60%"
      />
    </div>

    <!-- 회의록 없음 -->
    <UiEmpty
      v-else-if="!meetingDetail.minutes"
      icon="icon-document"
      title="회의록이 없습니다."
    />

    <!-- 회의록 -->
    <MeetingMinutesView
      v-else
      :meeting="meetingDetail.meeting"
      :minutes="meetingDetail.minutes"
      :infographic-list="meetingDetail.infographicList ?? []"
      :speakers="meetingDetail.speakers"
    />

    <MeetingSpeakerMapModal
      v-if="isSpeakerMapModalOpen"
      :speakers="meetingDetail.speakers"
      :attendees="attendeeList"
      @close="isSpeakerMapModalOpen = false"
      @saved="onSavedSpeakerMapping"
    />
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingUser } from '~/types/meeting'

const route = useRoute()
const meetingId = Number(route.params.id)

const { meetingDetail, isLoadingDetail, handleSelectMeetingDetail } = useMeetingStore()
const isSpeakerMapModalOpen = ref(false)

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

const onSavedSpeakerMapping = async () => {
  await handleSelectMeetingDetail(meetingId)
}

onMounted(async () => {
  await handleSelectMeetingDetail(meetingId)
})
</script>
