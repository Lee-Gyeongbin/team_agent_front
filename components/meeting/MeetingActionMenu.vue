<template>
  <div class="meeting2-side-section">
    <span class="meeting2-section-title">작업</span>
    <div class="meeting2-side-action-grp">
      <!-- 파일로 저장 — 드롭다운 (형식 선택 후 즉시 다운로드) -->
      <div
        ref="downloadPickerRef"
        class="meeting2-action-picker"
      >
        <button
          class="meeting2-side-action-btn"
          @click="toggleDownloadPicker"
        >
          <i class="icon-download size-16" />
          파일로 저장
          <i
            class="icon-arrow-down-gray size-12 meeting2-action-picker-caret"
            :class="{ 'is-open': isDownloadPickerOpen }"
          />
        </button>

        <div
          v-if="isDownloadPickerOpen"
          class="meeting2-action-picker-pop"
        >
          <button
            v-for="format in formats"
            :key="format"
            type="button"
            class="meeting2-action-picker-item"
            @click="onSelectFormat(format)"
          >
            {{ format.toUpperCase() }}로 저장
          </button>
        </div>
      </div>

      <button
        class="meeting2-side-action-btn"
        @click="onClickMail"
      >
        <i class="icon-send size-16" />
        메일 발송
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingFileFormat } from '~/types/meeting2'

const { handleDownloadFile, handleOpenMailSend } = useMeetingStore()

const formats: MeetingFileFormat[] = ['pdf', 'docx', 'hwp', 'txt', 'md']

const isDownloadPickerOpen = ref(false)
const downloadPickerRef = ref<HTMLDivElement | null>(null)

const toggleDownloadPicker = () => {
  isDownloadPickerOpen.value = !isDownloadPickerOpen.value
}

const onSelectFormat = (format: MeetingFileFormat) => {
  isDownloadPickerOpen.value = false
  handleDownloadFile(format)
}

const onClickMail = () => handleOpenMailSend()

// 외부 클릭 시 드롭다운 닫기
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
