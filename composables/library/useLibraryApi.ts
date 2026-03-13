import { useApi } from '~/composables/com/useApi'
import type {
  LibraryCategory,
  LibraryCard,
  LibraryCardDetail,
  LibraryCategoryOrderItem,
  LibraryCardOrderPayload,
} from '~/types/library'

export const useLibraryApi = () => {
  const { get, post } = useApi()

  /** 카테고리 목록 조회 API */
  const fetchCategoryList = async (): Promise<{ dataList: LibraryCategory[] }> => {
    return get<{ dataList: LibraryCategory[] }>('/library/categoryList.do')
  }

  /** 카테고리 등록/수정 API */
  const fetchSaveCategory = async (category: LibraryCategory): Promise<void> => {
    await post('/library/saveCategory.do', { category })
  }

  /** 카테고리 삭제 API */
  const fetchDeleteCategory = async (category: LibraryCategory): Promise<void> => {
    await post('/library/deleteCategory.do', { category })
  }

  /** 카드 목록 조회 API */
  const fetchCardList = async (): Promise<{ dataList: LibraryCard[] }> => {
    return get<{ dataList: LibraryCard[] }>('/library/cardList.do')
  }

  /** 보관된 카드 목록 조회 API */
  const fetchArchiveCardList = async (): Promise<{ dataList: LibraryCardDetail[] }> => {
    return get<{ dataList: LibraryCardDetail[] }>('/library/archiveCardList.do')
  }

  /** 삭제 대기 카드 목록 조회 API */
  const fetchTrashCardList = async (): Promise<{ dataList: LibraryCardDetail[] }> => {
    return get<{ dataList: LibraryCardDetail[] }>('/library/trashCardList.do')
  }

  /** 카드 상세 조회 API */
  const fetchCardDetail = async (cardId: string): Promise<{ data: LibraryCardDetail }> => {
    return post<{ data: LibraryCardDetail }>('/library/cardDetail.do', { cardId })
  }

  /** 카드 수정 API */
  const fetchSaveCard = async (card: LibraryCard): Promise<void> => {
    await post('/library/saveCard.do', { card })
  }

  /** 카드 즐겨찾기 등록/해제 API */
  const fetchUpdateCardPin = async (cardId: string, pinYn: 'Y' | 'N'): Promise<void> => {
    await post('/library/updateCardPin.do', { cardId, pinYn })
  }

  /** 카테고리 순서 변경 API */
  const fetchUpdateCategoryOrder = async (items: LibraryCategoryOrderItem[]): Promise<void> => {
    await post('/library/updateCategoryOrder.do', { items })
  }

  /** 카드 순서 변경 API */
  const fetchUpdateCardOrder = async (payload: LibraryCardOrderPayload[]): Promise<void> => {
    await post('/library/updateCardOrder.do', { payload })
  }

  /** 카드 이동 API */
  const fetchMoveCard = async (targetCategoryId: string, cardId: string): Promise<void> => {
    await post('/library/moveCard.do', { targetCategoryId, cardId })
  }

  /** 삭제 대기 항목 전체 삭제 — 백엔드 연결 시 사용 */
  const fetchDeleteTrashAll = async (): Promise<void> => {
    await post('/library/deleteTrashAll.do', {})
  }

  return {
    fetchCategoryList,
    fetchSaveCategory,
    fetchDeleteCategory,
    fetchCardList,
    fetchArchiveCardList,
    fetchTrashCardList,
    fetchCardDetail,
    fetchSaveCard,
    fetchUpdateCardPin,
    fetchUpdateCategoryOrder,
    fetchUpdateCardOrder,
    fetchMoveCard,
    fetchDeleteTrashAll,
  }
}
