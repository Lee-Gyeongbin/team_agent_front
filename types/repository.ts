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

export interface CategoryActionResponse {
  successYn: boolean
}

/**
 * selectDocRepositoryDetail.do 응답 — `data` 래핑 없이 루트에 문서·검색 VO 필드가 함께 내려옴
 */
export interface DocRepositoryDetailResponse {
  findContent?: string
  categoryId?: string
  categoryName?: string
  parnCatId?: string
  catLvl?: string
  sortOrd?: string
  sortPath?: string
  depth?: string
  totalCount?: string
  docId?: string
  docTitle?: string
  author?: string
  secLvl?: string
  content?: string
  fileName?: string
  filePath?: string
  fileSize?: string
  fileType?: string
  keywords?: string
  refUrl?: string
  useYn?: string
  createDt?: string
  modifyDt?: string
  dsDocCnt?: string
  docIdList?: string
  /** 백엔드 VO 잔여 필드(문자열 등) */
  file?: string
}

/** 문서 항목 */
export interface Document {
  docId: string
  docTitle: string
  categoryId: string
  categoryName: string
  author: string
  secLvl: string
  content: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  keywords: string
  refUrl: string
  useYn: string
  dsDocCnt: string
  createDt: string
  files: File[]
}

/** 중복 검사용 — (CATEGORY_ID, FILE_NAME, FILE_TYPE) 튜플 목록 */
export interface DocExistCheckItem {
  categoryId: string
  fileName: string
  fileType: string
}

/** 저장 API 업로드 완료 파일 메타 (백엔드 file 배열 요소) */
export interface DocumentSaveFileItem {
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
}

/** 문서 삭제 API docIdList 요소 — repository.deleteDocument (#{item.docId}) */
export type DocumentDeleteItem = Pick<Document, 'docId'>

/** 문서 저장 API 본문 (file: 다건) */
export interface DocumentSavePayload {
  /** 수정 시에만 전달 (신규 등록은 생략) */
  docId?: string
  docTitle: string
  categoryId: string
  author?: string
  secLvl?: string
  content?: string
  keywords?: string
  refUrl?: string
  file: DocumentSaveFileItem[]
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
