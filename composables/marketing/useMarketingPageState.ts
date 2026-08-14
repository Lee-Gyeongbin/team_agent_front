import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import type { MarketingAgentSummary } from '~/types/marketing'
import { MARKETING_AGENT_THEME_FALLBACK_HEX } from '~/utils/marketing/marketingUtil'
import {
  getDefaultMarketingAuthoringConfig,
  parseMarketingAuthoringAgentConfig,
} from '~/utils/agent/marketingAuthoringConfigUtil'

export type MarketingPagePhase = 'list' | 'form' | 'result'

const { fetchMarketingAgents } = useMarketingApi()

// ===== 상태 (에이전트 선택 / 페이지 라우팅) — 다른 marketing 스토어들이 공통으로 참조한다 =====
export const pagePhase = ref<MarketingPagePhase>('list')
export const agents = ref<MarketingAgentSummary[]>([])
const selectedAgentId = ref('')

export const useMarketingPageState = () => {
  const route = useRoute()

  const marketingProjectId = computed(() => String(route.params.id ?? '').trim())

  const selectedAgent = computed(() => {
    const requestedId = String(route.query.agentId ?? selectedAgentId.value).trim()
    return agents.value.find((agent) => agent.agentId === requestedId) ?? agents.value[0] ?? null
  })
  const config = computed(() => selectedAgent.value?.config ?? null)
  const themeColorHex = computed(() => selectedAgent.value?.colorHex ?? MARKETING_AGENT_THEME_FALLBACK_HEX)

  const navigateMarketing = (query: Record<string, string> = {}) => {
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    const path = marketingProjectId.value ? `/marketing/${marketingProjectId.value}` : '/marketing'
    return navigateTo({ path, query: agentId ? { ...query, agentId } : query }, { replace: true })
  }

  const handleSelectAgents = async () => {
    const response = await fetchMarketingAgents()
    agents.value = (response.list ?? []).map((agent) => ({
      ...agent,
      config:
        parseMarketingAuthoringAgentConfig(agent.config as unknown as Record<string, unknown> | null) ??
        getDefaultMarketingAuthoringConfig(),
    }))
    if (selectedAgent.value) selectedAgentId.value = selectedAgent.value.agentId
  }

  return {
    pagePhase,
    agents,
    selectedAgent,
    config,
    themeColorHex,
    marketingProjectId,
    navigateMarketing,
    handleSelectAgents,
  }
}
