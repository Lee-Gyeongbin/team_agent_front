import type { Agent } from '~/types/agent'

/** 테마(cncptTy) 별 정적 설정 */
export interface ChatTheme {
  key: string
  label: string
  iconClassNm: string
  tagline: string
  primary: string
  primaryHover: string
  primaryDark: string
  primaryDarkHover: string
  primaryRgb: string
  primaryBg: string
  bgGradient: string
  /**
   * 사이드바 배경색 — 기본 배경(#f4f7f9)에 테마 primary를 6% 혼합한 값.
   * 전역 배경 그라데이션이 사이드바에도 자연스럽게 스며들도록 한다.
   */
  sidebarBg: string
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    key: 'KM',
    label: '지식관리',
    iconClassNm: 'icon-chat-open-book',
    tagline: '문서·데이터를 기반으로 정확하게 답합니다',
    primary: '#0b7285',
    primaryHover: '#096274',
    primaryDark: '#075463',
    primaryDarkHover: '#054653',
    primaryRgb: '11, 114, 133',
    primaryBg: '#d8f1f6',
    bgGradient: 'none',
    sidebarBg: '#f4f7f9',
  },
  {
    key: 'WORK',
    label: '워크',
    iconClassNm: 'icon-dropdown-system',
    tagline: '업무 효율을 높여주는 AI 파트너',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryDark: '#1e40af',
    primaryDarkHover: '#1e3a8a',
    primaryRgb: '37, 99, 235',
    primaryBg: '#dbeafe',
    bgGradient: 'linear-gradient(180deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 50%, transparent 100%)',
    sidebarBg: '#edf3fd',
  },
  {
    key: 'LIFE',
    label: '라이프',
    iconClassNm: 'icon-user',
    tagline: '일상을 더 풍요롭게 만들어 드립니다',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryDark: '#b45309',
    primaryDarkHover: '#92400e',
    primaryRgb: '245, 158, 11',
    primaryBg: '#fef3c7',
    bgGradient: 'linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 50%, transparent 100%)',
    sidebarBg: '#f8f0df',
  },
  {
    key: 'MENTAL',
    label: '멘탈케어',
    iconClassNm: 'icon-heart-line',
    tagline: '마음의 건강을 함께 돌봐드립니다',
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryDark: '#be185d',
    primaryDarkHover: '#9d174d',
    primaryRgb: '236, 72, 153',
    primaryBg: '#fce7f3',
    bgGradient: 'linear-gradient(180deg, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0.04) 50%, transparent 100%)',
    sidebarBg: '#f8eaf1',
  },
]

/** cncptTy 키 목록 */
const THEME_KEYS = new Set(CHAT_THEMES.map((t) => t.key))

/**
 * agentList를 cncptTy 기준으로 테마 버킷에 분류한다.
 * 4테마(KM/WORK/LIFE/MENTAL)에 속하지 않는 에이전트는 제외.
 * 정렬은 이미 store에서 sortOrd 기준으로 처리되어 있으므로 유지.
 */
export const groupAgentsByTheme = (agents: Agent[]): Record<string, Agent[]> => {
  const result: Record<string, Agent[]> = {}
  for (const theme of CHAT_THEMES) {
    result[theme.key] = []
  }
  for (const agent of agents) {
    if (THEME_KEYS.has(agent.cncptTy)) {
      result[agent.cncptTy].push(agent)
    }
  }
  return result
}

/** 에이전트가 1개 이상 있는 테마만 반환 */
export const getVisibleThemes = (grouped: Record<string, Agent[]>): ChatTheme[] => {
  return CHAT_THEMES.filter((t) => (grouped[t.key]?.length ?? 0) > 0)
}

/** 에이전트가 있는 첫 번째 테마 키를 반환. 모두 비어있으면 첫 테마 키 반환. */
export const getInitialThemeKey = (grouped: Record<string, Agent[]>): string => {
  for (const theme of CHAT_THEMES) {
    if (grouped[theme.key]?.length > 0) return theme.key
  }
  return CHAT_THEMES[0].key
}

/** key로 ChatTheme 객체를 반환 */
export const findThemeByKey = (key: string): ChatTheme | undefined => CHAT_THEMES.find((t) => t.key === key)
