import { useLlmApi } from '~/composables/llm/useLlmApi'
import type { LlmModel } from '~/types/llm'

const { fetchLlmList, fetchSaveLlm, fetchDeleteLlm, fetchUpdateLlmOrder } = useLlmApi()

// ===== 상태 변수 =====
const llmList = ref<LlmModel[]>([])

// ===== 조회 =====
const handleSelectLlmList = async () => {
  try {
    const response = await fetchLlmList()
    llmList.value = response.dataList ?? []
  } catch {
    openAlert({ message: '모델 목록 조회 실패' })
  }
}

// ===== 추가/수정/삭제 =====
const handleSaveLlm = async (model: Partial<LlmModel>) => {
  await fetchSaveLlm(model)
  await handleSelectLlmList()
}

const handleDeleteLlm = async (modelId: string) => {
  await fetchDeleteLlm(modelId)
  await handleSelectLlmList()
}

// ===== 순서 =====
const handleUpdateLlmOrder = async (orderList: { modelId: string; sortOrder: number }[]) => {
  await fetchUpdateLlmOrder(orderList)
  await handleSelectLlmList()
}

export const useLlmStore = () => {
  return {
    llmList,
    handleSelectLlmList,
    handleSaveLlm,
    handleDeleteLlm,
    handleUpdateLlmOrder,
  }
}
