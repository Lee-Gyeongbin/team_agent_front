import type { ChatGuideItem, MaintNoticeKind } from '~/types/com/chatGuide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'
import { setNetworkIncidentGuideFromMaint } from '~/composables/com/useNetworkErrorNotice'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'

/** localStorage — 점검 공지 "다시 보지 않기" (자동 팝업만 차단, 값은 modifyDt) */
const HIDE_STORAGE_PREFIX = 'ta_maintNoticeHide:'

const getGuideId = (item: ChatGuideItem | null | undefined) => String(item?.guideId ?? '').trim()

const getNoticeVersion = (item: ChatGuideItem | null | undefined) => String(item?.modifyDt ?? '').trim()

const getHideStorageKey = (guideId: string) => `${HIDE_STORAGE_PREFIX}${guideId}`

const isHiddenByUser = (guideId: string, version: string): boolean => {
  if (!guideId || !version || typeof localStorage === 'undefined') return false
  return localStorage.getItem(getHideStorageKey(guideId)) === version
}

const setHiddenByUser = (guideId: string, version: string) => {
  if (!guideId || !version || typeof localStorage === 'undefined') return
  localStorage.setItem(getHideStorageKey(guideId), version)
}

const clearHiddenByUser = (guideId: string) => {
  if (!guideId || typeof localStorage === 'undefined') return
  localStorage.removeItem(getHideStorageKey(guideId))
}

/** API datetime 문자열 → Date (없거나 유효하지 않으면 null) */
const parseApiDateTime = (value: string | null | undefined): Date | null => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const isoLike = raw.includes('T') ? raw : raw.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
  const d = new Date(isoLike)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 표시 기간 라벨 — startDt·endDt */
const buildPeriodLabel = (item: ChatGuideItem | null | undefined): string => {
  if (!item) return ''

  const formatDate = (dateTime: string | null | undefined): string => {
    const d = parseApiDateTime(dateTime)
    if (!d) return ''
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}.${month}.${day}`
  }

  const start = formatDate(item.startDt)
  const end = formatDate(item.endDt)
  if (start && end) return `${start} ~ ${end}`
  if (start) return `${start} ~`
  if (end) return `~ ${end}`
  return ''
}

/** 종류별 배지·제목 fallback */
const MAINT_NOTICE_KIND_META: Record<MaintNoticeKind, { badge: string; fallbackTitle: string }> = {
  emergency: { badge: '긴급', fallbackTitle: '긴급 공지' },
  scheduled: { badge: '점검', fallbackTitle: '정기 점검 안내' },
  recovery: { badge: '복구', fallbackTitle: '서비스 복구 안내' },
}

/** 배너·자동 팝업 대상 */
const getMaintNoticeKind = (item: ChatGuideItem): MaintNoticeKind | null => {
  if (item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.emergency) return 'emergency'
  if (item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.scheduled) return 'scheduled'
  if (item.guideKey === CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.recovery) return 'recovery'
  return null
}

/**
 * 비로그인 화면용 — 네트워크 오류 모달 가이드만 동기화
 * (회원가입 직진입 등 점검 배너가 없는 페이지)
 */
export const handleSyncNetworkIncidentGuide = async () => {
  try {
    const { fetchChatGuideMaintList } = useChatGuideApi()
    const list = await fetchChatGuideMaintList()
    setNetworkIncidentGuideFromMaint(list)
  } catch {
    // 캐시 유지
  }
}

/** 배너·모달 공통 제목 — API title 없으면 종류별 fallback */
const getDisplayTitle = (item: ChatGuideItem, kind: MaintNoticeKind): string =>
  String(item.title ?? '').trim() || MAINT_NOTICE_KIND_META[kind].fallbackTitle

interface MaintNoticeBannerItem {
  item: ChatGuideItem
  kind: MaintNoticeKind
  badge: string
  title: string
  periodLabel: string
}

const toBannerItem = (item: ChatGuideItem): MaintNoticeBannerItem | null => {
  const kind = getMaintNoticeKind(item)
  if (!kind) return null
  return {
    item,
    kind,
    badge: MAINT_NOTICE_KIND_META[kind].badge,
    title: getDisplayTitle(item, kind),
    periodLabel: buildPeriodLabel(item),
  }
}

/**
 * 로그인 점검·복구 공지
 * - 목록/활성 여부는 백엔드(chatGuideMaintList)가 필터해서 전달
 * - MAINT_INCIDENT_NETWORK(enblYn=Y)도 리스트에 포함 → 네트워크 오류 모달용 캐시만 동기화
 * - 프론트: 배너·모달 표시 + 다시 보지 않기(localStorage)만 담당
 */
export const useMaintNotice = () => {
  const { fetchChatGuideMaintList } = useChatGuideApi()

  const maintList = ref<ChatGuideItem[]>([])
  const autoOpenQueue = ref<ChatGuideItem[]>([])
  const notice = ref<ChatGuideItem | null>(null)
  const isOpen = ref(false)

  const bannerItems = computed(() =>
    maintList.value.map(toBannerItem).filter((row): row is MaintNoticeBannerItem => row != null),
  )

  const modalProps = computed(() => {
    const item = notice.value
    const kind = item ? getMaintNoticeKind(item) : null
    return {
      isOpen: isOpen.value,
      kind: kind ?? ('emergency' as MaintNoticeKind),
      title: item && kind ? getDisplayTitle(item, kind) : '',
      content: String(item?.content ?? '').trim(),
      periodLabel: buildPeriodLabel(item),
      hideByUser: isHiddenByUser(getGuideId(item), getNoticeVersion(item)),
    }
  })

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
    setHiddenByUser(id, getNoticeVersion(notice.value))
    autoOpenQueue.value = autoOpenQueue.value.filter((row) => getGuideId(row) !== id)
    finishModal()
  }

  const handleSelectMaintNotice = async () => {
    try {
      const list = await fetchChatGuideMaintList()
      setNetworkIncidentGuideFromMaint(list)

      const displayList = list.filter((item) => getMaintNoticeKind(item) != null)
      maintList.value = displayList
      autoOpenQueue.value = displayList.filter((item) => !isHiddenByUser(getGuideId(item), getNoticeVersion(item)))
      notice.value = null
      isOpen.value = false
      openNextAuto()
    } catch {
      // 네트워크 가이드 캐시는 유지 — offline 시 모달 문구로 사용
      maintList.value = []
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
