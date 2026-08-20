import type { DropdownMenuItemDef } from '@leechanyong/ispark-ui'
import type { MyDoc } from '~/types/mydoc'

/** 기본대화(svcTy C) — UiBadge basic-chat 테마 (API colorHex 없을 때) */
const BASIC_CHAT_THEME_HEX = '#ac5e00'

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return '100, 116, 139'
  return `${Number.parseInt(h.slice(0, 2), 16)}, ${Number.parseInt(h.slice(2, 4), 16)}, ${Number.parseInt(h.slice(4, 6), 16)}`
}

const resolveMyDocThemeHex = (doc: MyDoc): string => {
  const raw = doc.colorHex?.trim()
  if (raw) return raw.startsWith('#') ? raw : `#${raw}`
  if (doc.svcTy === 'C') return BASIC_CHAT_THEME_HEX
  return ''
}

/** 왼쪽 문서 아이콘 영역 — 에이전트 colorHex 배경 (채팅 index 카드와 동일 CSS 변수) */
export const getMyDocDocAreaStyle = (doc: MyDoc): Record<string, string> | undefined => {
  const colorHex = resolveMyDocThemeHex(doc)
  if (!colorHex) return undefined
  return {
    '--card-icon-color': colorHex,
    '--card-icon-bg': `rgba(${hexToRgb(colorHex)}, 0.12)`,
  }
}

/** 에이전트 아이콘 hover 툴팁 라벨 */
export const getMyDocAgentLabel = (doc: MyDoc): string => {
  if (doc.agentNm?.trim()) return doc.agentNm.trim()
  if (doc.svcTy === 'C') return '기본대화'
  if (doc.svcTy === 'S') return '데이터분석'
  if (doc.agentId?.trim()) return doc.agentId.trim()
  return '에이전트'
}

/** 우측 에이전트 아이콘 — API iconClassNm (없으면 기본, C는 기본대화 아이콘) */
export const getMyDocAgentIconClass = (doc: MyDoc): string => {
  const icon = doc.iconClassNm?.trim()
  if (icon) return icon
  if (doc.svcTy === 'C') return 'icon-comment-other'
  return 'icon-search'
}

export const getMyDocMenuItems = (): DropdownMenuItemDef[] => {
  const items: DropdownMenuItemDef[] = [
    { label: '열기', icon: 'icon-document', value: 'open' },
    { label: '이름 변경', icon: 'icon-edit', value: 'rename' },
    { label: '공유', icon: 'icon-sidebar-share', value: 'share' },
    { label: '삭제', icon: 'icon-delete', value: 'delete', color: 'danger' },
  ]
  return items
}
