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
} = useAgentApi() // API 함수 가져오기

const agentList = ref<Agent[]>([]) // 빈 배열
const datasetList = ref<AgentDataset[]>([]) // 빈 배열

// Agent 목록 조회
const handleSelectAgentList = async () => {
  const res = await fetchAgentList() // API 호출
  agentList.value = res.list // 결과 저장
}

// Agent 추가/수정
const handleSaveAgent = async (agent: Partial<Agent>) => {
  await fetchSaveAgent(agent) // API 호출
  await handleSelectAgentList() // 저장 후 목록 다시 조회
}

// Agent 삭제
const handleDeleteAgent = async (id: string) => {
  await fetchDeleteAgent(id) // API 호출
  await handleSelectAgentList() // 삭제 후 목록 다시 조회
}

// Agent 순서 변경
const handleUpdateAgentOrder = async (orderList: { id: string; order: number }[]) => {
  await fetchUpdateAgentOrder(orderList) // API 호출
  await handleSelectAgentList() // 순서 변경 후 목록 다시 조회
}

// 데이터셋 목록 조회
const handleSelectDatasetList = async (agentId: string) => {
  const res = await fetchDatasetList(agentId) // API 호출
  datasetList.value = res.list // 결과 저장
}

// 데이터셋 추가/수정
const handleSaveDataset = async (dataset: Partial<AgentDataset>) => {
  await fetchSaveDataset(dataset) // API 호출
  await handleSelectDatasetList(dataset.agentId ?? '') // 추가/수정 후 목록 다시 조회
}

// 데이터셋 동기화
const handleSyncDataset = async (id: string) => {
  await fetchSyncDataset(id) // API 호출
  await handleSelectDatasetList(id) // 동기화 후 목록 다시 조회
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
