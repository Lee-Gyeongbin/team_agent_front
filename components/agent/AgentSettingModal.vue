<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="agent ? 'Agent 설정' : 'Agent 추가'"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <!-- 섹션1: Agent 유형 -->
      <AgentSettingType
        v-model="form.svcTy"
        v-model:sub-ty="form.subTy"
        :is-edit="isEmpty(agent?.agentId)"
        @change="onChangeAgentType"
      />

      <!-- 섹션2: Agent 기본 설정 + 유형별 상세 설정 -->
      <AgentSettingBasic
        v-model="basicForm"
        :svc-ty="form.svcTy"
        :sub-ty="form.subTy"
        :rag-form="ragForm"
        :sql-form="sqlForm"
        :survey-form="surveyForm"
        :sql-model-options="sqlModelOptions"
        :api-url-cd-options="apiUrlCdOptions"
        @update:rag-form="ragForm = $event"
        @update:sql-form="sqlForm = $event"
        @update:survey-form="surveyForm = $event"
      />

      <!-- 섹션3: 데이터 연결 (svcTy 기반 분기) -->
      <AgentSettingData
        v-if="form.svcTy === 'M' || form.svcTy === 'S'"
        ref="settingDataRef"
        :svc-ty="form.svcTy"
        :dataset-list="localDatasetList"
        :datamart-list="localDatamartList"
        @update:dataset-list="localDatasetList = $event"
        @update:datamart-list="localDatamartList = $event"
      />
    </div>

    <!-- 푸터 -->
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
import type { Agent, AgtDs, AgtDm, AgtSubAdditionalConfig } from '~/types/agent'
import type { CodeItem } from '~/types/codes'
import { useAgentStore } from '~/composables/agent/useAgentStore'
import { SURVEY_SUB_TY, normalizeAgentSubCfg } from '~/utils/chat/surveyUtil'
import {
  buildSurveyAdditionalConfig,
  emptySurveyConfigForm,
  parseSurveyAdditionalConfigToForm,
  type SurveyConfigForm,
} from '~/utils/agent/surveyConfigUtil'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const { modelOptions, handleChangeAgentType } = useAgentStore()

const settingDataRef = ref<{ resetFilter: () => void } | null>(null)

const sqlModelOptions = computed(() => [
  { label: '선택', value: '' },
  ...modelOptions.value.map((m) => ({ value: m.modelId, label: m.modelName })),
])

const apiUrlCdOptions = ref<{ label: string; value: string }[]>([{ label: '선택', value: '' }])
const initApiUrlCdOptions = async () => {
  const codes = await getCodes('AA000001')
  apiUrlCdOptions.value = [
    { label: '선택', value: '' },
    ...codes.map((item: CodeItem) => ({
      label: item.codeNm,
      value: item.codeId,
    })),
  ]
}

const onChangeAgentType = async (svcTy: string) => {
  if (svcTy !== 'C') {
    form.value.subTy = ''
  } else if (!form.value.subTy) {
    form.value.subTy = ''
    preservedSurveyConfig.value = null
    surveyForm.value = emptySurveyConfigForm()
  }
  const result = await handleChangeAgentType(svcTy)
  localDatasetList.value = result.datasetList
  localDatamartList.value = result.datamartList
  nextTick(() => settingDataRef.value?.resetFilter())
}

const emit = defineEmits<{
  close: []
  save: [form: Partial<Agent>]
}>()

// 유형
const form = ref({
  svcTy: '',
  subTy: '',
})

// 설문(SURVEY) ADDITIONAL_CONFIG — UI 미편집 필드(문항·영역별 참고치 등) 보존용
const preservedSurveyConfig = ref<AgtSubAdditionalConfig | null>(null)
const surveyForm = ref<SurveyConfigForm>(emptySurveyConfigForm())

const loadSurveyConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedSurveyConfig.value = { ...additional }
    surveyForm.value = parseSurveyAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedSurveyConfig.value = null
  surveyForm.value = emptySurveyConfigForm()
}

// 기본 설정 폼
const basicForm = ref({
  agentNm: '',
  apiUrlCd: '',
  iconId: '',
  colorId: '',
  description: '',
  sortOrd: 0,
  temperature: 0.7,
  tempDefaultYn: 'N' as 'Y' | 'N',
  topP: 0.9,
  topPDefaultYn: 'N' as 'Y' | 'N',
})

// RAG 설정 (001)
const ragForm = ref({
  simThresh: 0,
  maxSrchRslt: 0,
})

// SQL 설정 (002)
const sqlForm = ref({
  modelId: '',
  maxQrySec: 0,
  sqlValidYn: 'N' as 'Y' | 'N',
  readonlyYn: 'Y' as 'Y' | 'N',
  userCfrmYn: 'N' as 'Y' | 'N',
})

// 데이터 연결 (agent 객체에서 직접 가져옴)
const localDatasetList = ref<AgtDs[]>([])
const localDatamartList = ref<AgtDm[]>([])

// 모달 열릴 때 폼 초기화
watch(
  () => props.isOpen,
  async (open) => {
    if (!open) return
    await initApiUrlCdOptions()
    if (props.agent) {
      form.value.svcTy = props.agent.svcTy
      form.value.subTy = normalizeAgentSubCfg(props.agent.subCfg)?.subTy ?? ''
      if (props.agent.svcTy === 'C' && form.value.subTy === SURVEY_SUB_TY) {
        loadSurveyConfigFromAgent(props.agent)
      } else {
        preservedSurveyConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
      }
      basicForm.value = {
        agentNm: props.agent.agentNm,
        apiUrlCd: props.agent.apiUrlCd ?? '',
        iconId: props.agent.iconId ?? '',
        colorId: props.agent.colorId ?? '',
        description: props.agent.description,
        sortOrd: props.agent.sortOrd ?? 0,
        temperature: props.agent.temperature ?? 0.1,
        tempDefaultYn: props.agent.tempDefaultYn ?? 'Y',
        topP: props.agent.topP ?? 0.9,
        topPDefaultYn: props.agent.topPDefaultYn ?? 'Y',
      }
      ragForm.value = {
        simThresh: props.agent.simThresh ?? 0.7,
        maxSrchRslt: props.agent.maxSrchRslt ?? 10,
      }
      sqlForm.value = {
        modelId: props.agent.modelId ?? '',
        maxQrySec: props.agent.maxQrySec ?? 60,
        sqlValidYn: props.agent.sqlValidYn ?? 'N',
        readonlyYn: props.agent.readonlyYn ?? 'N',
        userCfrmYn: props.agent.userCfrmYn ?? 'N',
      }
      localDatasetList.value = [...(props.agent.datasetList ?? [])]
      localDatamartList.value = [...(props.agent.datamartList ?? [])]
      nextTick(() => settingDataRef.value?.resetFilter())
    } else {
      form.value.svcTy = ''
      form.value.subTy = ''
      preservedSurveyConfig.value = null
      surveyForm.value = emptySurveyConfigForm()
      basicForm.value = {
        agentNm: '',
        apiUrlCd: '',
        iconId: '',
        colorId: '',
        description: '',
        sortOrd: 0,
        temperature: 0.1,
        tempDefaultYn: 'Y',
        topP: 0.9,
        topPDefaultYn: 'Y',
      }
      ragForm.value = { simThresh: 0.7, maxSrchRslt: 10 }
      sqlForm.value = { modelId: '', maxQrySec: 60, sqlValidYn: 'N', readonlyYn: 'N', userCfrmYn: 'N' }
      localDatasetList.value = []
      localDatamartList.value = []
    }
  },
)

const onSave = () => {
  const base: Partial<Agent> = {
    svcTy: form.value.svcTy,
    ...basicForm.value,
  }

  if (form.value.svcTy === 'M') {
    Object.assign(base, ragForm.value, { datasetList: localDatasetList.value })
  } else if (form.value.svcTy === 'S') {
    Object.assign(base, sqlForm.value, { datamartList: localDatamartList.value })
  } else if (form.value.svcTy === 'C' && form.value.subTy === SURVEY_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: SURVEY_SUB_TY,
      additionalConfig: buildSurveyAdditionalConfig(surveyForm.value, preservedSurveyConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  }

  emit('save', base)
}
</script>
