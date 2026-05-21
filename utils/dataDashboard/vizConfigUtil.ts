import { calculateChartScale } from '~/utils/chat/visualizationChartUtil'
import type { DataDashboardVizConfig } from '~/types/data-dashboard'

/** vizConfig JSON 문자열·이중 인코딩 → 객체 */
export const parseVizConfig = (raw: unknown): DataDashboardVizConfig => {
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as DataDashboardVizConfig
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw.trim())
      if (typeof parsed === 'string') return parseVizConfig(parsed)
      return parsed && typeof parsed === 'object' ? (parsed as DataDashboardVizConfig) : {}
    } catch {
      return {}
    }
  }
  return {}
}

/** 결과 컬럼명과 vizConfig 키 대소문자 불일치 보정 */
export const resolveColumnKey = (columns: string[], key?: string): string | undefined => {
  if (!key?.trim()) return undefined
  const exact = columns.find((c) => c === key)
  if (exact) return exact
  const upper = key.toUpperCase()
  return columns.find((c) => c.toUpperCase() === upper)
}

/** 행 객체에서 컬럼 값 조회 (대소문자 무시) */
export const getRowValue = (row: Record<string, unknown>, colKey: string): unknown => {
  if (colKey in row) return row[colKey]
  const matchKey = Object.keys(row).find((k) => k.toUpperCase() === colKey.toUpperCase())
  return matchKey ? row[matchKey] : undefined
}

/** 막대/라인 Y축 — 전부 양수면 min 0 고정 */
export const buildPositiveYScale = (values: number[]) => {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (valid.length === 0) return { min: 0, max: 100, stepSize: 20 }

  const hasNegative = valid.some((v) => v < 0)
  const scale = calculateChartScale(valid, 0.1, hasNegative)
  if (!hasNegative) {
    return { min: 0, max: scale.max, stepSize: scale.stepSize }
  }
  return scale
}
