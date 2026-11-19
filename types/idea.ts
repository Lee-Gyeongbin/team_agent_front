import type { TableColumn } from '~/types/table'

/** 구분 코드 중 에이전트 선택이 필요한 값 (공통코드 ID000002, 백엔드 TYPE_CD_AGENT와 동일) */
export const IDEA_TYPE_CD_AGENT = '001'

/** 진행상태 코드별 UiBadge variant (공통코드 ID000001) — 등록되지 않은 코드는 default */
export const IDEA_STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  '001': 'default', // 검토중
  '002': 'info', // 채택
  '003': 'success', // 반영완료
  '004': 'warning', // 보류
}
export const getIdeaStatusVariant = (statusCd?: string) => IDEA_STATUS_VARIANT[statusCd ?? ''] ?? 'default'

export const IDEA_TEXT_MAX_LENGTH = 8_000

/** 첨부파일 1개당 최대 크기 (20MB) */
export const IDEA_FILE_MAX_SIZE = 20 * 1024 * 1024
export const IDEA_FILE_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.csv,.txt'

/** 공통코드 항목 (구분·진행상태) */
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
  statusCd: string
  /** 화면에서 공통코드로 채움 (getIdeaCodeNames) */
  statusNm: string
  likeCnt: number
  /** 관리자 코멘트 존재 여부 */
  cmtYn: 'Y' | 'N'
  createId: string
  createNm: string
  createDt: string
}

/** 관리 엑셀 조회 항목 */
export interface IdeaExcelItem extends Pick<
  IdeaListItem,
  'ideaId' | 'title' | 'createNm' | 'createDt' | 'likeCnt'
>, Partial<Pick<IdeaListItem, 'ideaTypeCd' | 'ideaTypeNm' | 'agentId' | 'agentNm' | 'statusCd' | 'statusNm'>> {
  content: string | null
  cmtContent: string | null
  cmtDt: string | null
}

/** 상세 */
export interface IdeaDetail extends IdeaListItem {
  /** 서식 에디터 HTML */
  content: string
  likedYn: 'Y' | 'N'
  cmtContent: string | null
  cmtUserNm: string | null
  cmtDt: string | null
  fileList: IdeaFile[]
}

/** 목록 조회 조건 */
export interface IdeaSearchParams {
  searchKeyword: string
  searchTypeCd: string
  searchStatusCd: string
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

/** 아이디어 관리 상세 하단 — 진행상태·관리자 코멘트 */
export interface IdeaManageFormData {
  statusCd: string
  /** 서식 에디터 HTML (비우면 코멘트 삭제) */
  cmtContent: string
}

export const ideaColumns: TableColumn[] = [
  { key: 'rowNo', label: '번호', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'ideaTypeNm', label: '구분', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'title', label: '제목', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'createNm', label: '작성자', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'likeCnt', label: '추천', width: '88px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'statusNm', label: '진행상태', width: '110px', align: 'center', headerAlign: 'center' },
]

/** 아이디어 관리 목록 — 사용자 목록 컬럼 + 관리(삭제) */
export const ideaManageColumns: TableColumn[] = [
  ...ideaColumns,
  { key: 'manage', label: '관리', width: '100px', align: 'center', headerAlign: 'center' },
]
