import { useLlmApi } from '~/composables/llm/useLlmApi'
import type { LlmModel } from '~/types/llm'

const { fetchLlmList, fetchProviderOptions, fetchSaveLlm, fetchDeleteLlm, fetchUpdateLlmOrder } = useLlmApi()

const llmList = ref<LlmModel[]>([])
const providerOptions = ref<{ label: string; value: string }[]>([])
const isSettingOpen = ref(false)
const llmListBeforeDrag = ref<LlmModel[]>([]) // 드래그 시작 시점 순서 (취소 시 복원용)

/** 모델 목록 조회 */
const handleSelectLlmList = async () => {
  try {
    const response = await fetchLlmList()
    llmList.value = response.dataList ?? []
  } catch {
    openAlert({ message: '모델 목록 조회 실패' })
  }
}

/** Provider 옵션 조회 (모달 오픈 시 호출) */
const handleFetchProviderOptions = async () => {
  try {
    const res = await fetchProviderOptions()
    providerOptions.value = (res.dataList ?? []).map((p) => ({
      label: p.providerName,
      value: p.providerId,
    }))
  } catch {
    openAlert({ message: 'Provider 목록 조회 실패' })
  }
}

/** 모델 저장 유효성 검사 */
const validateSaveLlm = (model: Partial<LlmModel>) => {
  const valid = { valid: true, message: '' }
  if (!model.modelName) {
    valid.valid = false
    valid.message = '모델명을 입력해주세요.'
    return valid
  }
  if (!model.modelId) {
    valid.valid = false
    valid.message = '모델ID를 입력해주세요.'
    return valid
  }
  if (!model.providerId) {
    valid.valid = false
    valid.message = 'Provider를 선택해주세요.'
    return valid
  }
  if (!model.apiUrl) {
    valid.valid = false
    valid.message = 'API URL을 입력해주세요.'
    return valid
  }
  if (!model.apiKey) {
    valid.valid = false
    valid.message = 'API Key를 입력해주세요.'
    return valid
  }
  return valid
}

/** 모델 저장 */
const handleSaveLlm = async (model: Partial<LlmModel>) => {
  const { valid, message } = validateSaveLlm(model)
  if (!valid) {
    openToast({ message })
    return
  }
  openConfirm({
    message: '모델을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveLlm(model)
        await handleSelectLlmList()
        isSettingOpen.value = false
        openAlert({ message: '모델이 저장되었습니다.' })
      } catch {
        openAlert({ message: '모델 저장 실패' })
      }
    },
  })
}

const handleDeleteLlm = async (modelId: string) => {
  await fetchDeleteLlm(modelId)
  await handleSelectLlmList()
}

/** 모델 드래그 시작 시 순서 저장 (취소 시 복원용) */
const onLlmDragStart = () => {
  llmListBeforeDrag.value = [...llmList.value]
}

/** 모델 순서 업데이트 */
const handleUpdateLlmOrder = async (orderList: { modelId: string; sortOrder: number }[]) => {
  openConfirm({
    message: '모델 순서를 변경하시겠습니까?',
    onConfirm: async () => {
      await fetchUpdateLlmOrder(orderList)
      await handleSelectLlmList()
      openToast({ message: '모델 순서가 변경되었습니다.' })
    },
    onCancel: () => {
      llmList.value = [...llmListBeforeDrag.value]
    },
  })
}

/** 모델 활성화 상태 변경 */
const handleToggleActive = async (model: Partial<LlmModel>) => {
  try {
    await fetchSaveLlm(model)
    await handleSelectLlmList()
    openToast({ message: '모델 활성화 상태가 변경되었습니다.' })
  } catch {
    openToast({ message: '모델 활성화 상태 변경 실패' })
  }
}

export const useLlmStore = () => {
  return {
    llmList,
    providerOptions,
    isSettingOpen,
    handleSelectLlmList,
    handleFetchProviderOptions,
    handleSaveLlm,
    handleDeleteLlm,
    handleUpdateLlmOrder,
    handleToggleActive,
    onLlmDragStart,
  }
}
