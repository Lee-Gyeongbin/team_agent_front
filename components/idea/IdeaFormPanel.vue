<template>
  <UiDrawer
    :open="isOpen"
    :title="`아이디어 ${panelActionLabel}`"
    position="right"
    width="50%"
    show-resize
    show-fullscreen
    persist-key="idea-form"
    :confirm-before-close="false"
    @update:open="(value) => !value && $emit('close')"
  >
    <div class="com-setting-form inq-form-panel">
      <div class="inq-form-row">
        <div class="url-reg-field">
          <label class="url-reg-label">구분 <span class="required">*</span></label>
          <UiSelect
            ref="categoryRef"
            :model-value="formData.ideaTypeCd"
            :options="typeOptions"
            placeholder="구분을 선택하세요"
            size="md"
            @update:model-value="(value) => onCategoryChange(String(value ?? ''))"
          />
        </div>
        <div
          v-if="isAgentSelected"
          class="url-reg-field"
        >
          <label class="url-reg-label">에이전트 <span class="required">*</span></label>
          <UiSelect
            ref="agentRef"
            :model-value="formData.agentId"
            :options="agentOptions"
            placeholder="에이전트를 선택하세요"
            size="md"
            @update:model-value="(value) => onFieldChange('agentId', String(value ?? ''))"
          />
        </div>
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">아이디어 제목 <span class="required">*</span></label>
        <UiInput
          ref="titleRef"
          :model-value="formData.title"
          placeholder="제목을 입력하세요"
          size="md"
          :max-length="300"
          @update:model-value="(value) => onFieldChange('title', String(value ?? ''))"
        />
      </div>

      <div class="url-reg-field inq-content-field">
        <label class="url-reg-label">아이디어 내용 <span class="required">*</span></label>
        <!-- 드로어를 열 때마다 새로 만들어 입력값으로 초기화 -->
        <InqRichEditor
          v-if="isOpen"
          ref="contentRef"
          :model-value="formData.content"
          @update:model-value="(value) => onFieldChange('content', value)"
        />
      </div>

      <div class="url-reg-field inq-attach">
        <label class="url-reg-label">첨부파일</label>
        <IdeaAttachBox
          :model-value="formData.files"
          @update:model-value="onFilesChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="outline"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiDrawer, UiInput, UiSelect, UiButton } from '@leechanyong/ispark-ui'
import InqRichEditor from '~/components/inq/InqRichEditor.vue'
import { openToast } from '~/composables/useToast'
import type { IdeaFile, IdeaFormData } from '~/types/idea'

interface Props {
  isOpen: boolean
  formData: IdeaFormData
  typeOptions: { label: string; value: string }[]
  agentOptions: { label: string; value: string }[]
  /** 구분 코드가 '에이전트'인지 (공통코드 코드값 기준) */
  isAgentType: (ideaTypeCd: string) => boolean
  panelActionLabel: '등록' | '수정'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updateFormData: [payload: IdeaFormData]
  save: [payload: IdeaFormData]
}>()

type FieldRef = { $el?: HTMLElement } | null
const categoryRef = ref<FieldRef>(null)
const agentRef = ref<FieldRef>(null)
const titleRef = ref<FieldRef>(null)
const contentRef = ref<{ $el?: HTMLElement; focus?: () => void } | null>(null)

const isAgentSelected = computed(() => props.isAgentType(props.formData.ideaTypeCd))

const focusField = (fieldRef: typeof titleRef) => {
  nextTick(() => {
    const el = fieldRef.value?.$el
    if (!(el instanceof HTMLElement)) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const target = el.querySelector<HTMLElement>('input, textarea, button') ?? el
    target.focus()
  })
}

const onFieldChange = <K extends keyof IdeaFormData>(key: K, value: IdeaFormData[K]) => {
  emit('updateFormData', { ...props.formData, [key]: value })
}

// 구분이 '에이전트'가 아니면 선택한 에이전트 초기화
const onCategoryChange = (value: string) => {
  emit('updateFormData', {
    ...props.formData,
    ideaTypeCd: value,
    agentId: props.isAgentType(value) ? props.formData.agentId : '',
  })
}

/** 첨부 목록 변경 — 목록에서 뺀 저장 파일은 deleteFileIds에 담아 저장 시 서버에서 삭제 */
const onFilesChange = (files: IdeaFile[]) => {
  const removedIds = props.formData.files
    .filter((file) => file.ideaFileId && !files.some((item) => item.ideaFileId === file.ideaFileId))
    .map((file) => file.ideaFileId as string)
  emit('updateFormData', {
    ...props.formData,
    files,
    deleteFileIds: [...props.formData.deleteFileIds, ...removedIds],
  })
}

const onSave = () => {
  if (!props.formData.ideaTypeCd) {
    openToast({ message: '구분을 선택해주세요.', type: 'warning' })
    focusField(categoryRef)
    return
  }
  if (isAgentSelected.value && !props.formData.agentId) {
    openToast({ message: '에이전트를 선택해주세요.', type: 'warning' })
    focusField(agentRef)
    return
  }
  if (!props.formData.title.trim()) {
    openToast({ message: '제목을 입력해주세요.', type: 'warning' })
    focusField(titleRef)
    return
  }
  if (!props.formData.content.trim()) {
    openToast({ message: '내용을 입력해주세요.', type: 'warning' })
    contentRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    contentRef.value?.focus?.()
    return
  }
  emit('save', props.formData)
}
</script>
