import { useApi } from '~/composables/com/useApi'
import type { ChatGreetingForm, ChatGuideQueryBody, ChatNoticeForm } from '~/types/chat-guide'

export const useChatGuideApi = () => {
  const { get, post } = useApi()

  /** 인사멘트 조회 */
  const fetchSelectGreeting = async (): Promise<ChatGreetingForm> => {
    const res = await get<Pick<ChatGuideQueryBody, 'dataList'>>('/chatguide/greetingList.do')
    return res.dataList[0]
  }

  /** 인사멘트 저장 */
  const fetchSaveGreeting = async (payload: ChatGreetingForm): Promise<void> => {
    await post('/chatguide/insertGreetingList.do', payload)
  }

  /** 안내멘트 조회 */
  const fetchSelectNotice = async (): Promise<ChatGuideQueryBody['dataList']> => {
    const res = await get<Pick<ChatGuideQueryBody, 'dataList'>>('/chatguide/noticeList.do')
    return res.dataList
  }

  /** 안내멘트 저장 */
  const fetchSaveNotice = async (payload: ChatNoticeForm): Promise<void> => {
    await post('/chatguide/insertNoticeList.do', payload)
  }

  return {
    fetchSelectGreeting,
    fetchSaveGreeting,
    fetchSelectNotice,
    fetchSaveNotice,
  }
}
