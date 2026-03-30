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
        <label class="url-reg-label">카테고리 <span class="required">*</span></label>
        <UiSelect
          ref="noticeTypeRef"
          :model-value="formData.noticeTypeCd"
          :options="noticeTypeOptions"
          placeholder="카테고리를 선택하세요"
          size="md"
          @update:model-value="(value) => onNoticeTypeChange(String(value ?? ''))"
        />
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">옵션</label>
        <div class="notice-option-box">
          <div class="flex flex-wrap items-center gap-8">
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
          ref="noticeContentRef"
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
  noticeTypeOptions: { label: string; value: string }[]
  panelActionLabel: '등록' | '수정'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updateFormData: [payload: NoticeFormData]
  save: [payload: NoticeFormData]
}>()

const noticeTitleRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const noticeContentRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const noticeTypeRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)

const focusField = (fieldRef: typeof noticeTitleRef) => {
  nextTick(() => {
    const el = fieldRef.value?.$el || fieldRef.value
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector('input, textarea') || el
      if ('focus' in input) (input as HTMLElement).focus()
    }
  })
}

const isDashboardTitle = computed(() => props.formData.featuredYn === 'Y')
const isTopFixed = computed(() => props.formData.pinYn === 'Y')
const onFieldChange = <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => {
  emit('updateFormData', {
    ...props.formData,
    [key]: value,
  })
}
const onNoticeTypeChange = (value: string) => {
  onFieldChange('noticeTypeCd', value)
}

const onSaveNotice = () => {
  if (!String(props.formData.noticeTypeCd ?? '').trim()) {
    openToast({ message: '카테고리를 선택해주세요.', type: 'warning' })
    focusField(noticeTypeRef)
    return
  }
  if (!props.formData.title.trim()) {
    openToast({ message: '공지 제목을 입력해주세요.', type: 'warning' })
    focusField(noticeTitleRef)
    return
  }
  if (!props.formData.content.trim()) {
    openToast({ message: '공지 내용을 입력해주세요.', type: 'warning' })
    focusField(noticeContentRef)
    return
  }
  emit('save', props.formData)
}
</script>
