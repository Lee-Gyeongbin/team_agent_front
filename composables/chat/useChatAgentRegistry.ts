/** 채팅 에이전트 레지스트리
 * - 에이전트 목록 조회
 */
import type { Agent } from '~/types/agent'
import { openToast } from '~/composables/useToast'
import { normalizeAgentSubCfg } from '~/utils/chat/surveyUtil'
import { isRecommendAgent } from '~/utils/chat/recommendAgentUtil'
import { isTranslateAgent } from '~/utils/chat/translateAgentUtil'
import { isAutoRecommendAgent } from '~/utils/chat/autoRecommendUtil'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatApi } from '~/composables/chat/useChatApi'
import { ref, computed } from 'vue'

const { selectedChatAgentId } = useChatSearchState()
const { fetchSelectAgentListForChat } = useChatApi()

/** /chat 인덱스용 에이전트 목록 (selectAgentListForChat.do — subCfg 포함) */
export const chatIndexAgents = ref<Agent[]>([])

/** /chat 인덱스 에이전트 로딩 상태 */
export const isLoadingChatIndexAgents = ref(true)

/** 동시 호출 시 단일 요청만 수행 */
let chatIndexAgentsLoadPromise: Promise<void> | null = null

/** /chat 인덱스 에이전트 카드 서브타이틀 — svcTy 기반 */
const SVC_TY_SUB_LABEL: Record<string, string> = {
  M: '문서검색증강(RAG) Agent',
  S: '검색모드-to-SQL Agent',
  T: '실시간 음성인식(STT) Agent',
  C: '일반 채팅 Agent',
  A: '메일 브리핑 Agent',
  W: '번역 Agent',
  D: '프로젝트 리스크 진단 Agent',
}

/** /chat 인덱스 에이전트 카드 아이콘 색상 스타일 — colorId 기반 */
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`
}

/**
 * 에이전트 종류
 * M: 문서검색증강(RAG) Agent
 * S: 검색모드-to-SQL Agent
 * T: 실시간 음성인식(STT) Agent
 * C: 일반 채팅 Agent
 * A: 메일 브리핑 Agent
 * W: 번역 Agent
 * D: 프로젝트 리스크 진단 Agent
 */
export const normalizeChatAgents = (list: Agent[]) =>
  list
    .filter(
      (a) =>
        a.useYn === 'Y' &&
        (a.svcTy === 'M' ||
          a.svcTy === 'S' ||
          a.svcTy === 'T' ||
          a.svcTy === 'C' ||
          a.svcTy === 'A' ||
          a.svcTy === 'W' ||
          a.svcTy === 'D'),
    )
    .map((a) => ({
      ...a,
      subCfg: normalizeAgentSubCfg(a.subCfg),
    }))
    .sort((a, b) => a.sortOrd - b.sortOrd)

/** 선택된 채팅 에이전트 — 테마 아이콘·색상 공통 */
export const selectedChatThemeAgent = computed(
  () => chatIndexAgents.value.find((agent) => agent.agentId === selectedChatAgentId.value) ?? null,
)

export const getChatIndexAgentSubLabel = (agent: Agent) => SVC_TY_SUB_LABEL[agent.svcTy] ?? ''

export const getChatIndexAgentColorStyle = (colorHex: string) => {
  return {
    '--card-icon-color': colorHex,
    '--card-icon-bg': `rgba(${hexToRgb(colorHex)}, 0.12)`,
  }
}

/** /chat 인덱스·검색기록용 에이전트 목록 조회 (selectAgentListForChat.do) */
export const handleSelectChatIndexAgents = async () => {
  if (chatIndexAgentsLoadPromise) return chatIndexAgentsLoadPromise

  chatIndexAgentsLoadPromise = (async () => {
    isLoadingChatIndexAgents.value = true
    try {
      const res = await fetchSelectAgentListForChat()
      const list = res?.agentList ?? []
      chatIndexAgents.value = normalizeChatAgents(list)
      const selectedId = selectedChatAgentId.value
      if (selectedId) {
        const selected = chatIndexAgents.value.find((a) => a.agentId === selectedId)
        if (selected && (isRecommendAgent(selected) || isTranslateAgent(selected) || isAutoRecommendAgent(selected))) {
          selectedChatAgentId.value = null
        }
      }
    } catch {
      chatIndexAgents.value = []
      openToast({ message: '에이전트 목록을 불러오지 못했습니다.', type: 'error' })
    } finally {
      isLoadingChatIndexAgents.value = false
      chatIndexAgentsLoadPromise = null
    }
  })()

  return chatIndexAgentsLoadPromise
}
