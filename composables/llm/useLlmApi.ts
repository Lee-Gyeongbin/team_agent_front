import { useApi } from '~/composables/com/useApi'
import type { LlmModel, LlmProvider } from '~/types/llm'

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

  /** 모델 목록 조회 */
  const fetchLlmList = async (): Promise<{ dataList: LlmModel[] }> => {
    return get<{ dataList: LlmModel[] }>('/llm/list.do')
  }

  /** Provider 옵션 목록 조회 */
  const fetchProviderOptions = async (): Promise<{ dataList: LlmProvider[] }> => {
    return get<{ dataList: LlmProvider[] }>('/llm/provider/list.do')
  }

  /** 모델 저장 */
  const fetchSaveLlm = async (model: Partial<LlmModel>) => {
    return post<{ data: LlmModel }>(`/llm/save.do`, model)
  }

  /** 모델 삭제 */
  const fetchDeleteLlm = async (modelId: string) => {
    return post<{ data: { modelId: string } }>(`/llm/delete.do`, { modelId })
  }

  /** 모델 순서 업데이트 */
  const fetchUpdateLlmOrder = async (orderList: { modelId: string; sortOrder: number }[]) => {
    return post<{ data: null }>(`/llm/order.do`, orderList)
  }

  return {
    fetchLlmList,
    fetchProviderOptions,
    fetchSaveLlm,
    fetchDeleteLlm,
    fetchUpdateLlmOrder,
  }
}
