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

/** 카테고리 정렬 순서·부모 일괄 업데이트 요청 항목 */
export interface CategoryOrderSortItem {
  categoryId: string
  categoryName: string
  parnCatId: string | null
  sortOrd: number
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

/** URL 항목 (TB_CNT_URL) */
export interface UrlItem {
  urlId: string
  urlName: string
  urlAddr: string
  categoryId: string | null
  categoryName?: string
  /** 수집 주기: DAILY / WEEKLY / MANUAL */
  crawlIntvl: string
  crawlDpth: number
  /** 사용 여부: Y / N */
  useYn: string
  lastCrawlDt: string | null
  urlCrawlStatusCd?: string | null
  /** 이 URL을 사용하는 데이터셋 수 (TB_DS_URL JOIN) */
  activeDsCnt?: number
  /** 이 URL을 사용하는 데이터셋명 목록 (콤마 구분) */
  dsNm?: string
  createDt?: string
  modifyDt?: string
}
