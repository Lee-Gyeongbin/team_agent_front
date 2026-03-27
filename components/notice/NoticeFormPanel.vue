<template>
  <UiModal
    :is-open="isOpen"
    :title="`공지 ${panelActionLabel}`"
    position="right"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <div class="url-reg-field">
        <label class="url-reg-label">공지 제목 <span class="required">*</span></label>
        <UiInput
          ref="noticeTitleRef"
          :model-value="formData.title"
          placeholder="공지 제목을 입력하세요"
          size="md"
          :max-length="300"
          @update:model-value="(value) => onFieldChange('title', value)"
        />
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">옵션</label>
        <div class="notice-option-box">
          <div class="notice-option-group flex items-center gap-8">
            <label class="notice-option-item flex items-center gap-2">
              <UiCheckbox
                :model-value="isDashboardTitle"
                @update:model-value="(value) => onFieldChange('featuredYn', value ? 'Y' : null)"
              />
              <span>대시보드 타이틀로 표시하기</span>
            </label>
            <label class="notice-option-item flex items-center gap-2">
              <UiCheckbox
                :model-value="isTopFixed"
                @update:model-value="(value) => onFieldChange('pinYn', value ? 'Y' : null)"
              />
              <span>공지사항 상단에 고정하기</span>
            </label>
          </div>
        </div>
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">공지 내용 <span class="required">*</span></label>
        <UiTextarea
          :model-value="formData.content"
          placeholder="공지 내용을 입력하세요"
          :max-length="500"
          :rows="10"
          border
          :auto-resize="true"
          :max-rows="10"
          @update:model-value="(value) => onFieldChange('content', value)"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSaveNotice"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import type { NoticeFormData } from '~/types/notice'

interface Props {
  isOpen: boolean
  formData: NoticeFormData
  panelActionLabel: '등록' | '수정'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updateFormData: [payload: NoticeFormData]
  save: [payload: NoticeFormData]
}>()

const noticeTitleRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const isDashboardTitle = computed(() => props.formData.featuredYn === 'Y')
const isTopFixed = computed(() => props.formData.pinYn === 'Y')
const onFieldChange = <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => {
  emit('updateFormData', {
    ...props.formData,
    [key]: value,
  })
}

const onSaveNotice = () => {
  if (!props.formData.title.trim()) {
    openToast({ message: '공지 제목을 입력해주세요.', type: 'warning' })
    noticeTitleRef.value?.focus?.()
    return
  }
  if (!props.formData.content.trim()) {
    openToast({ message: '공지 내용을 입력해주세요.', type: 'warning' })
    return
  }
  emit('save', props.formData)
}
</script>
