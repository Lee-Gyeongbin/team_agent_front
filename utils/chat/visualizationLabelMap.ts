const COLUMN_LABEL_MAP: Record<string, string> = {
  __TIME_AXIS_YEAR_MONTH__: '연-월',
  __TIME_AXIS_YEAR_QUARTER__: '연-분기',
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

export const resolveColumnLabel = (key: string) => {
  return COLUMN_LABEL_MAP[key] ?? key
}

export const resolveDisplayValue = (key: string, value: unknown) => {
  const text = value == null ? '' : String(value)
  if (dynamicValueMap[key]?.[text]) {
    return dynamicValueMap[key][text]
  }
  if (key === 'REGN_CD') {
    return REGION_CODE_MAP[text] ?? text
  }
  return text
}
