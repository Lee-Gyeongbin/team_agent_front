import type { LibraryCategory, LibraryCard, CategoryCardsMap, LibrarySearchOption } from '~/types/library'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useLibraryApi } from '~/composables/library/useLibraryApi'
const { fetchCategoryList } = useLibraryApi()

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

/** 더미 카드 생성 헬퍼 */
const createCards = (categoryId: number, count: number): LibraryCard[] =>
  Array.from({ length: count }, (_, i) => ({
    cardId: `cat${categoryId}-card${i + 1}`,
    userId: '',
    categoryId,
    logId: '',
    svcTy: '',
    title: '2025년 우리회사 월별매출액 2025년 우리회사 월별매출액',
    tags: '#보고서,#임원',
    pinYn: 'N',
    archiveYn: 'N',
    sortOrd: i + 1,
    srcDocs: '',
    sqlCode: '',
    chartCfg: '',
    qryRslt:
      '전자결재가 반려된 경우 아래 절차로 재상신할 수 있습니다. 1. [전자결재] → [수신함] 메뉴에서 반려 글자테스트',
    useYn: 'Y',
    createDt: '2026.02.16 09:20',
    modifyDt: '',
  }))

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const categoryList = ref<LibraryCategory[]>([
  { categoryId: 1, userId: '', categoryNm: '인사이트', color: '', sortOrd: 1, createDt: '' },
  { categoryId: 2, userId: '', categoryNm: '보고서', color: '', sortOrd: 2, createDt: '' },
  { categoryId: 3, userId: '', categoryNm: '매뉴얼', color: '', sortOrd: 3, createDt: '' },
  { categoryId: 4, userId: '', categoryNm: '데이터분석', color: '', sortOrd: 4, createDt: '' },
  { categoryId: 5, userId: '', categoryNm: '기타', color: '', sortOrd: 5, createDt: '' },
])

const categoryCards = ref<CategoryCardsMap>({
  1: createCards(1, 7),
  2: createCards(2, 7),
  3: createCards(3, 7),
  4: createCards(4, 7),
  5: createCards(5, 7),
})

const isLoading = ref(false)
const errorMessage = ref('')
const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isTrashDeleteModalOpen = ref(false)
const selectedCardId = ref<string | null>(null)
const favoriteCardIds = ref<Set<string>>(new Set())

export const useLibraryStore = () => {
  /** 카테고리 목록 조회 */
  const handleFetchCategoryList = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const response = await fetchCategoryList()
      categoryList.value = response.dataList ?? []
    } catch {
      errorMessage.value = '카테고리 목록을 불러오는데 실패했습니다.'
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
