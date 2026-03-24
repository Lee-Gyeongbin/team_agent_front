import { toRaw } from 'vue'

/** noticeList.do — 안내멘트 행 배열 */
export interface ChatNoticeListResponse {
  dataList: ChatNoticeItem[]
}

/** =========================
 *  인사멘트 타입
 *  ========================= */
export interface ChatGreetingForm {
  guideId: string
  guideTpCd: string
  guideKey: string
  enblYn: 'Y' | 'N'
  content: string
  modifyDt: string
}

/** greetingList.do */
export interface ChatGreetingListResponse {
  dataList: ChatGreetingForm[]
}

/** =========================
 *  안내멘트 타입
 *  ========================= */
export interface ChatNoticeItem {
  guideId: string
  guideTpCd: string
  guideKey: string
  enblYn: 'Y' | 'N'
  content: string
  dsplCond: string
  modifyDt: string
  autoDetectYn: 'Y' | 'N'
}

export interface ChatNoticeForm {
  feature: ChatNoticeItem
  guide: ChatNoticeItem
  privacy: ChatNoticeItem
  limitation: ChatNoticeItem
}

/** 안내멘트 블록별 guideKey 기본값 */
export const CHAT_NOTICE_DEFAULT_GUIDE_KEYS = {
  feature: 'NOTICE_FEATURE',
  guide: 'NOTICE_INPUT',
  privacy: 'NOTICE_PRIVACY',
  limitation: 'NOTICE_LIMIT',
} as const satisfies Record<keyof ChatNoticeForm, string>

/** =========================
 *  점검/장애 타입
 *  ========================= */

/**
 * 점검/장애 목록 조회
 */
export interface ChatMaintenanceItem {
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

/** 점검/장애 블록별 guideKey 기본값 — 백엔드와 동일하게 맞출 것 */
export const CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS = {
  emergency: 'MAINT_EMERGENCY',
  scheduled: 'MAINT_SCHEDULED',
  incidentSystem: 'MAINT_INCIDENT_SYSTEM',
  incidentNetwork: 'MAINT_INCIDENT_NETWORK',
  incidentDb: 'MAINT_INCIDENT_DB',
  recovery: 'MAINT_RECOVERY',
} as const

/** 장애 유형 블록 UI (아이콘/라벨만 — 서버 컬럼 아님) */
export const CHAT_MAINTENANCE_INCIDENT_UI_SLOTS = [
  { guideKey: CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentSystem, icon: '⚙️', label: '시스템 장애' },
  { guideKey: CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentNetwork, icon: '🌐', label: '네트워크 장애' },
  { guideKey: CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentDb, icon: '🗄️', label: 'DB 장애' },
] as const

/** ChatMaintenanceItem 필드 기본값으로 1행 */
export const getEmptyChatMaintenanceItem = (guideKey: string): ChatMaintenanceItem => ({
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

/**
 * 화면·merge 기본 스켈레톤 — guideKey 목록은 `CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS` 한 곳만 유지
 * (`getEmptyChatMaintenanceItem`은 1행 팩토리, 본 함수는 그걸 키 순서대로 묶은 것)
 */
export const getEmptyChatMaintenanceList = (): ChatMaintenanceItem[] =>
  (Object.values(CHAT_MAINTENANCE_DEFAULT_GUIDE_KEYS) as string[]).map((guideKey) =>
    getEmptyChatMaintenanceItem(guideKey),
  )

export const cloneChatMaintenanceList = (src: ChatMaintenanceItem[]): ChatMaintenanceItem[] =>
  structuredClone(toRaw(src))

/** =========================
 *  오류 메시지 타입
 *  ========================= */
export interface ChatGuideErrorRow {
  guideKey: string
  content: string
  enblYn: 'Y' | 'N'
  maxChars?: number
}

export interface ChatGuideErrorData {
  responseErrors: ChatGuideErrorRow[]
  inputErrors: ChatGuideErrorRow[]
  apiErrors: ChatGuideErrorRow[]
}

/** errorMessageList.do — dataList[0]에 responseErrors/inputErrors/apiErrors 묶음 1건 */
export interface ChatGuideErrorListRes {
  dataList: ChatGuideErrorData[]
}

/** maintenanceList.do */
export interface ChatMaintenanceListResponse {
  dataList: ChatMaintenanceItem[]
}

/** =========================
 *  UI 옵션 (셀렉트 등)
 *  ========================= */
export interface ChatGuideSelectOption {
  label: string
  value: string
}

export const conditionOptions: ChatGuideSelectOption[] = [
  { label: '사용자가 "기능" 또는 "도움말" 입력 시', value: 'keyword' },
  { label: '첫 방문 시 자동 표시', value: 'first_visit' },
  { label: '항상 표시', value: 'always' },
]

/** =========================
 *  빈 폼·기본값·복제·맵핑
 *  ========================= */
export const getEmptyChatGreetingForm = (): ChatGreetingForm => ({
  guideId: '',
  guideTpCd: '',
  guideKey: '',
  enblYn: 'N',
  content: '',
  modifyDt: '',
})

export const getEmptyChatNoticeForm = (): ChatNoticeForm => ({
  feature: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_NOTICE_DEFAULT_GUIDE_KEYS.feature,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  guide: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_NOTICE_DEFAULT_GUIDE_KEYS.guide,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  privacy: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_NOTICE_DEFAULT_GUIDE_KEYS.privacy,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
  limitation: {
    guideId: '',
    guideTpCd: '',
    guideKey: CHAT_NOTICE_DEFAULT_GUIDE_KEYS.limitation,
    enblYn: 'N',
    content: '',
    dsplCond: '',
    autoDetectYn: 'N',
    modifyDt: '',
  },
})

export function cloneChatGuideForm<T extends ChatNoticeForm>(src: T): T {
  return structuredClone(toRaw(src) as T)
}

export const cloneChatNoticeForm = (src: ChatNoticeForm): ChatNoticeForm => cloneChatGuideForm(src)

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

export const getChatGuideErrorDefaults = (): ChatGuideErrorData => ({
  responseErrors: ['RESP_FAIL', 'RESP_NO_RESULT'].map((k) => buildChatGuideErrorRow(k)),
  inputErrors: [
    buildChatGuideErrorRow('INPUT_EMPTY'),
    buildChatGuideErrorRow('INPUT_LENGTH', 2000),
    buildChatGuideErrorRow('INPUT_UPLOAD_FAIL'),
  ],
  apiErrors: ['API_500', 'API_429', 'API_408', 'API_401_403'].map((k) => buildChatGuideErrorRow(k)),
})

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
    { guideKey: 'API_500', label: '서버 내부 오류' },
    { guideKey: 'API_429', label: '요청 한도 초과' },
    { guideKey: 'API_408', label: '요청 시간 초과' },
    { guideKey: 'API_401_403', label: '인증/권한 오류' },
  ],
} as const

const cloneErrorRows = (items: ChatGuideErrorRow[]) => items.map((e) => ({ ...e }))

export const cloneChatGuideErrorData = (src: ChatGuideErrorData): ChatGuideErrorData => ({
  responseErrors: cloneErrorRows(src.responseErrors),
  inputErrors: cloneErrorRows(src.inputErrors),
  apiErrors: cloneErrorRows(src.apiErrors),
})
