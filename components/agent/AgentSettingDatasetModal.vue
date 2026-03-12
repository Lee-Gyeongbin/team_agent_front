<template>
  <UiModal
    :is-open="isOpen"
    :title="isEditMode ? '데이터셋 수정' : '데이터셋 추가'"
    position="center"
    @close="$emit('close')"
  >
    <div class="agent-dataset-modal-form">
      <!-- 데이터셋 이름 -->
      <div class="agent-setting-field-row">
        <label class="agent-setting-label">
          <span class="is-required">*</span>
          데이터셋 이름
        </label>
        <UiInput
          v-model="form.name"
          placeholder="예: 제품 매뉴얼 DB"
          size="sm"
        />
      </div>

      <!-- 데이터셋 설명 -->
      <div class="agent-setting-field-row is-top">
        <label class="agent-setting-label">
          <span class="is-required">*</span>
          데이터셋 설명
        </label>
        <UiTextarea
          v-model="form.description"
          placeholder="데이터셋에 대한 설명을 입력하세요."
          :rows="3"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="5"
        />
      </div>
    </div>

    <!-- 푸터 -->
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="md"
          @click="onSave"
        >
          {{ isEditMode ? '수정' : '추가' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { AgentDataset } from '~/types/agent'

interface Props {
  isOpen: boolean
  dataset?: AgentDataset | null // null이면 추가, 있으면 수정
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  dataset: null,
})

const emit = defineEmits<{
  close: []
  save: [dataset: AgentDataset]
}>()

const isEditMode = computed(() => !!props.dataset)

// 폼 데이터
const form = ref({
  name: '',
  description: '',
})

// dataset prop 변경 시 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open && props.dataset) {
      // 수정 모드: 기존 데이터 채우기
      form.value.name = props.dataset.name
      form.value.description = props.dataset.description
    } else if (open) {
      // 추가 모드: 초기화
      form.value.name = ''
      form.value.description = ''
    }
  },
)

const onSave = () => {
  const result: AgentDataset = {
    id: props.dataset?.id || `ds-${Date.now()}`,
    name: form.value.name,
    description: form.value.description,
    documentCount: props.dataset?.documentCount ?? 0,
    chunkCount: props.dataset?.chunkCount ?? 0,
    isConnected: props.dataset?.isConnected ?? false,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  emit('save', result)
  emit('close')
}
</script>
