<template>
  <div class="meeting2-stt-toolbar">
    <span class="meeting2-stt-toggle">
      실시간 STT
      <UiBadge :variant="sttBadgeVariant">{{ sttBadgeLabel }}</UiBadge>
    </span>

    <UiButton
      variant="ghost"
      size="sm"
      :disabled="sttList.length === 0"
      title="전체 텍스트 다운로드"
      @click="onClickDownload"
    >
      <template #icon-left>
        <i class="icon-download size-14" />
      </template>
      다운로드
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { isRecording, isConnecting } = useRealtimeTranscription()
const { currentMeeting } = useMeetingStore()

const sttList = computed(() => currentMeeting.value?.sttList ?? [])

/** 녹음 상태별 STT 뱃지 라벨/색 */
const sttBadgeLabel = computed(() => {
  if (isRecording.value) return 'ON'
  if (isConnecting.value) return '연결 중'
  return 'OFF'
})

const sttBadgeVariant = computed(() => {
  if (isRecording.value) return 'success' as const
  if (isConnecting.value) return 'basic-chat' as const
  return 'default' as const
})

const onClickDownload = () => {
  if (sttList.value.length === 0) {
    openToast({ message: '다운로드할 텍스트가 없습니다.', type: 'warning' })
    return
  }
  openToast({ message: '전체 텍스트가 다운로드되었습니다.' })
}
</script>
