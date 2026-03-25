// 백엔드 FileVO 매핑 타입
export interface FileMeta {
  docId?: string
  docTitle?: string
  categoryId?: string
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
  ragUseCnt?: string
  createDt?: string
  modifyDt?: string
  // 기타 필드 확장용
  [key: string]: unknown
}

// 프론트에서 업로드 요청 시 사용하는 타입 (실제 File 객체 포함)
export interface FileUploadRequest {
  file: File
  /** 문서 제목 (매뉴얼 제목 등) */
  docTitle?: string
  /** 카테고리 ID (매뉴얼 분류 등) */
  categoryId?: string
  /** 보안등급 */
  secLvl?: string
  /** 키워드 */
  keywords?: string
}

// /com/file/uploadFile.do 응답
export interface FileUploadResponse {
  uploadUrl: string
  filePath: string
}

// /com/file/viewFile.do, /com/file/downloadFile.do 응답
export interface FileUrlResponse {
  url: string
}

// /com/file/deleteFile.do 응답 — NCP Object Storage 객체 삭제 결과
export interface FileDeleteResponse {
  successYn?: boolean
}
