import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent } from '~/types/agent'

const { fetchAgentList, fetchSaveAgent, fetchAgentDetail, fetchDeleteAgent, fetchToggleAgent, fetchUpdateAgentOrder } =
  useAgentApi()

const agentList = ref<Agent[]>([])
/** 에이전트 상세 모달 */
const isSettingOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

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
    isSettingOpen.value = true
  } catch {
    openToast({
      message: '에이전트 상세 조회 실패',
      type: 'error',
    })
  }
}

const handleSaveAgent = async (agent: Partial<Agent>) => {
  await fetchSaveAgent(agent)
  await handleSelectAgentList()
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
    handleSelectAgentList,
    handleToggleAgent,
    handleFetchAgentDetail,
    handleSaveAgent,
    handleDeleteAgent,
    handleUpdateAgentOrder,
  }
}
