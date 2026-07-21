import type { ChatGuideItem } from '~/types/com/chatGuide'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'
import { useChatGuide } from '~/composables/com/useChatGuide'
import { openToast } from '~/composables/useToast'

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

/** 네트워크 오류 모달 옵션 */
export interface NetworkErrorNoticeOptions {
  message?: string
  retryText?: string
  closeText?: string
}

type StatusMessageType = 'checking' | 'error' | ''

const isOpen = ref(false)
const isRetrying = ref(false)
const message = ref('')
const statusMessage = ref('')
const statusMessageType = ref<StatusMessageType>('')
const retryText = ref('다시 시도')
const closeText = ref('닫기')
/** online 직후 잘못된 notify 방지 */
let onlineGraceUntil = 0

const CHECKING_MESSAGE = '네트워크 연결을 확인하고 있습니다…\n잠시만 기다려 주세요.'
const SERVER_FAIL_MESSAGE = '서버 연결을 확인할 수 없습니다.\n잠시 후 다시 시도해 주세요.'
const RETRY_FAIL_MESSAGE = '연결에 실패하였습니다. 네트워크 확인 후 다시 시도해 주세요.'
const RECOVERED_TOAST_MESSAGE = '네트워크 연결이 복구되었습니다.'
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
  statusMessage.value = ''
  statusMessageType.value = ''
}

const clearStatusMessage = () => {
  statusMessage.value = ''
  statusMessageType.value = ''
}

/** 로그인 전 chatGuideMaintList에서 받은 네트워크 장애 문구 */
const networkIncidentMaintMessage = ref('')

/**
 * chatGuideMaintList → 네트워크 오류 모달 문구 캐시
 * (로그인 후 chatGuideList가 있으면 그쪽을 우선)
 */
export const setNetworkIncidentGuideFromMaint = (list: ChatGuideItem[]) => {
  const networkKey = CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentNetwork
  const item = list.find((row) => row.guideKey === networkKey)

  if (!item || item.enblYn !== 'Y') {
    networkIncidentMaintMessage.value = ''
    return
  }

  networkIncidentMaintMessage.value = String(item.content ?? '').trim()
}

/**
 * MAINT_INCIDENT_NETWORK 안내 문구
 * - 로그인 후: chatGuideList.do 캐시
 * - 로그인 전: chatGuideMaintList.do 캐시 (setNetworkIncidentGuideFromMaint)
 * - offline 시 fetch 금지 — 캐시만 사용
 */
const resolveGuideMessage = (): { message: string; enabled: boolean } => {
  const { getChatGuideByKey } = useChatGuide()
  const guide = getChatGuideByKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentNetwork)

  if (guide?.enblYn === 'Y') {
    const dbContent = String(guide.content ?? '').trim()
    if (dbContent) return { message: dbContent, enabled: true }
  }

  if (networkIncidentMaintMessage.value) {
    return { message: networkIncidentMaintMessage.value, enabled: true }
  }

  return { message: '', enabled: false }
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

const applyNoticeOptions = (options: NetworkErrorNoticeOptions) => {
  message.value = options.message?.trim() || resolveGuideMessage().message
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
  if (isRetrying.value) return

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

/**
 * 네트워크 오류 알림 — 중복 호출 방지 (이미 열려 있으면 무시)
 * useApi · offline 이벤트 등에서 사용
 */
export function notifyNetworkError(options: NetworkErrorNoticeOptions = {}): void {
  if (isOpen.value) return
  if (Date.now() < onlineGraceUntil) return

  const guide = resolveGuideMessage()
  const nextMessage = options.message?.trim() || guide.message
  if (!nextMessage) return

  applyNoticeOptions(options)
}

/** online 복구 등 — 모달 닫기 */
export function closeNetworkErrorNotice(): void {
  if (!isOpen.value) return
  resetState()
}

/** offline/online 이벤트 리스너 — app.vue에서 1회 호출 */
export function useNetworkErrorOfflineListener() {
  const onOffline = () => notifyNetworkError()
  const onOnline = () => {
    markNetworkOnlineGrace()
    if (isOpen.value) {
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
export function useNetworkErrorNoticeState() {
  const close = () => {
    closeNetworkErrorNotice()
  }

  const retry = () => {
    void attemptReconnect({ showRecoveredToast: true })
  }

  return {
    isOpen,
    isRetrying,
    message,
    statusMessage,
    statusMessageType,
    retryText,
    closeText,
    close,
    retry,
  }
}
