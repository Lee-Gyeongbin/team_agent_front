import type { LibraryCategory, LibraryCard, CategoryCardsMap, LibrarySearchOption } from '~/types/library'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useLibraryApi } from '~/composables/library/useLibraryApi'
const { fetchCategoryList, fetchCardList } = useLibraryApi()

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
const isTrashDeleteModalOpen = ref(false)
const selectedCardId = ref<string | null>(null)
const favoriteCardIds = ref<Set<string>>(new Set())

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

  /** 카드 목록 조회 */
  const handleFetchCardList = async () => {
    errorMessage.value = ''
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

  const handleListMenuSelect = (value: string) => {
    // TODO: 백엔드 연결 시 value에 따라 API 호출로 교체
    console.warn('[TODO] 카테고리 메뉴 선택:', value)
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
        order: index,
      })),
    }))
    // TODO: 백엔드 연결 시 fetchUpdateCardOrder 호출
    console.warn('[TODO] 카드 순서 변경:', allCards)
  }

  const toggleFavorite = (cardId: string) => {
    if (favoriteCardIds.value.has(cardId)) {
      favoriteCardIds.value.delete(cardId)
    } else {
      favoriteCardIds.value.add(cardId)
    }
  }

  const openModal = (cardId: string) => {
    selectedCardId.value = cardId
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
    isTrashDeleteModalOpen.value = false
  }

  return {
    categoryList,
    categoryCards,
    searchOptions,
    isLoading,
    errorMessage,
    listMenuItems,
    cardMenuItems,
    isModalOpen,
    isArchiveModalOpen,
    isTrashDeleteModalOpen,
    selectedCardId,
    favoriteCardIds,
    handleFetchCategoryList,
    handleFetchCardList,
    handleListMenuSelect,
    handleCardMenuSelect,
    onCategoryDragEnd,
    onCardDragEnd,
    toggleFavorite,
    openModal,
    handleModalClose,
    handleModalRefresh,
    handleModalDelete,
    handleTrashDeleteConfirm,
  }
}
