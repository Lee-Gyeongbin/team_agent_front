import { usePromptApi } from '~/composables/prompt/usePromptApi'
import type {
  SystemPrompt,
  PromptTemplate,
  PromptFilterData,
  PromptLimitData,
  PromptVersion,
  PromptVersionStats,
  ErrorMessageData,
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

/** 시스템 프롬프트 상태 변수 */
const systemPromptList = ref<SystemPrompt[]>([])
const templateList = ref<PromptTemplate[]>([])
const filterData = ref<PromptFilterData>({
  inputBanWords: [],
  outputBanWords: [],
  policies: [],
})

const settingForm = ref<Partial<SystemPrompt>>({})

const emptySettingForm: Partial<SystemPrompt> = {
  promptId: '',
  promptName: '',
  promptTypeCd: '',
  content: '',
  temperature: 0.7,
  topP: 0.8,
  applyLlmYn: 'Y',
  applyRagYn: 'Y',
  applySqlYn: 'Y',
}

/** settingForm 초기화 */
const resetSettingForm = () => {
  settingForm.value = { ...emptySettingForm }
}

/** 시스템 프롬프트 목록 조회 */
const handleSelectSystemPromptList = async () => {
  try {
    const response = await fetchSystemPromptList()
    systemPromptList.value = response.dataList ?? []
    resetSettingForm()
  } catch {
    openToast({
      message: '시스템 프롬프트 조회 실패',
    })
  }
}

/** 시스템 프롬프트 저장 */
const handleSaveSystemPrompt = async (prompt: Partial<SystemPrompt>) => {
  const valid = validateSystemPrompt(prompt)
  if (!valid.valid) {
    openToast({
      message: valid.message,
    })
    return
  }
  openConfirm({
    title: '프롬프트 저장',
    message: '프롬프트를 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveSystemPrompt(prompt)
        await handleSelectSystemPromptList()
        openAlert({
          message: '시스템 프롬프트가 저장되었습니다.',
        })
      } catch {
        openToast({
          message: '시스템 프롬프트 저장 실패',
        })
      }
    },
  })
}

/** 시스템 프롬프트 유효성 검사 */
const validateSystemPrompt = (prompt: Partial<SystemPrompt>) => {
  if (isEmpty(prompt.promptName)) {
    return { valid: false, message: '프롬프트 명을 입력해주세요.' }
  }
  if (isEmpty(prompt.promptTypeCd)) {
    return { valid: false, message: '프롬프트 유형을 선택해주세요.' }
  }
  if (isEmpty(prompt.content)) {
    return { valid: false, message: '시스템 프롬프트를 입력해주세요.' }
  }
  if (isEmpty(prompt.temperature)) {
    return { valid: false, message: '창의성을 입력해주세요.' }
  }
  if (Number(prompt.temperature) < 0 || Number(prompt.temperature) > 2) {
    return { valid: false, message: '창의성은 0~2 사이의 값을 입력해주세요.' }
  }
  if (isEmpty(prompt.topP)) {
    return { valid: false, message: '샘플링값을 입력해주세요.' }
  }
  if (Number(prompt.topP) < 0.1 || Number(prompt.topP) > 1) {
    return { valid: false, message: '샘플링값은 0.1~1.0 사이의 값을 입력해주세요.' }
  }
  if (isEmpty(prompt.applyLlmYn)) {
    return { valid: false, message: 'LLM 적용 여부를 선택해주세요.' }
  }
  if (isEmpty(prompt.applyRagYn)) {
    return { valid: false, message: 'RAG 적용 여부를 선택해주세요.' }
  }
  if (isEmpty(prompt.applySqlYn)) {
    return { valid: false, message: 'SQL 적용 여부를 선택해주세요.' }
  }
  return { valid: true, message: '' }
}

/** 시스템 프롬프트 삭제 */
const handleDeleteSystemPrompt = async (prompt: SystemPrompt) => {
  openConfirm({
    title: '프롬프트 삭제',
    message: '프롬프트를 삭제하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchDeleteSystemPrompt(prompt)
        await handleSelectSystemPromptList()
        openAlert({
          message: '프롬프트가 삭제되었습니다.',
        })
      } catch {
        openToast({ message: '시스템 프롬프트 삭제 실패' })
      }
    },
  })
}

/** 시스템 프롬프트 활성/비활성 토글 */
const handleToggleSystemPrompt = async (prompt: Partial<SystemPrompt>) => {
  try {
    await fetchSaveSystemPrompt(prompt)
    await handleSelectSystemPromptList()
    openToast({ message: '프롬프트 활성화 상태가 변경되었습니다.' })
  } catch {
    openToast({ message: '프롬프트 활성화 상태 변경 실패' })
  }
}

/** START 템플릿 조회 TODO  : 기획 확정 뒤 구현 필요 */
const handleSelectTemplateList = async () => {
  const res = await fetchTemplateList()
  templateList.value = res.list
}

const handleSaveTemplate = async (template: Partial<PromptTemplate>) => {
  await fetchSaveTemplate(template)
  await handleSelectTemplateList()
}

const handleDeleteTemplate = async (id: string) => {
  await fetchDeleteTemplate(id)
  await handleSelectTemplateList()
}
/** END 템플릿 조회 TODO  : 기획 확정 뒤 구현 필요 */

/** 금지어/필터링 조회 */
const handleSelectFilterData = async () => {
  try {
    const response = await fetchFilterData()
    const data = response.data ?? {}
    filterData.value = {
      inputBanWords: data.inputBanWords ?? [],
      outputBanWords: data.outputBanWords ?? [],
      policies: data.policies ?? [],
    }
  } catch {
    openToast({ message: '금지어/필터링 조회 실패' })
  }
}

/** 금지어/필터링 저장 */
const handleSaveFilter = async (data: Partial<PromptFilterData>) => {
  openConfirm({
    title: '금지어/필터링 저장',
    message: '금지어/필터링 정책을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveFilter(data)
        handleSelectFilterData()
        openAlert({ message: '금지어/필터링이 저장되었습니다.' })
      } catch {
        openToast({ message: '금지어/필터링 저장 실패' })
      }
    },
  })
}

/** 토큰/응답 제한 */
const limitData = ref<PromptLimitData>({
  limitId: '',
  maxInTokens: 0,
  maxOutTokens: 0,
  ctxtWin: 0,
  dayUserLmt: 0,
  monOrgLmt: 0,
  rateLmtRpm: 0,
  minRespLen: 0,
  respTmo: 0,
  retryCnt: 0,
  streamYn: 'N',
  modifyDt: '',
})

/** 토큰/응답 제한 조회 */
const handleSelectLimitData = async () => {
  try {
    const response = await fetchLimitData()
    limitData.value = response.data ?? {}
  } catch {
    openToast({ message: '토큰/응답 제한 조회 실패' })
  }
}

/** 토큰/응답 제한 저장 */
const handleSaveLimit = async (data: Partial<PromptLimitData>) => {
  openConfirm({
    title: '토큰/응답 제한 저장',
    message: '토큰/응답 제한 설정을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveLimit(data)
        await handleSelectLimitData()
        openAlert({ message: '토큰/응답 제한 설정이 저장되었습니다.' })
      } catch {
        openToast({ message: '토큰/응답 제한 설정 저장 실패' })
      }
    },
  })
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
    resetSettingForm,
    handleSelectSystemPromptList,
    handleSaveSystemPrompt,
    handleDeleteSystemPrompt,
    handleToggleSystemPrompt,
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
