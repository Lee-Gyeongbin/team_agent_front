/** 카테고리 한 행 (selectCategoryList WITH RECURSIVE 결과 — 평면 리스트, SORT_PATH 순) */
export interface CategoryItem {
  categoryId: string
  categoryName: string
  /** 루트는 null 또는 빈 문자열 */
  parnCatId: string | null
  catLvl: string
  sortOrd: string
  sortPath: string
  depth: string
}

/** 화면용 트리 노드 (API 행 + 자식·펼침 상태) */
export interface CategoryTreeItem extends CategoryItem {
  children?: CategoryTreeItem[]
  expanded?: boolean
}

/** 첨부 파일 항목 (UiFileUpload 등 공통 UI에서 사용) */
export interface FileItem {
  docFileId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  useYn?: string
}

/** 파일 저장소 목록/저장 — TB_DOC_FILE 행 */
export interface FileLibraryItem {
  docFileId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  categoryId?: string
  categoryName?: string
  secLvl?: string
  docDesc?: string
  keywords?: string
  docSrc?: string
  activeDsCnt?: number
  createDt?: string
  useYn?: string
  dsNm?: string
}

/** saveFileLibrary (Presigned 후 메타 저장) */
export interface FileLibrarySavePayload {
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  categoryId: string
  secLvl?: string
  docDesc?: string
  keywords?: string
  docSrc?: string
}

/** URL 항목 */
export interface UrlItem {
  id: string
  category: string
  urlAddress: string
  urlName: string
  collectionCycle: string
  lastCollectedAt: string
  active: boolean
  categoryId?: string
}
