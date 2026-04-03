/** 문서 유형 — 템플릿형: 고정 항목, 자유형식: LLM이 항목 생성 */
export type TmplDocType = 'TEMPLATE' | 'FREE'

/** 항목 정의 행 (JSON 키 ↔ 표시명) */
export interface TmplFieldRow {
  rowId: string
  jsonKey: string
  itemLabel: string
  multiline: boolean
}

/** 사용자 정의 문서 템플릿 (목록/편집용) */
export interface DocumentTemplateUser {
  templateId: string
  templateName: string
  docType: TmplDocType
  description: string
  fieldRows: TmplFieldRow[]
  promptTemplate: string
}

/** 폼 저장 시 emit — 신규는 templateId 없음 */
export interface TmplFormSavePayload {
  templateId?: string
  templateName: string
  docType: TmplDocType
  description: string
  fieldRows: TmplFieldRow[]
  promptTemplate: string
}
