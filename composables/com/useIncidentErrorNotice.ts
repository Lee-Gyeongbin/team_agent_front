import type { ChatGuideItem, IncidentErrorType } from '~/types/com/chatGuide'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'
import { useChatGuide } from '~/composables/com/useChatGuide'
import { openToast } from '~/composables/useToast'

export type { IncidentErrorType }

interface ApiResponseLike {
  status: number
  statusText: string
  ok: boolean
  headers: Pick<Headers, 'get'>
}

export interface FatalServerErrorInfo {
  statusCode: number
  statusMessage: string
}

const FATAL_SERVER_STATUSES = new Set([502, 503, 504])

/** 게이트웨이 장애 또는 200으로 반환된 HTML 장애 페이지를 공통 판별한다. */
export const resolveFatalServerError = (response: ApiResponseLike): FatalServerErrorInfo | null => {
  const isHtmlMasquerade = response.ok && response.headers.get('content-type')?.includes('text/html') === true

  if (!isHtmlMasquerade && !FATAL_SERVER_STATUSES.has(response.status)) return null

  return {
    statusCode: isHtmlMasquerade ? 503 : response.status,
    statusMessage: isHtmlMasquerade ? 'Service Unavailable' : response.statusText || 'Server Error',
  }
}

/** fetch / $fetch 네트워크 단절 오류 여부 */
export const isNetworkError = (error: unknown): boolean => {
  if (typeof window !== 'undefined' && !navigator.onLine) return true

  if (!error || typeof error !== 'object') return false

  const name = 'name' in error ? String(error.name) : ''
  const message = 'message' in error ? String(error.message) : String(error)

  if (name === 'AbortError') return false

  const lower = message.toLowerCase()
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    (name === 'TypeError' && lower.includes('fetch'))
  )
}

/** 장애 모달 옵션 */
export interface IncidentErrorNoticeOptions {
  /** 장애 유형 — 기본 network */
  type?: IncidentErrorType
  message?: string
  retryText?: string
  closeText?: string
}

type StatusMessageType = 'checking' | 'error' | ''

const GUIDE_KEY_BY_TYPE: Record<IncidentErrorType, string> = {
  network: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentNetwork,
  system: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentSystem,
  db: CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentDb,
}

const DEFAULT_NOTICE_MESSAGE: Record<IncidentErrorType, string> = {
  network: '네트워크 연결이 원활하지 않습니다.\n연결 상태를 확인한 후 다시 시도해 주세요.',
  system: '시스템에 일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.',
  db: '데이터베이스 연결에 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.',
}

const CHECKING_MESSAGE = '네트워크 연결을 확인하고 있습니다…\n잠시만 기다려 주세요.'
const SERVER_FAIL_MESSAGE = '서버 연결을 확인할 수 없습니다.\n잠시 후 다시 시도해 주세요.'
const RETRY_FAIL_MESSAGE = '연결에 실패하였습니다. 네트워크 확인 후 다시 시도해 주세요.'
const RECOVERED_TOAST_MESSAGE = '네트워크 연결이 복구되었습니다.'

const isOpen = ref(false)
const isRetrying = ref(false)
const errorType = ref<IncidentErrorType>('network')
const message = ref('')
const statusMessage = ref('')
const statusMessageType = ref<StatusMessageType>('')
const retryText = ref('다시 시도')
const closeText = ref('닫기')
/** online 직후 잘못된 notify 방지 */
let onlineGraceUntil = 0

/** online 직후 네트워크 스택 안정화 대기 */
const ONLINE_RECONNECT_DELAY_MS = 500
/** 확인 중 문구 최소 노출 시간 (성공 시 모달이 너무 빨리 닫히는 것 방지) */
const MIN_CHECKING_DISPLAY_MS = 1000

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const markNetworkOnlineGrace = (ms = 2000) => {
  onlineGraceUntil = Date.now() + ms
}

const resetState = () => {
  isOpen.value = false
  isRetrying.value = false
  errorType.value = 'network'
  statusMessage.value = ''
  statusMessageType.value = ''
}

const clearStatusMessage = () => {
  statusMessage.value = ''
  statusMessageType.value = ''
}

/** 로그인 전 chatGuideMaintList에서 받은 장애 유형별 문구 */
const incidentMaintMessages = ref<Record<IncidentErrorType, string>>({
  network: '',
  system: '',
  db: '',
})

/**
 * chatGuideMaintList → 장애 모달 문구 캐시
 * (로그인 후 chatGuideList가 있으면 그쪽을 우선)
 */
export const setIncidentGuideFromMaint = (list: ChatGuideItem[]) => {
  const next: Record<IncidentErrorType, string> = {
    network: '',
    system: '',
    db: '',
  }

  ;(Object.keys(GUIDE_KEY_BY_TYPE) as IncidentErrorType[]).forEach((type) => {
    const guideKey = GUIDE_KEY_BY_TYPE[type]
    const item = list.find((row) => row.guideKey === guideKey)

    if (!item || item.enblYn !== 'Y') return

    next[type] = String(item.content ?? '').trim()
  })

  incidentMaintMessages.value = next
}

/**
 * 장애 유형별 안내 문구
 * - 로그인 후: chatGuideList.do 캐시
 * - 로그인 전: chatGuideMaintList.do 캐시 (setIncidentGuideFromMaint)
 * - offline 시 fetch 금지 — 캐시만 사용
 */
const resolveGuideMessage = (type: IncidentErrorType): string => {
  const { getChatGuideByKey } = useChatGuide()
  const guide = getChatGuideByKey(GUIDE_KEY_BY_TYPE[type])

  if (guide?.enblYn === 'Y') {
    const dbContent = String(guide.content ?? '').trim()
    if (dbContent) return dbContent
  }

  if (incidentMaintMessages.value[type]) {
    return incidentMaintMessages.value[type]
  }

  return DEFAULT_NOTICE_MESSAGE[type]
}

/** 서버 연결 확인 — 성공 시에만 resolve */
const checkNetworkConnection = async (): Promise<void> => {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('offline')
  }

  const response = await fetch('/api/session/user.do', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })

  // 401이어도 서버 응답이면 연결 복구로 간주
  if (!response.ok && response.status !== 401) {
    throw new Error('network')
  }
}

const applyNoticeOptions = (options: IncidentErrorNoticeOptions) => {
  const type = options.type ?? 'network'
  errorType.value = type
  message.value = options.message?.trim() || resolveGuideMessage(type)
  clearStatusMessage()
  retryText.value = options.retryText?.trim() || '다시 시도'
  closeText.value = options.closeText?.trim() || '닫기'
  isOpen.value = true
}

const setCheckingStatus = () => {
  statusMessage.value = CHECKING_MESSAGE
  statusMessageType.value = 'checking'
}

const setFailureStatus = () => {
  if (typeof window !== 'undefined' && navigator.onLine) {
    statusMessage.value = SERVER_FAIL_MESSAGE
  } else {
    statusMessage.value = RETRY_FAIL_MESSAGE
  }
  statusMessageType.value = 'error'
}

/** 재연결 시도 — online 자동 / 다시 시도 버튼 공통 */
const attemptReconnect = async (options: { showRecoveredToast?: boolean; fromOnline?: boolean } = {}) => {
  if (isRetrying.value || errorType.value !== 'network') return

  isRetrying.value = true
  setCheckingStatus()
  await nextTick()

  const startedAt = Date.now()
  try {
    if (options.fromOnline) {
      await delay(ONLINE_RECONNECT_DELAY_MS)
      if (typeof window !== 'undefined' && !navigator.onLine) {
        throw new Error('offline')
      }
    }

    await checkNetworkConnection()

    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_CHECKING_DISPLAY_MS) {
      await delay(MIN_CHECKING_DISPLAY_MS - elapsed)
    }

    resetState()
    if (options.showRecoveredToast) {
      openToast({ message: RECOVERED_TOAST_MESSAGE })
    }
  } catch {
    setFailureStatus()
  } finally {
    isRetrying.value = false
  }
}

/** HTTP 200 + result FAIL 시 백엔드 장애 errorCode → 모달 유형 */
const INCIDENT_ERROR_CODE_MAP: Record<string, IncidentErrorType> = {
  RESP_SYS_ERROR: 'system',
  RESP_DB_ERROR: 'db',
}

/** HTTP 200 + `{ result: 'FAIL', errorCode: 'RESP_SYS_ERROR' | 'RESP_DB_ERROR' }` 여부 */
export function isIncidentApiBody(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false

  const body = data as { result?: string; errorCode?: string }
  if (body.result !== 'FAIL' || !body.errorCode) return false

  return body.errorCode in INCIDENT_ERROR_CODE_MAP
}

/**
 * fetch throw 등 — 전역 장애 UI(IncidentErrorModal · error.vue)가 처리하는 오류
 * 페이지 inline 에러 표시 생략용
 */
export function isIncidentHandledError(error: unknown): boolean {
  if (isNetworkError(error)) return true
  if (!error || typeof error !== 'object') return false

  const e = error as { fatal?: boolean; statusCode?: number }
  if (e.fatal === true) return true

  const statusCode = e.statusCode
  return statusCode === 502 || statusCode === 503 || statusCode === 504
}

/** 백엔드 장애 코드 감지 → 시스템/DB 모달 */
export function notifyIncidentFromErrorCode(errorCode?: string): boolean {
  if (!errorCode) return false

  const type = INCIDENT_ERROR_CODE_MAP[errorCode]
  if (!type) return false

  notifyIncidentError({ type })
  return true
}

/**
 * API 본문 장애 코드 감지 → 시스템/DB 모달
 * - HTTP 200 + `{ result: 'FAIL', errorCode: 'RESP_SYS_ERROR' | 'RESP_DB_ERROR' }`
 * @returns 장애 모달을 띄웠으면 true
 */
export function notifyIncidentFromApiBody(data: unknown): boolean {
  if (!isIncidentApiBody(data)) return false

  const body = data as { errorCode?: string }
  return notifyIncidentFromErrorCode(body.errorCode)
}

/**
 * 장애 모달 알림 — 중복 호출 방지 (이미 열려 있으면 무시)
 * useApi · offline 이벤트 · 시스템/DB 장애 등에서 사용
 */
export function notifyIncidentError(options: IncidentErrorNoticeOptions = {}): void {
  if (!import.meta.client) return
  if (isOpen.value) return

  const type = options.type ?? 'network'
  // online 직후 grace는 네트워크 오탐 방지용 — 시스템/DB는 제외
  if (type === 'network' && Date.now() < onlineGraceUntil) return

  applyNoticeOptions(options)
}

/** online 복구 등 — 모달 닫기 */
export function closeIncidentErrorNotice(): void {
  if (!isOpen.value) return
  resetState()
}

/** offline/online 이벤트 리스너 — app.vue에서 1회 호출 */
export function useNetworkErrorOfflineListener() {
  const onOffline = () => notifyIncidentError({ type: 'network' })
  const onOnline = () => {
    markNetworkOnlineGrace()
    if (isOpen.value && errorType.value === 'network') {
      void attemptReconnect({ showRecoveredToast: true, fromOnline: true })
      return
    }
  }

  onMounted(() => {
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
  })

  onUnmounted(() => {
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online', onOnline)
  })
}

/** app.vue 렌더·이벤트용 */
export function useIncidentErrorNoticeState() {
  const close = () => {
    closeIncidentErrorNotice()
  }

  const retry = () => {
    void attemptReconnect({ showRecoveredToast: true })
  }

  return {
    isOpen,
    isRetrying,
    errorType,
    message,
    statusMessage,
    statusMessageType,
    retryText,
    closeText,
    close,
    retry,
  }
}
