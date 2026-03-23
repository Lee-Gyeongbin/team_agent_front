import type { Agent } from '~/types/agent'
import { useApi } from '~/composables/com/useApi'
const { get, post } = useApi()

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
  /** 에이전트 목록 조회 */
  const fetchAgentList = async (): Promise<{ dataList: Agent[] }> => {
    return get<{ dataList: Agent[] }>('/agent/list.do')
  }

  /** 에이전트 활성화/비활성화 */
  const fetchToggleAgent = async (agentId: string, useYn: 'Y' | 'N'): Promise<void> => {
    return post('/agent/toggle.do', { agentId, useYn })
  }

  /** 에이전트 상세 조회 */
  const fetchAgentDetail = async (agent: Agent): Promise<{ data: Agent }> => {
    return post<{ data: Agent }>(`/agent/detail.do`, agent)
  }

  const fetchSaveAgent = async (agent: Partial<Agent>): Promise<{ data: Agent }> => {
    return mockPost<{ data: Agent }>(`${MOCK_BASE}/save`, agent)
  }

  const fetchDeleteAgent = async (agentId: string) => {
    return mockPost<{ data: { agentId: string } }>(`${MOCK_BASE}/delete`, { agentId })
  }

  const fetchUpdateAgentOrder = async (orderList: { agentId: string; sortOrd: number }[]) => {
    return mockPost<{ data: null }>(`${MOCK_BASE}/order`, orderList)
  }

  return {
    fetchAgentList,
    fetchToggleAgent,
    fetchAgentDetail,
    fetchSaveAgent,
    fetchDeleteAgent,
    fetchUpdateAgentOrder,
  }
}
