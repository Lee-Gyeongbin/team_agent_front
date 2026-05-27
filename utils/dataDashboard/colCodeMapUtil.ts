import type { ColCodeMap } from '~/types/data-dashboard'

type ColCodeRawItem = {
  colId?: string
  codeVal?: string
  codeKorNm?: string
}

/** colId / SQL 컬럼명을 코드맵 조회용 canonical 키로 통일 (regnCd → REGN_CD) */
export const normalizeColIdForCodeMap = (key: string): string => {
  const trimmed = key.trim()
  if (!trimmed) return trimmed

  const snake = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase()

  // chat 시각화와 동일한 예외 키 (STATID → STAT_ID 등)
  if (snake === 'STATID') return 'STAT_ID'
  if (snake === 'DETAILITEMCD') return 'DETAIL_ITEM_CD'

  return snake
}

/** colCodeMap API list → ColCodeMap */
export const buildColCodeMapFromList = (list: ColCodeRawItem[] | undefined | null): ColCodeMap => {
  const map: ColCodeMap = {}
  for (const item of list ?? []) {
    const colId = item.colId?.trim()
    const codeVal = item.codeVal?.trim()
    const codeKorNm = item.codeKorNm?.trim()
    if (!colId || !codeVal || !codeKorNm) continue

    const key = normalizeColIdForCodeMap(colId)
    if (!map[key]) map[key] = {}
    map[key][codeVal] = codeKorNm
  }
  return map
}

const findCodeLabel = (colMap: Record<string, string>, raw: string): string | undefined => {
  if (colMap[raw]) return colMap[raw]

  const upper = raw.toUpperCase()
  const caseKey = Object.keys(colMap).find((k) => k.toUpperCase() === upper)
  if (caseKey) return colMap[caseKey]

  if (/^\d+$/.test(raw)) {
    const padded = raw.padStart(2, '0')
    if (colMap[padded]) return colMap[padded]

    const normalizedRaw = raw.replace(/^0+/, '') || '0'
    const padKey = Object.keys(colMap).find((k) => (k.replace(/^0+/, '') || '0') === normalizedRaw)
    if (padKey) return colMap[padKey]
  }

  return undefined
}

/** DB NUMBER 직렬화값 정규화 (2.00000 → 2, 02 유지) */
const normalizeCodeRaw = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (/^\d+\.0+$/.test(trimmed)) return String(parseInt(trimmed, 10))
  return trimmed
}

/** 코드값 → 한글명 (컬럼 키·코드값 형식 불일치 보정) */
export const resolveColCodeLabel = (
  codeMap: ColCodeMap | undefined,
  colKey: string,
  codeVal: unknown,
): string => {
  const raw = normalizeCodeRaw(String(codeVal ?? ''))
  if (!codeMap || !raw) return raw

  const colMap = codeMap[normalizeColIdForCodeMap(colKey)]
  if (!colMap) return raw

  return findCodeLabel(colMap, raw) ?? raw
}

/** 차트 범례·축 레이블 — 코드맵 우선, MON은 N월·QUARTER는 N분기 형식 */
export const formatChartCategoryLabel = (
  codeMap: ColCodeMap | undefined,
  colKey: string,
  raw: string,
): string => {
  const trimmed = String(raw ?? '').trim()
  const mapped = resolveColCodeLabel(codeMap, colKey, trimmed)
  if (mapped !== normalizeCodeRaw(trimmed)) return mapped

  const colNorm = normalizeColIdForCodeMap(colKey)
  const num = parseInt(normalizeCodeRaw(trimmed), 10)

  if (colNorm === 'MON' && num >= 1 && num <= 12) return `${num}월`
  if (colNorm === 'QUARTER' && num >= 1 && num <= 4) return `${num}분기`

  return mapped
}
