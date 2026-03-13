import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent, AgentDataset } from '~/types/agent'

const {
  fetchAgentList,
  fetchSaveAgent,
  fetchDeleteAgent,
  fetchUpdateAgentOrder,
  fetchDatasetList,
  fetchSaveDataset,
  fetchSyncDataset,
} = useAgentApi()

// ===== 상태 변수 =====
const agentList = ref<Agent[]>([])
const datasetList = ref<AgentDataset[]>([])

// ===== Agent 조회 =====
const handleSelectAgentList = async () => {
  const res = await fetchAgentList()
  agentList.value = res.list
}

// ===== Agent 추가/수정/삭제 =====
const handleSaveAgent = async (agent: Partial<Agent>) => {
  await fetchSaveAgent(agent)
  await handleSelectAgentList()
}

const handleDeleteAgent = async (id: string) => {
  await fetchDeleteAgent(id)
  await handleSelectAgentList()
}

// ===== Agent 순서 =====
const handleUpdateAgentOrder = async (orderList: { id: string; order: number }[]) => {
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

export const useAgentStore = () => {
  return {
    agentList,
    datasetList,
    handleSelectAgentList,
    handleSaveAgent,
    handleDeleteAgent,
    handleUpdateAgentOrder,
    handleSelectDatasetList,
    handleSaveDataset,
    handleSyncDataset,
  }
}
