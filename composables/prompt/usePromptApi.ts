import type {
  SystemPrompt,
  PromptTemplate,
  PromptFilterData,
  PromptLimitData,
  PromptVersion,
  PromptVersionStats,
  ErrorMessageData,
  PromptAgent,
  PromptAppAgt,
} from '~/types/prompt'
import { useApi } from '~/composables/com/useApi'
const MOCK_BASE = '/mock/prompt'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const usePromptApi = () => {
  const { get, post } = useApi()

  /** 시스템 프롬프트 목록 조회 */
  const fetchSystemPromptList = async (): Promise<{
    dataList: SystemPrompt[]
    agentList: PromptAgent[]
    promptAppAgtList: PromptAppAgt[]
  }> => {
    return get<{ dataList: SystemPrompt[]; agentList: PromptAgent[]; promptAppAgtList: PromptAppAgt[] }>(
      `/prompt/system/list.do`,
    )
  }

  /** 시스템 프롬프트 저장 */
  const fetchSaveSystemPrompt = async (prompt: Partial<SystemPrompt>, promptAppAgtList: PromptAppAgt[]) => {
    return post<{ data: SystemPrompt }>(`/prompt/system/save.do`, { ...prompt, promptAppAgtList })
  }

  /** 시스템 프롬프트 삭제 */
  const fetchDeleteSystemPrompt = async (prompt: SystemPrompt) => {
    return post<{ data: SystemPrompt }>(`/prompt/system/delete.do`, prompt)
  }

  /** 템플릿 조회 TODO : 기획 확정 뒤 구현 필요 */
  const fetchTemplateList = async () => {
    return mockPost<{ list: PromptTemplate[] }>(`${MOCK_BASE}/template/list`, {})
  }

  const fetchSaveTemplate = async (template: Partial<PromptTemplate>) => {
    return mockPost<{ data: PromptTemplate }>(`${MOCK_BASE}/template/save`, template)
  }

  const fetchDeleteTemplate = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/template/delete`, { id })
  }

  /** 금지어/필터링 조회 */
  const fetchFilterData = async (): Promise<{ data: PromptFilterData }> => {
    return get<{ data: PromptFilterData }>(`/prompt/filter/data.do`)
  }

  /** 금지어/필터링 저장 */
  const fetchSaveFilter = async (data: Partial<PromptFilterData>) => {
    return post<{ data: PromptFilterData }>(`/prompt/filter/save.do`, data)
  }

  /** 토큰/응답 제한 조회 */
  const fetchLimitData = async (): Promise<{ data: PromptLimitData }> => {
    return get<{ data: PromptLimitData }>(`/prompt/limit/data.do`)
  }

  /** 토큰/응답 제한 저장 */
  const fetchSaveLimit = async (data: Partial<PromptLimitData>) => {
    return post<{ data: PromptLimitData }>(`/prompt/limit/save.do`, data)
  }

  // ===== 버전 관리 =====
  const fetchVersionList = async () => {
    return mockPost<{ list: PromptVersion[]; stats: PromptVersionStats }>(`${MOCK_BASE}/version/list`, {})
  }

  const fetchRestoreVersion = async (id: string) => {
    return mockPost<{ data: PromptVersion }>(`${MOCK_BASE}/version/restore`, { id })
  }

  // ===== 오류 메시지 =====
  const fetchErrorMessageData = async () => {
    return mockPost<{ data: ErrorMessageData }>(`${MOCK_BASE}/error/data`, {})
  }

  const fetchSaveErrorMessage = async (data: Partial<ErrorMessageData>) => {
    return mockPost<{ data: ErrorMessageData }>(`${MOCK_BASE}/error/save`, data)
  }

  return {
    fetchSystemPromptList,
    fetchSaveSystemPrompt,
    fetchDeleteSystemPrompt,
    fetchTemplateList,
    fetchSaveTemplate,
    fetchDeleteTemplate,
    fetchFilterData,
    fetchSaveFilter,
    fetchLimitData,
    fetchSaveLimit,
    fetchVersionList,
    fetchRestoreVersion,
    fetchErrorMessageData,
    fetchSaveErrorMessage,
  }
}
