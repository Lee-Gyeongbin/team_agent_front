import type { ChatMessage, ChatSocketMessage, ChatSocketPayload } from '~/types/chat'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { getWebSocketUrl } from '~/utils/chat/chatWebSocketUtil'
import { migrateRecommendMessagesForAnswerLogId } from '~/utils/chat/recommendAgentUtil'
import { TODAY_MEME_AGENT_ID } from '~/utils/chat/todayMemeUtil'
import { NEWS_CURATOR_AGENT_ID } from '~/utils/chat/newsCuratorUtil'
const {
  messages,
  pendingMessageId,
  messageBufferMap,
  getStreamingMessage,
  finalizeStreamingMessage,
  updateStreamingError,
  startWaitingNextQuestions,
  setNextQuestions,
  resetNextQuestions,
  stoppedByUser,
} = useChatMessages()

// 답변 완료 후 다음 추천 질문 생성 대상에서 제외할 에이전트 (투데이밈/뉴스 큐레이터 등 특수 카드 플로우)
const NEXT_QUESTIONS_EXCLUDED_AGENT_IDS = new Set([TODAY_MEME_AGENT_ID, NEWS_CURATOR_AGENT_ID])

// 일반 채팅(C) / 데이터분석(S) / 매뉴얼(M) 답변에 한해 다음 추천 질문 생성을 대기한다
const NEXT_QUESTIONS_ELIGIBLE_SVC_TYPES = new Set(['C', 'S', 'M'])

const isEligibleForNextQuestions = (message: ChatMessage) => {
  if (!message.svcTy || !NEXT_QUESTIONS_ELIGIBLE_SVC_TYPES.has(message.svcTy)) return false
  if (message.hiddenFromDisplay) return false
  const agentId = typeof message.agentId === 'string' ? message.agentId.trim() : ''
  // 일반질의(C)는 agentId가 없는 순수 일반질의에서만 노출 (agentId가 있으면 에이전트 질의)
  if (message.svcTy === 'C' && agentId) return false
  if (agentId && NEXT_QUESTIONS_EXCLUDED_AGENT_IDS.has(agentId)) return false
  return true
}

// 스트리밍 렌더 큐: 청크가 한 번에 몰려와도 RAF 기준으로 조금씩 화면에 드러냄
// 매뉴얼/지식채팅(M) 전용 체감 속도
const MANUAL_MIN_CHARS_PER_FRAME = 4
const MANUAL_MID_CHARS_PER_FRAME = 8
const MANUAL_MAX_CHARS_PER_FRAME = 16
const activeRafMap = new Map<string, number>() // logId → rafId
const pendingCompleteMap = new Map<string, ChatSocketMessage>() // logId → complete payload

// backlog(미표시 글자 수) 구간 임계값
// - MID 초과: 중간 속도
// - MAX 초과: 최고 속도
// 값 자체는 체감 튜닝 포인트이므로 상수로 분리
const STREAMING_BACKLOG_MID = 300
const STREAMING_BACKLOG_MAX = 800

/**
 * 매뉴얼/지식채팅(M) 전용 프레임당 표시 글자 수(step)를 계산한다.
 * - backlog가 커질수록 step을 키워 "뒤처짐"을 빠르게 해소
 */
const resolveManualStep = (remaining: number) => {
  if (remaining > STREAMING_BACKLOG_MAX) return MANUAL_MAX_CHARS_PER_FRAME
  if (remaining > STREAMING_BACKLOG_MID) return MANUAL_MID_CHARS_PER_FRAME
  return MANUAL_MIN_CHARS_PER_FRAME
}

const isManualStreaming = (svcTy: string | undefined) => svcTy === 'M'

/**
 * answer_source 누적 JSON을 UI 표시용 출처 리스트로 파싱한다.
 * malformed JSON은 조용히 무시(undefined 반환)해서 스트리밍 본문 렌더를 방해하지 않는다.
 */
const parseAnswerSourceItems = (accumulated: string) => {
  try {
    const parsed = JSON.parse(accumulated) as {
      items?: { url?: string; title?: string; docFileId?: string; fileName?: string }[]
    }
    if (!Array.isArray(parsed.items)) return undefined
    return parsed.items
      .map((it) => {
        const url = String(it?.url ?? '').trim()
        const title = String(it?.title ?? '').trim()
        const docFileId = String(it?.docFileId ?? '').trim()
        const fileName = String(it?.fileName ?? '').trim()

        if (url.length > 0) {
          return {
            url,
            ...(title.length > 0 ? { title } : {}),
          }
        }
        if (fileName.length > 0) {
          return {
            ...(docFileId.length > 0 ? { docFileId } : {}),
            fileName,
          }
        }
        return undefined
      })
      .filter((it): it is NonNullable<typeof it> => it !== undefined)
  } catch {
    return undefined
  }
}

/**
 * 수신된 텍스트 delta를 logId 버퍼에 누적한다.
 * 실제 수신 데이터(source of truth)는 messageBufferMap에만 누적하고,
 * 화면 노출은 RAF tick에서 점진적으로 따라간다.
 */
const appendStreamingChunk = (logId: string, nextChunk: string) => {
  const prevBuffer = messageBufferMap.value[logId] || ''
  messageBufferMap.value[logId] = `${prevBuffer}${nextChunk}`
}

const parseChartOption = (value: ChatSocketMessage['chartOption']) => {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as ChatSocketMessage['chartOption']
      return parsed
    } catch {
      return undefined
    }
  }
  return value
}

const finalizeCompletedMessage = (streamingMessage: (typeof messages.value)[number], payload: ChatSocketMessage) => {
  // 서버 logId가 있으면 question + answer 메시지에 반영
  if (payload.logId) {
    const oldLogId = streamingMessage.logId
    // 버퍼 키를 서버 logId로 마이그레이션
    messageBufferMap.value[payload.logId] = messageBufferMap.value[oldLogId] || ''
    messageBufferMap.value[oldLogId] = ''
    // answer 메시지 logId 갱신
    streamingMessage.logId = payload.logId
    // 직전 question 메시지 logId 갱신
    const idx = messages.value.indexOf(streamingMessage)
    if (idx > 0 && messages.value[idx - 1].type === 'question') {
      const pairedQuestion = messages.value[idx - 1]
      pairedQuestion.logId = payload.logId
      // 재생성 시 질문 기준으로 전송할 수 있도록 질문 메타를 보정
      pairedQuestion.svcTy = pairedQuestion.svcTy ?? streamingMessage.svcTy ?? 'C'
      pairedQuestion.refId = pairedQuestion.refId ?? streamingMessage.refId ?? 'all'
    }
    // pendingMessageId도 서버 logId로 갱신 (finalizeStreamingMessage에서 조회 가능하도록)
    pendingMessageId.value = payload.logId
    if (oldLogId !== payload.logId) {
      migrateRecommendMessagesForAnswerLogId(messages.value, oldLogId, payload.logId)
    }
  }
  // 서버 logId가 없으면(예: 정지 등으로 로그 미저장) 좋아요/싫어요 등 액션 숨김 처리
  streamingMessage.chatLogMissing = !payload.logId
  streamingMessage.hasSource =
    !!payload.docFileId || streamingMessage.hasSource === true || (streamingMessage.groundingSources?.length ?? 0) > 0
  streamingMessage.hasVisualization = !!payload.tableData
  if (payload.tableData !== undefined && payload.tableData !== '') {
    streamingMessage.tableData = payload.tableData
  }
  const parsedChartOption = parseChartOption(payload.chartOption)
  if (parsedChartOption) {
    streamingMessage.chartOption = parsedChartOption
  }
  if (typeof payload.sql === 'string') {
    streamingMessage.visualizationData = {
      ...(streamingMessage.visualizationData ?? {}),
      sql: payload.sql,
      chartTitle:
        typeof streamingMessage.visualizationData?.chartTitle === 'string'
          ? streamingMessage.visualizationData.chartTitle
          : '',
    }
  }
  // 스트리밍 메시지 완료 처리
  finalizeStreamingMessage()

  // 사용자가 응답 중단 버튼을 누른 경우 다음 추천 질문을 생성하지 않음
  if (stoppedByUser.value) {
    stoppedByUser.value = false
    resetNextQuestions()
    return
  }

  // 일반 채팅 답변 완료 후 다음 추천 질문 비동기 생성 대기 시작 (서버에서 recommend_questions로 별도 전송)
  if (isEligibleForNextQuestions(streamingMessage)) {
    startWaitingNextQuestions()
  } else {
    resetNextQuestions()
  }
}

const tickStreamingRender = (logId: string) => {
  const msg = messages.value.find((m) => m.type === 'answer' && m.logId === logId)
  if (!msg) {
    // 메시지가 이미 정리된 경우(방 이동/리셋 등) 렌더 루프와 대기 complete를 함께 정리
    activeRafMap.delete(logId)
    pendingCompleteMap.delete(logId)
    return
  }
  const target = messageBufferMap.value[logId] ?? ''
  const current = msg.rContent ?? ''
  if (current.length >= target.length) {
    // 현재 프레임에서 target까지 따라잡음
    activeRafMap.delete(logId)
    // complete가 이미 도착해 대기 중이면, "즉시 full flush" 대신 여기서 finalize 처리
    const pendingComplete = pendingCompleteMap.get(logId)
    if (pendingComplete) {
      pendingCompleteMap.delete(logId)
      finalizeCompletedMessage(msg, pendingComplete)
    }
    return
  }
  const remaining = target.length - current.length
  const step = resolveManualStep(remaining)
  msg.rContent = target.substring(0, current.length + step)
  activeRafMap.set(
    logId,
    requestAnimationFrame(() => tickStreamingRender(logId)),
  )
}

const scheduleStreamingRender = (logId: string) => {
  // 동일 logId에 RAF 중복 예약 방지 (한 번에 하나의 tick 루프만 유지)
  if (!activeRafMap.has(logId)) {
    activeRafMap.set(
      logId,
      requestAnimationFrame(() => tickStreamingRender(logId)),
    )
  }
}

const flushStreamingRender = (logId: string) => {
  // 에러/강제종료 시 렌더 예약 및 완료대기 상태를 모두 즉시 정리
  const rafId = activeRafMap.get(logId)
  if (rafId !== undefined) cancelAnimationFrame(rafId)
  activeRafMap.delete(logId)
  pendingCompleteMap.delete(logId)
}

const hasAnyRenderedContent = (logId: string, rendered: string | undefined) => {
  const currentBuffer = messageBufferMap.value[logId] || ''
  return Boolean(currentBuffer || rendered)
}

/**
 * complete 이벤트를 "즉시 본문 치환"하지 않고, 현재 렌더 루프에 합류시킨다.
 * - complete만 오고 chunk가 거의 없는 경우도 fallback content로 동일 경로 처리
 * - 현재 렌더가 target을 이미 따라잡았으면 즉시 finalize
 * - 아니라면 RAF를 이어서 자연스럽게 끝까지 보여준 뒤 finalize
 */
const markCompleteAndMaybeFinalize = (
  streamingMessage: (typeof messages.value)[number],
  payload: ChatSocketMessage,
  completeContent: string,
) => {
  if (completeContent && !hasAnyRenderedContent(streamingMessage.logId, streamingMessage.rContent)) {
    messageBufferMap.value[streamingMessage.logId] = completeContent
  }
  pendingCompleteMap.set(streamingMessage.logId, payload)
  const target = messageBufferMap.value[streamingMessage.logId] || completeContent
  const current = streamingMessage.rContent ?? ''
  if (current.length >= target.length) {
    pendingCompleteMap.delete(streamingMessage.logId)
    finalizeCompletedMessage(streamingMessage, payload)
    return
  }
  scheduleStreamingRender(streamingMessage.logId)
}

// 웹소켓 관련 (WebSocket은 앱 전역에서 단일 인스턴스로 공유)
const WEBSOCKET_OPEN = 1
const WEBSOCKET_CONNECTING = 0
const chatbotSocket = shallowRef<WebSocket | null>(null)

// WebSocket 연결 확인 + 페이로드 전송 (실패 시 false 반환)
const ensureWebSocketAndSend = async (payload: ChatSocketPayload): Promise<boolean> => {
  if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
    openLoading({ text: '서버에 연결하는 중...' })
    try {
      await connectWebSocket()
    } finally {
      closeLoading()
    }
  }
  if (chatbotSocket.value?.readyState !== WEBSOCKET_OPEN) {
    updateStreamingError('연결 오류가 발생했습니다. 다시 시도해주세요.')
    return false
  }
  try {
    chatbotSocket.value.send(JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('웹소켓 메시지 전송 실패:', error)
    updateStreamingError('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    return false
  }
}
// WebSocket 메시지 처리
const handleWebSocketMessage = (payload: ChatSocketMessage) => {
  // connected, question_received는 답변 메시지가 없어도 처리 가능
  if (payload.type === 'connected' || payload.type === 'question_received') return
  // 다음 추천 질문: 메인 응답(complete) 종료 후 pendingMessageId가 비워진 상태에서 도착하므로 별도 처리
  if (payload.type === 'recommend_questions') {
    if (Array.isArray(payload.questions) && payload.questions.length > 0) {
      setNextQuestions(payload.questions)
    } else {
      resetNextQuestions()
    }
    return
  }
  // 현재 스트리밍 메시지 찾기
  const streamingMessage = getStreamingMessage()
  if (!streamingMessage) return

  // WebSocket 메시지 타입에 따라 처리
  switch (payload.type) {
    case 'status': {
      if (payload.statusMessage) {
        streamingMessage.streamingStatus = payload.statusMessage
      }
      streamingMessage.streamingStatusCode = payload.statusCode
      break
    }
    // 스트리밍 메시지 처리
    case 'chunk': {
      // 답변 청크가 오면 status 텍스트 초기화
      streamingMessage.streamingStatus = undefined
      streamingMessage.streamingStatusCode = undefined
      // Web 출처 등 구조화 청크 — 답변 텍스트 버퍼에 합치지 않음
      if (payload.chunkEvent === 'answer_source' && payload.accumulated) {
        const sourceItems = parseAnswerSourceItems(payload.accumulated)
        if (sourceItems) streamingMessage.groundingSources = sourceItems
        // answer_source 이벤트가 왔으면 출처 패널 버튼 노출 대상으로 확정
        streamingMessage.hasSource = true
        streamingMessage.isStreaming = true
        break
      }
      // 리서치 리포트 HTML — 사이드 패널용
      if (payload.chunkEvent === 'report_html' && payload.content) {
        streamingMessage.reportHtml = payload.content
        streamingMessage.hasReport = true
        streamingMessage.isStreaming = true
        break
      }
      // PLANNER PT 슬라이드 JSON — PPTX 다운로드 버튼 표시용
      if (payload.chunkEvent === 'pptx_data' && payload.content) {
        streamingMessage.pptxData = payload.content
        streamingMessage.hasPptx = true
        streamingMessage.isStreaming = true
        break
      }
      // 일반 텍스트 delta는 버퍼에 누적
      appendStreamingChunk(streamingMessage.logId, payload.content ?? '')
      streamingMessage.isStreaming = true
      if (isManualStreaming(streamingMessage.svcTy)) {
        // 매뉴얼채팅(M)만 속도 제어 적용
        scheduleStreamingRender(streamingMessage.logId)
      } else {
        // 그 외 모드는 기존처럼 즉시 표시
        streamingMessage.rContent = messageBufferMap.value[streamingMessage.logId] || ''
      }
      break
    }
    case 'complete': {
      if (isManualStreaming(streamingMessage.svcTy)) {
        // 매뉴얼채팅(M)은 점진 렌더를 끝까지 보여준 뒤 finalize
        markCompleteAndMaybeFinalize(streamingMessage, payload, payload.content ?? '')
      } else {
        // 그 외 모드는 complete 시 최종 본문 즉시 반영 후 finalize
        const completeContent = payload.content ?? ''
        if (completeContent && !hasAnyRenderedContent(streamingMessage.logId, streamingMessage.rContent)) {
          messageBufferMap.value[streamingMessage.logId] = completeContent
        }
        streamingMessage.rContent = messageBufferMap.value[streamingMessage.logId] || completeContent
        finalizeCompletedMessage(streamingMessage, payload)
      }
      break
    }
    case 'error': {
      // 이미 답변이 조금이라도 렌더링/버퍼링 된 상태면
      // 사용자 경험상 "오류"로 덮어쓰지 말고 무시(또는 경고로만)
      if (!hasAnyRenderedContent(streamingMessage.logId, streamingMessage.rContent)) {
        updateStreamingError(payload.content || '응답 처리 중 오류가 발생했습니다.')
      } else {
        // 필요하면 콘솔만 남기기
        console.warn('[chat] streaming error after partial content:', payload.content)
      }
      // 에러 이후 잔여 RAF가 남아 콘텐츠를 덮어쓰지 않도록 강제 정리
      flushStreamingRender(streamingMessage.logId)
      break
    }
    default:
      break
  }
}

// WebSocket 연결 종료
const disconnectWebSocket = () => {
  if (chatbotSocket.value) {
    chatbotSocket.value.close()
    chatbotSocket.value = null
  }
}

// WebSocket 연결
const connectWebSocket = (): Promise<void> => {
  // WebSocket 연결 상태 확인
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    // 현재 WebSocket 연결 상태 확인
    const currentSocket = chatbotSocket.value
    if (currentSocket?.readyState === WEBSOCKET_OPEN) {
      resolve()
      return
    }
    // WebSocket 연결 중인 경우
    if (currentSocket?.readyState === WEBSOCKET_CONNECTING) {
      const onOpen = () => {
        currentSocket.removeEventListener('open', onOpen)
        resolve()
      }
      currentSocket.addEventListener('open', onOpen)
      return
    }

    // 기존 WebSocket 연결이 있으면 닫기
    if (currentSocket) {
      currentSocket.close()
      chatbotSocket.value = null
    }

    try {
      // WebSocket 연결 시도
      const socket = new WebSocket(getWebSocketUrl())
      chatbotSocket.value = socket

      // WebSocket 연결 성공 시
      socket.onopen = () => resolve()

      // WebSocket 메시지 수신 시
      socket.onmessage = (event) => {
        try {
          // WebSocket 메시지 파싱
          const payload = JSON.parse(event.data) as ChatSocketMessage
          // WebSocket 메시지 처리
          handleWebSocketMessage(payload)
        } catch (error) {
          console.error('웹소켓 메시지 파싱 오류:', error)
        }
      }

      socket.onerror = (error) => {
        console.error('웹소켓 연결 오류:', error)
      }

      socket.onclose = () => {
        chatbotSocket.value = null
      }
    } catch (error) {
      console.error('WebSocket 초기화 실패:', error)
      resolve()
    }
  })
}

// WebSocket 연결 시작
const startChatSocket = () => {
  void connectWebSocket()
}

// WebSocket 연결 종료
const stopChatSocket = () => {
  disconnectWebSocket()
}

export const useChatSocket = () => {
  return {
    chatbotSocket,
    startChatSocket,
    stopChatSocket,
    messages,
    pendingMessageId,
    messageBufferMap,
    ensureWebSocketAndSend,
    handleWebSocketMessage,
    disconnectWebSocket,
    connectWebSocket,
  }
}
