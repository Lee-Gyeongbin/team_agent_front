/** tb_chat_guide — 챗봇 가이드 행 (API camelCase) */
export interface ChatGuideItem {
  guideId: string
  guideTpCd: string
  guideKey: string
  title: string | null
  enblYn: 'Y' | 'N'
  content: string | null
  dsplCond: string | null
  startDt: string | null
  endDt: string | null
  advanceNoticeCd: string | null
  maxChars: number | null
  modifyDt: string
  autoDsplYn: 'Y' | 'N'
  autoDetectYn: 'Y' | 'N'
}

/** /chatGuideList.do API 응답 */
export interface ChatGuideListResponse {
  list?: ChatGuideItem[]
}
