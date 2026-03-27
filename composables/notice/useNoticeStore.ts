import { noticeDummyData } from '~/composables/notice/dummydata'
import type { NoticeFormData, NoticeItem, NoticeRow } from '~/types/notice'

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
      // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
      // TO-DO: useNoticeApi의 목록 조회 API 호출 후 응답 데이터로 noticeList 세팅
      noticeList.value = noticeDummyData
    } catch (error) {
      errorMessage.value = '공지사항 조회 중 오류가 발생했습니다.'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const handleDeleteNoticeById = async (noticeId: string) => {
    if (!noticeId.trim()) return false

    const target = noticeList.value.find((item) => item.noticeId === noticeId)
    const title = target?.title ?? '선택한 공지사항'
    const confirmed = await openConfirm({
      title: '공지 삭제',
      message: `'${title}'을(를) 삭제하시겠습니까?`,
    })

    if (!confirmed) return false

    // 🔽 더미 로직 — 백엔드 연결 시 API로 교체
    // TO-DO: 단건 삭제 API 호출 후 성공 시 목록 재조회(handleFetchNoticeList)
    noticeList.value = noticeList.value.filter((item) => item.noticeId !== noticeId)
    openToast({ message: '공지사항을 삭제했습니다.' })
    return true
  }

  /**
   * TO-DO: 공지 저장
   * - 백엔드 연결 시 useNoticeApi 저장 API 호출로 교체
   */
  const { user } = useAuth()
  const formatNow = () => {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    const yyyy = now.getFullYear()
    const mm = pad(now.getMonth() + 1)
    const dd = pad(now.getDate())
    const hh = pad(now.getHours())
    const mi = pad(now.getMinutes())
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }

  const handleSaveNotice = (payload: NoticeFormData) => {
    const targetId = String(payload.noticeId ?? '').trim()

    if (targetId) {
      // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
      // TO-DO: 수정 API 호출(단건) 후 성공 시 목록 재조회(handleFetchNoticeList)
      noticeList.value = noticeList.value.map((item) =>
        item.noticeId === targetId
          ? {
              ...item,
              title: payload.title.trim(),
              content: payload.content.trim(),
              pinYn: payload.pinYn,
              useYn: payload.useYn,
              modifyDt: formatNow(),
            }
          : item,
      )
      openToast({ message: '공지사항을 수정했습니다.' })
      return
    }

    // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
    // TO-DO: 등록 API 호출 후 성공 시 목록 재조회(handleFetchNoticeList)
    const nextId = noticeList.value.reduce((max, item) => Math.max(max, Number(item.noticeId) || 0), 0) + 1
    const currentDateTime = formatNow()
    noticeList.value = [
      {
        noticeId: String(nextId),
        title: payload.title.trim(),
        content: payload.content.trim(),
        viewCnt: 0,
        pinYn: payload.pinYn,
        useYn: payload.useYn,
        crtrId: String(user.value?.userNm ?? '관리자'),
        createDt: currentDateTime,
        modifyDt: currentDateTime,
      },
      ...noticeList.value,
    ]
    openToast({ message: '공지사항을 등록했습니다.' })
  }

  const getDisplayNoticeTitle = (title: string) => {
    const trimmedTitle = String(title ?? '').trim()
    if (trimmedTitle.length <= 30) return trimmedTitle
    return `${trimmedTitle.slice(0, 30)}...`
  }

  const getDefaultNoticeForm = (): NoticeFormData => ({ ...defaultNoticeForm.value })

  const mapNoticeItemToFormData = (notice: NoticeItem): NoticeFormData => ({
    noticeId: notice.noticeId,
    title: notice.title,
    content: notice.content,
    pinYn: notice.pinYn,
    useYn: notice.useYn,
    crtrId: notice.crtrId,
    createDt: notice.createDt,
    modifyDt: notice.modifyDt,
  })

  const panelActionLabel = computed<'등록' | '수정'>(() => (noticeForm.value.noticeId ? '수정' : '등록'))

  const onRegisterNotice = () => {
    noticeForm.value = getDefaultNoticeForm()
    isEditFromDetail.value = false
    isNoticePanelOpen.value = true
  }

  const onSaveNoticeForm = (payload: NoticeFormData) => {
    handleSaveNotice(payload)
    isNoticePanelOpen.value = false
    noticeForm.value = getDefaultNoticeForm()
    isEditFromDetail.value = false
  }

  const onCloseNoticeForm = () => {
    isNoticePanelOpen.value = false
    if (isEditFromDetail.value && selectedNotice.value) {
      isNoticeDetailPanelOpen.value = true
    }
    noticeForm.value = getDefaultNoticeForm()
    isEditFromDetail.value = false
  }

  const onOpenNoticeDetail = (notice: NoticeRow) => {
    // 🔽 더미 로직 — 백엔드 연결 시 상세 조회 API(단건)로 교체
    // TO-DO: noticeId로 상세 조회 후 selectedNotice 세팅
    const targetNotice = noticeList.value.find((item) => item.noticeId === notice.noticeId)
    selectedNotice.value = targetNotice ?? null
    isNoticeDetailPanelOpen.value = true
  }

  const onEditNotice = () => {
    if (!selectedNotice.value) return
    // 🔽 더미 로직 — 백엔드 연결 시 수정 폼 초기값은 상세 API 응답 기준으로 세팅
    noticeForm.value = mapNoticeItemToFormData(selectedNotice.value)
    isEditFromDetail.value = true
    isNoticeDetailPanelOpen.value = false
    isNoticePanelOpen.value = true
  }

  const onDeleteNotice = async () => {
    if (!selectedNotice.value) return
    const deleted = await handleDeleteNoticeById(selectedNotice.value.noticeId)
    if (!deleted) return

    isNoticeDetailPanelOpen.value = false
    selectedNotice.value = null
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
    handleDeleteNoticeById,
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
