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
    primary: '#0ea5a4',
    primaryHover: '#0a8988',
    primaryDark: '#077372',
    primaryDarkHover: '#055f5e',
    primaryRgb: '14, 165, 164',
    primaryBg: '#d0f0f0',
    bgGradient: 'linear-gradient(180deg, rgba(14,165,164,0.12) 0%, rgba(14,165,164,0.04) 50%, transparent 100%)',
    sidebarBg: '#e6f2f4', // #f4f7f9 × 94% + #0ea5a4 × 6%
  },
  {
    key: 'WORK',
    label: '워크',
    iconClassNm: 'icon-dropdown-system',
    tagline: '업무 효율을 높여주는 AI 파트너',
    primary: '#3c69db',
    primaryHover: '#1d4ed8',
    primaryDark: '#2b43a2',
    primaryDarkHover: '#1d3589',
    primaryRgb: '60, 105, 219',
    primaryBg: '#dee9fb',
    bgGradient: 'linear-gradient(180deg, rgba(60,105,219,0.12) 0%, rgba(60,105,219,0.04) 50%, transparent 100%)',
    sidebarBg: '#e9eef7', // #f4f7f9 × 94% + #3c69db × 6%
  },
  {
    key: 'LIFE',
    label: '라이프',
    iconClassNm: 'icon-user',
    tagline: '일상을 더 풍요롭게 만들어 드립니다',
    primary: '#22a858',
    primaryHover: '#1b9249',
    primaryDark: '#177a3d',
    primaryDarkHover: '#126331',
    primaryRgb: '34, 168, 88',
    primaryBg: '#dcf5e7',
    bgGradient: 'linear-gradient(180deg, rgba(34,168,88,0.12) 0%, rgba(34,168,88,0.04) 50%, transparent 100%)',
    sidebarBg: '#e7f2ef', // #f4f7f9 × 94% + #22a858 × 6%
  },
  {
    key: 'MENTAL',
    label: '멘탈케어',
    iconClassNm: 'icon-heart-line',
    tagline: '마음의 건강을 함께 돌봐드립니다',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryDark: '#5b21b6',
    primaryDarkHover: '#4c1d95',
    primaryRgb: '124, 58, 237',
    primaryBg: '#ede9fe',
    bgGradient: 'linear-gradient(180deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 50%, transparent 100%)',
    sidebarBg: '#edecf8', // #f4f7f9 × 94% + #7c3aed × 6%
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

/** 에이전트가 있는 첫 번째 테마 키를 반환. 모두 비어있으면 첫 테마 키 반환. */
export const getInitialThemeKey = (grouped: Record<string, Agent[]>): string => {
  for (const theme of CHAT_THEMES) {
    if (grouped[theme.key]?.length > 0) return theme.key
  }
  return CHAT_THEMES[0].key
}

/** key로 ChatTheme 객체를 반환 */
export const findThemeByKey = (key: string): ChatTheme | undefined => CHAT_THEMES.find((t) => t.key === key)
