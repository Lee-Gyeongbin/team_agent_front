const COLUMN_LABEL_MAP: Record<string, string> = {
  STAT_ID: '통계ID',
  YEAR: '연도',
  MON: '월',
  QUARTER: '분기',
  REGN_CD: '지역코드',
  DETAIL_ITEM_CD: '상세항목코드',
  RESULT: '구분',
  TOTAL_VAL: '합계',
  AVG_VAL: '평균',
  SUM_VAL: '합계',
  STAT_VAL: '값',
}

const REGION_CODE_MAP: Record<string, string> = {
  '01': '본부',
  '02': '대전',
  '03': '충청',
  '04': '세종',
  '05': '광주',
  '06': '전남',
  '07': '영등포',
  '08': '동대문',
  '09': '대구',
}

/** API에서 내려온 동적 매핑 (STAT_ID → statNm, DETAIL_ITEM_CD → detailItemNm) */
const dynamicValueMap: Record<string, Record<string, string>> = {}

export const registerDynamicMappings = (
  statList?: Array<{ statId?: string; statNm?: string }>,
  statDetailList?: Array<{ detailItemCd?: string; detailItemNm?: string }>,
) => {
  if (statList?.length) {
    dynamicValueMap.STAT_ID = {}
    statList.forEach(({ statId, statNm }) => {
      if (statId && statNm) dynamicValueMap.STAT_ID[statId] = statNm
    })
  }
  if (statDetailList?.length) {
    dynamicValueMap.DETAIL_ITEM_CD = {}
    statDetailList.forEach(({ detailItemCd, detailItemNm }) => {
      if (detailItemCd && detailItemNm) dynamicValueMap.DETAIL_ITEM_CD[detailItemCd] = detailItemNm
    })
  }
}

export const clearDynamicMappings = () => {
  delete dynamicValueMap.STAT_ID
  delete dynamicValueMap.DETAIL_ITEM_CD
}

/**
 * COLUMN_LABEL_MAP / dynamicValueMap 조회용으로 컬럼 키를 canonical 형태로 통일
 * (예: stat_id, STAT_ID → STAT_ID / statId → STAT_ID / detail_item_cd, detailItemCd → DETAIL_ITEM_CD)
 */
export const normalizeColumnKeyForMapping = (key: string): string => {
  const t = key.trim()
  if (!t) return t
  const upper = t.toUpperCase()
  // camelCase API 키: statId → STATID, detailItemCd → DETAILITEMCD
  if (upper === 'STATID') return 'STAT_ID'
  if (upper === 'DETAILITEMCD') return 'DETAIL_ITEM_CD'
  return upper
}

export const resolveColumnLabel = (key: string) => {
  const canon = normalizeColumnKeyForMapping(key)
  return COLUMN_LABEL_MAP[canon] ?? key
}

export const resolveDisplayValue = (key: string, value: unknown) => {
  const text = value == null ? '' : String(value)
  const canon = normalizeColumnKeyForMapping(key)
  if (dynamicValueMap[canon]?.[text]) {
    return dynamicValueMap[canon][text]
  }
  if (canon === 'REGN_CD') {
    return REGION_CODE_MAP[text] ?? text
  }
  return text
}
