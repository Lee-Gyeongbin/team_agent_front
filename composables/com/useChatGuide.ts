import type { ChatGuideItem } from '~/types/com/chatGuide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

const CHAT_GUIDE_STATE_KEY = 'ta_chatGuideList'

/**
 * 전역 챗봇 가이드 상태 composable
 * - useState로 앱 전체 공유 (로그인 시 useAuth에서 fetchChatGuideList 호출)
 * - 다른 화면에서 사용: const { chatGuideList } = useChatGuide()
 */
export const useChatGuide = () => {
  const { fetchChatGuideList: fetchChatGuideListApi } = useChatGuideApi()
  const chatGuideList = useState<ChatGuideItem[]>(CHAT_GUIDE_STATE_KEY, () => [])

  const fetchChatGuideList = async (): Promise<ChatGuideItem[]> => {
    const list = await fetchChatGuideListApi()
    chatGuideList.value = list
    return list
  }

  const clearChatGuideList = () => {
    chatGuideList.value = []
  }

  /** guideKey로 단건 조회 */
  const getChatGuideByKey = (guideKey: string): ChatGuideItem | undefined =>
    chatGuideList.value.find((item) => item.guideKey === guideKey)

  /** guideTpCd로 필터 */
  const getChatGuideByType = (guideTpCd: string): ChatGuideItem[] =>
    chatGuideList.value.filter((item) => item.guideTpCd === guideTpCd)

  return { chatGuideList, fetchChatGuideList, clearChatGuideList, getChatGuideByKey, getChatGuideByType }
}
