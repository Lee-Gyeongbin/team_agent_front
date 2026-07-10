import type { ChatGuideItem, MaintNoticeKind } from '~/types/com/chatGuide'
import { useChatGuideApi } from '~/composables/com/useChatGuideApi'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'

// ─── localStorage (다시 보지 않기 — 자동 팝업만 차단) ───────────────────────

const HIDE_STORAGE_PREFIX = 'ta_maintNoticeHide:'

const getGuideId = (item: ChatGuideItem | null | undefined) => String(item?.guideId ?? '').trim()

const getHideStorageKey = (guideId: string) => `${HIDE_STORAGE_PREFIX}${guideId || 'MAINT'}`

const getNoticeVersion = (item: ChatGuideItem | null | undefined) => String(item?.modifyDt ?? '').trim()

const isHiddenByUser = (item: ChatGuideItem | null | undefined): boolean => {
  const guideId = getGuideId(item)
  const version = getNoticeVersion(item)
  if (!guideId || !version || typeof localStorage === 'undefined') return false
  return localStorage.getItem(getHideStorageKey(guideId)) === version
}

const setHiddenByUser = (item: ChatGuideItem) => {
  const guideId = getGuideId(item)
  const version = getNoticeVersion(item)
  if (!guideId || !version || typeof localStorage === 'undefined') return
  localStorage.setItem(getHideStorageKey(guideId), version)
}

const clearHiddenByUser = (guideId: string) => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(getHideStorageKey(guideId))
}

// ─── 날짜·기간 ─────────────────────────────────────────────────────────────

const parseApiDateTime = (value: string | null | undefined): Date | null => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const isoLike = raw.includes('T') ? raw : raw.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
  const d = new Date(isoLike)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatMaintDate = (dateTime: string | null | undefined, style: 'modal' | 'banner'): string => {
  const d = parseApiDateTime(dateTime)
  if (!d) return ''
  if (style === 'banner') {
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
  }
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

const buildPeriodLabel = (item: ChatGuideItem | null | undefined, style: 'modal' | 'banner'): string => {
  if (!item) return ''
  const start = formatMaintDate(item.startDt, style)
  const end = formatMaintDate(item.endDt, style)
  if (start && end) return `${start} ~ ${end}`
  if (start) return `${start} ~`
  if (end) return `~ ${end}`
  return ''
}

const parseAdvanceNoticeDays = (code: string | null | undefined): number | null => {
  const raw = String(code ?? '').trim()
  if (!raw) return null
  const match = raw.match(/(\d+)/)
  if (!match) return null
  const days = Number(match[1])
  return Number.isFinite(days) && days >= 0 ? days : null
}

// ─── 공지 판별·표시 문구 ─────────────────────────────────────────────────────

const getMaintNoticeKind = (item: ChatGuideItem): MaintNoticeKind =>
  item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.scheduled ? 'scheduled' : 'emergency'

const getDisplayTitle = (item: ChatGuideItem): string => {
  const title = String(item.title ?? '').trim()
  if (title) return title
  return getMaintNoticeKind(item) === 'scheduled' ? '정기 점검 안내' : '긴급 공지'
}

/** 모달 본문 제목 — 긴급: API title 원문 / 정기: fallback 포함 */
const getModalBodyTitle = (item: ChatGuideItem): string => {
  if (getMaintNoticeKind(item) === 'emergency') {
    return String(item.title ?? '').trim()
  }
  return getDisplayTitle(item)
}

const getMaintNoticeBadge = (kind: MaintNoticeKind) => (kind === 'emergency' ? '긴급' : '점검')

const isMaintNoticeActive = (item: ChatGuideItem | null | undefined): boolean => {
  if (!item || item.enblYn !== 'Y') return false
  const title = String(item.title ?? '').trim()
  const content = String(item.content ?? '').trim()
  if (!title && !content) return false

  const now = Date.now()
  const start = parseApiDateTime(item.startDt)
  const end = parseApiDateTime(item.endDt)

  if (end && now > end.getTime()) return false

  if (getMaintNoticeKind(item) === 'scheduled') {
    if (!start) return true
    const advanceDays = parseAdvanceNoticeDays(item.advanceNoticeCd) ?? 0
    const showFrom = start.getTime() - advanceDays * 24 * 60 * 60 * 1000
    return now >= showFrom
  }

  if (start && now < start.getTime()) return false
  return true
}

// ─── 배너 ───────────────────────────────────────────────────────────────────

interface MaintNoticeBannerItem {
  item: ChatGuideItem
  kind: MaintNoticeKind
  badge: string
  title: string
  periodLabel: string
}

const toBannerItem = (item: ChatGuideItem): MaintNoticeBannerItem => {
  const kind = getMaintNoticeKind(item)
  return {
    item,
    kind,
    badge: getMaintNoticeBadge(kind),
    title: getDisplayTitle(item),
    periodLabel: buildPeriodLabel(item, 'banner'),
  }
}

const pickActiveMaintNotices = (apiList: ChatGuideItem[]): ChatGuideItem[] => {
  const emergency = apiList.find((item) => item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.emergency)
  const scheduled = apiList.find((item) => item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.scheduled)
  return [emergency, scheduled].filter((item): item is ChatGuideItem => !!item && isMaintNoticeActive(item))
}

// ─── composable ─────────────────────────────────────────────────────────────

/**
 * 로그인 점검 공지
 * - 배너: 활성 기간 동안 항상 표시
 * - 자동 팝업: 긴급 → 정기 순
 * - 다시 보지 않기: 자동 팝업만 차단 (배너·수동 클릭 유지)
 * - 체크 해제 후 확인: 자동 팝업 재허용
 * - modifyDt 변경 시 숨김 설정 초기화
 */
export const useMaintNotice = () => {
  const { fetchChatGuideMaintList } = useChatGuideApi()

  const list = ref<ChatGuideItem[]>([])
  const autoOpenQueue = ref<ChatGuideItem[]>([])
  const notice = ref<ChatGuideItem | null>(null)
  const isOpen = ref(false)

  const bannerItems = computed(() => list.value.map(toBannerItem))

  const kind = computed<MaintNoticeKind>(() => (notice.value ? getMaintNoticeKind(notice.value) : 'emergency'))
  const title = computed(() => (notice.value ? getModalBodyTitle(notice.value) : ''))
  const content = computed(() => String(notice.value?.content ?? '').trim())
  const periodLabel = computed(() => buildPeriodLabel(notice.value, 'modal'))
  const hideByUser = computed(() => isHiddenByUser(notice.value))

  const modalProps = computed(() => ({
    isOpen: isOpen.value,
    kind: kind.value,
    title: title.value,
    content: content.value,
    periodLabel: periodLabel.value,
    hideByUser: hideByUser.value,
  }))

  const openNextAuto = async () => {
    const next = autoOpenQueue.value.shift()
    if (!next) {
      notice.value = null
      isOpen.value = false
      return
    }
    isOpen.value = false
    notice.value = null
    await nextTick()
    notice.value = next
    isOpen.value = true
  }

  const finishModal = () => {
    isOpen.value = false
    notice.value = null
    void openNextAuto()
  }

  const openModal = (item: ChatGuideItem) => {
    autoOpenQueue.value = []
    notice.value = item
    isOpen.value = true
  }

  const closeModal = () => {
    if (notice.value) clearHiddenByUser(getGuideId(notice.value))
    finishModal()
  }

  const hideForever = () => {
    if (!notice.value) return
    const id = getGuideId(notice.value)
    setHiddenByUser(notice.value)
    autoOpenQueue.value = autoOpenQueue.value.filter((row) => getGuideId(row) !== id)
    finishModal()
  }

  const handleSelectMaintNotice = async () => {
    try {
      const apiList = await fetchChatGuideMaintList()
      const nextList = pickActiveMaintNotices(apiList)

      list.value = nextList
      autoOpenQueue.value = nextList.filter((item) => !isHiddenByUser(item))
      notice.value = null
      isOpen.value = false
      openNextAuto()
    } catch {
      list.value = []
      autoOpenQueue.value = []
      notice.value = null
      isOpen.value = false
    }
  }

  return {
    bannerItems,
    modalProps,
    openModal,
    closeModal,
    hideForever,
    handleSelectMaintNotice,
  }
}
