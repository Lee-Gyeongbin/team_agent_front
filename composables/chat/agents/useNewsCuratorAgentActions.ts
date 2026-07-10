import {
  buildCurationPrompt,
  createNewsCuratorMessage,
  handleLoadNewsCuratorCategories,
  isValidNewsCuratorCategorySelection,
  NEWS_CURATOR_AGENT_ID,
  parseNewsCuratorPromptMeta,
  setNewsCuratorSubmitCardLogId,
  useNewsCurator,
  useNewsCuratorAgentConfig,
} from '~/utils/chat/newsCuratorUtil'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { useChatApi } from '~/composables/chat/useChatApi'

const { messages } = useChatSocket()
const { isNewsCuratorVisible, registerNewsCuratorRoom, openNewsCurator, closeNewsCurator } = useNewsCurator()
const { isSearchModeMissingSubOptions, selectedChatAgentId, resolveSvcTy, buildRefIdForPayload, selectedModelOption } =
  useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

const AGENT_ID_NEWS = NEWS_CURATOR_AGENT_ID

export const useNewsCuratorAgentActions = () => {
  /** 새로운 카테고리 선택 */
  const handleNewsCuratorReselectCategories = async (newsMessageLogId: string): Promise<string | null> => {
    if (messages.value.some((m) => m.type === 'news' && m.newsSubmitted !== true)) return null

    const anchorMessage = messages.value.find((m) => m.logId === newsMessageLogId && m.type === 'news')
    if (!anchorMessage || anchorMessage.newsSubmitted !== true) return null

    const newsMsg = createNewsCuratorMessage(false, { newsReselect: true })
    messages.value = [...messages.value, newsMsg]
    return newsMsg.logId
  }

  /** 사용자 저장 관심 뉴스 분야 codeId 목록 저장 */
  const handleSaveUserNewsInterestCategories = async (newsCategoryCodeIdList: string[]) => {
    const codeIds = newsCategoryCodeIdList.map((id) => String(id).trim()).filter(Boolean)
    if (!codeIds.length) return
    const { fetchSaveUserNewsInterestCategories } = useChatApi()
    await fetchSaveUserNewsInterestCategories(codeIds)
  }

  /**
   * in-room news 카드 제출 상태 동기화 (`newsMessageLogId` 대상)
   * - /chat 인덱스 진입 시 카드 주입은 `addInlineNewsMessage` 사용 (question→news 변환 없음)
   */
  const handleSyncNewsCard = (newsMessageLogId: string, categories?: string[], options?: { isNew?: boolean }) => {
    const normalizedCategories = (categories ?? []).map((item) => String(item).trim()).filter(Boolean)
    const targetMessage = messages.value.find((m) => m.logId === newsMessageLogId && m.type === 'news')
    if (!targetMessage) return

    targetMessage.newsSubmitted = true
    if (normalizedCategories.length > 0) {
      targetMessage.newsSelectedCategories = normalizedCategories
    }
    targetMessage.newsIsNew = options?.isNew ?? true
    targetMessage.newsReselect = false
  }

  /** /chat 인덱스에서 NewsCurator 제출 후 readonly news 카드를 목록 앞에 주입 */
  const addInlineNewsMessage = (categories: string[], isNew: boolean) => {
    const newsMsg = createNewsCuratorMessage(true)
    newsMsg.newsSelectedCategories = categories.map((id) => String(id).trim()).filter(Boolean)
    newsMsg.newsIsNew = isNew
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [newsMsg, ...msgs]
    setNewsCuratorSubmitCardLogId(newsMsg.logId)
  }

  /**
   * 뉴스 큐레이터 공통 제출 파이프라인 — 카테고리 로드·프롬프트 빌드·방 등록·관심분야 저장
   * @param sendFn 실제 전송 방식(새 방 생성 vs 기존 방 전송)만 외부에서 주입
   */
  const submitNewsCuratorPrompt = async (
    categories: string[],
    isNew: boolean,
    sendFn: (prompt: string) => Promise<boolean>,
  ): Promise<boolean> => {
    await handleLoadNewsCuratorCategories()

    if (isNew) {
      if (!isValidNewsCuratorCategorySelection(categories)) {
        openToast({ message: '선택한 뉴스 분야를 확인해 주세요.', type: 'warning' })
        return false
      }
      try {
        await handleSaveUserNewsInterestCategories(categories)
      } catch {
        openToast({ message: '관심 뉴스 분야 저장에 실패했습니다.', type: 'warning' })
        return false
      }
    }

    const { newsCuratorAgentConfig } = useNewsCuratorAgentConfig()
    const prompt = buildCurationPrompt(newsCuratorAgentConfig.value, { isNew })
    const sent = await sendFn(prompt)
    if (sent) {
      registerNewsCuratorRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 메시지 목록 내 NewsCurator 컴포넌트 제출 — 큐레이션 시스템 프롬프트 전체 전송 */
  const onNewsCuratorMessageSubmit = async (
    logId: string,
    categories: string[] = [],
    options?: { isNew?: boolean },
  ): Promise<boolean> => {
    if (isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false
    const isNew = options?.isNew ?? true
    if (!messages.value.some((m) => m.logId === logId && m.type === 'news')) return false

    setNewsCuratorSubmitCardLogId(logId)
    const sent = await submitNewsCuratorPrompt(categories, isNew, async (prompt) => {
      const prevLen = messages.value.length
      const pipelineSent = await executeSendPipeline({
        content: prompt,
        roomId: chatRoom.value.roomId,
        svcTy: resolveSvcTy(),
        modelId: selectedModelOption.value,
        refId: buildRefIdForPayload(),
        agentId: AGENT_ID_NEWS,
        files: [],
      })
      if (pipelineSent) {
        const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
        if (newQuestion) newQuestion.hiddenFromDisplay = true
        selectedChatAgentId.value = null
      }
      return pipelineSent
    })
    if (sent) {
      handleSyncNewsCard(logId, categories, { isNew })
    } else {
      setNewsCuratorSubmitCardLogId(null)
    }
    return sent
  }

  /**
   * 뉴스 큐레이터 닫기 — 에이전트 선택 상태를 초기화하고 오버레이를 닫는다
   * @param newsMessageLogId - 제거할 news 메시지 logId (없으면 메시지 목록 그대로)
   */
  const handleCloseNewsCurator = (newsMessageLogId?: string) => {
    selectedChatAgentId.value = null
    closeNewsCurator()
    if (newsMessageLogId) {
      messages.value = messages.value.filter((m) => m.logId !== newsMessageLogId)
    }
  }

  /** /chat 인덱스에서 NewsCurator 제출(카테고리 선택 후) — 방 생성·인라인 카드 주입·닫기 */
  const handleIndexNewsCuratorSubmit = async (
    categories: string[],
    options?: { isNew?: boolean },
  ): Promise<boolean> => {
    const isNew = options?.isNew ?? true
    return submitNewsCuratorPrompt(categories, isNew, async (prompt) => {
      const sent = await createChatRoom(prompt)
      if (sent) {
        addInlineNewsMessage(categories, isNew)
        handleCloseNewsCurator()
      }
      return sent
    })
  }

  /** NewsCurator 인트로 종료·건너뛰기 후 하단 에이전트 선택 해제(카드·메시지는 유지) */
  const handleNewsCuratorIntroEnd = () => {
    if (selectedChatAgentId.value === AGENT_ID_NEWS) {
      selectedChatAgentId.value = null
    }
  }

  return {
    isNewsCuratorVisible,
    openNewsCurator,
    parseNewsCuratorPromptMeta,
    submitNewsCuratorPrompt,
    onNewsCuratorMessageSubmit,
    addInlineNewsMessage,
    handleSyncNewsCard,
    handleNewsCuratorReselectCategories,
    handleSaveUserNewsInterestCategories,
    handleCloseNewsCurator,
    handleIndexNewsCuratorSubmit,
    handleNewsCuratorIntroEnd,
  }
}
