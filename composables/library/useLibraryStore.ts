import type {
  LibraryCategory,
  LibraryCard,
  CategoryCardsMap,
  LibrarySearchOption,
  LibraryCardDetail,
  LibraryCardOrderPayload,
} from '~/types/library'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useLibraryApi } from '~/composables/library/useLibraryApi'
const {
  fetchCategoryList,
  fetchCardList,
  fetchArchiveCardList,
  fetchCardDetail,
  fetchUpdateCardPin,
  fetchSaveCard,
  fetchSaveCategory,
  fetchDeleteCategory,
  fetchUpdateCategoryOrder,
  fetchUpdateCardOrder,
  fetchMoveCard,
} = useLibraryApi()

const isLoading = ref(false)
const errorMessage = ref('')

const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isRenameModalOpen = ref(false)
const isMoveModalOpen = ref(false)

/** 정렬 옵션 목록 */
export const searchOptions: LibrarySearchOption[] = [
  { label: '직접설정순', value: 'custom' },
  { label: '최신순', value: 'latest' },
  { label: '이름순', value: 'name' },
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
const archiveCardList = ref<LibraryCard[]>([])

const categoryListBeforeDrag = ref<LibraryCategory[]>([]) // 카테고리 드래그 시작 시점 순서 (취소 시 복원용)
const categoryCardsBeforeDrag = ref<CategoryCardsMap>({}) // 카드 드래그 시작 시점 순서 (취소 시 복원용)
const renamingCategory = ref<LibraryCategory | null>(null)
const movingCard = ref<LibraryCard | null>(null)
const selectedCardId = ref<string | null>(null)
const selectedCard = ref<LibraryCardDetail | null>(null)
const newCategoryNm = ref('')

/** cardId가 속한 카테고리를 제외한 카테고리 목록 (이동 모달용) */
const moveTargetOptions = computed(() => {
  const card = movingCard.value
  if (!card) return []
  return categoryList.value
    .filter((cat) => String(cat.categoryId) !== String(card.categoryId))
    .map((cat) => ({ label: cat.categoryNm, value: cat.categoryId }))
})

/** cardList를 categoryId 기준으로 그룹핑하여 CategoryCardsMap 반환 */
const mapCardListToCategoryCards = (cards: LibraryCard[]): CategoryCardsMap =>
  cards.reduce<CategoryCardsMap>((acc, card) => {
    const key = String(card.categoryId)
    if (!acc[key]) acc[key] = []
    acc[key].push(card)
    return acc
  }, {})

export const useLibraryStore = () => {
  /** 카테고리 목록 조회 */
  const handleFetchCategoryList = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const response = await fetchCategoryList()
      categoryList.value = response.dataList ?? []
      await handleFetchCardList() // 카드 목록 조회
      await handleFetchArchiveCardList() // 보관된 카드 목록 조회
    } catch {
      errorMessage.value = '카테고리 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 카테고리 추가 */
  const handleAddCategory = async () => {
    if (!newCategoryNm.value) {
      openAlert({ message: '카테고리명을 입력해주세요.' })
      return
    }
    try {
      isLoading.value = true
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
          openAlert({ message: '카테고리가 추가되었습니다.' })
        },
      })
    } catch {
      openAlert({ message: '카테고리 추가에 실패했습니다.' })
    } finally {
      isLoading.value = false
    }
  }

  /** 카드 목록 조회 */
  const handleFetchCardList = async () => {
    isLoading.value = true
    try {
      const response = await fetchCardList()
      const list = response.dataList ?? []
      cardList.value = list
      const cardsByCategory = mapCardListToCategoryCards(list)
      const merged: CategoryCardsMap = {}
      for (const cat of categoryList.value) {
        const key = String(cat.categoryId)
        merged[key] = cardsByCategory[key] ?? []
      }
      categoryCards.value = merged
    } catch {
      errorMessage.value = '카드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 보관된 카드 목록 조회 */
  const handleFetchArchiveCardList = async () => {
    isLoading.value = true
    try {
      const response = await fetchArchiveCardList()
      archiveCardList.value = response.dataList ?? []
    } catch {
      errorMessage.value = '보관된 카드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
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
    try {
      openConfirm({
        message: '카테고리를 삭제하시겠습니까?',
        onConfirm: async () => {
          if (!validateCategoryDelete(category)) return
          await fetchDeleteCategory(category)
          await handleFetchCategoryList()
          openAlert({ message: '카테고리가 삭제되었습니다.' })
        },
      })
    } catch {
      openAlert({ message: '카테고리 삭제에 실패했습니다.' })
    }
  }

  /** 카테고리 삭제 유효성 검사 */
  const validateCategoryDelete = (category: LibraryCategory) => {
    if (categoryCards.value[category.categoryId]?.length > 0) {
      openAlert({ message: '하위 카드가 있는 카테고리는 삭제할 수 없습니다. 카드를 먼저 삭제해주세요.' })
      return false
    }
    return true
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
        openAlert({ message: '카드가 이동되었습니다.' })
        handleMoveModalClose()
      },
    })
  }

  /** 카테고리명 변경 저장 */
  const handleSaveRename = async (categoryNm: string) => {
    if (!renamingCategory.value) {
      openAlert({ message: '카테고리를 선택해주세요.' })
      return
    }
    try {
      openConfirm({
        message: '카테고리명을 변경하시겠습니까?',
        onConfirm: async () => {
          isLoading.value = true
          await fetchSaveCategory({ ...renamingCategory.value, categoryNm: categoryNm } as LibraryCategory)
          await handleFetchCategoryList()
          handleRenameModalClose()
          openAlert({ message: '카테고리명 변경되었습니다.' })
        },
      })
    } catch {
      openAlert({ message: '카테고리명 변경에 실패했습니다.' })
    } finally {
      isLoading.value = false
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
        openAlert({ message: '카테고리 순서가 변경되었습니다.' })
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
  const handleDeleteCard = async (card: LibraryCard) => {
    openConfirm({
      message: '카드를 삭제하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, useYn: 'N' })
        await handleFetchCardList()
        openAlert({ message: '카드가 삭제되었습니다.\n 삭제된 카드는 휴지통에서 확인할 수 있습니다.' })
      },
    })
  }

  /** 답변 복사 */
  const handleCopyAnswer = async (card: LibraryCard) => {
    const response = await fetchCardDetail(card.cardId)
    navigator.clipboard.writeText(response.data.rcontent)
    openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
  }

  /** 카드 보관 */
  const handleArchiveCard = async (card: LibraryCard) => {
    openConfirm({
      message: '카드를 보관하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, archiveYn: 'Y' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 보관되었습니다.' })
      },
    })
  }

  /** 카드 보관해제 */
  const handleUnarchiveCard = async (card: LibraryCard) => {
    openConfirm({
      message: '카드를 보관해제하시겠습니까?',
      onConfirm: async () => {
        await fetchSaveCard({ ...card, archiveYn: 'N' })
        await handleFetchCategoryList()
        openToast({ message: '카드가 보관해제되었습니다.' })
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
        await fetchUpdateCardOrder(payload as LibraryCardOrderPayload[])
        await handleFetchCardList()
        openAlert({ message: '카드 순서가 변경되었습니다.' })
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
      openAlert({ message: `즐겨찾기가 ${nextPinYn === 'Y' ? '등록되었습니다.' : '해제되었습니다.'}` })
    } catch {
      openAlert({ message: '즐겨찾기 등록/해제를 실패했습니다. 다시 시도해주세요.' })
    }
  }

  /** 카드 상세 모달 열기 */
  const openModal = async (cardId: string) => {
    try {
      selectedCardId.value = cardId
      const response = await fetchCardDetail(cardId)
      selectedCard.value = response.data
    } catch {
      errorMessage.value = '카드 상세를 불러오는데 실패했습니다.'
    }

    isModalOpen.value = true
  }

  /** 카드 상세 모달 닫기 */
  const handleModalClose = () => {
    isModalOpen.value = false
    selectedCardId.value = null
  }

  const handleModalRefresh = () => {
    // TODO: 새로고침 로직
  }

  const handleModalDelete = () => {
    // TODO: 삭제 로직
    isModalOpen.value = false
    selectedCardId.value = null
  }

  const handleTrashDeleteConfirm = () => {
    // TODO: 백엔드 연결 시 fetchDeleteTrashAll 호출
  }

  return {
    categoryList,
    categoryCards,
    cardList,
    archiveCardList,
    searchOptions,
    isLoading,
    errorMessage,
    listMenuItems,
    getCardMenuItems,
    isModalOpen,
    isArchiveModalOpen,
    isRenameModalOpen,
    isMoveModalOpen,
    renamingCategory,
    movingCard,
    moveTargetOptions,
    selectedCardId,
    selectedCard,
    newCategoryNm,
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
    handleModalRefresh,
    handleModalDelete,
    handleTrashDeleteConfirm,
  }
}
