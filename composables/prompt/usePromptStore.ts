import { usePromptApi } from '~/composables/prompt/usePromptApi'
import type {
  SystemPrompt,
  PromptTemplate,
  PromptFilterData,
  PromptFilterPolicy,
  PromptLimitData,
  PromptVersion,
  PromptVersionStats,
  ErrorMessageData,
  ErrorMessageItem,
} from '~/types/prompt'

const {
  fetchSystemPromptList,
  fetchSaveSystemPrompt,
  fetchDeleteSystemPrompt,
  fetchTemplateList,
  fetchSaveTemplate,
  fetchDeleteTemplate,
  fetchFilterData,
  fetchSaveFilter,
  fetchLimitData,
  fetchSaveLimit,
  fetchVersionList,
  fetchRestoreVersion,
  fetchErrorMessageData,
  fetchSaveErrorMessage,
} = usePromptApi()

// ===== 상태 변수 =====
const systemPromptList = ref<SystemPrompt[]>([])
const templateList = ref<PromptTemplate[]>([])
const filterData = ref<PromptFilterData>({
  inputKeywords: [],
  outputKeywords: [],
  policies: [],
})

const settingForm = ref<Partial<SystemPrompt>>({})

/** 시스템 프롬프트 목록 조회 */
const handleSelectSystemPromptList = async () => {
  try {
    const response = await fetchSystemPromptList()
    systemPromptList.value = response.dataList ?? []
  } catch (error) {
    openToast({
      message: '시스템 프롬프트 조회 실패',
    })
  }
}

// ===== 시스템 프롬프트 추가/수정/삭제 =====
const handleSaveSystemPrompt = async (prompt: Partial<SystemPrompt>) => {
  await fetchSaveSystemPrompt(prompt)
  await handleSelectSystemPromptList()
}

const handleDeleteSystemPrompt = async (id: string) => {
  await fetchDeleteSystemPrompt(id)
  await handleSelectSystemPromptList()
}

// ===== 템플릿 조회 =====
const handleSelectTemplateList = async () => {
  const res = await fetchTemplateList()
  templateList.value = res.list
}

// ===== 템플릿 추가/수정/삭제 =====
const handleSaveTemplate = async (template: Partial<PromptTemplate>) => {
  await fetchSaveTemplate(template)
  await handleSelectTemplateList()
}

const handleDeleteTemplate = async (id: string) => {
  await fetchDeleteTemplate(id)
  await handleSelectTemplateList()
}

// ===== 금지어/필터링 조회 =====
const handleSelectFilterData = async () => {
  const res = await fetchFilterData()
  filterData.value = res.data
}

// ===== 금지어/필터링 저장 =====
const handleSaveFilter = async (data: Partial<PromptFilterData>) => {
  const res = await fetchSaveFilter(data)
  filterData.value = res.data
}

// ===== 토큰/응답 제한 조회 =====
const limitData = ref<PromptLimitData>({
  maxInputTokens: 0,
  maxOutputTokens: 0,
  contextWindow: 0,
  dailyRequestLimit: 0,
  monthlyOrgLimit: 0,
  rateLimit: 0,
  todayUsage: 0,
  monthUsage: 0,
  monthLimit: 0,
  minResponseLength: 0,
  responseTimeout: 0,
  retryCount: 0,
  streamingEnabled: false,
})

const handleSelectLimitData = async () => {
  const res = await fetchLimitData()
  limitData.value = res.data
}

// ===== 토큰/응답 제한 저장 =====
const handleSaveLimit = async (data: Partial<PromptLimitData>) => {
  const res = await fetchSaveLimit(data)
  limitData.value = res.data
}

// ===== 버전 관리 =====
const versionList = ref<PromptVersion[]>([])
const versionStats = ref<PromptVersionStats>({ totalVersions: 0, monthlyUpdates: 0, lastChangeDays: 0 })

const handleSelectVersionList = async () => {
  const res = await fetchVersionList()
  versionList.value = res.list
  versionStats.value = res.stats
}

const handleRestoreVersion = async (id: string) => {
  await fetchRestoreVersion(id)
  await handleSelectVersionList()
}

// ===== 오류 메시지 =====
const errorMessageData = ref<ErrorMessageData>({
  responseErrors: [],
  inputErrors: [],
  apiErrors: [],
})

const handleSelectErrorMessageData = async () => {
  const res = await fetchErrorMessageData()
  errorMessageData.value = res.data
}

const handleSaveErrorMessage = async (data: Partial<ErrorMessageData>) => {
  const res = await fetchSaveErrorMessage(data)
  errorMessageData.value = res.data
}

export const usePromptStore = () => {
  return {
    systemPromptList,
    settingForm,
    handleSelectSystemPromptList,
    handleSaveSystemPrompt,
    handleDeleteSystemPrompt,
    templateList,
    handleSelectTemplateList,
    handleSaveTemplate,
    handleDeleteTemplate,
    filterData,
    handleSelectFilterData,
    handleSaveFilter,
    limitData,
    handleSelectLimitData,
    handleSaveLimit,
    versionList,
    versionStats,
    handleSelectVersionList,
    handleRestoreVersion,
    errorMessageData,
    handleSelectErrorMessageData,
    handleSaveErrorMessage,
  }
}
