import type { CategoryItem, Document, UrlItem } from '~/types/repository'

// 🔽 Mock — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/repository'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useRepositoryApi = () => {
  // ===== 카테고리 =====
  const fetchCategoryList = async () => {
    return mockPost<{ list: CategoryItem[] }>(`${MOCK_BASE}/category/list`, {})
  }

  const fetchSaveCategory = async (data: { id?: string; name: string; parentId?: string | null }) => {
    return mockPost<{ data: CategoryItem }>(`${MOCK_BASE}/category/save`, data)
  }

  const fetchRenameCategory = async (id: string, name: string) => {
    return mockPost<{ data: CategoryItem }>(`${MOCK_BASE}/category/rename`, { id, name })
  }

  const fetchDeleteCategory = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/category/delete`, { id })
  }

  // ===== 문서 =====
  const fetchDocumentList = async (params: { keyword?: string; status?: string; categoryIds?: string[]; page?: number; pageSize?: number }) => {
    return mockPost<{ list: Document[]; total: number }>(`${MOCK_BASE}/document/list`, params)
  }

  const fetchDeleteDocument = async (ids: string[]) => {
    return mockPost<{ data: { ids: string[] } }>(`${MOCK_BASE}/document/delete`, { ids })
  }

  // ===== URL =====
  const fetchUrlList = async (params: { keyword?: string; status?: string; category?: string; page?: number; pageSize?: number }) => {
    return mockPost<{ list: UrlItem[]; total: number }>(`${MOCK_BASE}/url/list`, params)
  }

  const fetchSaveUrl = async (data: Partial<UrlItem>) => {
    return mockPost<{ data: UrlItem }>(`${MOCK_BASE}/url/save`, data)
  }

  const fetchDeleteUrl = async (ids: string[]) => {
    return mockPost<{ data: { ids: string[] } }>(`${MOCK_BASE}/url/delete`, { ids })
  }

  const fetchToggleUrlStatus = async (id: string, active: boolean) => {
    return mockPost<{ data: UrlItem }>(`${MOCK_BASE}/url/toggle-status`, { id, active })
  }

  return {
    fetchCategoryList,
    fetchSaveCategory,
    fetchRenameCategory,
    fetchDeleteCategory,
    fetchDocumentList,
    fetchDeleteDocument,
    fetchUrlList,
    fetchSaveUrl,
    fetchDeleteUrl,
    fetchToggleUrlStatus,
  }
}
