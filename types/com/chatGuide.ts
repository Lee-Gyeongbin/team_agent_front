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

/** /chatGuideList.do · /chatGuideMaintList.do API 응답 */
export interface ChatGuideListResponse {
  list?: ChatGuideItem[]
  dataList?: ChatGuideItem[]
}

/** 로그인 점검 공지 종류 — 긴급 / 정기 / 복구 */
export type MaintNoticeKind = 'emergency' | 'scheduled' | 'recovery'

/** 전역 장애 모달 유형 — 네트워크 / 시스템 / DB */
export type IncidentErrorType = 'network' | 'system' | 'db'
