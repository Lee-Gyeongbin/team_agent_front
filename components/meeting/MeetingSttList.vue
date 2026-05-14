<template>
  <div class="meeting2-stt-section">
    <UiEmpty
      v-if="sttList.length === 0"
      title="아직 발화 내용이 없습니다."
      description="녹음을 시작하면 실시간 STT가 표시됩니다."
    />

    <div
      v-else
      class="meeting2-stt-list"
    >
      <div
        v-for="item in sttList"
        :key="item.id"
        class="meeting2-stt-item"
      >
        <span
          class="meeting2-stt-item-avatar"
          :class="`meeting2-speaker-color-${getSpeakerColor(item.speakerId)}`"
        >
          {{ getSpeakerAvatar(item.speakerId, item.speakerName) }}
        </span>
        <div class="meeting2-stt-item-body">
          <div class="meeting2-stt-item-meta">
            <span class="meeting2-stt-item-name">{{ item.speakerName }}</span>
            <span class="meeting2-stt-item-time">{{ item.time }}</span>
          </div>
          <p class="meeting2-stt-item-text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { computeSpeakerAvatarMap } from '~/utils/meeting/speakerAvatarUtil'

const { currentMeeting } = useMeetingStore()

const sttList = computed(() => currentMeeting.value?.sttList ?? [])

const speakers = computed(() => currentMeeting.value?.speakers ?? [])
const avatarMap = computed(() => computeSpeakerAvatarMap(speakers.value))

const getSpeakerColor = (speakerId: string) => {
  const speaker = speakers.value.find((s) => s.id === speakerId)
  return speaker?.colorIndex ?? 0
}

const getSpeakerAvatar = (speakerId: string, speakerName: string) => {
  return avatarMap.value.get(speakerId) || speakerName?.charAt(0) || '?'
}
</script>
