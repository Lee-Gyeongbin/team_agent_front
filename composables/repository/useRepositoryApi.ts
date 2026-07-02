import type { ActionResponse } from '~/types/global'
import type {
  CategoryItem,
  CategoryOrderSortItem,
  FileLibraryItem,
  FileLibrarySavePayload,
  UrlItem,
} from '~/types/repository'
import type { FileMeta, FileUploadResponse } from '~/types/file'

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

  /** 카테고리 순서·부모 일괄 변경 (드래그 정렬 + 부모 변경) */
  const fetchUpdateCategoryOrder = async (items: CategoryOrderSortItem[]): Promise<void> => {
    await post('/repository/updateCategoryOrder.do', { dataList: items })
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
    /** true: URL_ID IS NOT NULL (URL탭 수집 파일), 미전달: URL_ID IS NULL (파일탭) */
    urlIdNotNull?: boolean
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
    findContent?: string
    useYn?: string
    categoryId?: string
    page?: number
    pageSize?: number
  }) => {
    return post<{ dataList: UrlItem[]; totalCnt: number }>('/repository/selectUrlList.do', params)
  }

  const fetchSaveUrl = async (data: Partial<UrlItem>) => {
    return post<{ successYn: boolean; returnMsg?: string; urlId?: string }>('/repository/saveUrl.do', data)
  }

  const fetchDeleteUrl = async (urlIdList: string[]) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/deleteUrl.do', { urlIdList })
  }

  const fetchUpdateUrl = async (data: Partial<UrlItem>) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/updateUrl.do', data)
  }

  const fetchToggleUrlStatus = async (urlId: string, useYn: string) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/updateUrlUseYn.do', { urlId, useYn })
  }

  const fetchBatchScraping = async () => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/batchScraping.do', {})
  }

  const fetchSelectedScraping = async (urlIdList: string[]) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/batchScraping.do', { urlIdList })
  }

  return {
    fetchCategoryList,
    fetchSaveCategory,
    fetchRenameCategory,
    fetchDeleteCategory,
    fetchUpdateCategoryOrder,
    fetchSaveDocumentFile,
    fetchUrlList,
    fetchSaveUrl,
    fetchUpdateUrl,
    fetchDeleteUrl,
    fetchToggleUrlStatus,
    fetchBatchScraping,
    fetchSelectedScraping,
    fetchSelectDocFileLibraryList,
    /** @deprecated 이름 통일용 별칭 — `fetchSelectDocFileLibraryList` 와 동일 */
    fetchFileLibraryList: fetchSelectDocFileLibraryList,
    fetchSaveFileLibraryBatch,
    fetchUpdateFileLibrary,
    fetchDeleteFileLibrary,
    fetchSaveUseYnN,
  }
}
