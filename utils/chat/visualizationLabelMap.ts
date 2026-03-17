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
  '02': '대전',
  '03': '충청',
  '04': '세종',
  '05': '광주',
  '06': '전남',
  '07': '영등포',
  '08': '동대문',
  '09': '대구',
}

export const resolveColumnLabel = (key: string) => {
  return COLUMN_LABEL_MAP[key] ?? key
}

export const resolveDisplayValue = (key: string, value: unknown) => {
  const text = value == null ? '' : String(value)
  if (key === 'REGN_CD') {
    return REGION_CODE_MAP[text] ?? text
  }
  return text
}
