import type { SystemPrompt, PromptTemplate } from '~/types/prompt'

// 🔽 Mock — 백엔드 API 완성 시 useApi 패턴으로 교체
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
  // ===== 시스템 프롬프트 =====
  const fetchSystemPromptList = async () => {
    return mockPost<{ list: SystemPrompt[] }>(`${MOCK_BASE}/list`, {})
  }

  const fetchSaveSystemPrompt = async (prompt: Partial<SystemPrompt>) => {
    return mockPost<{ data: SystemPrompt }>(`${MOCK_BASE}/save`, prompt)
  }

  const fetchDeleteSystemPrompt = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  // ===== 템플릿 =====
  const fetchTemplateList = async () => {
    return mockPost<{ list: PromptTemplate[] }>(`${MOCK_BASE}/template/list`, {})
  }

  const fetchSaveTemplate = async (template: Partial<PromptTemplate>) => {
    return mockPost<{ data: PromptTemplate }>(`${MOCK_BASE}/template/save`, template)
  }

  const fetchDeleteTemplate = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/template/delete`, { id })
  }

  return {
    fetchSystemPromptList,
    fetchSaveSystemPrompt,
    fetchDeleteSystemPrompt,
    fetchTemplateList,
    fetchSaveTemplate,
    fetchDeleteTemplate,
  }
}
