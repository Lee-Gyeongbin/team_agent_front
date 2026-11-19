import type { InqAnsr, InqCodeItem, InqResponse, InqRow } from '~/types/inq'
import { INQ_STATUS_FLAG_VARIANT } from '~/types/inq'

/** 목록 제목 표시 최대 글자 수 */
const INQ_TITLE_LABEL_MAX_LENGTH = 50

/** 응답이 successYn=false 이면 returnMsg 로 에러를 던진다 */
export const assertInqOk = <T extends InqResponse>(res: T): T => {
  if (!res.successYn) throw new Error(res.returnMsg || '요청에 실패했습니다.')
  return res
}

/** 공통코드 목록 → 선택 옵션 */
export const toInqOptions = (codes: InqCodeItem[]) => codes.map((c) => ({ label: c.codeNm, value: c.codeId }))

/** 목록 번호 — 전체 건수 기준 내림차순 (현재 페이지 목록에 없는 행은 '-') */
export const getInqOrderNo = (
  list: InqRow[],
  row: InqRow,
  totalCount: number,
  currentPage: number,
  pageSize: number,
) => {
  const idx = list.findIndex((r) => r.inqId === row.inqId)
  return idx < 0 ? '-' : String(totalCount - (currentPage - 1) * pageSize - idx)
}

/** 목록 제목 — 에이전트 문의는 [에이전트명] 접두, 최대 글자 수 초과는 말줄임 */
export const getInqTitleLabel = (row: InqRow) => {
  const agent = row.agentNm ? `[${row.agentNm}] ` : ''
  const text = `${agent}${String(row.title ?? '').trim()}`
  return text.length <= INQ_TITLE_LABEL_MAX_LENGTH ? text : `${text.slice(0, INQ_TITLE_LABEL_MAX_LENGTH)}...`
}

/** 처리상태 배지 구분값 → 배지 색 */
export const getInqStatusVariant = (statusFlag?: string | null) =>
  INQ_STATUS_FLAG_VARIANT[statusFlag ?? ''] ?? 'default'

/** 'YYYY-MM-DD HH:mm:ss' → 'YYYY-MM-DD' */
export const toInqDateOnly = (value?: string | null) => String(value ?? '').slice(0, 10)

/** Error 메시지가 있으면 그대로, 없으면 fallback */
export const getInqErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

/** 답변 목록을 부모 → 자식 순서의 트리 순서로 정렬 */
export const orderInqAnswers = (answers: InqAnsr[]): InqAnsr[] => {
  const out: InqAnsr[] = []
  const walk = (upAnsrId: string | null) => {
    answers
      .filter((a) => (a.upAnsrId ?? null) === upAnsrId)
      .forEach((a) => {
        out.push(a)
        walk(a.ansrId)
      })
  }
  walk(null)
  return out
}

/** 하위 답글 수 */
export const countInqDescendants = (answers: InqAnsr[], ansrId: string): number =>
  answers
    .filter((a) => a.upAnsrId === ansrId)
    .reduce((sum, child) => sum + 1 + countInqDescendants(answers, child.ansrId), 0)
