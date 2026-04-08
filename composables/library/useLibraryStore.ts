import type {
  LibraryCategory,
  LibraryCard,
  CategoryCardsMap,
  LibrarySearchOption,
  DocItem,
  LibraryCardDetail,
  LibraryCardOrderPayload,
  TableDataItem,
  ChartStatItem,
  ChartDetailCdItem,
  LibraryGeneratedReportValues,
} from '~/types/library'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { plainTextFromHtml } from '~/utils/global/htmlUtil'
import { useLibraryApi } from '~/composables/library/useLibraryApi'
import { useTmplApi } from '~/composables/tmpl/useTmplApi'
import type { TmplBaseInfo } from '~/types/tmpl'
const {
  fetchCategoryList,
  fetchCardList,
  fetchArchiveCardList,
  fetchTrashCardList,
  fetchCardDetail,
  fetchUpdateCardPin,
  fetchSaveCard,
  fetchSaveCategory,
  fetchDeleteCategory,
  fetchUpdateCategoryOrder,
  fetchUpdateCardOrder,
  fetchMoveCard,
  fetchDocList,
  fetchTableData,
  fetchChartLabel,
  fetchDeleteTrashCard,
  fetchCreateDoc,
  fetchCreateReportChatRoom,
  fetchReAskReport,
} = useLibraryApi()
const { fetchTmplList } = useTmplApi()
const errorMessage = ref('')

const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isRenameModalOpen = ref(false)
const isMoveModalOpen = ref(false)
const isTrashModalOpen = ref(false)
/** 정렬 옵션 목록 */
export const searchOptions: LibrarySearchOption[] = [
  { label: '직접설정순', value: 'custom' },
  { label: '최신순', value: 'latest' },
  { label: '이름순', value: 'name' },
  { label: '즐겨찾기순', value: 'pin' },
]

/** 카테고리 헤더 드롭다운 메뉴 아이템 */
export const listMenuItems: DropdownMenuItemDef[] = [
  { label: '이름 변경', icon: 'icon-edit', value: 'rename' },
  { label: '카테고리 삭제', icon: 'icon-trashcan', value: 'delete', color: 'danger' },
]

/** 카드 드롭다운 메뉴 아이템 (pinYn에 따라 즐겨찾기 항목 변경) */
export const getCardMenuItems = (card: LibraryCard): DropdownMenuItemDef[] => [
  { label: '상세 보기', icon: 'icon-view', value: 'view' },
  { label: '카테고리 이동', icon: 'icon-transfer', value: 'move' },
  ...(card.pinYn === 'Y'
    ? [{ label: '즐겨찾기 해제', icon: 'icon-star-fill', value: 'favorite-remove' as const }]
    : [{ label: '즐겨찾기 등록', icon: 'icon-star-line', value: 'favorite-add' as const }]),
  { label: '답변 복사', icon: 'icon-copy-gray', value: 'copy' },
  { label: '보관', icon: 'icon-archive', value: 'archive' },
  { label: '삭제', icon: 'icon-delete', value: 'delete', color: 'danger' },
]

const categoryList = ref<LibraryCategory[]>([])
const categoryCards = ref<CategoryCardsMap>({})
const cardList = ref<LibraryCard[]>([])
const archiveCardList = ref<LibraryCardDetail[]>([])
const trashCardList = ref<LibraryCardDetail[]>([])
const categoryListBeforeDrag = ref<LibraryCategory[]>([]) // 카테고리 드래그 시작 시점 순서 (취소 시 복원용)
const categoryCardsBeforeDrag = ref<CategoryCardsMap>({}) // 카드 드래그 시작 시점 순서 (취소 시 복원용)
const renamingCategory = ref<LibraryCategory | null>(null)
const movingCard = ref<LibraryCard | null>(null)
const selectedCardId = ref<string | null>(null)
const selectedCard = ref<LibraryCardDetail | null>(null)
const refItems = ref<DocItem[]>([]) // 참조 매뉴얼 목록
const tableData = ref<TableDataItem | null>(null) // 테이블 데이터 목록
const chartStatItems = ref<ChartStatItem[]>([]) // 차트 통계 항목 목록 TODO : 프로토타입 시연용
const chartDetailCdItems = ref<ChartDetailCdItem[]>([]) // 차트 상세 코드 항목 목록 TODO : 프로토타입 시연용
const newCategoryNm = ref('')
const searchTitle = ref('')
const searchSort = ref('custom')

const tmplList = ref<TmplBaseInfo[]>([])

const isCreateDocModalOpen = ref(false)
const isCreateDocReportOpen = ref(false)
const generatedReport = ref<LibraryGeneratedReportValues>({})
const selectedCreateDocTmplNm = ref('')
const roomId = ref('')
const reportRefineCompletedAt = ref(0)

/** 문서 생성 API JSON → 편집용 flat 문자열 (HTML 제거, 비문자 값은 문자열화) */
const normalizeGeneratedReport = (data: Record<string, unknown>): LibraryGeneratedReportValues => {
  const out: LibraryGeneratedReportValues = {}
  for (const key of Object.keys(data)) {
    const v = data[key]
    if (v === null || v === undefined) {
      out[key] = ''
      continue
    }
    if (typeof v === 'string') {
      out[key] = /<[^>]+>/.test(v) ? plainTextFromHtml(v) : v
      continue
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      out[key] = String(v)
      continue
    }
    out[key] = JSON.stringify(v)
  }
  return out
}

/** cardId가 속한 카테고리를 제외한 카테고리 목록 (이동 모달용) */
const moveTargetOptions = computed(() => {
  const card = movingCard.value
  if (!card) return []
  return [
    { label: '선택', value: '' },
    ...categoryList.value
      .filter((cat) => String(cat.categoryId) !== String(card.categoryId))
      .map((cat) => ({ label: cat.categoryNm, value: cat.categoryId })),
  ]
})

/** cardList를 categoryId 기준으로 그룹핑하여 CategoryCardsMap 반환 */
const mapCardListToCategoryCards = (cards: LibraryCard[]): CategoryCardsMap =>
  cards.reduce<CategoryCardsMap>((acc, card) => {
    const key = String(card.categoryId)
    if (!acc[key]) acc[key] = []
    acc[key].push(card)
    return acc
  }, {})

/** 열려 있는 모든 모달을 닫고 모달 관련 상태 초기화 */
const initModalStates = () => {
  isModalOpen.value = false
  isArchiveModalOpen.value = false
  isRenameModalOpen.value = false
  isMoveModalOpen.value = false
  isTrashModalOpen.value = false
  renamingCategory.value = null
  movingCard.value = null
  selectedCardId.value = null
  selectedCard.value = null
}

/** cardList·categoryCards에 있는 동일 카드의 newYn만 동기화 */
const patchCardNewYnInLists = (id: string, categoryId: number, newYn: 'Y' | 'N') => {
  const row = cardList.value.find((c) => c.cardId === id)
  if (row) row.newYn = newYn
  const rowInCat = categoryCards.value[String(categoryId)]?.find((c) => c.cardId === id)
  if (rowInCat) rowInCat.newYn = newYn
}

export const useLibraryStore = () => {
  /** 카테고리 목록 조회 */
  const handleFetchCategoryList = async () => {
    initModalStates()
    errorMessage.value = ''
    try {
      openLoading({ text: '내 지식창고를 불러오는 중...' })
      const response = await fetchCategoryList()
      categoryList.value = response.dataList ?? []
      await handleFetchCardList() // 카드 목록 조회
      await handleFetchArchiveCardList() // 보관된 카드 목록 조회
      await handleFetchTrashCardList() // 휴지통 카드 목록 조회
    } catch {
      errorMessage.value = '카테고리 목록을 불러오는데 실패했습니다.'
    } finally {
      closeLoading()
    }
  }

  /** 카테고리 추가 */
  const handleAddCategory = async () => {
    if (!newCategoryNm.value) {
      openToast({ message: '카테고리명을 입력해주세요.', type: 'error' })
      return
    }
    try {
      openConfirm({
        message: '카테고리를 추가하시겠습니까?',
        onConfirm: async () => {
          const newCategory: LibraryCategory = {
            categoryId: '',
            categoryNm: newCategoryNm.value,
            userId: '',
            color: '',
            sortOrd: 0, // 등록 시 0으로 설정 (api에서 max+1 처리)
            createDt: '',
          }
          await fetchSaveCategory(newCategory)
          newCategoryNm.value = ''
          await handleFetchCategoryList()
          openToast({ message: '카테고리가 추가되었습니다.', type: 'success' })
        },
      })
    } catch {
      openToast({ message: '카테고리 추가에 실패했습니다.', type: 'error' })
    }
  }

  /** 카드 목록 조회 */
  const handleFetchCardList = async () => {
    initModalStates()
    try {
      openLoading({ text: '카드 목록을 불러오는 중...' })
      const response = await fetchCardList(searchTitle.value, searchSort.value)
      const list = response.dataList ?? []
      cardList.value = list
      const cardsByCategory = mapCardListToCategoryCards(list)
      const merged: CategoryCardsMap = {}
      for (const cat of categoryList.value) {
        const key = String(cat.categoryId)
        merged[key] = cardsByCategory[key] ?? []
      }
      categoryCards.value = merged
      closeLoading()
    } catch {
      errorMessage.value = '카드 목록을 불러오는데 실패했습니다.'
    }
  }

  /** 보관된 카드 목록 조회 */
  const handleFetchArchiveCardList = async () => {
    try {
      const response = await fetchArchiveCardList()
      archiveCardList.value = response.dataList ?? []
    } catch {
      errorMessage.value = '보관된 카드 목록을 불러오는데 실패했습니다.'
    }
  }

  /** 휴지통 카드 목록 조회 */
  const handleFetchTrashCardList = async () => {
    try {
      const response = await fetchTrashCardList()
      trashCardList.value = response.dataList ?? []
    } catch {
      errorMessage.value = '휴지통 카드 목록을 불러오는데 실패했습니다.'
    }
  }

  /** 카테고리 메뉴 선택 */
  const handleListMenuSelect = (category: LibraryCategory, value: string) => {
    if (value === 'rename') {
      renamingCategory.value = { ...category }
      isRenameModalOpen.value = true
    } else if (value === 'delete') {
      handleDeleteCategory(category)
    }
  }

  /** 카테고리 삭제 */
  const handleDeleteCategory = (category: LibraryCategory) => {
    const valid = validateCategoryDelete(category)
    if (!valid.isValid) {
      openToast({ message: valid.message, type: 'error' })
      return
    }
    try {
      openConfirm({
        message: '카테고리를 삭제하시겠습니까?',
        onConfirm: async () => {
          openLoading({ text: '카테고리를 삭제하는 중...' })
          const response = await fetchDeleteCategory(category)
          closeLoading()
          if (response.result === 'SUCCESS') {
            openToast({ message: '카테고리가 삭제되었습니다.', type: 'success' })
            await handleFetchCategoryList()
          } else {
            openToast({ message: response.msg, type: 'error' })
          }
        },
      })
    } catch {
      openToast({ message: '카테고리 삭제에 실패했습니다.', type: 'error' })
    }
  }

  /** 카테고리 삭제 유효성 검사 */
  const validateCategoryDelete = (category: LibraryCategory) => {
    let message = ''
    let isValid = true
    if (categoryList.value.length <= 1) {
      message = '카테고리는 최소 1개 이상이어야 합니다.'
      isValid = false
    }
    if (categoryCards.value[category.categoryId]?.length > 0) {
      message = '카드가 있는 카테고리는 삭제할 수 없습니다. \n카드를 먼저 삭제해주세요.'
      isValid = false
    }
    return { message: message ?? '', isValid: isValid }
  }

  /** 카테고리명 변경 모달 닫기 */
  const handleRenameModalClose = () => {
    isRenameModalOpen.value = false
    renamingCategory.value = null
  }

  /** 카드 이동 모달 닫기 */
  const handleMoveModalClose = () => {
    isMoveModalOpen.value = false
    movingCard.value = null
  }

  /** 카드 이동 실행 */
  const handleMoveCard = async (_targetCategoryId: string, _cardId: string) => {
    if (!movingCard.value) return
    openConfirm({
      message: '카드를 이동하시겠습니까?',
      onConfirm: async () => {
        await fetchMoveCard(_targetCategoryId, _cardId)
        await handleFetchCardList()
        openToast({ message: '카드가 이동되었습니다.', type: 'success' })
        handleMoveModalClose()
      },
    })
  }

  /** 카테고리명 변경 저장 */
  const handleSaveRename = async (categoryNm: string) => {
    if (!renamingCategory.value) {
      openToast({ message: '카테고리를 선택해주세요.', type: 'error' })
      return
    }
    try {
      openConfirm({
        message: '카테고리명을 변경하시겠습니까?',
        onConfirm: async () => {
          await fetchSaveCategory({ ...renamingCategory.value, categoryNm: categoryNm } as LibraryCategory)
          await handleFetchCategoryList()
          handleRenameModalClose()
          openToast({ message: '카테고리명 변경되었습니다.', type: 'success' })
        },
      })
    } catch {
      openToast({ message: '카테고리명 변경에 실패했습니다.', type: 'error' })
    }
  }

  /** 카테고리 드래그 시작 시 순서 저장 (취소 시 복원용) */
  const onCategoryDragStart = () => {
    categoryListBeforeDrag.value = [...categoryList.value]
  }

  /** 카테고리 드래그 종료 시 순서 변경 */
  const onCategoryDragEnd = () => {
    openConfirm({
      message: '카테고리 순서를 변경하시겠습니까?',
      onConfirm: async () => {
        const orderData = categoryList.value.map((item, index) => ({ categoryId: item.categoryId, sortOrd: index + 1 }))
        await fetchUpdateCategoryOrder(orderData)
        await handleFetchCategoryList()
        openToast({ message: '카테고리 순서가 변경되었습니다.', type: 'success' })
      },
      onCancel: () => {
        categoryList.value = [...categoryListBeforeDrag.value]
      },
    })
  }

  /** 카드 메뉴 선택 */
  const handleCardMenuSelect = (card: LibraryCard, value: string) => {
    if (value === 'view') {
      openModal(card.cardId)
    } else if (value === 'move') {
      movingCard.value = { ...card }
      isMoveModalOpen.value = true
    } else if (value === 'favorite-add') {
      handleCardPin({ ...card, pinYn: 'N' }) // 즐겨찾기 등록 -> pinYn 반대로 세팅
    } else if (value === 'favorite-remove') {
      handleCardPin({ ...card, pinYn: 'Y' }) // 즐겨찾기 해제 -> pinYn 반대로 세팅
    } else if (value === 'copy') {
      handleCopyAnswer(card)
    } else if (value === 'archive') {
      handleArchiveCard(card)
    } else if (value === 'delete') {
      handleDeleteCard(card)
    }
  }

  /** 카드 삭제 */
  const handleDeleteCard = async (card: LibraryCard | LibraryCardDetail) => {
    openConfirm({
      message: '카드를 삭제하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, useYn: 'N', thumbImg: '' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 삭제되었습니다.\n 삭제된 카드는 휴지통에서 확인할 수 있습니다.', type: 'success' })
      },
    })
  }

  /** 답변 복사 */
  const handleCopyAnswer = async (card: LibraryCard) => {
    const response = await fetchCardDetail(card.cardId)
    await copyToClipboard(response.data.rcontent)
    openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
  }

  /** 카드 보관 */
  const handleArchiveCard = async (card: LibraryCard) => {
    openConfirm({
      message: '카드를 보관하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, archiveYn: 'Y', thumbImg: '' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 보관되었습니다.', type: 'success' })
      },
    })
  }

  /** 카드 보관해제 */
  const handleUnarchiveCard = async (card: LibraryCard) => {
    openConfirm({
      message: '카드를 보관해제하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, archiveYn: 'N', thumbImg: '' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 보관해제되었습니다.', type: 'success' })
        isArchiveModalOpen.value = false
      },
    })
  }

  /** 카드 드래그 시작 시 순서 저장 (취소 시 복원용) */
  const onCardDragStart = () => {
    const copy: CategoryCardsMap = {}
    for (const [k, v] of Object.entries(categoryCards.value)) {
      copy[k] = [...v]
    }
    categoryCardsBeforeDrag.value = copy
  }

  /** 카드 드래그 종료 시 순서 변경 */
  const onCardDragEnd = () => {
    openConfirm({
      message: '카드 순서를 변경하시겠습니까?',
      onConfirm: async () => {
        const payload = categoryList.value.map((cat) => ({
          categoryId: cat.categoryId,
          cards: (categoryCards.value[cat.categoryId] || []).map((card, index) => ({
            cardId: card.cardId,
            sortOrd: index + 1,
          })),
        }))
        openLoading({ text: '카드 순서를 변경하는 중...' })
        await fetchUpdateCardOrder(payload as LibraryCardOrderPayload[])
        await handleFetchCardList()
        openToast({ message: '카드 순서가 변경되었습니다.', type: 'success' })
        closeLoading()
      },
      onCancel: () => {
        const restored: CategoryCardsMap = {}
        for (const [k, v] of Object.entries(categoryCardsBeforeDrag.value)) {
          restored[k] = [...v]
        }
        categoryCards.value = restored
      },
    })
  }

  /** 즐겨찾기 등록/해제 */
  const handleCardPin = async (card: LibraryCard | LibraryCardDetail) => {
    try {
      const nextPinYn = card.pinYn === 'Y' ? 'N' : 'Y'
      await fetchUpdateCardPin(card.cardId, nextPinYn)
      // cardList 업데이트
      const idx = cardList.value.findIndex((c) => c.cardId === card.cardId)
      if (idx !== -1) cardList.value[idx].pinYn = nextPinYn

      // categoryCards 업데이트
      const catKey = String(card.categoryId)
      const catCards = categoryCards.value[catKey]
      if (catCards) {
        const cardIdx = catCards.findIndex((c) => c.cardId === card.cardId)
        if (cardIdx !== -1) catCards[cardIdx].pinYn = nextPinYn
      }

      // 상세 모달에 열린 카드 업데이트
      if (selectedCard.value?.cardId === card.cardId) {
        selectedCard.value.pinYn = nextPinYn
      }
      openToast({ message: `즐겨찾기가 ${nextPinYn === 'Y' ? '등록되었습니다.' : '해제되었습니다.'}`, type: 'success' })
    } catch {
      openToast({ message: '즐겨찾기 등록/해제를 실패했습니다. 다시 시도해주세요.', type: 'error' })
    }
  }

  /** 카드 상세 모달 열기 */
  const openModal = async (cardId: string) => {
    try {
      openLoading({ text: '카드 상세정보를 불러오는 중...' })
      selectedCardId.value = cardId
      const response = await fetchCardDetail(cardId)
      selectedCard.value = response.data

      // 조회 시 카드 newYn → 'N' (목록·그리드 카드와 동기화)
      if (selectedCard.value?.newYn === 'Y') {
        await fetchSaveCard({ ...selectedCard.value, newYn: 'N', thumbImg: '' })
        selectedCard.value = { ...selectedCard.value, newYn: 'N' }
        patchCardNewYnInLists(cardId, selectedCard.value.categoryId, 'N')
      }

      // 통계 데이터 조회
      if (selectedCard.value?.svcTy === 'S') {
        const response = await fetchTableData(selectedCard.value)
        tableData.value = response.data ?? null
        const chartResponse = await fetchChartLabel(selectedCard.value.logId)
        chartStatItems.value = chartResponse.statList ?? []
        chartDetailCdItems.value = chartResponse.detailCdList ?? []
      }
      // 매뉴얼 참조 문서 조회
      if (selectedCard.value?.svcTy === 'M') {
        const response = await fetchDocList(selectedCard.value)
        refItems.value = response.dataList ?? []
      }
      isModalOpen.value = true
    } catch {
      errorMessage.value = '카드 상세를 불러오는데 실패했습니다.'
    } finally {
      closeLoading()
    }
  }

  /** 카드 상세 모달 닫기 */
  const handleModalClose = () => {
    isModalOpen.value = false
    selectedCardId.value = null
    selectedCard.value = null
  }

  const handleModalMove = (card: LibraryCardDetail) => {
    movingCard.value = { ...card }
    isMoveModalOpen.value = true
  }

  const handleModalDelete = (card: LibraryCardDetail | null) => {
    if (!card) return
    handleDeleteCard(card)
  }

  /** 휴지통 모달 닫기 */
  const handleTrashModalClose = () => {
    isTrashModalOpen.value = false
  }

  /** 휴지통에서 카드 복원 */
  const handleRestoreCard = async (card: LibraryCardDetail) => {
    openConfirm({
      message: '카드를 복원하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, useYn: 'Y', thumbImg: '' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 복원되었습니다.', type: 'success' })
        isTrashModalOpen.value = false
      },
    })
  }

  /** 휴지통 비우기 */
  const handleEmptyTrash = async () => {
    if (trashCardList.value.length === 0) {
      openToast({ message: '휴지통이 비어있습니다.', type: 'warning' })
      return
    }
    openConfirm({
      message: '휴지통을 비우시겠습니까?',
      onConfirm: async () => {
        try {
          await fetchDeleteTrashCard()
          await handleFetchCategoryList()
          openToast({ message: '휴지통을 비웠습니다.', type: 'success' })
        } catch {
          openToast({ message: '휴지통 비우기에 실패했습니다.', type: 'error' })
        }
      },
    })
  }

  /** 템플릿 목록 조회 */
  const handleSelectTmplList = async () => {
    try {
      const res = await fetchTmplList()
      tmplList.value = res.dataList ?? []
    } catch {
      openToast({ message: '템플릿 목록 조회 실패', type: 'error' })
    }
  }

  /** 문서 만들기 — 유형 선택 모달 닫기 */
  const handleCreateDocTypeModalClose = () => {
    isCreateDocModalOpen.value = false
  }

  /** 문서 생성하기 — 로딩 → API 응답 → 보고서 모달 */
  const handleCreateDocGenerate = async (payload: { cardId: string; tmplId: string }) => {
    const { cardId, tmplId } = payload
    if (!cardId?.trim() || !tmplId?.trim()) {
      openToast({ message: '카드 또는 템플릿 정보가 없습니다.', type: 'warning' })
      return
    }

    isCreateDocModalOpen.value = false
    generatedReport.value = {}
    selectedCreateDocTmplNm.value = tmplList.value.find((tmpl) => tmpl.tmplId === tmplId)?.tmplNm ?? ''
    openLoading({
      text: 'AI가 문서를 작성 중입니다...',
      isDy: true,
      intervalMs: 3000,
      dyTexts: [
        'AI가 문서를 꼼꼼히 읽고 있어요...',
        '좋은 문장으로 정리 중입니다...',
        '핵심 내용을 뽑아내는 중입니다...',
        '내용을 정리하는 중입니다...',
        '완성도를 높이는 중입니다...',
      ],
    })

    try {
      await handleCreateReportChatRoom()
      await nextTick()
      const res = await fetchCreateDoc(cardId, tmplId, roomId.value)
      const answer = res.data
      if (answer) {
        try {
          const parsed = JSON.parse(answer) as unknown
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            generatedReport.value = normalizeGeneratedReport(parsed as Record<string, unknown>)
          } else {
            generatedReport.value = {}
          }
        } catch {
          generatedReport.value = {}
        }
      }
      closeLoading()
      await nextTick()
      openToast({ message: `'${selectedCreateDocTmplNm.value}' 문서를 생성했습니다.`, type: 'success' })
      isCreateDocReportOpen.value = true
      await nextTick()
      reportRefineCompletedAt.value = Date.now()
    } catch {
      openToast({ message: '문서 생성 실패', type: 'error' })
      closeLoading()
    }
  }

  /** 보고서 보완 요청 */
  const handleReAskReport = async (message: string) => {
    try {
      openLoading({
        text: 'AI가 문서를 보완 중입니다...',
        isDy: true,
        intervalMs: 3000,
        dyTexts: [
          'AI가 문서를 꼼꼼히 읽고 있어요...',
          '사용자의 요청을 반영하는 중입니다...',
          '문서를 수정하는 중입니다...',
          '거의 다 완성되었습니다...',
          '완성도를 높이는 중입니다...',
        ],
      })

      const res = await fetchReAskReport(roomId.value, message, generatedReport.value as Record<string, unknown>)
      const answer = res.data
      if (answer) {
        try {
          const parsed = JSON.parse(answer) as unknown
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            generatedReport.value = normalizeGeneratedReport(parsed as Record<string, unknown>)
            reportRefineCompletedAt.value = Date.now()
          }
          openToast({ message: '보고서 보완을 완료했습니다.', type: 'success' })
        } catch {
          openToast({ message: '보고서 보완 요청 결과를 분석하는데 실패했습니다. 다시 시도해주세요.', type: 'error' })
        }
      }
      closeLoading()
    } catch {
      openToast({ message: '보고서 보완 요청 실패', type: 'error' })
    }
  }

  /** 보고서 채팅방 생성 */
  const handleCreateReportChatRoom = async () => {
    try {
      const res = await fetchCreateReportChatRoom()
      roomId.value = res.roomId
    } catch {
      openToast({ message: '채팅방 생성 실패', type: 'error' })
    }
  }

  const handleCreateDocReportClose = () => {
    isCreateDocReportOpen.value = false
    generatedReport.value = {}
    selectedCreateDocTmplNm.value = ''
    roomId.value = ''
    reportRefineCompletedAt.value = 0
  }

  /** 상세 모달 닫을 때 문서 만들기 관련 상태 초기화 */
  const resetLibraryDetailCreateDocUi = () => {
    isCreateDocModalOpen.value = false
    isCreateDocReportOpen.value = false
    generatedReport.value = {}
    selectedCreateDocTmplNm.value = ''
    roomId.value = ''
    reportRefineCompletedAt.value = 0
  }

  /** 보고서 모달에서 다른 유형 선택 */
  const handleCreateDocSelectOtherType = () => {
    isCreateDocReportOpen.value = false
    generatedReport.value = {}
    selectedCreateDocTmplNm.value = ''
    roomId.value = ''
    reportRefineCompletedAt.value = 0
    handleSelectTmplList()
    isCreateDocModalOpen.value = true
  }

  return {
    categoryList,
    categoryCards,
    cardList,
    archiveCardList,
    trashCardList,
    searchOptions,
    errorMessage,
    listMenuItems,
    getCardMenuItems,
    isModalOpen,
    isArchiveModalOpen,
    isTrashModalOpen,
    isRenameModalOpen,
    isMoveModalOpen,
    renamingCategory,
    movingCard,
    moveTargetOptions,
    selectedCardId,
    selectedCard,
    newCategoryNm,
    searchTitle,
    searchSort,
    refItems,
    tableData,
    chartStatItems,
    chartDetailCdItems,
    handleFetchCategoryList,
    handleFetchCardList,
    handleAddCategory,
    handleListMenuSelect,
    handleRenameModalClose,
    handleSaveRename,
    handleMoveModalClose,
    handleMoveCard,
    handleCardMenuSelect,
    onCategoryDragStart,
    onCategoryDragEnd,
    onCardDragStart,
    onCardDragEnd,
    handleUnarchiveCard,
    handleCardPin,
    openModal,
    handleModalClose,
    handleModalDelete,
    handleModalMove,
    handleTrashModalClose,
    handleRestoreCard,
    handleEmptyTrash,
    handleSelectTmplList,
    tmplList,
    isCreateDocModalOpen,
    isCreateDocReportOpen,
    generatedReport,
    reportRefineCompletedAt,
    selectedCreateDocTmplNm,
    handleCreateDocTypeModalClose,
    handleCreateDocGenerate,
    handleCreateDocReportClose,
    resetLibraryDetailCreateDocUi,
    handleCreateDocSelectOtherType,
    handleReAskReport,
  }
}
