import { useApi } from '~/composables/com/useApi'
import type {
  LibraryCategory,
  LibraryCard,
  LibraryCardDetail,
  LibraryCategoryOrderItem,
  LibraryCardOrderPayload,
  DocItem,
  TableDataItem,
  ChartStatItem,
  ChartDetailCdItem,
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
  const fetchDeleteCategory = async (category: LibraryCategory): Promise<{ result: string; msg: string }> => {
    return post<{ result: string; msg: string }>('/library/deleteCategory.do', { category })
  }

  /** 카드 목록 조회 API */
  const fetchCardList = async (searchTitle?: string, searchSort?: string): Promise<{ dataList: LibraryCard[] }> => {
    return post<{ dataList: LibraryCard[] }>('/library/cardList.do', {
      searchTitle: searchTitle ?? '',
      searchSort: searchSort ?? '',
    })
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

  /** 참조 매뉴얼 목록 조회 API */
  const fetchDocList = async (card: LibraryCardDetail): Promise<{ dataList: DocItem[] }> => {
    return post<{ dataList: DocItem[] }>('/library/docList.do', { card })
  }

  /** 테이블 데이터 조회 API */
  const fetchTableData = async (card: LibraryCardDetail): Promise<{ data: TableDataItem }> => {
    return post<{ data: TableDataItem }>('/library/tableData.do', { card })
  }

  /** 차트 라벨 목록 조회 API TODO : 프로토타입 시연용 */
  const fetchChartLabel = async (
    logId: string,
  ): Promise<{ statList: ChartStatItem[]; detailCdList: ChartDetailCdItem[] }> => {
    return post<{ statList: ChartStatItem[]; detailCdList: ChartDetailCdItem[] }>('/library/chartLabel.do', { logId })
  }

  /** 휴지통 비우기 API */
  const fetchDeleteTrashCard = async (): Promise<void> => {
    await post('/library/deleteTrashCard.do', {})
  }

  /** 문서 생성 API */
  const fetchCreateDoc = async (
    cardId: string,
    tmplId: string,
    roomId: string,
  ): Promise<{ successYn: boolean; returnMsg: string; data: string }> => {
    return post<{ successYn: boolean; returnMsg: string; data: string }>('/library/createDoc.do', {
      cardId,
      tmplId,
      roomId,
    })
  }

  /** 보고서 보완 요청 API */
  const fetchReAskReport = async (
    roomId: string,
    askQuery: string,
    generatedReport: Record<string, unknown>,
  ): Promise<{ successYn: boolean; returnMsg: string; data: string }> => {
    return post<{ successYn: boolean; returnMsg: string; data: string }>('/library/reAskReport.do', {
      roomId,
      askQuery,
      generatedReport,
    })
  }

  /** 채팅방 생성 API */
  const fetchCreateReportChatRoom = async (): Promise<{ roomId: string }> => {
    return post<{ roomId: string }>('/library/createReportChatRoom.do', {})
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
    fetchDocList,
    fetchTableData,
    fetchChartLabel,
    fetchDeleteTrashCard,
    fetchCreateDoc,
    fetchCreateReportChatRoom,
    fetchReAskReport,
  }
}
