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
        v-model:cncpt-ty="form.cncptTy"
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
        :recommend-form="recommendForm"
        :curation-form="curationForm"
        :translate-form="translateForm"
        :researcher-form="researcherForm"
        :risk-form="riskForm"
        :planner-form="plannerForm"
        :proposal-form="proposalForm"
        :sql-model-options="sqlModelOptions"
        :api-url-cd-options="apiUrlCdOptions"
        :tmpl-id-options="tmplIdOptions"
        @update:rag-form="ragForm = $event"
        @update:sql-form="sqlForm = $event"
        @update:survey-form="surveyForm = $event"
        @update:recommend-form="recommendForm = $event"
        @update:curation-form="curationForm = $event"
        @update:translate-form="translateForm = $event"
        @update:researcher-form="researcherForm = $event"
        @update:risk-form="riskForm = $event"
        @update:planner-form="plannerForm = $event"
        @update:proposal-form="proposalForm = $event"
      />

      <!-- 섹션3: 데이터 연결 (svcTy 기반 분기) — D(RISK/PROPOSAL)는 자사 역량 RAG 데이터셋 연결 -->
      <AgentSettingData
        v-if="form.svcTy === 'M' || form.svcTy === 'S' || (form.svcTy === 'D' && (form.subTy === 'RISK' || form.subTy === 'PROPOSAL'))"
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
import { useTmplApi } from '~/composables/tmpl/useTmplApi'
import { SURVEY_SUB_TY, normalizeAgentSubCfg } from '~/utils/chat/surveyUtil'
import { RECOMMEND_SUB_TY } from '~/utils/chat/recommendAgentUtil'
import { CURATION_SUB_TY } from '~/utils/chat/newsCuratorUtil'
import { TRANSLATE_SUB_TY } from '~/utils/chat/translateAgentUtil'
import {
  buildSurveyAdditionalConfig,
  emptySurveyConfigForm,
  parseSurveyAdditionalConfigToForm,
  type SurveyConfigForm,
} from '~/utils/agent/surveyConfigUtil'
import {
  buildRecommendAdditionalConfig,
  emptyRecommendConfigForm,
  parseRecommendAdditionalConfigToForm,
  type RecommendConfigForm,
} from '~/utils/agent/recommendConfigUtil'
import {
  buildCurationAdditionalConfig,
  emptyCurationConfigForm,
  parseCurationAdditionalConfigToForm,
  type CurationConfigForm,
} from '~/utils/agent/curationConfigUtil'
import {
  buildTranslateAdditionalConfig,
  emptyTranslateConfigForm,
  parseTranslateAdditionalConfigToForm,
  type TranslateConfigForm,
} from '~/utils/agent/translateConfigUtil'
import {
  buildResearcherAdditionalConfig,
  emptyResearcherConfigForm,
  parseResearcherAdditionalConfigToForm,
  type ResearcherConfigForm,
} from '~/utils/agent/researcherConfigUtil'
import {
  RISK_SUB_TY,
  buildRiskAdditionalConfig,
  emptyRiskConfigForm,
  parseRiskAdditionalConfigToForm,
  type RiskConfigForm,
} from '~/utils/agent/riskConfigUtil'
import { PLANNER_SUB_TY } from '~/utils/chat/plannerAgentUtil'
import {
  buildPlannerAdditionalConfig,
  emptyPlannerConfigForm,
  parsePlannerAdditionalConfigToForm,
  type PlannerConfigForm,
} from '~/utils/agent/plannerConfigUtil'
import { PROPOSAL_SUB_TY } from '~/utils/chat/proposalAgentUtil'
import {
  buildProposalAdditionalConfig,
  emptyProposalConfigForm,
  parseProposalAdditionalConfigToForm,
  type ProposalConfigForm,
} from '~/utils/agent/proposalConfigUtil'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const { modelOptions, handleChangeAgentType } = useAgentStore()
const { fetchTmplList } = useTmplApi()
const RESEARCHER_SUB_TY = 'RESEARCHER'

const settingDataRef = ref<{ resetFilter: () => void } | null>(null)

const sqlModelOptions = computed(() => [
  { label: '선택', value: '' },
  ...modelOptions.value.map((m) => ({ value: m.modelId, label: m.modelName })),
])

const apiUrlCdOptions = ref<{ label: string; value: string }[]>([{ label: '선택', value: '' }])
const tmplIdOptions = ref<{ label: string; value: string }[]>([{ label: '선택', value: '' }])
const tmplListLoaded = ref(false)
let tmplListLoadPromise: Promise<void> | null = null

const isResearcherAgentForm = () => form.value.svcTy === 'M' && form.value.subTy === RESEARCHER_SUB_TY
const isRiskAgentForm = () => form.value.svcTy === 'D' && form.value.subTy === RISK_SUB_TY
const isPlannerAgentForm = () => form.value.svcTy === 'C' && form.value.subTy === PLANNER_SUB_TY
const isProposalAgentForm = () => form.value.svcTy === 'D' && form.value.subTy === PROPOSAL_SUB_TY
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

const initTmplIdOptions = async () => {
  try {
    const res = await fetchTmplList()
    const rows = res.dataList ?? []
    tmplIdOptions.value = [
      { label: '선택', value: '' },
      ...rows
        .filter((row) => row.useYn !== 'N')
        .map((row) => ({
          label: row.tmplNm?.trim() || row.tmplId,
          value: row.tmplId,
        })),
    ]
    tmplListLoaded.value = true
  } catch {
    tmplIdOptions.value = [{ label: '선택', value: '' }]
    tmplListLoaded.value = false
    openToast({ message: '템플릿 목록 조회 실패', type: 'error' })
  }
}

/** RESEARCHER/RISK/PLANNER/PROPOSAL 등 템플릿 기반 세부 유형일 때만 tb_tmpl 목록 조회 (동시 호출 dedup) */
const ensureTmplIdOptionsIfResearcher = (): Promise<void> => {
  if (!isResearcherAgentForm() && !isRiskAgentForm() && !isPlannerAgentForm() && !isProposalAgentForm()) return Promise.resolve()
  if (tmplListLoaded.value) return Promise.resolve()
  if (tmplListLoadPromise) return tmplListLoadPromise

  tmplListLoadPromise = initTmplIdOptions().finally(() => {
    tmplListLoadPromise = null
  })
  return tmplListLoadPromise
}

const onChangeAgentType = async (svcTy: string) => {
  if (svcTy !== 'C' && svcTy !== 'M') {
    form.value.subTy = ''
  } else if (svcTy === 'M' && form.value.subTy !== '' && form.value.subTy !== RESEARCHER_SUB_TY) {
    form.value.subTy = ''
  } else if (svcTy === 'C' && form.value.subTy === RESEARCHER_SUB_TY) {
    form.value.subTy = ''
  } else if (!form.value.subTy) {
    form.value.subTy = ''
    preservedSurveyConfig.value = null
    preservedRecommendConfig.value = null
    preservedCurationConfig.value = null
    preservedResearcherConfig.value = null
    surveyForm.value = emptySurveyConfigForm()
    recommendForm.value = emptyRecommendConfigForm()
    curationForm.value = emptyCurationConfigForm()
    researcherForm.value = emptyResearcherConfigForm()
  }
  // M·D는 데이터셋, S는 데이터마트 — handleChangeAgentType가 svcTy로 분기 처리한다.
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
  cncptTy: '',
  svcTy: '',
  subTy: '',
})

// 설문(SURVEY) ADDITIONAL_CONFIG — UI 미편집 필드(문항·영역별 참고치 등) 보존용
const preservedSurveyConfig = ref<AgtSubAdditionalConfig | null>(null)
const surveyForm = ref<SurveyConfigForm>(emptySurveyConfigForm())

// 추천(RECOMMEND) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedRecommendConfig = ref<AgtSubAdditionalConfig | null>(null)
const recommendForm = ref<RecommendConfigForm>(emptyRecommendConfigForm())

// 큐레이션(CURATION) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedCurationConfig = ref<AgtSubAdditionalConfig | null>(null)
const curationForm = ref<CurationConfigForm>(emptyCurationConfigForm())

// 번역(TRANSLATE) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedTranslateConfig = ref<AgtSubAdditionalConfig | null>(null)
const translateForm = ref<TranslateConfigForm>(emptyTranslateConfigForm())

// 리서처(RESEARCHER) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedResearcherConfig = ref<AgtSubAdditionalConfig | null>(null)
const researcherForm = ref<ResearcherConfigForm>(emptyResearcherConfigForm())

// 리스크진단(RISK) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedRiskConfig = ref<AgtSubAdditionalConfig | null>(null)
const riskForm = ref<RiskConfigForm>(emptyRiskConfigForm())

// 기획서·PT(PLANNER) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedPlannerConfig = ref<AgtSubAdditionalConfig | null>(null)
const plannerForm = ref<PlannerConfigForm>(emptyPlannerConfigForm())

// 제안서(PROPOSAL) ADDITIONAL_CONFIG — UI 미편집 필드 보존용
const preservedProposalConfig = ref<AgtSubAdditionalConfig | null>(null)
const proposalForm = ref<ProposalConfigForm>(emptyProposalConfigForm())

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

const loadRecommendConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedRecommendConfig.value = { ...additional }
    recommendForm.value = parseRecommendAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedRecommendConfig.value = null
  recommendForm.value = emptyRecommendConfigForm()
}

const loadCurationConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedCurationConfig.value = { ...additional }
    curationForm.value = parseCurationAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedCurationConfig.value = null
  curationForm.value = emptyCurationConfigForm()
}

const loadTranslateConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedTranslateConfig.value = { ...additional }
    translateForm.value = parseTranslateAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedTranslateConfig.value = null
  translateForm.value = emptyTranslateConfigForm()
}

const loadResearcherConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedResearcherConfig.value = { ...additional }
    researcherForm.value = parseResearcherAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedResearcherConfig.value = null
  researcherForm.value = emptyResearcherConfigForm()
}

const loadRiskConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedRiskConfig.value = { ...additional }
    riskForm.value = parseRiskAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedRiskConfig.value = null
  riskForm.value = emptyRiskConfigForm()
}

const loadPlannerConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedPlannerConfig.value = { ...additional }
    plannerForm.value = parsePlannerAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedPlannerConfig.value = null
  plannerForm.value = emptyPlannerConfigForm()
}

const loadProposalConfigFromAgent = (agent: Agent | null) => {
  const subCfg = normalizeAgentSubCfg(agent?.subCfg)
  const additional = subCfg?.additionalConfig
  if (additional && typeof additional === 'object' && Object.keys(additional).length > 0) {
    preservedProposalConfig.value = { ...additional }
    proposalForm.value = parseProposalAdditionalConfigToForm(additional as Record<string, unknown>)
    return
  }
  preservedProposalConfig.value = null
  proposalForm.value = emptyProposalConfigForm()
}

const resetSubTyConfigForms = () => {
  preservedSurveyConfig.value = null
  preservedRecommendConfig.value = null
  preservedCurationConfig.value = null
  preservedTranslateConfig.value = null
  preservedResearcherConfig.value = null
  surveyForm.value = emptySurveyConfigForm()
  recommendForm.value = emptyRecommendConfigForm()
  curationForm.value = emptyCurationConfigForm()
  translateForm.value = emptyTranslateConfigForm()
  researcherForm.value = emptyResearcherConfigForm()
  preservedRiskConfig.value = null
  riskForm.value = emptyRiskConfigForm()
  preservedPlannerConfig.value = null
  plannerForm.value = emptyPlannerConfigForm()
  preservedProposalConfig.value = null
  proposalForm.value = emptyProposalConfigForm()
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
    if (!open) {
      tmplListLoaded.value = false
      tmplListLoadPromise = null
      tmplIdOptions.value = [{ label: '선택', value: '' }]
      return
    }
    await initApiUrlCdOptions()
    if (props.agent) {
      form.value.cncptTy = props.agent.cncptTy ?? ''
      form.value.svcTy = props.agent.svcTy
      form.value.subTy = normalizeAgentSubCfg(props.agent.subCfg)?.subTy ?? ''
      if (props.agent.svcTy === 'C' && form.value.subTy === SURVEY_SUB_TY) {
        loadSurveyConfigFromAgent(props.agent)
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
      } else if (props.agent.svcTy === 'C' && form.value.subTy === RECOMMEND_SUB_TY) {
        loadRecommendConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
      } else if (props.agent.svcTy === 'C' && form.value.subTy === CURATION_SUB_TY) {
        loadCurationConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
      } else if (props.agent.svcTy === 'M' && form.value.subTy === RESEARCHER_SUB_TY) {
        loadResearcherConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
      } else if (props.agent.svcTy === 'W' && form.value.subTy === TRANSLATE_SUB_TY) {
        loadTranslateConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedResearcherConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
      } else if (props.agent.svcTy === 'D' && form.value.subTy === RISK_SUB_TY) {
        loadRiskConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        preservedPlannerConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
        plannerForm.value = emptyPlannerConfigForm()
      } else if (props.agent.svcTy === 'C' && form.value.subTy === PLANNER_SUB_TY) {
        loadPlannerConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        preservedRiskConfig.value = null
        preservedProposalConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
        riskForm.value = emptyRiskConfigForm()
        proposalForm.value = emptyProposalConfigForm()
        await ensureTmplIdOptionsIfResearcher()
      } else if (props.agent.svcTy === 'D' && form.value.subTy === PROPOSAL_SUB_TY) {
        loadProposalConfigFromAgent(props.agent)
        preservedSurveyConfig.value = null
        preservedRecommendConfig.value = null
        preservedCurationConfig.value = null
        preservedTranslateConfig.value = null
        preservedResearcherConfig.value = null
        preservedRiskConfig.value = null
        preservedPlannerConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
        recommendForm.value = emptyRecommendConfigForm()
        curationForm.value = emptyCurationConfigForm()
        translateForm.value = emptyTranslateConfigForm()
        researcherForm.value = emptyResearcherConfigForm()
        riskForm.value = emptyRiskConfigForm()
        plannerForm.value = emptyPlannerConfigForm()
        await ensureTmplIdOptionsIfResearcher()
      } else {
        resetSubTyConfigForms()
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
      await ensureTmplIdOptionsIfResearcher()
      nextTick(() => settingDataRef.value?.resetFilter())
    } else {
      form.value.cncptTy = ''
      form.value.svcTy = ''
      form.value.subTy = ''
      resetSubTyConfigForms()
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

watch(
  () => form.value.subTy,
  (subTy, prevSubTy) => {
    if (!props.isOpen || subTy === prevSubTy) return
    if (subTy === SURVEY_SUB_TY) {
      if (props.agent?.svcTy === 'C' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === SURVEY_SUB_TY) {
        loadSurveyConfigFromAgent(props.agent)
      } else {
        preservedSurveyConfig.value = null
        surveyForm.value = emptySurveyConfigForm()
      }
      return
    }
    if (subTy === RECOMMEND_SUB_TY) {
      if (props.agent?.svcTy === 'C' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === RECOMMEND_SUB_TY) {
        loadRecommendConfigFromAgent(props.agent)
      } else {
        preservedRecommendConfig.value = null
        recommendForm.value = emptyRecommendConfigForm()
      }
      return
    }
    if (subTy === CURATION_SUB_TY) {
      if (props.agent?.svcTy === 'C' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === CURATION_SUB_TY) {
        loadCurationConfigFromAgent(props.agent)
      } else {
        preservedCurationConfig.value = null
        curationForm.value = emptyCurationConfigForm()
      }
      return
    }
    if (subTy === TRANSLATE_SUB_TY) {
      if (props.agent?.svcTy === 'W' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === TRANSLATE_SUB_TY) {
        loadTranslateConfigFromAgent(props.agent)
      } else {
        preservedTranslateConfig.value = null
        translateForm.value = emptyTranslateConfigForm()
      }
      return
    }
    if (subTy === RESEARCHER_SUB_TY) {
      if (props.agent?.svcTy === 'M' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === RESEARCHER_SUB_TY) {
        loadResearcherConfigFromAgent(props.agent)
      } else {
        preservedResearcherConfig.value = null
        researcherForm.value = emptyResearcherConfigForm()
      }
      if (form.value.svcTy === 'M') {
        ensureTmplIdOptionsIfResearcher()
      }
      return
    }
    if (subTy === RISK_SUB_TY) {
      if (props.agent?.svcTy === 'D' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === RISK_SUB_TY) {
        loadRiskConfigFromAgent(props.agent)
      } else {
        preservedRiskConfig.value = null
        riskForm.value = emptyRiskConfigForm()
      }
      if (form.value.svcTy === 'D') {
        ensureTmplIdOptionsIfResearcher()
      }
      return
    }
    if (subTy === PLANNER_SUB_TY) {
      if (props.agent?.svcTy === 'C' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === PLANNER_SUB_TY) {
        loadPlannerConfigFromAgent(props.agent)
      } else {
        preservedPlannerConfig.value = null
        plannerForm.value = emptyPlannerConfigForm()
      }
      if (form.value.svcTy === 'C') {
        ensureTmplIdOptionsIfResearcher()
      }
      return
    }
    if (subTy === PROPOSAL_SUB_TY) {
      if (props.agent?.svcTy === 'D' && normalizeAgentSubCfg(props.agent.subCfg)?.subTy === PROPOSAL_SUB_TY) {
        loadProposalConfigFromAgent(props.agent)
      } else {
        preservedProposalConfig.value = null
        proposalForm.value = emptyProposalConfigForm()
      }
      if (form.value.svcTy === 'D') {
        ensureTmplIdOptionsIfResearcher()
      }
    }
  },
)

const onSave = () => {
  const base: Partial<Agent> = {
    cncptTy: form.value.cncptTy,
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
  } else if (form.value.svcTy === 'C' && form.value.subTy === RECOMMEND_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: RECOMMEND_SUB_TY,
      additionalConfig: buildRecommendAdditionalConfig(recommendForm.value, preservedRecommendConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  } else if (form.value.svcTy === 'C' && form.value.subTy === CURATION_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: CURATION_SUB_TY,
      additionalConfig: buildCurationAdditionalConfig(curationForm.value, preservedCurationConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  } else if (form.value.svcTy === 'W' && form.value.subTy === TRANSLATE_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: TRANSLATE_SUB_TY,
      additionalConfig: buildTranslateAdditionalConfig(translateForm.value, preservedTranslateConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  }

  if (form.value.svcTy === 'M' && form.value.subTy === RESEARCHER_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: RESEARCHER_SUB_TY,
      additionalConfig: buildResearcherAdditionalConfig(researcherForm.value, preservedResearcherConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  }

  if (form.value.svcTy === 'D' && form.value.subTy === RISK_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: RISK_SUB_TY,
      additionalConfig: buildRiskAdditionalConfig(riskForm.value, preservedRiskConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
    // 자사 역량 RAG 데이터셋 연결 (채팅 데이터셋 콤보는 에이전트에 연결된 데이터셋을 노출)
    base.datasetList = localDatasetList.value
  }

  if (form.value.svcTy === 'C' && form.value.subTy === PLANNER_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: PLANNER_SUB_TY,
      additionalConfig: buildPlannerAdditionalConfig(plannerForm.value, preservedPlannerConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
  }

  if (form.value.svcTy === 'D' && form.value.subTy === PROPOSAL_SUB_TY) {
    const existingSubCfg = normalizeAgentSubCfg(props.agent?.subCfg)
    base.subCfg = {
      subCfgId: existingSubCfg?.subCfgId ?? '',
      agentId: props.agent?.agentId ?? '',
      subTy: PROPOSAL_SUB_TY,
      additionalConfig: buildProposalAdditionalConfig(proposalForm.value, preservedProposalConfig.value),
      useYn: existingSubCfg?.useYn ?? 'Y',
      createDt: existingSubCfg?.createDt ?? '',
      modifyDt: existingSubCfg?.modifyDt ?? '',
    }
    // 자사 역량 RAG 데이터셋 연결
    base.datasetList = localDatasetList.value
  }

  emit('save', base)
}
</script>
