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

/** detail.do 요청 */
export interface MyDocDetailRequest {
  docId: string
}

/** detail.do 응답 */
export interface MyDocDetailResponse {
  data: MyDoc
}

/** selectSharedDocInfo.do 요청 — refId = 공유 ID (알림 refId) */
export interface MyDocSharedDetailRequest {
  refId: string
}

/** selectSharedDocInfo.do 응답 — 알림 받기 모달 프리뷰용 */
export interface MyDocSharedDetailResponse {
  data: MyDoc
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

/** updateNewYn.do 요청 */
export interface MyDocUpdateNewYnRequest {
  docId: string
  newYn: 'Y' | 'N'
}

/** updateNewYn.do 응답 */
export interface MyDocUpdateNewYnResponse {
  successYn: boolean
  returnMsg: string
}

/** updateDocNm.do 요청 — 문서명만 변경 */
export interface MyDocUpdateDocNmRequest {
  docId: string
  docNm: string
}

/** updateDocNm.do 응답 */
export interface MyDocUpdateDocNmResponse {
  successYn: boolean
  returnMsg: string
  modifyDt?: string | null
}

/** shareDoc.do 요청 — 내 문서 공유 */
export interface MyDocSharePayload {
  docId: string
  userIds: string[]
  shareMsg?: string
}

/** shareDoc.do 응답 */
export interface MyDocShareResponse {
  successYn: boolean
  returnMsg: string
}
/** insertReceiveMyDoc.do 응답 — 내 문서 공유 알림 받기 */
export interface MyDocReceiveResponse {
  successYn: boolean
  returnMsg: string
  docId?: string
}
