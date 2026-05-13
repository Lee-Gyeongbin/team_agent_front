<template>
  <div class="meeting2-stt-toolbar">
    <span class="meeting2-stt-toggle">
      실시간 STT
      <UiBadge :variant="sttBadgeVariant">{{ sttBadgeLabel }}</UiBadge>
    </span>

    <div class="meeting2-stt-toolbar-actions">
      <UiButton
        variant="ghost"
        size="md"
        :disabled="sttList.length === 0"
        title="전체 텍스트 다운로드"
        @click="onClickDownload"
      >
        <template #icon-left>
          <i class="icon-download size-20" />
        </template>
        다운로드
      </UiButton>

      <input
        ref="audioFileInputRef"
        type="file"
        accept="audio/*"
        class="meeting2-stt-audio-input"
        @change="onAudioFileChange"
      />

      <UiButton
        variant="ghost"
        size="md"
        :disabled="!isMeetingIdValid || isFinishing"
        title="로컬 오디오 파일로 전사·회의록 생성 (테스트용)"
        @click="onClickPickAudioFile"
      >
        <template #icon-left>
          <i class="icon-attach-file size-20" />
        </template>
        오디오 첨부
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { openConfirm } from '~/composables/useDialog'
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const props = defineProps<{
  /** 라우트 회의 ID — finishMeetingWithAudio 전송에 사용 */
  meetingId: number
}>()

const { isRecording, isConnecting } = useRealtimeTranscription()
const { currentMeeting, isFinishing, handleSelectMeetingDetail, activeTab, handleFinishMeetingWithAudio } =
  useMeetingStore()

const audioFileInputRef = ref<HTMLInputElement | null>(null)

const isMeetingIdValid = computed(() => Number.isFinite(props.meetingId) && props.meetingId > 0)

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

const onClickPickAudioFile = () => {
  if (!isMeetingIdValid.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  audioFileInputRef.value?.click()
}

/** 로컬 오디오 파일 선택 시 서버 전사·회의록 생성 (녹음 대신 테스트용) */
const onAudioFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!isMeetingIdValid.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }

  const confirmed = await openConfirm({
    title: '오디오로 전사',
    message: '선택한 파일로 전사 및 회의록 생성을 진행할까요?',
  })
  if (!confirmed) return

  const success = await handleFinishMeetingWithAudio({
    meetingId: props.meetingId,
    audioBlob: file,
  })

  if (success) {
    await handleSelectMeetingDetail(props.meetingId)
    await navigateTo(`/meeting/${props.meetingId}`)
    activeTab.value = 'infographic'
  }
}
</script>

<style lang="scss" scoped>
.meeting2-stt-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

// 파일 입력은 버튼으로만 열기 — 레이아웃에서 숨김
.meeting2-stt-audio-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
