import { useApi } from '~/composables/com/useApi'
import type {
  ChatGreetingForm,
  ChatGreetingListResponse,
  ChatGuideErrorData,
  ChatGuideErrorListRes,
  ChatMaintenanceItem,
  ChatMaintenanceListResponse,
  ChatNoticeForm,
  ChatNoticeListResponse,
} from '~/types/chat-guide'

export const useChatGuideApi = () => {
  const { get, post } = useApi()

  /** 인사멘트 조회 */
  const fetchSelectGreeting = async (): Promise<ChatGreetingForm> => {
    const res = await get<ChatGreetingListResponse>('/chatguide/greetingList.do')
    return res.dataList[0]
  }

  /** 인사멘트 저장 */
  const fetchSaveGreeting = async (payload: ChatGreetingForm): Promise<void> => {
    await post('/chatguide/greetingSave.do', payload)
  }

  /** 안내멘트 조회 */
  const fetchSelectNotice = async (): Promise<ChatNoticeListResponse['dataList']> => {
    const res = await get<Pick<ChatNoticeListResponse, 'dataList'>>('/chatguide/noticeList.do')
    return res.dataList
  }

  /** 안내멘트 저장 */
  const fetchSaveNotice = async (payload: ChatNoticeForm): Promise<void> => {
    await post('/chatguide/noticeSave.do', payload)
  }

  /** 오류 메시지 조회 — dataList[0]에 묶음 1건, 없으면 null (스토어에서 null이면 기본값) */
  const fetchSelectErrorMessage = async (): Promise<ChatGuideErrorData | null> => {
    const res = await get<Pick<ChatGuideErrorListRes, 'dataList'>>('/chatguide/errorMessageList.do')
    return res.dataList?.[0] ?? null
  }

  /** 오류 메시지 저장 */
  const fetchSaveErrorMessage = async (payload: ChatGuideErrorData): Promise<void> => {
    await post('/chatguide/errorMessageSave.do', payload)
  }

  /** 점검/장애 조회 */
  const fetchSelectMaintenance = async (): Promise<ChatMaintenanceListResponse['dataList']> => {
    const res = await get<Pick<ChatMaintenanceListResponse, 'dataList'>>('/chatguide/maintenanceList.do')
    return res.dataList
  }

  /** 점검/장애 저장 — 조회(`maintenanceList.do`)와 동일하게 본문에 `dataList` 포함 */
  const fetchSaveMaintenance = async (payload: ChatMaintenanceItem[]): Promise<void> => {
    const body: Pick<ChatMaintenanceListResponse, 'dataList'> = { dataList: payload }
    await post('/chatguide/maintenanceSave.do', body)
  }

  return {
    fetchSelectGreeting,
    fetchSaveGreeting,
    fetchSelectNotice,
    fetchSaveNotice,
    fetchSelectErrorMessage,
    fetchSaveErrorMessage,
    fetchSelectMaintenance,
    fetchSaveMaintenance,
  }
}
