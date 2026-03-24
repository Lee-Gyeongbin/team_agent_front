import type { Agent, AgtDm, AgtDs } from '~/types/agent'
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

  /** 모델 옵션 조회 */
  const fetchModelOptions = async (): Promise<{ dataList: { modelId: string; modelName: string }[] }> => {
    return get<{ dataList: { modelId: string; modelName: string }[] }>('/agent/modelList.do')
  }

  /** 에이전트 활성화/비활성화 */
  const fetchToggleAgent = async (agentId: string, useYn: 'Y' | 'N'): Promise<void> => {
    return post('/agent/toggle.do', { agentId, useYn })
  }

  /** 에이전트 상세 조회 */
  const fetchAgentDetail = async (agent: Agent): Promise<{ data: Agent }> => {
    return post<{ data: Agent }>(`/agent/detail.do`, agent)
  }

  /** 에이전트 상세 데이터 목록 조회 */
  const fetchAgentDetailDataList = async (agent: Agent): Promise<{ dataList: AgtDs[] | AgtDm[] }> => {
    return post<{ dataList: AgtDs[] | AgtDm[] }>(`/agent/detailDataList.do`, agent)
  }

  /** 에이전트 저장 */
  const fetchSaveAgent = async (agent: Partial<Agent>): Promise<{ data: Agent }> => {
    return post<{ data: Agent }>('/agent/save.do', agent)
  }

  /** 에이전트 삭제 */
  const fetchDeleteAgent = async (agent: Agent): Promise<void> => {
    return post(`/agent/delete.do`, agent)
  }

  /** 에이전트 순서 변경 */
  const fetchUpdateAgentOrder = async (orderList: { agentId: string; sortOrd: number }[]): Promise<{ data: null }> => {
    return post<{ data: null }>(`/agent/order.do`, orderList)
  }

  return {
    fetchAgentList,
    fetchModelOptions,
    fetchToggleAgent,
    fetchAgentDetail,
    fetchAgentDetailDataList,
    fetchSaveAgent,
    fetchDeleteAgent,
    fetchUpdateAgentOrder,
  }
}
