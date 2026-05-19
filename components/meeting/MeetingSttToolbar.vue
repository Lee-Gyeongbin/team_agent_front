<template>
  <div class="meeting2-stt-toolbar">
    <span class="meeting2-stt-toggle">
      실시간 STT
      <UiBadge :variant="sttBadgeVariant">{{ sttBadgeLabel }}</UiBadge>
    </span>

    <div class="meeting2-stt-toolbar-actions">
      <UiButton
        variant="ghost"
        size="xs"
        :class="{ 'is-active': isSearchOpen }"
        title="STT 검색"
        @click="toggleSearch"
      >
        <template #icon-left>
          <i class="icon-search size-16" />
        </template>
        검색
      </UiButton>

      <div
        ref="downloadPickerRef"
        class="meeting2-stt-download-picker"
      >
        <UiButton
          variant="ghost"
          size="xs"
          :disabled="sttList.length === 0"
          title="다운로드"
          @click="toggleDownloadPicker"
        >
          <template #icon-left>
            <i class="icon-download size-20" />
          </template>
          다운로드
          <template #icon-right>
            <i
              class="icon-arrow-down-gray size-12 meeting2-stt-download-caret"
              :class="{ 'is-open': isDownloadPickerOpen }"
            />
          </template>
        </UiButton>

        <div
          v-if="isDownloadPickerOpen"
          class="meeting2-stt-download-pop"
        >
          <button
            type="button"
            class="meeting2-stt-download-item"
            @click="onClickTextDownload"
          >
            텍스트 다운로드
          </button>
          <button
            type="button"
            class="meeting2-stt-download-item"
            @click="onClickAudioDownload"
          >
            오디오 다운로드
          </button>
        </div>
      </div>

      <input
        ref="audioFileInputRef"
        type="file"
        accept="audio/*"
        class="meeting2-stt-audio-input"
        @change="onAudioFileChange"
      />

      <UiButton
        variant="ghost"
        size="xs"
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
const {
  currentMeeting,
  isFinishing,
  isSearchOpen,
  toggleSearch,
  handleSelectMeetingDetail,
  activeTab,
  handleFinishMeetingWithAudio,
  handleDownloadSttText,
  handleDownloadMeetingAudio,
} = useMeetingStore()

const audioFileInputRef = ref<HTMLInputElement | null>(null)
const downloadPickerRef = ref<HTMLDivElement | null>(null)
const isDownloadPickerOpen = ref(false)

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

const toggleDownloadPicker = () => {
  if (sttList.value.length === 0) return
  isDownloadPickerOpen.value = !isDownloadPickerOpen.value
}

const onClickTextDownload = () => {
  isDownloadPickerOpen.value = false
  const success = handleDownloadSttText()
  if (success) openToast({ message: '텍스트 파일을 다운로드했습니다.' })
}

const onClickAudioDownload = async () => {
  isDownloadPickerOpen.value = false
  const success = await handleDownloadMeetingAudio()
  if (success) openToast({ message: '오디오 파일을 다운로드했습니다.' })
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

const onDocClick = (e: MouseEvent) => {
  if (!isDownloadPickerOpen.value) return
  if (downloadPickerRef.value && !downloadPickerRef.value.contains(e.target as Node)) {
    isDownloadPickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
})
</script>

<style lang="scss" scoped>
.meeting2-stt-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;

  :deep(.ui-button.size-btn-xs) {
    font-size: 12px;
  }
}

.meeting2-stt-download-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  align-self: center;
}

.meeting2-stt-download-caret {
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.meeting2-stt-download-pop {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 144px;
  padding: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 20;
}

.meeting2-stt-download-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
  }
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
