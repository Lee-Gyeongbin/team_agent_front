<template>
  <div>
    <UiEmpty
      v-if="sttList.length === 0"
      title="아직 발화 내용이 없습니다."
      description="녹음을 시작하면 실시간 STT가 표시됩니다."
    />

    <div
      v-else
      class="meeting-stt-list"
    >
      <div
        v-for="item in sttList"
        :key="item.id"
        class="meeting-stt-item"
      >
        <span
          class="meeting-stt-item-avatar"
          :class="`meeting-speaker-color-${getSpeakerColor(item.speakerId)}`"
        >
          {{ item.speakerName.charAt(0) }}
        </span>
        <div class="meeting-stt-item-body">
          <div class="meeting-stt-item-meta">
            <span class="meeting-stt-item-name">{{ item.speakerName }}</span>
            <span class="meeting-stt-item-time">{{ item.time }}</span>
          </div>
          <p class="meeting-stt-item-text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const { currentMeeting } = useMeeting2Store()

const sttList = computed(() => currentMeeting.value?.sttList ?? [])

const getSpeakerColor = (speakerId: string) => {
  const speaker = currentMeeting.value?.speakers.find((s) => s.id === speakerId)
  return speaker?.colorIndex ?? 0
}
</script>
