<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="model ? 'LLM 모델 수정' : 'LLM 모델 추가'"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <LlmSettingBasic v-model="basicForm" />
      <LlmSettingApi v-model="apiForm" />
      <LlmSettingParam v-model="paramForm" />
      <LlmSettingUsage v-model="usageForm" />
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
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { LlmModel } from '~/types/llm'

interface Props {
  isOpen: boolean
  model: LlmModel | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [form: Partial<LlmModel>]
}>()

// ===== 초기값 =====
const defaultBasic = () => ({ name: '', modelId: '', provider: '', version: '', status: '활성', description: '' })
const defaultApi = () => ({ apiEndpoint: '', apiKey: '', timeout: 30, retryCount: 3, extraHeaders: '' })
const defaultParam = () => ({ temperature: 0.7, topP: 1, maxTokens: 4096, contextWindow: 128000, frequencyPenalty: 0, presencePenalty: 0, supportStreaming: true, supportFunctionCall: true, supportVision: true })
const defaultUsage = () => ({ inputCost: 0, outputCost: 0, dailyRequestLimit: 4096, rpmLimit: 128000, tpmLimit: 0, dailyCostLimit: 0, accessAdmin: true, accessPremium: true, accessGeneral: true })

// ===== 폼 상태 =====
const basicForm = ref(defaultBasic())
const apiForm = ref(defaultApi())
const paramForm = ref(defaultParam())
const usageForm = ref(defaultUsage())

// 모달 열릴 때 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    if (props.model) {
      const m = props.model
      basicForm.value = { name: m.name, modelId: m.modelId, provider: m.provider, version: m.version, status: m.status, description: m.description }
      apiForm.value = { apiEndpoint: m.apiEndpoint, apiKey: m.apiKey, timeout: m.timeout, retryCount: m.retryCount, extraHeaders: m.extraHeaders }
      paramForm.value = { temperature: m.temperature, topP: m.topP, maxTokens: m.maxTokens, contextWindow: m.contextWindow, frequencyPenalty: m.frequencyPenalty, presencePenalty: m.presencePenalty, supportStreaming: m.supportStreaming, supportFunctionCall: m.supportFunctionCall, supportVision: m.supportVision }
      usageForm.value = { inputCost: m.inputCost, outputCost: m.outputCost, dailyRequestLimit: m.dailyRequestLimit, rpmLimit: m.rpmLimit, tpmLimit: m.tpmLimit, dailyCostLimit: m.dailyCostLimit, accessAdmin: m.accessAdmin, accessPremium: m.accessPremium, accessGeneral: m.accessGeneral }
    } else {
      basicForm.value = defaultBasic()
      apiForm.value = defaultApi()
      paramForm.value = defaultParam()
      usageForm.value = defaultUsage()
    }
  },
)

const onSave = () => {
  emit('save', {
    ...basicForm.value,
    ...apiForm.value,
    ...paramForm.value,
    ...usageForm.value,
  })
}
</script>
