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

export interface FileItem {
  docId: string
  docFileId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  fileOrder: string
  useYn: string
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
  keywords?: string
  refUrl?: string
  useYn?: string
  createDt?: string
  modifyDt?: string
  dsDocCnt?: string
  docIdList?: string
  fileList?: FileItem[]
}

/** 문서 상세 조회 API 응답 (data + fileList 분리 구조) */
export interface DocRepositoryDetailApiResponse {
  data: DocRepositoryDetailResponse
  fileList?: FileItem[]
}

/** 문서 항목 */
export interface Document {
  docId: string
  docFileId?: string
  /** 목록 API DOC_FILE_ID_LIST 파싱 결과 — 미리보기·다운로드 시 첫 ID 우선 */
  docFileIdList?: string[]
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
  fileCnt: string
  createDt: string
  files: File[]
  attachedFileList?: FileItem[]
  dsNmList?: string
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
  /** 수정 시 기존 파일 중 삭제할 대상 docFileId 목록 */
  deleteFileIds?: string[]
  file: DocumentSaveFileItem[]
  /** 파일 저장소(DOC_ID 미할당) 행을 문서에 연결할 DOC_FILE_ID 목록 */
  linkDocFileIds?: string[]
  /** 문서 첨부 최종 순서 (DOC_FILE_ID 배열, 선택) */
  orderedDocFileIds?: string[]
}

/** 파일 저장소 목록/저장 — tb_doc_file DOC_ID 미할당 행 */
export interface FileLibraryItem {
  docFileId: string
  docId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  /** 파일이 연결된 문서셋 경로 목록 (예: 카테고리 > 문서셋명, ... ) */
  dsNmList?: string
  categoryId?: string
  categoryName?: string
  createDt?: string
  useYn?: string
}

/** saveFileLibrary (Presigned 후 메타 저장) */
export interface FileLibrarySavePayload {
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  categoryId?: string
  /** 선택 시 파일 저장과 동시에 문서셋 매핑할 DOC_ID */
  docId?: string
  categoryName?: string
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
