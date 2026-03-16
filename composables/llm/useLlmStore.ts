import { useLlmApi } from '~/composables/llm/useLlmApi'
import type { LlmModel } from '~/types/llm'

const { fetchLlmList, fetchSaveLlm, fetchDeleteLlm, fetchUpdateLlmOrder } = useLlmApi()

const llmList = ref<LlmModel[]>([])
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

/** 모델 저장 */
const handleSaveLlm = async (model: Partial<LlmModel>) => {
  await fetchSaveLlm(model)
  await handleSelectLlmList()
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

export const useLlmStore = () => {
  return {
    llmList,
    handleSelectLlmList,
    handleSaveLlm,
    handleDeleteLlm,
    handleUpdateLlmOrder,
    onLlmDragStart,
  }
}
