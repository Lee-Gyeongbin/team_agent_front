import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Notify } from '~/types/global'
import type { KnowledgeItem } from '~/types/chat'
import type { LibraryCard } from '~/types/library'
import { useNotifyApi } from '~/composables/com/useNotifyApi'
import { useLibraryStore } from '~/composables/library/useLibraryStore'

// ── 전역 상태 (모듈 레벨) ──
const notifyList = ref<Notify[]>([])
const notifyLoading = ref(false)
const notifyError = ref('')

// ── KS(지식 공유) 받기 모달 상태 (모듈 레벨) ──
const isKsModalOpen = ref(false)
const ksModalLoading = ref(false)
const ksKnowledgeList = ref<KnowledgeItem[]>([])
const selectedKsNotify = ref<Notify | null>(null)
const ksCardDetail = ref<LibraryCard | null>(null)

/** sendUserId / sendUserNm 에서 성(첫 글자) 추출 */
const getInitials = (notify: Notify): string => {
  const name = notify.sendUserNm ?? notify.sendUserId ?? ''
  return name.charAt(0).toUpperCase()
}

/** sendUserId 기반 고정 색상 팔레트 배정 */
const AVATAR_COLORS = ['#3c69db', '#22a858', '#7c3aed', '#ff7518', '#64748b', '#e11d48', '#0891b2', '#d97706']
const getAvatarColor = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export const useNotifyStore = () => {
  const router = useRouter()
  const {
    fetchNotifyList,
    fetchMarkRead,
    fetchMarkAllRead,
    fetchDismissNotify,
    fetchSelectCategoryList,
    fetchReceiveKnowledge,
    fetchSharedCardDetail,
  } = useNotifyApi()

  /** 미읽음 알림 수 */
  const unreadCount = computed(() => notifyList.value.filter((n) => n.readYn === 'N').length)

  /** 알림 목록 조회 */
  const handleFetchNotifyList = async () => {
    notifyError.value = ''
    notifyLoading.value = true
    try {
      const res = await fetchNotifyList()
      notifyList.value = res.list ?? []
    } catch (e) {
      notifyError.value = e instanceof Error ? e.message : '알림 목록 조회에 실패했습니다.'
    } finally {
      notifyLoading.value = false
    }
  }

  /** 단건 읽음 처리 */
  const handleMarkRead = async (notifyId: number) => {
    const item = notifyList.value.find((n) => n.notifyId === notifyId)
    if (!item || item.readYn === 'Y') return
    item.readYn = 'Y'
    try {
      await fetchMarkRead(notifyId)
    } catch {
      item.readYn = 'N'
    }
  }

  /** 전체 읽음 처리 */
  const handleMarkAllRead = async () => {
    const prev = notifyList.value.map((n) => n.readYn)
    notifyList.value.forEach((n) => (n.readYn = 'Y'))
    try {
      await fetchMarkAllRead()
    } catch {
      notifyList.value.forEach((n, i) => (n.readYn = prev[i]))
    }
  }

  /** 알림 삭제 */
  const handleDismissNotify = async (notifyId: number) => {
    const prevList = [...notifyList.value]
    notifyList.value = notifyList.value.filter((n) => n.notifyId !== notifyId)
    try {
      await fetchDismissNotify(notifyId)
    } catch {
      notifyList.value = prevList
    }
  }

  /** 지식공유 알림 '받기' 버튼 클릭 — 카테고리 목록 + 카드 상세 병렬 조회 후 모달 오픈 */
  const handleOpenKsModal = async (notify: Notify) => {
    selectedKsNotify.value = notify
    ksKnowledgeList.value = []
    ksCardDetail.value = null
    isKsModalOpen.value = true
    ksModalLoading.value = true

    const [categoryRes, cardRes] = await Promise.allSettled([
      fetchSelectCategoryList(),
      notify.refId ? fetchSharedCardDetail(notify.refId) : Promise.resolve(null),
    ])

    if (categoryRes.status === 'fulfilled') {
      ksKnowledgeList.value = categoryRes.value?.dataList ?? []
    } else {
      openToast({ message: '카테고리 목록 조회에 실패했습니다.', type: 'error' })
      isKsModalOpen.value = false
    }

    if (cardRes.status === 'fulfilled' && cardRes.value) {
      ksCardDetail.value = cardRes.value.data ?? null
    }

    ksModalLoading.value = false
  }

  /** 지식공유 카테고리 모달 닫기 */
  const handleCloseKsModal = () => {
    isKsModalOpen.value = false
    selectedKsNotify.value = null
    ksCardDetail.value = null
  }

  /** 지식공유 카테고리 확정 — 선택한 카테고리로 지식 카드 복사 저장 */
  const handleReceiveKnowledge = async (categoryId: string) => {
    if (!selectedKsNotify.value) return
    const notify = selectedKsNotify.value
    try {
      await fetchReceiveKnowledge(categoryId, notify)
      openToast({ message: '지식이 내 창고에 저장되었습니다.', type: 'success' })
      handleCloseKsModal()
      // 알림 목록 갱신 + 지식창고 메뉴 내에 있으면 목록 새로고침
      await handleFetchNotifyList()
      if (router.currentRoute.value.path.startsWith('/library')) {
        const { handleFetchCategoryList } = useLibraryStore()
        await handleFetchCategoryList()
      }
    } catch (e) {
      openToast({ message: e instanceof Error ? e.message : '지식 저장에 실패했습니다.', type: 'error' })
    }
  }

  return {
    notifyList,
    notifyLoading,
    notifyError,
    unreadCount,
    getInitials,
    getAvatarColor,
    handleFetchNotifyList,
    handleMarkRead,
    handleMarkAllRead,
    handleDismissNotify,
    isKsModalOpen,
    ksModalLoading,
    ksKnowledgeList,
    ksCardDetail,
    selectedKsNotify,
    handleOpenKsModal,
    handleCloseKsModal,
    handleReceiveKnowledge,
  }
}
