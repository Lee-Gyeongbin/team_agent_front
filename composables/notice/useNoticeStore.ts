import type { NoticeDetailResponse, NoticeFormData, NoticeItem, NoticeRow, LoginNoticeItem } from '~/types/notice'
import { useNoticeApi } from '~/composables/notice/useNoticeApi'
import { formatDate } from '~/utils/global/dateUtil'
import { getCodes } from '~/utils/global/comCodesUtil'

const {
  fetchSelectNoticePinnedList,
  fetchSelectNoticeList,
  fetchSelectNoticeDetail,
  fetchSaveNotice,
  fetchDeleteNotice,
  fetchSelectLoginNoticeList,
} = useNoticeApi()

export const useNoticeStore = () => {
  // ==============================
  // 유틸/매퍼
  // ==============================
  const formatNoticeDateOnly = (dateValue?: string | null) => {
    const trimmedDate = String(dateValue ?? '').trim()
    if (!trimmedDate) return ''

    const yyyymmdd = formatDate(trimmedDate.replace(' ', 'T'))
    if (!/^\d{8}$/.test(yyyymmdd)) return ''

    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
  }

  const createDefaultNoticeForm = (): NoticeFormData => ({
    noticeId: '',
    noticeTypeCd: '',
    title: '',
    content: '',
    featuredYn: 'N',
    pinYn: 'N',
    useYn: 'Y',
    crtrId: '',
    createDt: '',
    modifyDt: '',
  })

  const normalizeNoticeFormData = (payload: NoticeFormData): NoticeFormData => ({
    ...payload,
    noticeTypeCd: String(payload.noticeTypeCd ?? '').trim(),
    title: String(payload.title ?? '').trim(),
    content: String(payload.content ?? '').trim(),
  })

  const mapNoticeItemToFormData = (notice: NoticeItem): NoticeFormData => ({
    noticeId: notice.noticeId,
    noticeTypeCd: notice.noticeTypeCd,
    title: notice.title,
    content: notice.content,
    featuredYn: notice.featuredYn,
    pinYn: notice.pinYn,
    useYn: notice.useYn,
    crtrId: notice.crtrId,
    createDt: notice.createDt,
    modifyDt: notice.modifyDt,
  })

  const toYn = (value: 'Y' | 'N' | null | undefined): 'Y' | 'N' => (value === 'Y' ? 'Y' : 'N')

  const mapNoticeDetailToItem = (detail: NoticeDetailResponse): NoticeItem => ({
    noticeId: String(detail.noticeId ?? ''),
    noticeTypeCd: String(detail.noticeTypeCd ?? ''),
    title: String(detail.title ?? ''),
    content: String(detail.content ?? ''),
    featuredYn: toYn(detail.featuredYn),
    pinYn: toYn(detail.pinYn),
    useYn: toYn(detail.useYn),
    crtrId: String(detail.crtrId ?? ''),
    createDt: formatNoticeDateOnly(detail.createDt),
    modifyDt: formatNoticeDateOnly(detail.modifyDt),
    viewCnt: Number(detail.viewCnt ?? 0),
  })

  // ==============================
  // 상태
  // ==============================
  const pinnedNoticeList = ref<NoticeItem[]>([])
  const normalNoticeList = ref<NoticeItem[]>([])
  const loginNoticeList = ref<LoginNoticeItem[]>([])
  const isLoginNoticeLoading = ref(false)
  const loginNoticeErrorMessage = ref('')
  const searchKeyword = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const pageSizeTotal = 15
  const normalTotalCount = ref(0)
  const isNoticePanelOpen = ref(false)
  const isNoticeDetailPanelOpen = ref(false)
  const selectedNotice = ref<NoticeItem | null>(null)
  const isEditFromDetail = ref(false)
  const noticeForm = ref<NoticeFormData>(createDefaultNoticeForm())
  const noticeTypeOptions = ref<{ label: string; value: string }[]>([])
  const searchCategory = ref<string>('')
  const categoryOptions = computed(() => {
    const allOption = { label: '전체', value: '' }
    return [allOption, ...noticeTypeOptions.value]
  })

  // ==============================
  // 계산값
  // ==============================

  const filteredPinnedList = computed(() => pinnedNoticeList.value)
  const filteredNormalList = computed(() => normalNoticeList.value)
  const totalNoticeCount = computed(() => normalTotalCount.value + pinnedNoticeList.value.length)
  const noticeNormalPageSize = computed(() => Math.max(1, pageSizeTotal - filteredPinnedList.value.length))

  const panelActionLabel = computed<'등록' | '수정'>(() => (noticeForm.value.noticeId ? '수정' : '등록'))

  const noticeOrderMap = computed(() => {
    const orderMap = new Map<string, number>()
    const pageSize = noticeNormalPageSize.value
    const total = normalTotalCount.value
    const pageIndex = currentPage.value

    filteredNormalList.value.forEach((notice, idx) => {
      const number = total - (pageIndex - 1) * pageSize - idx
      orderMap.set(notice.noticeId, number)
    })

    return orderMap
  })

  const noticeTotalPages = computed(() => Math.max(1, Math.ceil(normalTotalCount.value / noticeNormalPageSize.value)))

  /** 테이블 렌더링용 목록 */
  const pagedNoticeList = computed(() => {
    const pinned = filteredPinnedList.value
    const normal = filteredNormalList.value
    return [...pinned, ...normal]
  })

  // ==============================
  // 내부 액션
  // ==============================
  const resetNoticeFormState = () => {
    noticeForm.value = createDefaultNoticeForm()
    isEditFromDetail.value = false
  }

  const handleSelectNoticeList = async () => {
    errorMessage.value = ''
    isLoading.value = true

    try {
      const params = {
        pageIndex: currentPage.value,
        searchKeyword: searchKeyword.value.trim() || undefined,
        noticeTypeCd: String(searchCategory.value ?? '').trim() || undefined,
      }

      const [pinnedRes, normalRes] = await Promise.all([
        fetchSelectNoticePinnedList(params),
        fetchSelectNoticeList(params),
      ])
      const pinnedList = Array.isArray(pinnedRes.dataList) ? pinnedRes.dataList.map(mapNoticeDetailToItem) : []
      pinnedNoticeList.value = pinnedList
      normalNoticeList.value = Array.isArray(normalRes.dataList) ? normalRes.dataList.map(mapNoticeDetailToItem) : []
      normalTotalCount.value = Number((normalRes as { totalCnt?: number }).totalCnt ?? 0)
    } catch (error) {
      errorMessage.value = '공지사항 조회 중 오류가 발생했습니다.'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const handleSelectNoticeTypeOptions = async () => {
    try {
      const codes = await getCodes('NT000001')
      noticeTypeOptions.value = codes.map((item) => ({
        label: item.codeNm,
        value: item.codeId,
      }))
    } catch (error) {
      noticeTypeOptions.value = []
      console.error(error)
    }
  }

  const LOGIN_NOTICE_TOP_COUNT = 3

  const handleSelectLoginNoticeList = async () => {
    loginNoticeErrorMessage.value = ''
    isLoginNoticeLoading.value = true
    try {
      const list = await fetchSelectLoginNoticeList()
      const rows = Array.isArray(list) ? list : []
      loginNoticeList.value = rows.slice(0, LOGIN_NOTICE_TOP_COUNT).map((row) => ({
        noticeId: String(row.noticeId ?? ''),
        noticeTypeCd: String(row.noticeTypeCd ?? ''),
        title: String(row.title ?? '').trim(),
        createDt: String(row.createDt ?? '').trim(),
      }))
    } catch (error) {
      loginNoticeList.value = []
      loginNoticeErrorMessage.value = '공지를 불러오지 못했습니다.'
      console.error(error)
    } finally {
      isLoginNoticeLoading.value = false
    }
  }

  /** 성공 시 저장된 공지 ID, 실패 시 null */
  const handleSaveNotice = async (payload: NoticeFormData): Promise<string | null> => {
    const normalizedPayload = normalizeNoticeFormData(payload)
    const targetId = String(normalizedPayload.noticeId ?? '').trim()
    const isEditMode = Boolean(targetId)
    const successMessage = isEditMode ? '공지사항을 수정했습니다.' : '공지사항을 등록했습니다.'
    const saveErrorMessage = isEditMode
      ? '공지사항 수정 중 오류가 발생했습니다.'
      : '공지사항 등록 중 오류가 발생했습니다.'

    try {
      const res = (await fetchSaveNotice(normalizedPayload)) as NoticeItem
      await handleSelectNoticeList()

      const savedNoticeId = isEditMode ? targetId : String(res.noticeId ?? '').trim()

      openToast({ message: successMessage })
      return savedNoticeId || null
    } catch (error) {
      openToast({ message: saveErrorMessage, type: 'error' })
      console.error(error)
      return null
    }
  }

  const handleSelectNoticeDetail = async (noticeId: string) => {
    try {
      const detail = await fetchSelectNoticeDetail(noticeId)
      selectedNotice.value = mapNoticeDetailToItem(detail)
      isNoticeDetailPanelOpen.value = true
    } catch (error) {
      openToast({ message: '공지사항 상세 조회 중 오류가 발생했습니다.', type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // UI 이벤트 핸들러
  // ==============================

  const onRegisterNotice = () => {
    resetNoticeFormState()
    if (!noticeForm.value.noticeTypeCd && noticeTypeOptions.value.length > 0) {
      noticeForm.value.noticeTypeCd = noticeTypeOptions.value[0].value
    }
    isNoticePanelOpen.value = true
  }

  const onSaveNoticeForm = async (payload: NoticeFormData) => {
    const savedNoticeId = await handleSaveNotice(payload)
    isNoticePanelOpen.value = false
    resetNoticeFormState()
    if (savedNoticeId) {
      await handleSelectNoticeDetail(savedNoticeId)
    }
  }

  const onCloseNoticeForm = () => {
    isNoticePanelOpen.value = false
    if (isEditFromDetail.value && selectedNotice.value) {
      isNoticeDetailPanelOpen.value = true
    }
    resetNoticeFormState()
  }

  const onOpenNoticeDetail = async (notice: Pick<NoticeRow, 'noticeId'>) => {
    await handleSelectNoticeDetail(notice.noticeId)
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
      await handleSelectNoticeList()
      isNoticeDetailPanelOpen.value = false
      selectedNotice.value = null
      openToast({ message: '공지사항을 삭제했습니다.' })
    } catch (error) {
      openToast({ message: '공지사항 삭제 중 오류가 발생했습니다.', type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // UI 표시용 헬퍼
  // ==============================
  const getDisplayNoticeTitle = (title: string) => {
    const trimmedTitle = String(title ?? '').trim()
    if (trimmedTitle.length <= 50) return trimmedTitle
    return `${trimmedTitle.slice(0, 50)}...`
  }

  const getNoticeTypeLabel = (notice: Pick<NoticeRow, 'noticeTypeCd'>) => {
    const noticeTypeCd = String(notice.noticeTypeCd ?? '').trim()
    const matchedOption = noticeTypeOptions.value.find((option) => option.value === noticeTypeCd)
    return matchedOption?.label ?? noticeTypeCd
  }

  /** 공지 구분 표기: 공통코드명을 대괄호로 감쌈 (라벨 없으면 빈 문자열) */
  const getNoticeTypeBracketed = (notice: Pick<NoticeRow, 'noticeTypeCd'>) => {
    const label = getNoticeTypeLabel(notice).trim()
    return label ? `[${label}]` : ''
  }

  const getNoticeOrderLabel = (notice: NoticeRow) => {
    return noticeOrderMap.value.get(notice.noticeId) ?? '-'
  }

  const getNoticeDateLabel = (dateValue?: string) => {
    const dateOnly = formatNoticeDateOnly(dateValue)
    return dateOnly || '-'
  }

  return {
    searchKeyword,
    isLoading,
    errorMessage,
    currentPage,
    isNoticePanelOpen,
    isNoticeDetailPanelOpen,
    selectedNotice,
    noticeForm,
    noticeTypeOptions,
    searchCategory,
    categoryOptions,
    panelActionLabel,
    filteredNormalList,
    totalNoticeCount,
    normalTotalCount,
    noticeNormalPageSize,
    noticeTotalPages,
    pagedNoticeList,
    handleSelectNoticeList,
    handleSelectNoticeTypeOptions,
    loginNoticeList,
    isLoginNoticeLoading,
    loginNoticeErrorMessage,
    handleSelectLoginNoticeList,
    onRegisterNotice,
    onSaveNoticeForm,
    onCloseNoticeForm,
    onOpenNoticeDetail,
    onEditNotice,
    onDeleteNotice,
    getNoticeTypeLabel,
    getNoticeTypeBracketed,
    getNoticeOrderLabel,
    getNoticeDateLabel,
    getDisplayNoticeTitle,
  }
}
