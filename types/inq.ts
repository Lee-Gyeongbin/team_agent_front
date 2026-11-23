import type { ChatFileViewResponse } from '~/types/chat'
import type { TableColumn } from '~/types/table'

/** 문의사항 응답 공통 (successYn / returnMsg) */
export interface InqResponse {
  successYn: boolean
  returnMsg: string
  errorCode?: string
}

/** 문의사항 목록 행 [TB_INQ] */
export interface InqRow {
  inqId: string
  title: string
  catCd: string
  catNm: string
  agentId: string | null
  agentNm: string | null
  statusCd: string
  statusNm: string
  secretYn: 'Y' | 'N'
  crtrId: string
  crtrNm: string
  createDt: string
  answerYn: 'Y' | 'N'
  maskedYn?: 'Y' | 'N'
}

/** 문의사항 상세 */
export interface InqItem extends InqRow {
  content: string | null
  modifyDt: string
}

/** 문의 답변·댓글 [TB_INQ_ANSR] */
export interface InqAnsr {
  ansrId: string
  inqId: string
  upAnsrId: string | null
  content: string
  ansrUserId: string
  ansrUserNm: string
  depth: number
  sortOrd: number
  createDt: string
  modifyDt: string
}

/** 문의 첨부파일 [TB_INQ_FILE] */
export interface InqFile {
  inqFileId: string
  inqId: string
  filePath: string
  fileNm: string
  fileSize: number
  fileType: string | null
}

/** 목록·엑셀 조회 조건 */
export interface InqSearchParams {
  searchKeyword?: string
  catCd?: string
  statusCd?: string
}

export interface InqListResponse extends InqResponse {
  dataList: InqRow[]
  totalCnt: number
}

export interface InqDetailResponse extends InqResponse {
  data: InqItem
  files: InqFile[]
  answers: InqAnsr[]
}

/** 등록·수정 폼 */
export interface InqFormData {
  inqId: string
  catCd: string
  agentId: string
  title: string
  content: string
  secretYn: 'Y' | 'N'
}

/** 저장 요청에 담는 새 첨부파일 메타 (업로드 완료 후) */
export interface InqFileSavePayload {
  filePath: string
  fileNm: string
  fileSize: number
  fileType: string
}

/** 답글 등록/수정 요청 — ansrId 가 있으면 수정, 없으면 upAnsrId 에 대한 답글(upAnsrId 도 없으면 관리자 답변) 등록 */
export interface InqAnsrSavePayload {
  inqId: string
  ansrId?: string
  upAnsrId?: string
  content: string
}

export interface InqSavePayload extends InqFormData {
  files: InqFileSavePayload[]
  removeFileIds: string[]
}

export interface InqFileUploadUrlResponse extends InqResponse {
  uploadUrl: string
  filePath: string
}

export interface InqFileDownloadResponse extends InqResponse {
  url?: string
}

/** 첨부파일 미리보기 응답 — 파일 서비스 뷰 응답(viewType·url 등)과 같은 키 */
export interface InqFilePreviewResponse extends InqResponse, ChatFileViewResponse {}

/** 답변·댓글 입력창 상태 — reply: targetId=부모 답변 ID / edit: targetId=수정 대상 답변 ID */
export type InqComposerMode = 'new' | 'reply' | 'edit'

export interface InqComposer {
  mode: InqComposerMode
  targetId: string
  text: string
}

/** 공통코드 한 건 — flag 는 서버가 지정하는 처리상태 배지 구분값 */
export interface InqCodeItem {
  codeId: string
  codeNm: string
  flag: string | null
}

/**
 * 문의하기 화면 공통 정보 — 서버가 공통코드와 정책값을 내려준다
 * (코드 ID·그룹 ID·페이지 크기·답변 단계를 화면에 하드코딩하지 않는다)
 */
export interface InqCodeInfoResponse extends InqResponse {
  catList: InqCodeItem[]
  statusList: InqCodeItem[]
  /** 에이전트 구분의 코드 ID (에이전트 선택을 받는 구분) */
  agentCatCd: string | null
  /** 답변전 처리상태의 코드 ID (관리자가 직접 고를 수 없음) */
  waitingStatusCd: string | null
  /** 목록 한 페이지 건수 */
  pageSize: number
  /** 답변·댓글 최대 단계 */
  ansrMaxDepth: number
}

/** 처리상태 배지 구분값 → 배지 색 — 구분값이 없거나 WAITING 이면 기본색 */
export const INQ_STATUS_FLAG_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  DONE: 'success',
  PROCESSING: 'warning',
  REJECTED: 'danger',
}

/** 목록 컬럼 (문의하기 / 문의하기 관리 공통) */
export const inqColumns: TableColumn[] = [
  { key: 'inqId', label: '번호', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'catNm', label: '구분', width: '130px', align: 'center', headerAlign: 'center' },
  { key: 'title', label: '제목', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'crtrNm', label: '작성자', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '130px', align: 'center', headerAlign: 'center' },
  { key: 'statusNm', label: '처리상태', width: '110px', align: 'center', headerAlign: 'center' },
]

/** 제목 최대 글자 수 (TB_INQ.TITLE varchar(300)) */
export const INQ_TITLE_MAX_LENGTH = 300

/** 첨부파일 정책 — 파일당 최대 크기와 허용 확장자 (서버는 검증하지 않는다) */
export const INQ_FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'hwp',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
]
export const INQ_FILE_ACCEPT = INQ_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(',')
export const INQ_FILE_MAX_SIZE = 50 * 1024 * 1024

/** 화면 경로(TB_MENU.SRC_PATH) — 메뉴 기능 권한 확인 기준 */
export const INQ_MENU_PATH = '/inq'
export const INQ_MANAGE_MENU_PATH = '/inq-manage'

/** 첨부파일 스토리지 키 루트 — 서버는 inq/{userId}/ 아래 키만 허용한다 */
export const INQ_UPLOAD_ROOT = 'inq'
