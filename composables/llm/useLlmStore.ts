import { useLlmApi } from '~/composables/llm/useLlmApi'
import type { LlmModel } from '~/types/llm'

const { fetchLlmList, fetchSaveLlm, fetchDeleteLlm, fetchUpdateLlmOrder } = useLlmApi()

// ===== 상태 변수 =====
const llmList = ref<LlmModel[]>([])

// ===== 조회 =====
const handleSelectLlmList = async () => {
  const res = await fetchLlmList()
  llmList.value = res.list
}

// ===== 추가/수정/삭제 =====
const handleSaveLlm = async (model: Partial<LlmModel>) => {
  await fetchSaveLlm(model)
  await handleSelectLlmList()
}

const handleDeleteLlm = async (id: string) => {
  await fetchDeleteLlm(id)
  await handleSelectLlmList()
}

// ===== 순서 =====
const handleUpdateLlmOrder = async (orderList: { id: string; order: number }[]) => {
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
