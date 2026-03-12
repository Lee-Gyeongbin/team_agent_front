import type { Agent, AgentDataset } from '~/types/agent'

// 🔽 Mock API — 백엔드 API 완성 시 useApi 패턴으로 교체
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
  // TODO: Agent 목록 조회
  const fetchAgentList = async (): Promise<{ list: Agent[] }> => {
    return mockPost<{ list: Agent[] }>(`${MOCK_BASE}/list`, {})
  }

  // TODO: Agent 추가/수정
  const fetchSaveAgent = async (): Promise<{ list: Agent[] }> => {
    return mockPost<{ data: Agent }>(`${MOCK_BASE}/save}`, agent)
  }

  // TODO: Agent 삭제
  // URL: /delete, 파라미터: id, 리턴: { data: { id: string } }
  const fetchDeleteAgent = async () => {}

  // TODO: Agent 순서 변경
  // URL: /order, 파라미터: orderList 배열, 리턴: { data: null }
  const fetchUpdateAgentOrder = async () => {}

  // TODO: 데이터셋 목록 조회
  // URL: /dataset/list, 파라미터: agentId, 리턴: { list: AgentDataset[] }
  const fetchDatasetList = async () => {}

  // TODO: 데이터셋 추가/수정
  // URL: /dataset/save, 파라미터: dataset 객체, 리턴: { data: AgentDataset }
  const fetchSaveDataset = async () => {}

  // TODO: 데이터셋 동기화
  // URL: /dataset/sync, 파라미터: id, 리턴: { data: { id: string }; message: string }
  const fetchSyncDataset = async () => {}

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
