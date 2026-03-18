// 테마 색상 관리
export interface ThemeColor {
  name: string
  key: string
  primary: string
  primaryHover: string
  primaryDark: string
  primaryDarkHover: string
  primaryRgb: string
  primaryBg: string
}

const themeColors: ThemeColor[] = [
  {
    name: '블루',
    key: 'blue',
    primary: '#3c69db',
    primaryHover: '#1d4ed8',
    primaryDark: '#2b43a2',
    primaryDarkHover: '#1d3589',
    primaryRgb: '60, 105, 219',
    primaryBg: '#dee9fb',
  },
  {
    name: '그린',
    key: 'green',
    primary: '#22a858',
    primaryHover: '#1b9249',
    primaryDark: '#177a3d',
    primaryDarkHover: '#126331',
    primaryRgb: '34, 168, 88',
    primaryBg: '#dcf5e7',
  },
  {
    name: '퍼플',
    key: 'purple',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryDark: '#5b21b6',
    primaryDarkHover: '#4c1d95',
    primaryRgb: '124, 58, 237',
    primaryBg: '#ede9fe',
  },
  {
    name: '오렌지',
    key: 'orange',
    primary: '#ff7518',
    primaryHover: '#e5660f',
    primaryDark: '#C73E07',
    primaryDarkHover: '#a83306',
    primaryRgb: '255, 117, 24',
    primaryBg: '#ffedd4',
  },
]

const STORAGE_KEY = 'theme-color'

const currentThemeKey = ref('blue')

const applyTheme = (theme: ThemeColor) => {
  const root = document.documentElement
  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-primary-hover', theme.primaryHover)
  root.style.setProperty('--color-primary-dark', theme.primaryDark)
  root.style.setProperty('--color-primary-dark-hover', theme.primaryDarkHover)
  root.style.setProperty('--color-primary-rgb', theme.primaryRgb)
  root.style.setProperty('--color-primary-bg', theme.primaryBg)
  root.setAttribute('data-theme', theme.key)
  currentThemeKey.value = theme.key
  localStorage.setItem(STORAGE_KEY, theme.key)
}

// 저장된 테마 초기 적용 (미저장 시 기본 블루 적용 → CSS 변수 항상 설정)
const initTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const theme = saved ? themeColors.find((t) => t.key === saved) : themeColors[0]
  if (theme) applyTheme(theme)
}

export const useTheme = () => {
  return {
    themeColors,
    currentThemeKey,
    applyTheme,
    initTheme,
  }
}
