<template>
  <div class="meeting2-stt-toolbar">
    <span class="meeting2-stt-toggle">
      실시간 STT
      <UiBadge :variant="sttBadgeVariant">{{ sttBadgeLabel }}</UiBadge>
    </span>

    <select
      v-model="selectedLanguage"
      class="meeting2-editor-toolbar-select"
    >
      <option
        v-for="lang in languages"
        :key="lang.value"
        :value="lang.value"
      >
        언어: {{ lang.label }}
      </option>
    </select>

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
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const { currentMeeting, recordStatus } = useMeeting2Store()

const selectedLanguage = ref('ko')

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: '영어' },
  { value: 'ja', label: '일본어' },
]

const sttList = computed(() => currentMeeting.value?.sttList ?? [])

watch(
  () => currentMeeting.value?.language,
  (lang) => {
    if (lang) selectedLanguage.value = lang
  },
  { immediate: true },
)

watch(selectedLanguage, (lang) => {
  if (currentMeeting.value) currentMeeting.value.language = lang
})

/** 녹음 상태별 STT 뱃지 라벨/색 */
const sttBadgeLabel = computed(() => {
  switch (recordStatus.value) {
    case 'recording':
      return 'ON'
    case 'paused':
      return '일시정지'
    case 'stopped':
      return '완료'
    default:
      return 'OFF'
  }
})

const sttBadgeVariant = computed(() => {
  switch (recordStatus.value) {
    case 'recording':
      return 'success' as const
    case 'paused':
      return 'basic-chat' as const
    case 'stopped':
      return 'data-line' as const
    default:
      return 'default' as const
  }
})

const onClickDownload = () => {
  if (sttList.value.length === 0) {
    openToast({ message: '다운로드할 텍스트가 없습니다.', type: 'warning' })
    return
  }
  openToast({ message: '전체 텍스트가 다운로드되었습니다.' })
}
</script>
