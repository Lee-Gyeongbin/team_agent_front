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

// /com/file/viewFile.do 응답
export interface FileUrlResponse {
  url: string
  reason: string
}

// /com/file/downloadFile.do 응답 항목 (docFileId 미지정 시 다건)
export interface FileDownloadItem {
  docFileId: string
  fileName: string
  url: string
}

// /com/file/downloadFile.do 응답
export interface FileDownloadResponse {
  url?: string
  downloadList?: FileDownloadItem[]
}

// /com/file/deleteFile.do 응답 — NCP Object Storage 객체 삭제 결과
export interface FileDeleteResponse {
  successYn?: boolean
}

/** 첨부 파일 선택 (복수 첨부 시 FilePreviewModal 셀렉트) */
export interface FilePreviewDocFileOption {
  label: string
  value: string
}

/** FilePreviewModal — PDF 미리보기 팝업 (viewFile.do presigned URL) */
export interface FilePreviewModalProps {
  isOpen: boolean
  docId: string
  docFileId: string
  /** 모달 헤더 제목 (미지정 시 기본 문구) */
  title?: string
  /** PDF 로드 후 이동할 페이지 (1부터) */
  initialPage?: number
  /** 2개 이상이면 상단에 파일 선택 표시 */
  docFileOptions?: FilePreviewDocFileOption[]
}
