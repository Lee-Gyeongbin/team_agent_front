import type { LlmModel } from '~/types/llm'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// Mock API — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/llm'

export const useLlmApi = () => {
  // LLM 모델 목록 조회
  const fetchLlmList = async (): Promise<{ list: LlmModel[] }> => {
    return mockPost<{ list: LlmModel[] }>(`${MOCK_BASE}/list`, {})
  }

  // LLM 모델 추가/수정
  const fetchSaveLlm = async (model: Partial<LlmModel>) => {
    return mockPost<{ data: LlmModel }>(`${MOCK_BASE}/save`, model)
  }

  // LLM 모델 삭제
  const fetchDeleteLlm = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  // LLM 모델 순서 변경
  const fetchUpdateLlmOrder = async (orderList: { id: string; order: number }[]) => {
    return mockPost<{ data: null }>(`${MOCK_BASE}/order`, orderList)
  }

  return {
    fetchLlmList,
    fetchSaveLlm,
    fetchDeleteLlm,
    fetchUpdateLlmOrder,
  }
}
