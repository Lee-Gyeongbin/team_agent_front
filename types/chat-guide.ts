import { toRaw } from 'vue'

// ============================================
// 타입 정의
// ============================================

/** noticeList.do — 응답 dataList */
export interface ChatGuideNoticeListResponse {
  dataList: ChatGuideNoticeItem[]
}

/** 인사멘트 폼 */
export interface ChatGuideGreetingForm {
  guideId: string
  guideTpCd: string
  guideKey: string
  enblYn: 'Y' | 'N'
  content: string
  modifyDt: string
}

/** greetingList.do — 응답 dataList */
export interface ChatGuideGreetingListResponse {
  dataList: ChatGuideGreetingForm[]
}

/** 안내멘트 행 */
export interface ChatGuideNoticeItem {
  guideId: string
  guideTpCd: string
  guideKey: string
  enblYn: 'Y' | 'N'
  content: string
  dsplCond: string
  modifyDt: string
  autoDetectYn: 'Y' | 'N'
}

/** 안내멘트 폼 (블록 묶음) */
export interface ChatGuideNoticeForm {
  feature: ChatGuideNoticeItem
  guide: ChatGuideNoticeItem
  privacy: ChatGuideNoticeItem
  limitation: ChatGuideNoticeItem
}

/** 점검/장애 목록 행 */
export interface ChatGuideMaintenanceItem {
  guideId: string
  guideTpCd: string
  guideKey: string
  title: string
  enblYn: 'Y' | 'N'
  content: string
  startDt: string
  endDt: string
  advanceNoticeCd: string
  advanceNoticeNm?: string
  modifyDt: string
  autoDsplYn: 'Y' | 'N'
}

/** 오류 메시지 행 */
export interface ChatGuideErrorRow {
  guideKey: string
  content: string
  enblYn: 'Y' | 'N'
  maxChars?: number
}

/** 오류 메시지 묶음 (응답/입력/API) */
export interface ChatGuideErrorData {
  responseErrors: ChatGuideErrorRow[]
  inputErrors: ChatGuideErrorRow[]
  apiErrors: ChatGuideErrorRow[]
}

/** errorMessageList.do — dataList (responseErrors / inputErrors / apiErrors) */
export interface ChatGuideErrorListRes {
  dataList: ChatGuideErrorData
}

/** maintenanceList.do — 응답 dataList */
export interface ChatGuideMaintenanceListResponse {
  dataList: ChatGuideMaintenanceItem[]
}

/** 셀렉트 등 UI 옵션 */
export interface ChatGuideSelectOption {
  label: string
  value: string
}

// ============================================
// 상수·키
// ============================================

/** 안내멘트 블록별 guideKey 기본값 */
export const CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS = {
  feature: 'NOTICE_FEATURE',
  guide: 'NOTICE_INPUT',
  privacy: 'NOTICE_PRIVACY',
  limitation: 'NOTICE_LIMIT',
} as const satisfies Record<keyof ChatGuideNoticeForm, string>

/** 점검/장애 블록별 guideKey (백엔드와 동일하게 유지) */
export const CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS = {
  emergency: 'MAINT_EMERGENCY',
  scheduled: 'MAINT_SCHEDULED',
  incidentSystem: 'MAINT_INCIDENT_SYSTEM',
  incidentNetwork: 'MAINT_INCIDENT_NETWORK',
  incidentDb: 'MAINT_INCIDENT_DB',
  recovery: 'MAINT_RECOVERY',
} as const

/** 장애 유형 블록 UI (아이콘·라벨 — 서버 컬럼 아님) */
export const CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS = [
  { guideKey: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentSystem, icon: '⚙️', label: '시스템 장애' },
  { guideKey: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentNetwork, icon: '🌐', label: '네트워크 장애' },
  { guideKey: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentDb, icon: '🗄️', label: 'DB 장애' },
] as const

/** 안내멘트 — 표시 조건 셀렉트 (퍼블리싱용 고정 옵션) */
export const CHAT_GUIDE_NOTICE_CONDITION_OPTIONS: ChatGuideSelectOption[] = [
  { label: '사용자가 "기능" 또는 "도움말" 입력 시', value: 'keyword' },
  { label: '첫 방문 시 자동 표시', value: 'first_visit' },
  { label: '항상 표시', value: 'always' },
]

/** 오류 메시지 화면 라벨 (guideKey별) */
export const CHAT_GUIDE_ERROR_CATALOG = {
  responseErrors: [
    { guideKey: 'RESP_FAIL', label: '응답 생성 실패' },
    { guideKey: 'RESP_NO_RESULT', label: '검색 결과 없음' },
  ],
  inputErrors: [
    { guideKey: 'INPUT_EMPTY', label: '입력값 없음' },
    { guideKey: 'INPUT_LENGTH', label: '입력 길이 초과' },
    { guideKey: 'INPUT_UPLOAD_FAIL', label: '파일 업로드 실패' },
  ],
  apiErrors: [
    { guideKey: 'API_500', label: '500 Internal Server Error' },
    { guideKey: 'API_429', label: '429 Too Many Requests' },
    { guideKey: 'API_408', label: '408 Request Timeout' },
    { guideKey: 'API_401_403', label: '401/403 Unauthorized' },
  ],
} as const

// ============================================
// 빈 폼·기본값·복제·헬퍼
// ============================================

/** 점검/장애 — guideKey당 빈 행 1건 */
export const getEmptyChatGuideMaintenanceItem = (guideKey: string): ChatGuideMaintenanceItem => ({
  guideId: '',
  guideTpCd: '',
  guideKey,
  title: '',
  enblYn: 'N',
  content: '',
  startDt: '',
  endDt: '',
  advanceNoticeCd: '',
  modifyDt: '',
  autoDsplYn: 'N',
})

/** 점검/장애 목록 — 기본 틀 (빈 행 채움) */
export const getEmptyChatGuideMaintenanceList = (): ChatGuideMaintenanceItem[] =>
  (Object.values(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS) as string[]).map((guideKey) =>
    getEmptyChatGuideMaintenanceItem(guideKey),
  )

/** 점검/장애 목록 깊은 복제 (편집 분리용) */
export const cloneChatGuideMaintenanceList = (src: ChatGuideMaintenanceItem[]): ChatGuideMaintenanceItem[] =>
  structuredClone(toRaw(src))

export const getEmptyChatGuideGreetingForm = (): ChatGuideGreetingForm => ({
  guideId: '',
  guideTpCd: '',
  guideKey: '',
  enblYn: 'N',
  content: '',
  modifyDt: '',
})

export const getEmptyChatGuideNoticeForm = (): ChatGuideNoticeForm => ({
  feature: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.feature,
    enblYn: 'N',
    content: '',
    dsplCond: CHAT_GUIDE_NOTICE_CONDITION_OPTIONS[0]?.value ?? '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  guide: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.guide,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  privacy: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.privacy,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  limitation: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.limitation,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
})

const buildChatGuideErrorRow = (guideKey: string, maxChars?: number): ChatGuideErrorRow => {
  const row: ChatGuideErrorRow = {
    guideKey,
    content: '',
    enblYn: 'Y',
  }
  if (maxChars !== undefined) {
    row.maxChars = maxChars
  }
  return row
}

/** 오류 메시지 — API 없을 때 병합용 기본 템플릿 */
export const getChatGuideErrorDefaults = (): ChatGuideErrorData => ({
  responseErrors: ['RESP_FAIL', 'RESP_NO_RESULT'].map((k) => buildChatGuideErrorRow(k)),
  inputErrors: [
    buildChatGuideErrorRow('INPUT_EMPTY'),
    buildChatGuideErrorRow('INPUT_LENGTH', 2000),
    buildChatGuideErrorRow('INPUT_UPLOAD_FAIL'),
  ],
  apiErrors: ['API_500', 'API_429', 'API_408', 'API_401_403'].map((k) => buildChatGuideErrorRow(k)),
})

/** guideKey → 표시 라벨 (CHAT_GUIDE_ERROR_CATALOG) */
export const getChatGuideErrorLabel = (guideKey: string): string | undefined => {
  const rows = [
    ...CHAT_GUIDE_ERROR_CATALOG.responseErrors,
    ...CHAT_GUIDE_ERROR_CATALOG.inputErrors,
    ...CHAT_GUIDE_ERROR_CATALOG.apiErrors,
  ]
  return rows.find((row) => row.guideKey === guideKey)?.label
}

const cloneErrorRows = (items: ChatGuideErrorRow[]) => items.map((errorRow) => ({ ...errorRow }))

/** 오류 메시지 묶음 얕은 복제 */
export const cloneChatGuideErrorData = (src: ChatGuideErrorData): ChatGuideErrorData => ({
  responseErrors: cloneErrorRows(src.responseErrors),
  inputErrors: cloneErrorRows(src.inputErrors),
  apiErrors: cloneErrorRows(src.apiErrors),
})
