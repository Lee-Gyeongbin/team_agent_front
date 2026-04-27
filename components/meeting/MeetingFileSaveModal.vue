<template>
  <UiModal
    :is-open="isFileSaveOpen"
    title="파일로 저장"
    max-width="440px"
    @close="onClose"
  >
    <div class="meeting2-modal-form">
      <div class="meeting2-modal-field">
        <span class="meeting2-label">파일 형식</span>
        <div class="meeting2-format-grp">
          <button
            v-for="format in formats"
            :key="format"
            type="button"
            class="meeting2-format-chip"
            :class="{ 'is-active': form.format === format }"
            @click="form.format = format"
          >
            {{ format.toUpperCase() }}
          </button>
        </div>
      </div>

      <div class="meeting2-modal-field">
        <span class="meeting2-label">파일명</span>
        <UiInput
          v-model="form.fileName"
          size="md"
          placeholder="파일명 입력"
        />
        <p class="meeting2-modal-hint">최종 저장: {{ form.fileName || '-' }}.{{ form.format }}</p>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          다운로드
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'
import type { MeetingFileFormat, MeetingFileSaveForm } from '~/types/meeting2'

const { isFileSaveOpen, currentMeeting, doSaveFile } = useMeeting2Store()

const formats: MeetingFileFormat[] = ['docx', 'pdf', 'hwp', 'txt', 'md']

const buildDefaultFileName = () => {
  if (!currentMeeting.value) return '회의록'
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeTitle = currentMeeting.value.title.replace(/[\\/:*?"<>|]/g, '').trim() || '회의록'
  return `${safeTitle}_${today}`
}

const form = reactive<MeetingFileSaveForm>({
  format: 'pdf',
  fileName: '',
})

watch(isFileSaveOpen, (open) => {
  if (!open || !currentMeeting.value) return
  form.format = currentMeeting.value.fileFormat ?? 'pdf'
  form.fileName = buildDefaultFileName()
})

const onClose = () => {
  isFileSaveOpen.value = false
}

const onSave = () => {
  if (!form.fileName.trim()) {
    openToast({ message: '파일명을 입력해주세요.', type: 'warning' })
    return
  }
  doSaveFile({ ...form, fileName: form.fileName.trim() })
}
</script>
