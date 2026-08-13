import type { WorkCategory } from '~/types/mail'

/** ML000001003 → 003, 3 → 003 */
export const normalizeMailCodeCd = (cd: string): string => {
  if (!cd) return ''
  const trimmed = cd.trim()
  const suffixMatch = trimmed.match(/(\d{3})$/)
  if (suffixMatch) return suffixMatch[1]
  if (/^\d+$/.test(trimmed)) return trimmed.padStart(3, '0')
  return trimmed
}

const TAG_PALETTE = ['tag-primary', 'tag-info', 'tag-purple', 'tag-success', 'tag-warn', 'tag-orange'] as const

const URGENCY_TAG_MAP: Record<string, string> = {
  '001': 'tag-urgent',
  '002': 'tag-warn',
  '003': 'tag-info',
  '004': 'tag-gray',
}

const getPaletteClass = (index: number, offset = 0): string => {
  if (index < 0) return 'tag-gray'
  return TAG_PALETTE[(index + offset) % TAG_PALETTE.length]
}

const getTagClassFromOptions = (cd: string, options: WorkCategory[], paletteOffset = 0): string | null => {
  if (!cd || options.length === 0) return null
  const normalized = normalizeMailCodeCd(cd)
  const idx = options.findIndex((o) => o.cd === cd || normalizeMailCodeCd(o.cd) === normalized)
  if (idx < 0) return null
  return getPaletteClass(idx, paletteOffset)
}

const getTagClassFromSuffix = (cd: string, paletteOffset = 0): string | null => {
  const normalized = normalizeMailCodeCd(cd)
  const suffixIdx = Number.parseInt(normalized, 10) - 1
  if (Number.isNaN(suffixIdx) || suffixIdx < 0) return null
  return getPaletteClass(suffixIdx, paletteOffset)
}

/** 메일 목적 · 필요 조치 — 공통코드 순서 기준 팔레트 (코드별 고유 색) */
export const getMailCategoryTagClass = (
  cd: string,
  options: WorkCategory[] = [],
  paletteOffset = 0,
): string => {
  return (
    getTagClassFromOptions(cd, options, paletteOffset) ??
    getTagClassFromSuffix(cd, paletteOffset) ??
    'tag-gray'
  )
}

/** 긴급도 — 의미 기반 고정 색 */
export const getMailUrgencyTagClass = (cd: string): string => {
  return URGENCY_TAG_MAP[normalizeMailCodeCd(cd)] ?? 'tag-gray'
}
