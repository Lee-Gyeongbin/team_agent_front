import type { NoticeDetailResponse, NoticeFormData, NoticeItem, NoticeRow } from '~/types/notice'
import { useNoticeApi } from '~/composables/notice/useNoticeApi'

const { fetchSelectNoticeList, fetchSelectNoticeDetail, fetchInsertNotice, fetchUpdateNotice, fetchDeleteNotice } =
  useNoticeApi()

export const useNoticeStore = () => {
  const noticeList = ref<NoticeItem[]>([])
  const searchKeyword = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const pageSize = 15
  const isNoticePanelOpen = ref(false)
  const isNoticeDetailPanelOpen = ref(false)
  const selectedNotice = ref<NoticeItem | null>(null)
  const isEditFromDetail = ref(false)
  const defaultNoticeForm = ref<NoticeFormData>({} as NoticeFormData)
  const noticeForm = ref<NoticeFormData>({} as NoticeFormData)

  const filteredList = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return noticeList.value

    return noticeList.value.filter((item) => {
      return item.title.toLowerCase().includes(keyword) || item.crtrId.toLowerCase().includes(keyword)
    })
  })

  const handleFetchNoticeList = async () => {
    errorMessage.value = ''
    isLoading.value = true

    try {
      const res = await fetchSelectNoticeList()
      noticeList.value = Array.isArray(res.list) ? res.list : []
    } catch (error) {
      errorMessage.value = '공지사항 조회 중 오류가 발생했습니다.'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const normalizeNoticeFormData = (payload: NoticeFormData): NoticeFormData => ({
    ...payload,
    title: String(payload.title ?? '').trim(),
    content: String(payload.content ?? '').trim(),
  })

  const handleSaveNotice = async (payload: NoticeFormData): Promise<boolean> => {
    const normalizedPayload = normalizeNoticeFormData(payload)
    const targetId = String(normalizedPayload.noticeId ?? '').trim()

    if (targetId) {
      try {
        await fetchUpdateNotice(normalizedPayload)
        await handleFetchNoticeList()
        openToast({ message: '공지사항을 수정했습니다.' })
        return true
      } catch (error) {
        openToast({ message: '공지사항 수정 중 오류가 발생했습니다.', type: 'error' })
        console.error(error)
        return false
      }
    }

    try {
      await fetchInsertNotice(normalizedPayload)
      await handleFetchNoticeList()
      openToast({ message: '공지사항을 등록했습니다.' })
      return true
    } catch (error) {
      openToast({ message: '공지사항 등록 중 오류가 발생했습니다.', type: 'error' })
      console.error(error)
      return false
    }
  }

  const getDisplayNoticeTitle = (title: string) => {
    const trimmedTitle = String(title ?? '').trim()
    if (trimmedTitle.length <= 30) return trimmedTitle
    return `${trimmedTitle.slice(0, 30)}...`
  }

  const getDefaultNoticeForm = (): NoticeFormData => ({ ...defaultNoticeForm.value })
  const resetNoticeFormState = () => {
    noticeForm.value = getDefaultNoticeForm()
    isEditFromDetail.value = false
  }

  const mapNoticeItemToFormData = (notice: NoticeItem): NoticeFormData => ({
    noticeId: notice.noticeId,
    title: notice.title,
    content: notice.content,
    featuredYn: notice.featuredYn,
    pinYn: notice.pinYn,
    useYn: notice.useYn,
    crtrId: notice.crtrId,
    createDt: notice.createDt,
    modifyDt: notice.modifyDt,
  })

  const mapNoticeDetailToItem = (detail: NoticeDetailResponse): NoticeItem => ({
    noticeId: String(detail.noticeId ?? ''),
    title: String(detail.title ?? ''),
    content: String(detail.content ?? ''),
    featuredYn: detail.featuredYn === 'Y' ? 'Y' : 'N',
    pinYn: detail.pinYn === 'Y' ? 'Y' : 'N',
    useYn: detail.useYn === 'Y' ? 'Y' : 'N',
    crtrId: String(detail.crtrId ?? ''),
    createDt: String(detail.createDt ?? ''),
    modifyDt: String(detail.modifyDt ?? ''),
    viewCnt: Number(detail.viewCnt ?? 0),
  })

  const panelActionLabel = computed<'등록' | '수정'>(() => (noticeForm.value.noticeId ? '수정' : '등록'))

  const onRegisterNotice = () => {
    resetNoticeFormState()
    isNoticePanelOpen.value = true
  }

  const onSaveNoticeForm = async (payload: NoticeFormData) => {
    const saved = await handleSaveNotice(payload)
    if (!saved) return
    isNoticePanelOpen.value = false
    resetNoticeFormState()
  }

  const onCloseNoticeForm = () => {
    isNoticePanelOpen.value = false
    if (isEditFromDetail.value && selectedNotice.value) {
      isNoticeDetailPanelOpen.value = true
    }
    resetNoticeFormState()
  }

  const onOpenNoticeDetail = (notice: NoticeRow) => {
    void (async () => {
      try {
        const detail = await fetchSelectNoticeDetail(notice.noticeId)
        const resolvedDetail = (detail as { dataVO?: NoticeDetailResponse })?.dataVO ?? (detail as NoticeDetailResponse)
        selectedNotice.value = mapNoticeDetailToItem(resolvedDetail)
        isNoticeDetailPanelOpen.value = true
      } catch (error) {
        openToast({ message: '공지사항 상세 조회 중 오류가 발생했습니다.', type: 'error' })
        console.error(error)
      }
    })()
  }

  const onEditNotice = () => {
    if (!selectedNotice.value) return
    noticeForm.value = mapNoticeItemToFormData(selectedNotice.value)
    isEditFromDetail.value = true
    isNoticeDetailPanelOpen.value = false
    isNoticePanelOpen.value = true
  }

  const onDeleteNotice = async () => {
    if (!selectedNotice.value) return
    const targetNoticeId = selectedNotice.value.noticeId
    const targetTitle = selectedNotice.value.title
    const confirmed = await openConfirm({
      title: '공지 삭제',
      message: `'${targetTitle}'을(를) 삭제하시겠습니까?`,
    })
    if (!confirmed) return

    try {
      await fetchDeleteNotice(targetNoticeId)
      await handleFetchNoticeList()
      isNoticeDetailPanelOpen.value = false
      selectedNotice.value = null
      openToast({ message: '공지사항을 삭제했습니다.' })
    } catch (error) {
      openToast({ message: '공지사항 삭제 중 오류가 발생했습니다.', type: 'error' })
      console.error(error)
    }
  }

  const closeNoticeDetailPanel = () => {
    isNoticeDetailPanelOpen.value = false
  }

  const getNoticeRowClassName = (row: Record<string, unknown>) => (row.pinYn === 'Y' ? 'is-pinned-notice' : '')

  const parseNoticeDate = (dateTime: string) => {
    const time = new Date(String(dateTime ?? '').replace(' ', 'T')).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  const orderedNoticeList = computed(() =>
    [...filteredList.value].sort((a, b) => {
      if (a.pinYn !== b.pinYn) return a.pinYn === 'Y' ? -1 : 1

      const createdDiff = parseNoticeDate(b.createDt) - parseNoticeDate(a.createDt)
      if (createdDiff !== 0) return createdDiff

      return Number(b.noticeId) - Number(a.noticeId)
    }),
  )

  const noticeOrderMap = computed(() => {
    const orderMap = new Map<string, number>()
    let order = orderedNoticeList.value.filter((notice) => notice.pinYn !== 'Y').length

    orderedNoticeList.value.forEach((notice) => {
      if (notice.pinYn === 'Y') return
      orderMap.set(notice.noticeId, order)
      order -= 1
    })

    return orderMap
  })

  const getNoticeOrderLabel = (notice: NoticeRow) => {
    if (notice.pinYn === 'Y') return '[중요]'
    return noticeOrderMap.value.get(notice.noticeId) ?? '-'
  }

  const getNoticeDateLabel = (dateValue?: string) => {
    const trimmedDate = String(dateValue ?? '').trim()
    return trimmedDate || '-'
  }

  const pagedNoticeList = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize
    return orderedNoticeList.value.slice(startIndex, startIndex + pageSize)
  })

  return {
    noticeList,
    searchKeyword,
    isLoading,
    errorMessage,
    currentPage,
    pageSize,
    isNoticePanelOpen,
    isNoticeDetailPanelOpen,
    selectedNotice,
    noticeForm,
    panelActionLabel,
    filteredList,
    pagedNoticeList,
    handleFetchNoticeList,
    handleSaveNotice,
    onRegisterNotice,
    onSaveNoticeForm,
    onCloseNoticeForm,
    onOpenNoticeDetail,
    onEditNotice,
    onDeleteNotice,
    closeNoticeDetailPanel,
    getNoticeRowClassName,
    getNoticeOrderLabel,
    getNoticeDateLabel,
    getDisplayNoticeTitle,
  }
}
