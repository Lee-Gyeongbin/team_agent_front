/** 설문 에이전트 액션
 * - 설문 진단 프롬프트 전송, 설문 메시지 추가, 설문 닫기
 */
import { usePsychologySurvey, createSurveyMessage, buildDiagnosticPrompt } from '~/utils/chat/surveyUtil'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { openToast } from '~/composables/useToast'

const { messages } = useChatSocket()
const { closePsychologySurvey, surveyAnswers, surveyGender, registerSurveyRoom, isSurveyVisible, isGenderStepVisible } =
  usePsychologySurvey()
const { isSearchModeMissingSubOptions, selectedChatAgentId, resolveSvcTy, buildRefIdForPayload, selectedModelOption } =
  useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

export const useSurveyAgentActions = () => {
  /**
   * 설문 진단 프롬프트 전송 — question 메시지를 화면에 노출하지 않는다.
   * @param content - 전송할 프롬프트 문자열
   * @param surveyMessageLogId - 제출 완료로 전환할 survey 메시지 logId (있으면 surveySubmitted=true로 갱신)
   */
  const onSendSurvey = async (content: string, surveyMessageLogId?: string): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    // 설문 메시지를 제출 완료 상태로 전환
    if (surveyMessageLogId) {
      const surveyMsg = messages.value.find((m) => m.logId === surveyMessageLogId && m.type === 'survey')
      if (surveyMsg) {
        surveyMsg.surveyAnswers = { ...surveyAnswers.value }
        surveyMsg.surveySubmitted = true
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: selectedChatAgentId.value ?? '',
      files: [],
    })
    if (sent) {
      const newMsgs = messages.value.slice(prevLen)
      const newQuestion = newMsgs.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      // 설문 전송 시 answer 메시지에 surveyAnswers 주입 — 방사형 그래프 이미지 생성 프롬프트용
      if (Object.keys(surveyAnswers.value).length > 0) {
        const newAnswer = newMsgs.find((m) => m.type === 'answer')
        if (newAnswer) newAnswer.surveyAnswers = { ...surveyAnswers.value }
      }
      selectedChatAgentId.value = null
    }
    return sent
  }

  /** 메시지 목록 내 설문 컴포넌트 제출 — 진단 프롬프트 빌드 후 전송 */
  const onSurveyMessageSubmit = async (logId: string): Promise<boolean> => {
    const prompt = buildDiagnosticPrompt(surveyAnswers.value, surveyGender.value)
    return await onSendSurvey(prompt, logId)
  }

  /**
   * index.vue에서 설문 제출 후 새 채팅방 진입 시 설문 컴포넌트를 메시지 목록 앞에 주입
   * - question 메시지는 hiddenFromDisplay=true로 숨김
   */
  const addInlineSurveyMessage = (answers: Record<number, number>, agentId = selectedChatAgentId.value ?? '') => {
    const surveyMsg = createSurveyMessage(answers, true, agentId)
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [surveyMsg, ...msgs]
  }

  /**
   * 설문 닫기 — 에이전트 선택 상태를 초기화하고 설문을 닫는다
   * @param surveyMessageLogId - 제거할 survey 메시지 logId (없으면 메시지 목록 그대로)
   */
  const handleClosePsychologySurvey = (surveyMessageLogId?: string) => {
    selectedChatAgentId.value = null
    closePsychologySurvey()
    if (surveyMessageLogId) {
      messages.value = messages.value.filter((m) => m.logId !== surveyMessageLogId)
    }
  }

  /** /chat 인덱스에서 설문 제출 — 방 생성·인라인 주입·등록·닫기 */
  const handleIndexSurveySubmit = async (): Promise<boolean> => {
    const prompt = buildDiagnosticPrompt(surveyAnswers.value, surveyGender.value)
    if (!prompt.trim()) {
      openToast({ message: '설문 설정을 불러오지 못했습니다. 에이전트를 다시 선택해 주세요.', type: 'warning' })
      return false
    }
    const answers = { ...surveyAnswers.value }
    const agentId = selectedChatAgentId.value ?? ''
    const sent = await createChatRoom(prompt)
    if (sent) {
      // createChatRoom은 clearMessagesBefore:true로 초기화 후 question+answer placeholder만 남김
      // → answer 메시지에 surveyAnswers 주입 (방사형 차트 데이터 요청 프롬프트 생성에 필요)
      const answerMsg = messages.value.find((m) => m.type === 'answer')
      if (answerMsg && Object.keys(answers).length > 0) {
        answerMsg.surveyAnswers = { ...answers }
        if (agentId && !answerMsg.agentId) answerMsg.agentId = agentId
      }
      addInlineSurveyMessage(answers, agentId)
      registerSurveyRoom(chatRoom.value.roomId)
      handleClosePsychologySurvey()
    }
    return sent
  }

  return {
    isSurveyVisible,
    isGenderStepVisible,
    surveyGender,
    onSendSurvey,
    onSurveyMessageSubmit,
    addInlineSurveyMessage,
    handleClosePsychologySurvey,
    handleIndexSurveySubmit,
  }
}
