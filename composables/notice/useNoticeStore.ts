import type { NoticeDetailResponse, NoticeFormData, NoticeItem, NoticeRow } from '~/types/notice'
import { useNoticeApi } from '~/composables/notice/useNoticeApi'
import { formatDate } from '~/utils/global/dateUtil'
import { getCodes } from '~/utils/global/comCodesUtil'

const {
  fetchSelectNoticePinnedList,
  fetchSelectNoticeList,
  fetchSelectNoticeDetail,
  fetchInsertNotice,
  fetchUpdateNotice,
  fetchDeleteNotice,
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
    featuredYn: null,
    pinYn: null,
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

  const searchKeyword = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const currentPage = ref(1)
  const pageSize = 15
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
  const isMatchedNotice = (item: NoticeItem, keyword: string, selectedCategory: string) => {
    const isCategoryMatched = !selectedCategory || String(item.noticeTypeCd ?? '').trim() === selectedCategory
    if (!isCategoryMatched) return false
    if (!keyword) return true

    return item.title.toLowerCase().includes(keyword) || item.crtrId.toLowerCase().includes(keyword)
  }

  const filterNoticeList = (list: NoticeItem[]) => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    const selectedCategory = String(searchCategory.value ?? '').trim()
    return list.filter((item) => isMatchedNotice(item, keyword, selectedCategory))
  }

  const filteredPinnedList = computed(() => filterNoticeList(pinnedNoticeList.value))
  const filteredNormalList = computed(() => filterNoticeList(normalNoticeList.value))
  const filteredList = computed(() => [...filteredPinnedList.value, ...filteredNormalList.value])

  const noticeNormalPageSize = computed(() => Math.max(1, pageSize - filteredPinnedList.value.length))

  const panelActionLabel = computed<'등록' | '수정'>(() => (noticeForm.value.noticeId ? '수정' : '등록'))

  const noticeOrderMap = computed(() => {
    const orderMap = new Map<string, number>()
    let order = filteredNormalList.value.length

    filteredNormalList.value.forEach((notice) => {
      orderMap.set(notice.noticeId, order)
      order -= 1
    })

    return orderMap
  })

  const noticeTotalPages = computed(() =>
    Math.max(1, Math.ceil(filteredNormalList.value.length / noticeNormalPageSize.value)),
  )

  /** 페이지 사이즈 단위 슬라이싱 */
  const pagedNoticeList = computed(() => {
    const pinned = filteredPinnedList.value
    const normal = filteredNormalList.value
    const sliceSize = noticeNormalPageSize.value
    const startIndex = (currentPage.value - 1) * sliceSize
    return [...pinned, ...normal.slice(startIndex, startIndex + sliceSize)]
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
      const [pinnedRes, normalRes] = await Promise.all([fetchSelectNoticePinnedList(), fetchSelectNoticeList()])
      const pinnedList = Array.isArray(pinnedRes.dataList) ? pinnedRes.dataList.map(mapNoticeDetailToItem) : []
      pinnedNoticeList.value = pinnedList
      normalNoticeList.value = Array.isArray(normalRes.dataList) ? normalRes.dataList.map(mapNoticeDetailToItem) : []
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

  /** 성공 시 저장된 공지 ID, 실패 시 null */
  const handleSaveNotice = async (payload: NoticeFormData): Promise<string | null> => {
    const normalizedPayload = normalizeNoticeFormData(payload)
    const targetId = String(normalizedPayload.noticeId ?? '').trim()
    const isEditMode = Boolean(targetId)
    const request = isEditMode ? fetchUpdateNotice : fetchInsertNotice
    const successMessage = isEditMode ? '공지사항을 수정했습니다.' : '공지사항을 등록했습니다.'
    const saveErrorMessage = isEditMode
      ? '공지사항 수정 중 오류가 발생했습니다.'
      : '공지사항 등록 중 오류가 발생했습니다.'

    try {
      const res = (await request(normalizedPayload)) as NoticeItem
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
    if (!savedNoticeId) return
    isNoticePanelOpen.value = false
    resetNoticeFormState()
    await handleSelectNoticeDetail(savedNoticeId)
  }

  const onCloseNoticeForm = () => {
    isNoticePanelOpen.value = false
    if (isEditFromDetail.value && selectedNotice.value) {
      isNoticeDetailPanelOpen.value = true
    }
    resetNoticeFormState()
  }

  const onOpenNoticeDetail = async (notice: NoticeRow) => {
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

  const getNoticeTypeLabel = (notice: NoticeRow) => {
    const noticeTypeCd = String(notice.noticeTypeCd ?? '').trim()
    const matchedOption = noticeTypeOptions.value.find((option) => option.value === noticeTypeCd)
    return matchedOption?.label ?? noticeTypeCd
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
    filteredList,
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
    noticeNormalPageSize,
    noticeTotalPages,
    pagedNoticeList,
    handleSelectNoticeList,
    handleSelectNoticeTypeOptions,
    onRegisterNotice,
    onSaveNoticeForm,
    onCloseNoticeForm,
    onOpenNoticeDetail,
    onEditNotice,
    onDeleteNotice,
    getNoticeTypeLabel,
    getNoticeOrderLabel,
    getNoticeDateLabel,
    getDisplayNoticeTitle,
  }
}
