import { toRaw } from 'vue'

/** noticeList.do — dataList 한 행이 폼 슬롯(ChatNoticeItem)과 동일 */
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
  /** 이름 자동 삽입 ({{userName}}) — 백엔드 컬럼명에 맞출 것 */
  autoNameYn?: 'Y' | 'N'
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
 * 점검/장애 목록 조회 한 행 — maintenanceList.do SELECT
 * (GUIDE_ID, GUIDE_TP_CD, GUIDE_KEY, TITLE, ENBL_YN, CONTENT, START_DT, END_DT,
 *  ADVANCE_NOTICE_CD, ADVANCE_NOTICE_NM, MODIFY_DT, AUTO_DSPL_YN)
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

/**
 * 조회 dataList를 기본 guideKey 행에 병합
 */
export const mergeChatMaintenanceDataList = (incoming: ChatMaintenanceItem[]): ChatMaintenanceItem[] => {
  const defaults = getEmptyChatMaintenanceList()
  const byKey = new Map(incoming.map((r) => [r.guideKey, r]))
  return defaults.map((d) => {
    const hit = byKey.get(d.guideKey)
    return hit ? { ...d, ...hit } : d
  })
}

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
  autoNameYn: 'N',
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

const cloneErrorRows = (items: ChatGuideErrorRow[]) => items.map((e) => ({ ...e }))

export const cloneChatGuideErrorData = (src: ChatGuideErrorData): ChatGuideErrorData => ({
  responseErrors: cloneErrorRows(src.responseErrors),
  inputErrors: cloneErrorRows(src.inputErrors),
  apiErrors: cloneErrorRows(src.apiErrors),
})

export const resolveNoticeFormSlot = (guideKey: string): keyof ChatNoticeForm | null => {
  const k = guideKey.toLowerCase()
  const def = CHAT_NOTICE_DEFAULT_GUIDE_KEYS

  if (k === def.feature.toLowerCase() || k.includes('feature')) return 'feature'
  if (k === def.guide.toLowerCase() || k.includes('input') || k.includes('guide') || k.includes('prompt')) {
    return 'guide'
  }
  if (k === def.privacy.toLowerCase() || k.includes('privacy')) return 'privacy'
  if (k === def.limitation.toLowerCase() || k.includes('limit')) return 'limitation'

  return null
}

export const mapNoticeDataListToForm = (dataList: ChatNoticeItem[]): ChatNoticeForm => {
  const form = getEmptyChatNoticeForm()

  dataList.forEach((item) => {
    const slot = resolveNoticeFormSlot(item.guideKey)
    if (slot) {
      form[slot] = { ...item, dsplCond: item.dsplCond ?? '' }
    }
  })

  return form
}
