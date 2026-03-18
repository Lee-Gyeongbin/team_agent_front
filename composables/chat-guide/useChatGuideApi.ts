import { useApi } from '~/composables/com/useApi'
import type {
  ChatGreetingForm,
  ChatNoticeForm,
  ChatMaintenanceForm,
  ChatGuideErrorMessageData,
} from '~/types/chat-guide'

export const useChatGuideApi = () => {
  const { get, post } = useApi()

  /** 인사멘트 조회 */
  const fetchSelectGreeting = async (): Promise<ChatGreetingForm> => {
    // TODO: 실제 API 엔드포인트와 파라미터 스펙 확정 후 수정
    const res = await get<ChatGreetingForm>('/chatguide/selectGreeting.do')
    return res
  }

  /** 인사멘트 저장 */
  const fetchSaveGreeting = async (payload: ChatGreetingForm): Promise<void> => {
    // TODO: successYn / returnMsg 여부에 따라 에러 처리 추가
    await post('/chatguide/saveGreeting.do', payload)
  }

  /** 안내멘트 조회 */
  const fetchSelectNotice = async (): Promise<ChatNoticeForm> => {
    const res = await get<ChatNoticeForm>('/chatguide/selectNotice.do')
    return res
  }

  /** 안내멘트 저장 */
  const fetchSaveNotice = async (payload: ChatNoticeForm): Promise<void> => {
    await post('/chatguide/saveNotice.do', payload)
  }

  /** 오류 메시지 조회 (ChatGuide 전용) */
  const fetchSelectErrorMessage = async (): Promise<ChatGuideErrorMessageData> => {
    const res = await get<{ data: ChatGuideErrorMessageData }>('/chatguide/selectErrorMessage.do')
    return res.data
  }

  /** 오류 메시지 저장 (ChatGuide 전용) */
  const fetchSaveErrorMessage = async (
    data: Partial<ChatGuideErrorMessageData>,
  ): Promise<ChatGuideErrorMessageData> => {
    const res = await post<{ data: ChatGuideErrorMessageData }>('/chatguide/saveErrorMessage.do', data)
    return res.data
  }

  /** 점검/장애 안내 조회 */
  const fetchSelectMaintenance = async (): Promise<ChatMaintenanceForm> => {
    const res = await get<ChatMaintenanceForm>('/chatguide/selectMaintenance.do')
    return res
  }

  /** 점검/장애 안내 저장 */
  const fetchSaveMaintenance = async (payload: ChatMaintenanceForm): Promise<void> => {
    await post('/chatguide/saveMaintenance.do', payload)
  }

  return {
    fetchSelectGreeting,
    fetchSaveGreeting,
    fetchSelectNotice,
    fetchSaveNotice,
    fetchSelectMaintenance,
    fetchSaveMaintenance,
    fetchSelectErrorMessage,
    fetchSaveErrorMessage,
  }
}
