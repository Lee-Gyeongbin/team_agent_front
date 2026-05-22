<template>
  <div class="meeting2-integrated-sources">
    <UiEmpty
      v-if="sources.length === 0"
      icon="icon-document"
      title="원본 회의 정보를 불러오는 중입니다."
    />
    <ul
      v-else
      class="meeting2-integrated-source-list"
    >
      <li
        v-for="item in sources"
        :key="item.meetingId"
        class="meeting2-integrated-source-item"
        @click="onClickSource(item.meetingId)"
      >
        <div class="meeting2-integrated-source-icon">
          <i class="icon-document size-18" />
        </div>
        <div class="meeting2-integrated-source-body">
          <span class="meeting2-integrated-source-title">{{ item.meetingTitle }}</span>
          <span class="meeting2-integrated-source-date">{{ formatDate(item.startDt) }}</span>
        </div>
        <i class="icon-arrow-right size-16 meeting2-integrated-source-arrow" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingIntegrationSource } from '~/types/meeting'

const { meetingDetail } = useMeetingStore()

const sources = computed<MeetingIntegrationSource[]>(() => meetingDetail.value.integrationSources ?? [])

const formatDate = (dt?: string): string => {
  if (!dt) return '-'
  // YYYY-MM-DD HH:mm:ss → YYYY.MM.DD
  return dt.slice(0, 10).replace(/-/g, '.')
}

const onClickSource = (meetingId: number) => {
  navigateTo(`/meeting/${meetingId}`)
}
</script>
