import type { Agent, AgentDataset } from '~/types/agent'

// Mock API — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/agent'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useAgentApi = () => {
  // Agent 목록 조회
  const fetchAgentList = async (): Promise<{ list: Agent[] }> => {
    return mockPost<{ list: Agent[] }>(`${MOCK_BASE}/list`, {})
  }

  // Agent 추가/수정
  const fetchSaveAgent = async (agent: Partial<Agent>): Promise<{ data: Agent }> => {
    return mockPost<{ data: Agent }>(`${MOCK_BASE}/save`, agent)
  }

  // Agent 삭제
  const fetchDeleteAgent = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  // Agent 순서 변경
  const fetchUpdateAgentOrder = async (orderList: { id: string; order: number }[]) => {
    return mockPost<{ data: null }>(`${MOCK_BASE}/order`, orderList)
  }

  // 데이터셋 목록 조회
  const fetchDatasetList = async (agentId: string) => {
    return mockPost<{ list: AgentDataset[] }>(`${MOCK_BASE}/dataset/list`, { agentId })
  }

  // 데이터셋 추가/수정
  const fetchSaveDataset = async (dataset: Partial<AgentDataset>) => {
    return mockPost<{ data: AgentDataset }>(`${MOCK_BASE}/dataset/save`, dataset)
  }

  // 데이터셋 동기화
  const fetchSyncDataset = async (id: string) => {
    return mockPost<{ data: { id: string }; message: string }>(`${MOCK_BASE}/dataset/sync`, { id })
  }

  return {
    fetchAgentList,
    fetchSaveAgent,
    fetchDeleteAgent,
    fetchUpdateAgentOrder,
    fetchDatasetList,
    fetchSaveDataset,
    fetchSyncDataset,
  }
}
