import type { ActionResponse } from '~/types/global'
import type {
  CategoryItem,
  DocExistCheckItem,
  DocRepositoryDetailApiResponse,
  Document,
  DocumentDeleteItem,
  DocumentSavePayload,
  FileLibraryItem,
  FileLibrarySavePayload,
  UrlItem,
} from '~/types/repository'
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

  // ===== 문서 =====
  const fetchDocumentList = async (
    findContent?: string,
    categoryId?: string,
    useYn?: string,
    page?: number,
    pageSize?: number,
  ) => {
    return post<{ dataList: Document[]; totalCnt: number }>('/repository/selectDocRepositoryList.do', {
      findContent,
      categoryId,
      useYn,
      page,
      pageSize,
    })
  }

  const fetchSelectDocumentExistCnt = async (categoryId: string, docTitle: string) => {
    return post<{ data: number }>('/repository/selectDocumentExistCnt.do', { categoryId, docTitle })
  }

  /** 문서 상세 — docId 기준, 응답은 { data, fileList } 구조 */
  const fetchSelectDocRepositoryDetail = async (docId: string) => {
    return post<DocRepositoryDetailApiResponse>('/repository/selectDocRepositoryDetail.do', { docId })
  }

  /** TB_DOC (CATEGORY_ID, FILE_NAME, FILE_TYPE) IN 조건 건수 — selectDocExistCnt */
  const fetchSelectDocExistCnt = async (docIdList: DocExistCheckItem[]) => {
    return post<{ data: number }>('/repository/selectDocExistCnt.do', { docIdList })
  }

  /**
   * 문서 파일 presigned URL 발급 (NCP PUT)
   * - 실제 바이너리 업로드는 호출부에서 `uploadUrl`로 PUT.
   * - 백엔드 FileVO: `storeFilePath` = S3 객체 키(필수), `fileName`/`fileType`/`fileSize` 등 메타.
   */
  const fetchSaveDocumentFile = async (
    meta: Pick<FileMeta, 'fileName' | 'fileType' | 'fileSize'> & Pick<FileMeta, 'storeFilePath'> & Partial<FileMeta>,
  ) => {
    return post<FileUploadResponse>('/repository/saveDocumentFile.do', meta)
  }

  /** 문서 저장 (DB) — file 은 업로드 완료 메타 배열 */
  const fetchSaveDocument = async (data: DocumentSavePayload): Promise<ActionResponse> => {
    return unwrapData<ActionResponse>(await post<{ data: ActionResponse }>('/repository/saveDocument.do', data))
  }

  /**
   * 문서 삭제 — RepositoryVO.docIdList: { docId } 객체 배열 (MyBatis #{item.docId})
   * JSON 예: `{ "docIdList": [ { "docId": "DOC001" } ] }`
   * 백엔드 400 시: VO가 `List<String>`이면 Jackson 역직렬화 실패 → `List<DocIdBean>` 등 객체 리스트로 변경
   */
  const fetchDeleteDocument = async (docIdList: DocumentDeleteItem[]) => {
    return post<{ data: number }>('/repository/deleteDocument.do', { docIdList })
  }

  /** 파일 관리 탭 — 풀(DOC_ID IS NULL) 목록 */
  const fetchSelectDocFileLibraryList = async (params: {
    categoryId?: string
    findContent?: string
    page?: number
    pageSize?: number
  }) => {
    return post<{ dataList: FileLibraryItem[]; totalCnt: number }>('/repository/selectDocFileLibraryList.do', params)
  }

  /** 파일 관리 탭 — 업로드 완료 후 TB_DOC_FILE 풀 INSERT */
  const fetchSaveFileLibrary = async (data: FileLibrarySavePayload) => {
    return post<{ successYn: boolean; returnMsg?: string; docFileId?: string }>('/repository/saveFileLibrary.do', data)
  }

  const fetchDeleteFileLibrary = async (docFileId: string) => {
    return post<{ successYn: boolean; returnMsg?: string }>('/repository/deleteFileLibrary.do', { docFileId })
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
    fetchSelectDocExistCnt,
    fetchSaveCategory,
    fetchRenameCategory,
    fetchDeleteCategory,
    fetchDocumentList,
    fetchSelectDocRepositoryDetail,
    fetchSaveDocument,
    fetchSaveDocumentFile,
    fetchDeleteDocument,
    fetchUrlList,
    fetchSaveUrl,
    fetchDeleteUrl,
    fetchToggleUrlStatus,
    fetchSelectDocumentExistCnt,
    fetchSelectDocFileLibraryList,
    /** @deprecated 이름 통일용 별칭 — `fetchSelectDocFileLibraryList` 와 동일 */
    fetchFileLibraryList: fetchSelectDocFileLibraryList,
    fetchSaveFileLibrary,
    fetchDeleteFileLibrary,
  }
}
