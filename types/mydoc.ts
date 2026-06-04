/** 내 문서보관함 상태 — tb_my_doc.DOC_STATUS */
export type MyDocStatus = 'SAVED' | 'ARCHIVED'

/** 내 문서보관함 — tb_my_doc (DB 컬럼 camelCase) */
export interface MyDoc {
  docId: string
  userId: string
  tmplId?: string | null
  agentId?: string | null
  agentNm?: string | null
  iconClassNm?: string | null
  colorHex?: string | null
  docNm: string
  docHtml?: string | null
  originHtml?: string | null
  svcTy?: string | null
  rContent?: string | null
  docStatus: MyDocStatus
  newYn?: string
  sortOrd: number
  createDt: string
  modifyDt?: string | null
  crtrId?: string
  mdfdId?: string | null
}

/** list.do 요청 */
export interface MyDocListRequest {
  searchDocNm?: string
  docStatus?: MyDocStatus
  svcTy?: string
  searchSort?: string
}

/** list.do 응답 */
export interface MyDocListResponse {
  dataList: MyDoc[]
}

/**
 * saveReport.do 요청 — 지식창고 AI 보고서 → 내 문서보관함 저장
 * docId·userId·감사필드·일시는 서버에서 세팅(수정 시 docId 포함)
 */
export interface MyDocSaveReportPayload {
  docId?: string
  tmplId?: string
  docNm: string
  docHtml: string
  originHtml: string
  svcTy?: string
  rContent?: string
  agentId?: string | null
  docStatus?: MyDocStatus
  sortOrd?: number
}

/** saveReport.do 응답 */
export interface MyDocSaveReportResponse {
  successYn: boolean
  returnMsg: string
  docId?: string
}
