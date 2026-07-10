import { CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'

/** localStorage — 기능 안내 "다음부터 보지 않기" */
const HIDE_STORAGE_PREFIX = 'ta_chatFeatureNoticeHide:'

/** 키워드 표시 조건에서 감지할 단어 */
const FEATURE_NOTICE_KEYWORDS = ['기능', '도움말'] as const

const getHideStorageKey = (guideId: string) => `${HIDE_STORAGE_PREFIX}${guideId || 'NOTICE_FEATURE'}`

const isHiddenByUser = (guideId: string): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(getHideStorageKey(guideId)) === 'Y'
}

const setHiddenByUser = (guideId: string) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(getHideStorageKey(guideId), 'Y')
}

/** 첫 방문 표시 여부 (first_visit) — 한 번 띄운 뒤 기록 */
const FIRST_VISIT_SHOWN_PREFIX = 'ta_chatFeatureNoticeFirstVisitShown:'

const getFirstVisitStorageKey = (guideId: string) => `${FIRST_VISIT_SHOWN_PREFIX}${guideId || 'NOTICE_FEATURE'}`

const hasShownOnFirstVisit = (guideId: string): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(getFirstVisitStorageKey(guideId)) === 'Y'
}

const markShownOnFirstVisit = (guideId: string) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(getFirstVisitStorageKey(guideId), 'Y')
}

/**
 * NOTICE_FEATURE(사용 가능 기능 안내) 모달 표시 로직
 * - enblYn === 'Y' 일 때만 대상
 * - dsplCond: always | first_visit | keyword
 * - "다음부터 보지 않기" 는 localStorage에 저장
 */
export const useChatFeatureNotice = () => {
  const { getChatGuideByKey } = useChatGuide()
  const { chatMessage } = useChatRooms()

  const isOpen = ref(false)
  /** keyword 조건으로 이미 한 번 연 뒤, 같은 입력 세션에서 반복 오픈 방지 */
  const keywordTriggered = ref(false)

  const featureGuide = computed(() => getChatGuideByKey(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.feature))

  const isEnabled = computed(() => featureGuide.value?.enblYn === 'Y')

  const content = computed(() => String(featureGuide.value?.content ?? '').trim())

  const dsplCond = computed(() => String(featureGuide.value?.dsplCond ?? '').trim())

  const guideId = computed(() => String(featureGuide.value?.guideId ?? '').trim())

  const canShow = computed(() => {
    if (!isEnabled.value) return false
    if (!content.value) return false
    if (isHiddenByUser(guideId.value)) return false
    return true
  })

  const openModal = () => {
    if (!canShow.value) return
    isOpen.value = true
    if (dsplCond.value === 'first_visit') {
      markShownOnFirstVisit(guideId.value)
    }
  }

  const closeModal = () => {
    isOpen.value = false
  }

  /** 다음부터 보지 않기 */
  const hideForever = () => {
    setHiddenByUser(guideId.value)
    isOpen.value = false
  }

  /** always / first_visit — 페이지 진입 시 자동 표시 */
  const tryOpenOnEnter = () => {
    if (!canShow.value) return
    if (dsplCond.value === 'always') {
      openModal()
      return
    }
    if (dsplCond.value === 'first_visit' && !hasShownOnFirstVisit(guideId.value)) {
      openModal()
    }
  }

  /** keyword — 입력에 "기능"/"도움말" 포함 시 표시 */
  const tryOpenByKeyword = (text: string) => {
    if (!canShow.value) return
    if (dsplCond.value !== 'keyword') return
    if (keywordTriggered.value) return
    const normalized = text.trim()
    if (!normalized) {
      keywordTriggered.value = false
      return
    }
    const hit = FEATURE_NOTICE_KEYWORDS.some((kw) => normalized.includes(kw))
    if (hit) {
      keywordTriggered.value = true
      openModal()
    }
  }

  /** chat/index 진입 후 가이드 로드 완료 시점에 호출 */
  const initFeatureNotice = () => {
    keywordTriggered.value = false
    tryOpenOnEnter()
  }

  // keyword 조건: 채팅 입력 감시
  watch(
    chatMessage,
    (text) => {
      tryOpenByKeyword(String(text ?? ''))
    },
    { flush: 'post' },
  )

  return {
    isOpen,
    content,
    dsplCond,
    canShow,
    openModal,
    closeModal,
    hideForever,
    initFeatureNotice,
  }
}
