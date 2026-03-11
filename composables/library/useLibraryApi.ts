import { useApi } from '~/composables/com/useApi'
import type {
  LibraryCategory,
  LibraryCard,
  CategoryCardsMap,
  LibraryCategoryOrderItem,
  LibraryCardOrderPayload,
} from '~/types/library'

export const useLibraryApi = () => {
  const { get, post } = useApi()

  /** 카테고리 목록 조회 — 백엔드 연결 시 사용 */
  const fetchCategoryList = async (): Promise<{ dataList: LibraryCategory[] }> => {
    return get<{ dataList: LibraryCategory[] }>('/library/categoryList.do')
  }

  /** 카테고리별 카드 목록 조회 — 백엔드 연결 시 사용 */
  const fetchCategoryCards = async (): Promise<{ data: CategoryCardsMap }> => {
    return get<{ data: CategoryCardsMap }>('/library/selectCategoryCards.do')
  }

  /** 카테고리 순서 변경 — 백엔드 연결 시 사용 */
  const fetchUpdateCategoryOrder = async (items: LibraryCategoryOrderItem[]): Promise<void> => {
    await post('/library/updateCategoryOrder.do', { items })
  }

  /** 카드 순서 변경 — 백엔드 연결 시 사용 */
  const fetchUpdateCardOrder = async (payload: LibraryCardOrderPayload[]): Promise<void> => {
    await post('/library/updateCardOrder.do', { payload })
  }

  /** 삭제 대기 항목 전체 삭제 — 백엔드 연결 시 사용 */
  const fetchDeleteTrashAll = async (): Promise<void> => {
    await post('/library/deleteTrashAll.do', {})
  }

  return {
    fetchCategoryList,
    fetchCategoryCards,
    fetchUpdateCategoryOrder,
    fetchUpdateCardOrder,
    fetchDeleteTrashAll,
  }
}
