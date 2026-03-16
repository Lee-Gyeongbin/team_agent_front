import { useApi } from '~/composables/com/useApi'
import type { LlmModel } from '~/types/llm'

// Mock API — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/llm'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useLlmApi = () => {
  const { get, post } = useApi()

  // ===== LLM 모델 =====
  const fetchLlmList = async (): Promise<{ dataList: LlmModel[] }> => {
    return get<{ dataList: LlmModel[] }>('/llm/list.do')
  }

  const fetchSaveLlm = async (model: Partial<LlmModel>) => {
    return mockPost<{ data: LlmModel }>(`${MOCK_BASE}/save`, model)
  }

  const fetchDeleteLlm = async (modelId: string) => {
    return mockPost<{ data: { modelId: string } }>(`${MOCK_BASE}/delete`, { modelId })
  }

  const fetchUpdateLlmOrder = async (orderList: { modelId: string; sortOrder: number }[]) => {
    return mockPost<{ data: null }>(`${MOCK_BASE}/order`, orderList)
  }

  return {
    fetchLlmList,
    fetchSaveLlm,
    fetchDeleteLlm,
    fetchUpdateLlmOrder,
  }
}
