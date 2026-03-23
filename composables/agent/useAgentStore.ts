import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent, AgtDs, AgtDm } from '~/types/agent'

const {
  fetchAgentList,
  fetchModelOptions,
  fetchSaveAgent,
  fetchAgentDetail,
  fetchAgentDetailDataList,
  fetchDeleteAgent,
  fetchToggleAgent,
  fetchUpdateAgentOrder,
} = useAgentApi()

const agentList = ref<Agent[]>([])
/** 에이전트 상세 모달 */
const isSettingOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)
const modelOptions = ref<{ modelId: string; modelName: string }[]>([])

/** 에이전트 목록 조회 */
const handleSelectAgentList = async () => {
  try {
    const response = await fetchAgentList()
    agentList.value = response?.dataList ?? []
  } catch {
    openToast({
      message: '에이전트 목록 조회 실패',
      type: 'error',
    })
  }
}

/** 모델 옵션 조회 */
const handleFetchModelOptions = async () => {
  try {
    const response = await fetchModelOptions()
    modelOptions.value = response?.dataList ?? []
  } catch {
    openToast({
      message: '모델 옵션 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 활성화/비활성화 */
const handleToggleAgent = async (agentId: string, useYn: 'Y' | 'N') => {
  try {
    await fetchToggleAgent(agentId, useYn)
    openToast({
      message: '에이전트 활성화 상태가 변경되었습니다.',
      type: 'success',
    })
    await handleSelectAgentList()
  } catch {
    openToast({
      message: '에이전트 활성화/비활성화 실패',
      type: 'error',
    })
  }
}

/** 에이전트 상세 조회 */
const handleFetchAgentDetail = async (agent: Agent) => {
  try {
    const response = await fetchAgentDetail(agent)
    selectedAgent.value = response?.data ?? null
    if (isNotEmpty(agent.connCount) && agent.connCount > 0) {
      await handleFetchAgentDetailDataList(agent)
    }
    isSettingOpen.value = true
  } catch {
    openToast({
      message: '에이전트 상세 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 상세 데이터 목록 조회 */
const handleFetchAgentDetailDataList = async (agent: Agent) => {
  try {
    const response = await fetchAgentDetailDataList(agent)
    if (!selectedAgent.value) return
    if (agent.agentTypeCd === '001') {
      selectedAgent.value.datasetList = (response?.dataList as AgtDs[]) ?? []
    } else if (agent.agentTypeCd === '002') {
      selectedAgent.value.datamartList = (response?.dataList as AgtDm[]) ?? []
    }
  } catch {
    openToast({
      message: '데이터 목록 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 저장 */
const handleSaveAgent = async (agent: Partial<Agent>) => {
  openConfirm({
    message: '에이전트를 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveAgent(agent)
        await handleSelectAgentList()
        openAlert({ message: '에이전트 정보가 저장되었습니다.' })
        isSettingOpen.value = false
      } catch {
        openToast({
          message: '에이전트 저장 실패',
          type: 'error',
        })
      }
    },
  })
}

const handleDeleteAgent = async (agentId: string) => {
  await fetchDeleteAgent(agentId)
  await handleSelectAgentList()
}

// ===== Agent 순서 =====
const handleUpdateAgentOrder = async (orderList: { agentId: string; sortOrd: number }[]) => {
  await fetchUpdateAgentOrder(orderList)
  await handleSelectAgentList()
}

export const useAgentStore = () => {
  return {
    agentList,
    isSettingOpen,
    selectedAgent,
    modelOptions,
    handleSelectAgentList,
    handleFetchModelOptions,
    handleToggleAgent,
    handleFetchAgentDetail,
    handleSaveAgent,
    handleDeleteAgent,
    handleUpdateAgentOrder,
  }
}
