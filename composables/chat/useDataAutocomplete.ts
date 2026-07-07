import { useDatamartVocabulary } from '~/composables/chat/useDatamartVocabulary'
import { useChatStore } from '~/composables/chat/useChatStore'
import { useChatRooms } from '~/composables/chat/useChatRooms'

/**
 * 데이터분석(S) 모드에서 입력 토큰 기반으로 용어를 추천하는 인라인 자동완성.
 *
 * 가이드 패널이 아닌 채팅 입력창 위(다음질문 추천과 동일한 틀)에 노출한다.
 * 용어 소스는 선택된 데이터마트 전체를 합산하며, 지표/구분 구분 없이 용어만 추천한다.
 */
export const useDataAutocomplete = () => {
  const { chatMessage } = useChatRooms()
  const { activeSearchModes, riskAgentActive, subOptions, selectedSubOptions, selectedChatThemeAgent } = useChatStore()

  /** 데이터분석 질문 모드 활성 여부 */
  const isActive = computed(() => activeSearchModes.value.includes('S') && !riskAgentActive.value)

  /** 추천 대상 데이터마트 — 체크된 것 전체(없으면 선택 가능한 전체). 비활성 모드에선 불러오지 않음 */
  const datamartIds = computed<string[]>(() => {
    if (!isActive.value) return []
    const selectedIds = selectedSubOptions.value.filter((id) => id && id !== 'all')
    if (selectedIds.length) return selectedIds.map(String)
    return subOptions.value.map((o) => String(o.value)).filter(Boolean)
  })

  const { suggestMetric, suggestDimension } = useDatamartVocabulary(datamartIds)

  /** 현재 에이전트 테마 색상 (하이라이트용) */
  const themeColorHex = computed(() => selectedChatThemeAgent.value?.colorHex?.trim() || '')

  /** 입력 중인 마지막 토큰 (공백으로 끝나면 추천 안 함) */
  const currentToken = computed(() => {
    const text = chatMessage.value
    if (!text || text.endsWith(' ')) return ''
    return text.split(/\s+/).at(-1) ?? ''
  })

  /** 지표·구분 합산 후 용어 중복 제거 */
  const items = computed<string[]>(() => {
    if (!isActive.value) return []
    const token = currentToken.value
    if (token.length < 1) return []
    const merged = [...suggestMetric(token), ...suggestDimension(token)]
    return [...new Set(merged)].slice(0, 6)
  })

  const hasItems = computed(() => items.value.length > 0)

  /** 입력 토큰과 일치하는 부분을 분리해 하이라이트 렌더링용 조각으로 반환 */
  const highlightParts = (term: string): { text: string; hit: boolean }[] => {
    const token = currentToken.value.trim()
    if (!token) return [{ text: term, hit: false }]
    const idx = term.toLowerCase().indexOf(token.toLowerCase())
    if (idx === -1) return [{ text: term, hit: false }]
    return [
      { text: term.slice(0, idx), hit: false },
      { text: term.slice(idx, idx + token.length), hit: true },
      { text: term.slice(idx + token.length), hit: false },
    ].filter((p) => p.text.length > 0)
  }

  /** 마지막 토큰을 선택 용어로 치환 */
  const applyItem = (term: string) => {
    const text = chatMessage.value
    const idx = text.lastIndexOf(' ')
    chatMessage.value = idx === -1 ? term : text.slice(0, idx + 1) + term
  }

  return {
    isActive,
    items,
    hasItems,
    themeColorHex,
    highlightParts,
    applyItem,
  }
}
