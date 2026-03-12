import type {
  LibraryCategory,
  LibraryCard,
  CategoryCardsMap,
  LibrarySearchOption,
  LibraryCardDetail,
} from '~/types/library'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useLibraryApi } from '~/composables/library/useLibraryApi'
const { fetchCategoryList, fetchCardList, fetchCardDetail, fetchUpdateCardPin, fetchSaveCategory } = useLibraryApi()

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

/** 카드 드롭다운 메뉴 아이템 */
export const cardMenuItems: DropdownMenuItemDef[] = [
  { label: '상세 보기', icon: 'icon-view', value: 'view' },
  { label: '카테고리 이동', icon: 'icon-transfer', value: 'move' },
  { label: '즐겨찾기 등록', icon: 'icon-star-line', value: 'favorite-add' },
  { label: '즐겨찾기 해제', icon: 'icon-star-fill', value: 'favorite-remove' },
  { label: '답변 복사', icon: 'icon-copy-gray', value: 'copy' },
  { label: '보관', icon: 'icon-archive', value: 'archive' },
  { label: '삭제', icon: 'icon-delete', value: 'delete', color: 'danger' },
]

const categoryList = ref<LibraryCategory[]>([])
const categoryCards = ref<CategoryCardsMap>({})
const cardList = ref<LibraryCard[]>([])

const isLoading = ref(false)
const errorMessage = ref('')
const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isRenameModalOpen = ref(false)
const renamingCategory = ref<LibraryCategory | null>(null)
const selectedCardId = ref<string | null>(null)
const selectedCard = ref<LibraryCardDetail | null>(null)
const newCategoryNm = ref('')

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
      await handleFetchCardList()
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
            sortOrd: 0, // 등록 시 0으로 설정
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

  /** 해당 카테고리에 새 카드 추가 */
  const handleAddCard = (categoryId: number) => {
    // TODO: 백엔드 연결 시 해당 카테고리에 카드 추가 API 호출
    console.warn('[TODO] 카드 추가:', categoryId)
  }

  /** 카드 목록 조회 */
  const handleFetchCardList = async () => {
    isLoading.value = true
    try {
      const response = await fetchCardList()
      const list = response.dataList ?? []
      cardList.value = list
      categoryCards.value = mapCardListToCategoryCards(list)
    } catch {
      errorMessage.value = '카드 목록을 불러오는데 실패했습니다.'
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
      // TODO: 카테고리 삭제
    }
  }

  /** 카테고리명 변경 모달 닫기 */
  const handleRenameModalClose = () => {
    isRenameModalOpen.value = false
    renamingCategory.value = null
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

  const handleCardMenuSelect = (cardId: string, value: string) => {
    // TODO: 백엔드 연결 시 cardId와 value에 따라 API 호출로 교체
    console.warn('[TODO] 카드 메뉴 선택:', cardId, value)
  }

  const onCategoryDragEnd = () => {
    const orderData = categoryList.value.map((item, index) => ({ categoryId: item.categoryId, order: index }))
    // TODO: 백엔드 연결 시 fetchUpdateCategoryOrder 호출
    console.warn('[TODO] 카테고리 순서 변경:', orderData)
  }

  const onCardDragEnd = () => {
    const allCards = categoryList.value.map((cat) => ({
      categoryId: cat.categoryId,
      cards: (categoryCards.value[cat.categoryId] || []).map((card, index) => ({
        cardId: card.cardId,
        sortOrd: index,
      })),
    }))
    // TODO: 백엔드 연결 시 fetchUpdateCardOrder 호출
    console.warn('[TODO] 카드 순서 변경:', allCards)
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
    } catch {
      errorMessage.value = '즐겨찾기 등록/해제를 실패했습니다.'
    }
  }

  /** 카드 상세 모달 열기 */
  const openModal = async (cardId: string) => {
    try {
      selectedCardId.value = cardId
      const response = await fetchCardDetail(cardId, '')
      selectedCard.value = response.data
    } catch {
      errorMessage.value = '카드 상세를 불러오는데 실패했습니다.'
    }

    isModalOpen.value = true
  }

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
    searchOptions,
    isLoading,
    errorMessage,
    listMenuItems,
    cardMenuItems,
    isModalOpen,
    isArchiveModalOpen,
    isRenameModalOpen,
    renamingCategory,
    selectedCardId,
    selectedCard,
    newCategoryNm,
    handleFetchCategoryList,
    handleFetchCardList,
    handleAddCategory,
    handleAddCard,
    handleListMenuSelect,
    handleRenameModalClose,
    handleSaveRename,
    handleCardMenuSelect,
    onCategoryDragEnd,
    onCardDragEnd,
    handleCardPin,
    openModal,
    handleModalClose,
    handleModalRefresh,
    handleModalDelete,
    handleTrashDeleteConfirm,
  }
}
