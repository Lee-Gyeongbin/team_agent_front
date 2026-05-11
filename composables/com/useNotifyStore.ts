import { ref, computed } from 'vue'
import type { Notify } from '~/types/global'
import { useNotifyApi } from '~/composables/com/useNotifyApi'

// ── 전역 상태 (모듈 레벨) ──
const notifyList = ref<Notify[]>([])
const notifyLoading = ref(false)
const notifyError = ref('')

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
  const { fetchNotifyList, fetchMarkRead, fetchMarkAllRead, fetchDismissNotify } = useNotifyApi()

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
  }
}
