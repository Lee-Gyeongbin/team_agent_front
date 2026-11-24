import type { TableColumn } from '~/types/table'

/** 구분 코드 중 에이전트 선택이 필요한 값 (공통코드 ID000002, 백엔드 TYPE_CD_AGENT와 동일) */
export const IDEA_TYPE_CD_AGENT = '001'

export const IDEA_TEXT_MAX_LENGTH = 8_000

/** 첨부파일 1개당 최대 크기 (20MB) */
export const IDEA_FILE_MAX_SIZE = 20 * 1024 * 1024
export const IDEA_FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.csv,.txt'

/** 공통코드 항목 (구분) */
export interface IdeaCode {
  codeId: string
  codeNm: string
}

/** 에이전트 선택 항목 (TB_AGT, USE_YN = 'Y') */
export interface IdeaAgent {
  agentId: string
  agentNm: string
}

/** 첨부파일 — 저장된 파일은 ideaFileId, 새로 고른 파일은 file 원본을 가짐 */
export interface IdeaFile {
  ideaFileId?: string
  fileNm: string
  fileSize: number
  file?: File
}

/** 목록 항목 (TB_IDEA) */
export interface IdeaListItem {
  ideaId: string
  /** 화면 번호 (최신 글이 큰 번호) */
  rowNo?: number
  ideaTypeCd: string
  /** 화면에서 공통코드로 채움 (getIdeaCodeNames) */
  ideaTypeNm: string
  agentId: string | null
  agentNm: string | null
  title: string
  likeCnt: number
  createId: string
  createNm: string
  createDt: string
}

/** 상세 */
export interface IdeaDetail extends IdeaListItem {
  /** 서식 에디터 HTML */
  content: string
  likedYn: 'Y' | 'N'
  fileList: IdeaFile[]
}

/** 목록 조회 조건 */
export interface IdeaSearchParams {
  searchKeyword: string
  searchTypeCd: string
  pageIndex: number
}

export interface IdeaListResponse {
  dataList: IdeaListItem[]
  totalCnt: number
}

/** 공통 응답 — result가 FAIL이면 msg에 사유 */
export interface IdeaResult<T = undefined> {
  result: 'SUCCESS' | 'FAIL'
  msg?: string
  data?: T
}

/** 등록·수정 입력값 */
export interface IdeaFormData {
  ideaId: string | null
  ideaTypeCd: string
  agentId: string
  title: string
  /** 서식 에디터 HTML */
  content: string
  /** 저장된 파일 + 새로 고른 파일 */
  files: IdeaFile[]
  /** 수정 시 목록에서 뺀 저장 파일 ID */
  deleteFileIds: string[]
}

export const ideaColumns: TableColumn[] = [
  { key: 'rowNo', label: '번호', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'ideaTypeNm', label: '구분', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'title', label: '제목', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'createNm', label: '작성자', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'likeCnt', label: '추천', width: '88px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
]
