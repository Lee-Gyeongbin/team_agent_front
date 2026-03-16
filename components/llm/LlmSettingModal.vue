<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="model ? 'LLM 모델 수정' : 'LLM 모델 추가'"
    @close="$emit('close')"
  >
    <div
      ref="formRef"
      class="com-setting-form"
    >
      <LlmSettingBasic
        :key="sectionKey"
        v-model="basicForm"
      />
      <LlmSettingApi
        :key="sectionKey"
        v-model="apiForm"
      />
      <LlmSettingParam
        :key="sectionKey"
        v-model="paramForm"
      />
      <LlmSettingUsage
        :key="sectionKey"
        v-model="usageForm"
      />
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

const { handleFetchProviderOptions } = useLlmStore()

interface Props {
  isOpen: boolean
  model: LlmModel | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [form: Partial<LlmModel>]
}>()

/** 기본 설정 */
const defaultBasic = (): {
  modelName: string
  modelId: string
  providerId: string
  version: string
  useYn: 'Y' | 'N'
  description: string
} => ({
  modelName: '',
  modelId: '',
  providerId: '',
  version: '',
  useYn: 'Y',
  description: '',
})
const defaultApi = () => ({ apiUrl: '', apiKey: '', tmoSec: 0, retryCnt: 0, custHeaders: '' })
const defaultParam = (): {
  temperature: number
  topP: number
  maxTokens: number
  ctxtWin: number
  freqPenalty: number
  presPenalty: number
  streamYn: 'Y' | 'N'
  fnCallYn: 'Y' | 'N'
  visionYn: 'Y' | 'N'
} => ({
  temperature: 0,
  topP: 0,
  maxTokens: 0,
  ctxtWin: 0,
  freqPenalty: 0,
  presPenalty: 0,
  streamYn: 'N',
  fnCallYn: 'N',
  visionYn: 'N',
})
const defaultUsage = () => ({
  inputCost: 0,
  outputCost: 0,
  dayReqLmt: 0,
  rpmLimit: 0,
  tpmLimit: 0,
  dayCostLmt: 0,
  roleIdArr: 'ROLE_USER',
})

const formRef = ref<HTMLElement | null>(null)
const sectionKey = ref(0)
const basicForm = ref(defaultBasic())
const apiForm = ref(defaultApi())
const paramForm = ref(defaultParam())
const usageForm = ref(defaultUsage())

// 모달 열릴 때 폼 초기화 및 Provider 옵션 fetch
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    handleFetchProviderOptions()
    if (props.model) {
      const m = props.model
      basicForm.value = {
        modelName: m.modelName,
        modelId: m.modelId,
        providerId: m.providerId,
        version: m.version,
        useYn: m.useYn === 'Y' ? 'Y' : 'N',
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
        streamYn: m.streamYn === 'Y' ? 'Y' : 'N',
        fnCallYn: m.fnCallYn === 'Y' ? 'Y' : 'N',
        visionYn: m.visionYn === 'Y' ? 'Y' : 'N',
      }
      usageForm.value = {
        inputCost: m.inputCost,
        outputCost: m.outputCost,
        dayReqLmt: m.dayReqLmt,
        rpmLimit: m.rpmLimit,
        tpmLimit: m.tpmLimit,
        dayCostLmt: m.dayCostLmt,
        roleIdArr:
          m.roleIdArr ??
          (m.accessControlList
            ?.filter((a) => a.allowedYn)
            .map((a) => `ROLE_${a.roleId.toUpperCase()}`)
            .join(',') ||
            'ROLE_ADMIN,ROLE_PREMIUM,ROLE_USER'),
      }
      nextTick(() => formRef.value?.closest('.modal-side-body')?.scrollTo(0, 0))
    } else {
      sectionKey.value += 1
      basicForm.value = defaultBasic()
      apiForm.value = defaultApi()
      paramForm.value = defaultParam()
      usageForm.value = defaultUsage()
      nextTick(() => formRef.value?.closest('.modal-side-body')?.scrollTo(0, 0))
    }
  },
)

const onSave = () => {
  const usage = usageForm.value
  emit('save', {
    ...basicForm.value,
    ...apiForm.value,
    ...paramForm.value,
    ...usage,
  })
}
</script>
