import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Notify } from '~/types/global'
import type { CodeItem } from '~/types/codes'
import type { KnowledgeItem } from '~/types/chat'
import type { LibraryCard } from '~/types/library'
import { useNotifyApi } from '~/composables/com/useNotifyApi'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
import { useMyDocApi } from '~/composables/my-documents/useMyDocApi'
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'
import type { MyDoc } from '~/types/mydoc'
import { getCodes } from '~/utils/global/comCodesUtil'

// ── 전역 상태 (모듈 레벨) ──
const notifyList = ref<Notify[]>([])
const notifyLoading = ref(false)
const notifyError = ref('')

// ── 알림 패널 열림 상태 (모듈 레벨 — 외부 페이지에서도 제어 가능) ──
const isNotificationOpen = ref(false)

/** 화면 첫 진입 시 미읽음 알림 패널 자동 오픈 여부 (세션당 1회) */
const hasAutoOpenedOnFirstEntry = ref(false)

/** 알림 유형 공통코드 그룹 — 각 코드의 ETC1 에 상세보기로 이동할 메뉴 경로(TB_MENU.SRC_PATH)를 둔다 */
const NOTIFY_TYPE_GRP_ID = 'NF000001'
/** 문의하기 알림 유형 코드 (작성자에게) — 서버 InqServiceImpl.NOTIFY_TY_USER 와 같은 값 */
const NOTIFY_TY_INQ_USER = 'II'
const notifyTypeList = ref<CodeItem[]>([])
let isNotifyTypeLoaded = false

/** notifyTyCd==='KS' && saveYn==='N' 인 미수신 지식공유 알림 존재 여부 */
const hasPendingKsNotify = computed(() => notifyList.value.some((n) => n.notifyTyCd === 'KS' && n.saveYn === 'N'))

/** notifyTyCd==='MD' && saveYn==='N' 인 미수신 내 문서 공유 알림 존재 여부 */
const hasPendingMdNotify = computed(() => notifyList.value.some((n) => n.notifyTyCd === 'MD' && n.saveYn === 'N'))

// ── KS(지식 공유) 받기 모달 상태 (모듈 레벨) ──
const isKsModalOpen = ref(false)
const ksModalLoading = ref(false)
const ksKnowledgeList = ref<KnowledgeItem[]>([])
const selectedKsNotify = ref<Notify | null>(null)
const ksCardDetail = ref<LibraryCard | null>(null)

// ── MD(내 문서 공유) 받기 모달 상태 (모듈 레벨) ──
const isMdModalOpen = ref(false)
const mdModalLoading = ref(false)
const selectedMdNotify = ref<Notify | null>(null)
const mdDocDetail = ref<MyDoc | null>(null)

/**
 * 발신자 표시 — 문의하기 알림(작성자에게)은 실제 답변자 대신 '관리자'로 보여준다
 * 🔽 추후 알림 유형 공통코드(ETC2)로 옮겨 DB에서 관리
 */
const getSenderLabel = (notify: Notify): string =>
  notify.notifyTyCd === NOTIFY_TY_INQ_USER ? '관리자' : (notify.sendUserNm ?? notify.sendUserId ?? '')

/** sendUserId / sendUserNm 에서 성(첫 글자) 추출 */
const getInitials = (notify: Notify): string => {
  return getSenderLabel(notify).charAt(0).toUpperCase()
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
  const { fetchSharedDocDetail, fetchReceiveMyDoc } = useMyDocApi()
  const { canRead } = usePermission()

  /** 미읽음 알림 수 */
  const unreadCount = computed(() => notifyList.value.filter((n) => n.readYn === 'N').length)

  /** 알림 유형 공통코드 조회 — 처음 한 번만 */
  const handleFetchNotifyTypeList = async () => {
    if (isNotifyTypeLoaded) return
    isNotifyTypeLoaded = true
    try {
      notifyTypeList.value = await getCodes(NOTIFY_TYPE_GRP_ID)
    } catch {
      isNotifyTypeLoaded = false
    }
  }

  /** 알림에서 이동할 메뉴 경로 — 유형 코드의 ETC1, 참조 ID가 있고 해당 메뉴 조회 권한이 있을 때만 */
  const getNotifyMenuPath = (notify: Notify): string => {
    const path = notifyTypeList.value.find((t) => t.codeId === notify.notifyTyCd)?.etc1?.trim() ?? ''
    return path && notify.refId && canRead(path) ? path : ''
  }

  /** 알림 상세보기 — 유형에 지정된 메뉴로 이동하고 참조 ID를 refId 쿼리로 넘긴다 */
  const handleOpenNotifyMenu = async (notify: Notify) => {
    const path = getNotifyMenuPath(notify)
    if (!path) return
    handleMarkRead(notify.notifyId)
    isNotificationOpen.value = false
    await router.push({ path, query: { refId: notify.refId } })
  }

  /** 알림 목록 조회 */
  const handleFetchNotifyList = async () => {
    notifyError.value = ''
    notifyLoading.value = true
    try {
      const [res] = await Promise.all([fetchNotifyList(), handleFetchNotifyTypeList()])
      notifyList.value = res.list ?? []

      // 화면 첫 진입 시 미읽음 알림이 있으면 알림 패널 자동 오픈
      if (import.meta.client && !hasAutoOpenedOnFirstEntry.value) {
        hasAutoOpenedOnFirstEntry.value = true
        if (notifyList.value.some((n) => n.readYn === 'N')) {
          isNotificationOpen.value = true
        }
      }
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
      await handleFetchNotifyList()
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

    // 받기 버튼 클릭 시 즉시 읽음 처리
    handleMarkRead(notify.notifyId)

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

  /** 내 문서 공유 알림 '받기' 버튼 클릭 — 문서 상세 조회 후 모달 오픈 */
  const handleOpenMdModal = async (notify: Notify) => {
    selectedMdNotify.value = notify
    mdDocDetail.value = null
    isMdModalOpen.value = true
    mdModalLoading.value = true

    handleMarkRead(notify.notifyId)

    try {
      if (notify.refId) {
        mdDocDetail.value = await fetchSharedDocDetail({ refId: notify.refId })
      }
    } catch {
      openToast({ message: '문서 정보 조회에 실패했습니다.', type: 'error' })
      isMdModalOpen.value = false
    } finally {
      mdModalLoading.value = false
    }
  }

  /** 내 문서 공유 받기 모달 닫기 */
  const handleCloseMdModal = () => {
    isMdModalOpen.value = false
    selectedMdNotify.value = null
    mdDocDetail.value = null
  }

  /** 내 문서 공유 받기 확정 */
  const handleReceiveMyDoc = async () => {
    if (!selectedMdNotify.value) return
    const notify = selectedMdNotify.value
    try {
      const res = await fetchReceiveMyDoc(notify)
      if (res.successYn === false) {
        openToast({ message: res.returnMsg || '문서 저장에 실패했습니다.', type: 'error' })
        return
      }
      openToast({ message: res.returnMsg || '문서가 내 문서보관함에 저장되었습니다.', type: 'success' })
      handleCloseMdModal()
      await handleFetchNotifyList()
      if (router.currentRoute.value.path.startsWith('/my-documents')) {
        const { refreshMyDocListAfterMutation } = useMyDocStore()
        await refreshMyDocListAfterMutation()
      }
    } catch (e) {
      openToast({ message: e instanceof Error ? e.message : '문서 저장에 실패했습니다.', type: 'error' })
    }
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
    isNotificationOpen,
    hasPendingKsNotify,
    hasPendingMdNotify,
    getSenderLabel,
    getInitials,
    getAvatarColor,
    getNotifyMenuPath,
    handleOpenNotifyMenu,
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
    isMdModalOpen,
    mdModalLoading,
    mdDocDetail,
    selectedMdNotify,
    handleOpenMdModal,
    handleCloseMdModal,
    handleReceiveMyDoc,
  }
}
