/** 문서 유형 — TMPL_TYPE (DB: T=템플릿형, F=자유형식) */
export type TmplDocType = 'T' | 'F'

/** 템플릿 항목(FIELD_*) — DB 컬럼 camelCase */
export interface TmplField {
  fieldId: string
  tmplId: string
  jsonKey: string
  fieldNm: string
  multilineYn: string
  sortOrd: number
  useYn: string
  createDt: string
  modifyDt: string
}

/** 문서 템플릿 기본 정보 — DB 컬럼 camelCase (사용자 정의·내장 동일 구조) */
export interface TmplBaseInfo {
  tmplId: string
  tmplNm: string
  tmplType: TmplDocType
  description: string
  llmPromptSmry: string
  llmPrompt: string
  sysTmplYn: string
  useYn: string
  createDt: string
  modifyDt: string
  fields: TmplField[]
}

/** 템플릿 저장 요청 — 등록/수정 시 (일반적으로 createDt·modifyDt는 서버에서 세팅) */
export interface TmplFormSavePayload {
  tmplId?: string
  tmplNm: string
  tmplType: TmplDocType
  description: string
  llmPromptSmry: string
  llmPrompt: string
  useYn?: string
  fields: TmplField[]
}
