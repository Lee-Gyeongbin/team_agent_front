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
const defaultBasic = () => ({
  modelName: '',
  modelId: '',
  providerId: '',
  version: '',
  useYn: true,
  description: '',
})
const defaultApi = () => ({ apiUrl: '', apiKey: '', tmoSec: 30, retryCnt: 3, custHeaders: '' })
const defaultParam = () => ({
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  ctxtWin: 128000,
  freqPenalty: 0,
  presPenalty: 0,
  streamYn: true,
  fnCallYn: true,
  visionYn: true,
})
const defaultAccessControlList = (modelId: string) => [
  { modelId, roleId: 'admin', allowedYn: true },
  { modelId, roleId: 'premium', allowedYn: true },
  { modelId, roleId: 'general', allowedYn: true },
]

const defaultUsage = () => ({
  inputCost: 0,
  outputCost: 0,
  dayReqLmt: 4096,
  rpmLimit: 128000,
  tpmLimit: 0,
  dayCostLmt: 0,
  accessControlList: defaultAccessControlList(''),
})

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
      basicForm.value = {
        modelName: m.modelName,
        modelId: m.modelId,
        providerId: m.providerId,
        version: m.version,
        useYn: m.useYn,
        description: m.description,
      }
      apiForm.value = {
        apiUrl: m.apiUrl,
        apiKey: m.apiKey,
        tmoSec: m.tmoSec,
        retryCnt: m.retryCnt,
        custHeaders: m.custHeaders,
      }
      paramForm.value = {
        temperature: m.temperature,
        topP: m.topP,
        maxTokens: m.maxTokens,
        ctxtWin: m.ctxtWin,
        freqPenalty: m.freqPenalty,
        presPenalty: m.presPenalty,
        streamYn: m.streamYn,
        fnCallYn: m.fnCallYn,
        visionYn: m.visionYn,
      }
      usageForm.value = {
        inputCost: m.inputCost,
        outputCost: m.outputCost,
        dayReqLmt: m.dayReqLmt,
        rpmLimit: m.rpmLimit,
        tpmLimit: m.tpmLimit,
        dayCostLmt: m.dayCostLmt,
        accessControlList: m.accessControlList ?? defaultAccessControlList(m.modelId),
      }
    } else {
      basicForm.value = defaultBasic()
      apiForm.value = defaultApi()
      paramForm.value = defaultParam()
      usageForm.value = defaultUsage()
    }
  },
)

const onSave = () => {
  const modelId = basicForm.value.modelId
  const usage = usageForm.value
  const accessControlList = usage.accessControlList.map((a) => ({
    ...a,
    modelId: a.modelId || modelId,
  }))
  emit('save', {
    ...basicForm.value,
    ...apiForm.value,
    ...paramForm.value,
    ...usage,
    accessControlList,
  })
}
</script>
