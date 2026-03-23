import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent, AgentDataset } from '~/types/agent'

const {
  fetchAgentList,
  fetchSaveAgent,
  fetchDeleteAgent,
  fetchToggleAgent,
  fetchUpdateAgentOrder,
  fetchDatasetList,
  fetchSaveDataset,
  fetchSyncDataset,
  fetchUpdateDatasetOrder,
} = useAgentApi()

// ===== 상태 변수 =====
const agentList = ref<Agent[]>([])
const datasetList = ref<AgentDataset[]>([])

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

/** 에이전트 추가/수정 */
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

// ===== Dataset 조회 =====
const handleSelectDatasetList = async (agentId: string) => {
  const res = await fetchDatasetList(agentId)
  datasetList.value = res.list
}

// ===== Dataset 추가/수정/동기화 =====
const handleSaveDataset = async (agentId: string, dataset: Partial<AgentDataset>) => {
  await fetchSaveDataset(dataset)
  await handleSelectDatasetList(agentId)
}

const handleSyncDataset = async (agentId: string, id: string) => {
  await fetchSyncDataset(id)
  await handleSelectDatasetList(agentId)
}

// ===== Dataset 순서 =====
const handleUpdateDatasetOrder = async (orderList: { id: string; order: number }[]) => {
  await fetchUpdateDatasetOrder(orderList)
}

export const useAgentStore = () => {
  return {
    agentList,
    datasetList,
    handleSelectAgentList,
    handleToggleAgent,
    handleSaveAgent,
    handleDeleteAgent,
    handleUpdateAgentOrder,
    handleSelectDatasetList,
    handleSaveDataset,
    handleSyncDataset,
    handleUpdateDatasetOrder,
  }
}
