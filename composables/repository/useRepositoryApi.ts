import type { ActionResponse } from '~/types/global'
import type { CategoryItem, FileLibraryItem, FileLibrarySavePayload, UrlItem } from '~/types/repository'
import type { FileMeta, FileUploadResponse } from '~/types/file'

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
  const { post } = useApi()
  /**
   * 백엔드 응답이 `{ returnMsg, successYn, data: {...} }` 형태일 때,
   * 프론트에서는 `data`만 사용하도록 정리.
   */
  const unwrapData = <T>(res: unknown): T => {
    const maybe = res as { data?: T }
    return maybe?.data ?? (res as T)
  }
  // ===== 카테고리 =====
  const fetchCategoryList = async () => {
    return post<{ dataList: CategoryItem[] }>('/repository/selectCategoryList.do', {})
  }

  const fetchSaveCategory = async (data: {
    categoryId?: string
    categoryName: string
    parnCatId?: string | null
  }): Promise<ActionResponse> => {
    return unwrapData(await post<{ data: ActionResponse }>('/repository/saveCategory.do', data))
  }

  const fetchRenameCategory = async (categoryId: string, categoryName: string): Promise<ActionResponse> => {
    return unwrapData(
      await post<{ data: ActionResponse }>('/repository/renameCategory.do', { categoryId, categoryName }),
    )
  }

  const fetchDeleteCategory = async (categoryId: string): Promise<ActionResponse> => {
    return post<ActionResponse>('/repository/deleteCategory.do', { categoryId })
  }

  // ===== 파일 =====

  /**
   * 파일 presigned URL 발급 (NCP PUT)
   */
  const fetchSaveDocumentFile = async (
    meta: Pick<FileMeta, 'fileName' | 'fileType' | 'fileSize'> & Pick<FileMeta, 'storeFilePath'> & Partial<FileMeta>,
  ) => {
    return post<FileUploadResponse>('/repository/saveDocumentFile.do', meta)
  }

  /** 파일 관리 탭 — 파일 목록 */
  const fetchSelectDocFileLibraryList = async (params: {
    categoryId?: string
    findContent?: string
    useYn?: 'Y' | 'N'
    page?: number
    pageSize?: number
  }) => {
    return post<{ dataList: FileLibraryItem[]; totalCnt: number }>('/repository/selectDocFileLibraryList.do', params)
  }

  /** 파일 관리 탭 — 업로드 완료 후 TB_DOC_FILE INSERT (배치) */
  const fetchSaveFileLibraryBatch = async (dataList: FileLibrarySavePayload[]) => {
    return post<{ successYn: boolean; returnMsg?: string; successCnt?: number }>('/repository/saveFileLibrary.do', {
      dataList,
    })
  }

  const fetchUpdateFileLibrary = async (data: {
    docFileId: string
    categoryId: string
    secLvl?: string
    docDesc?: string
    keywords?: string
    docSrc?: string
    useYn?: 'Y' | 'N'
  }) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/updateFileLibrary.do', data)
  }

  const fetchDeleteFileLibrary = async (docFileIdList: string[]) => {
    return post<{ successYn: boolean; returnMsg?: string; blockedFileNames?: string[] }>(
      '/repository/deleteFileLibrary.do',
      {
        docFileIdList,
      },
    )
  }

  /** 파일 관리 탭 — 선택 파일 배치 삭제 처리(서버에서 USE_YN='N' 반영) */
  const fetchSaveUseYnN = async (docFileIdList: string[]) => {
    return post<{ successYn: boolean; returnMsg?: string; successCnt?: number; blockedFileNames?: string[] }>(
      '/repository/saveUseYnN.do',
      { docFileIdList },
    )
  }

  // ===== URL =====
  const fetchUrlList = async (params: {
    keyword?: string
    status?: string
    category?: string
    page?: number
    pageSize?: number
  }) => {
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
    fetchSaveDocumentFile,
    fetchUrlList,
    fetchSaveUrl,
    fetchDeleteUrl,
    fetchToggleUrlStatus,
    fetchSelectDocFileLibraryList,
    /** @deprecated 이름 통일용 별칭 — `fetchSelectDocFileLibraryList` 와 동일 */
    fetchFileLibraryList: fetchSelectDocFileLibraryList,
    fetchSaveFileLibraryBatch,
    fetchUpdateFileLibrary,
    fetchDeleteFileLibrary,
    fetchSaveUseYnN,
  }
}
