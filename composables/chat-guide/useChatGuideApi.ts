import { useApi } from '~/composables/com/useApi'
import type {
  ChatGuideErrorData,
  ChatGuideErrorListRes,
  ChatGuideGreetingForm,
  ChatGuideGreetingListResponse,
  ChatGuideMaintenanceItem,
  ChatGuideMaintenanceListResponse,
  ChatGuideNoticeForm,
  ChatGuideNoticeListResponse,
} from '~/types/chat-guide'

export const useChatGuideApi = () => {
  const { get, post } = useApi()

  /** 인사멘트 조회 */
  const fetchChatGuideGreeting = async (): Promise<ChatGuideGreetingForm> => {
    const res = await get<ChatGuideGreetingListResponse>('/chatguide/greetingList.do')
    return res.dataList[0]
  }

  /** 인사멘트 저장 */
  const fetchSaveChatGuideGreeting = async (payload: ChatGuideGreetingForm): Promise<void> => {
    await post('/chatguide/greetingSave.do', payload)
  }

  /** 안내멘트 조회 */
  const fetchChatGuideNoticeList = async (): Promise<ChatGuideNoticeListResponse['dataList']> => {
    const res = await get<Pick<ChatGuideNoticeListResponse, 'dataList'>>('/chatguide/noticeList.do')
    return res.dataList
  }

  /** 안내멘트 저장 */
  const fetchSaveChatGuideNotice = async (payload: ChatGuideNoticeForm): Promise<void> => {
    await post('/chatguide/noticeSave.do', payload)
  }

  /** 오류 메시지 조회 — data.responseErrors/inputErrors/apiErrors 묶음 */
  const fetchChatGuideErrorMessage = async (): Promise<ChatGuideErrorData | null> => {
    const res = await get<ChatGuideErrorListRes>('/chatguide/errorMessageList.do')
    return res?.data ?? null
  }

  /** 오류 메시지 저장 */
  const fetchSaveChatGuideErrorMessage = async (payload: ChatGuideErrorData): Promise<void> => {
    await post('/chatguide/errorMessageSave.do', payload)
  }

  /** 점검/장애 조회 */
  const fetchChatGuideMaintenanceList = async (): Promise<ChatGuideMaintenanceListResponse['dataList']> => {
    const res = await get<Pick<ChatGuideMaintenanceListResponse, 'dataList'>>('/chatguide/maintenanceList.do')
    return res.dataList
  }

  /** 점검/장애 저장 — 조회(`maintenanceList.do`)와 동일하게 본문에 `dataList` 포함 */
  const fetchSaveChatGuideMaintenance = async (payload: ChatGuideMaintenanceItem[]): Promise<void> => {
    const body: Pick<ChatGuideMaintenanceListResponse, 'dataList'> = { dataList: payload }
    await post('/chatguide/maintenanceSave.do', body)
  }

  return {
    fetchChatGuideGreeting,
    fetchSaveChatGuideGreeting,
    fetchChatGuideNoticeList,
    fetchSaveChatGuideNotice,
    fetchChatGuideErrorMessage,
    fetchSaveChatGuideErrorMessage,
    fetchChatGuideMaintenanceList,
    fetchSaveChatGuideMaintenance,
  }
}
