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

/** 라인 차트 Y축 스케일 (음수 구간 포함) */
export const buildLineYScale = (values: number[]) => {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (valid.length === 0) return { min: 0, max: 100, stepSize: 20 }
  return calculateChartScale(valid, 0.1, true)
}

type YScale = { min: number; max: number; stepSize: number }

/** 데이터셋별 Y축 스케일 (막대/라인) */
const resolveDatasetYScale = (data: number[], chartType: 'bar' | 'line'): YScale => {
  return chartType === 'bar' ? buildPositiveYScale(data) : buildLineYScale(data)
}

type ReadRowNum = (row: Record<string, unknown>, colKey: string) => number
type ReadRowLabel = (row: Record<string, unknown>, colKey: string) => string

/** x축 고유값 목록 (등장 순서 유지) — raw 값 기준 */
export const buildRawCategories = (rows: Record<string, unknown>[], xKey: string): string[] => {
  const categories: string[] = []
  const seen = new Set<string>()
  rows.forEach((row) => {
    const raw = String(getRowValue(row, xKey) ?? '')
    if (!raw || seen.has(raw)) return
    seen.add(raw)
    categories.push(raw)
  })
  return categories
}

/** x축 raw 값 → 표시 레이블 (코드명 치환 등) */
export const buildCategoryLabels = (
  rawCategories: string[],
  rows: Record<string, unknown>[],
  displayRows: Record<string, unknown>[],
  xKey: string,
  readLabel: ReadRowLabel,
): string[] => {
  return rawCategories.map((raw) => {
    const idx = rows.findIndex((row) => String(getRowValue(row, xKey) ?? '') === raw)
    const displayRow =
      idx >= 0 ? (displayRows[idx] ?? rows[idx]) : rows.find((row) => String(getRowValue(row, xKey) ?? '') === raw)
    return readLabel((displayRow ?? {}) as Record<string, unknown>, xKey)
  })
}

/** x축 키 기준 Y값 합산 — 동일 x축에 여러 행(REGN_CD 등)이 있을 때 사용 */
export const buildAggregatedValueMap = (
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  readNum: ReadRowNum,
): Map<string, number> => {
  const valueMap = new Map<string, number>()
  rows.forEach((row) => {
    const category = String(getRowValue(row, xKey) ?? '')
    if (!category) return
    valueMap.set(category, (valueMap.get(category) ?? 0) + readNum(row, yKey))
  })
  return valueMap
}

/**
 * Y축 2개일 때 좌(y)·우(y1) 이축 scales — ChatVisualization buildChartModel과 동일 규칙
 */
/**
 * 막대·라인·가로막대용 X/Y축 컬럼 해석
 * - xAxisKey/yAxisKeys 우선
 * - 없으면 파이용 labelKey/valueKey 폴백 (파이 위젯에서 다른 차트로 전환 시)
 * - 그래도 없으면 첫 컬럼·나머지 컬럼 자동
 */
export const resolveChartAxisMapping = (
  columns: string[],
  vizCfg: DataDashboardVizConfig,
): { xKey: string; yKeys: string[] } => {
  const xKey =
    resolveColumnKey(columns, vizCfg.xAxisKey) ?? resolveColumnKey(columns, vizCfg.labelKey) ?? columns[0]

  const configuredYKeys = (vizCfg.yAxisKeys ?? [])
    .map((k) => resolveColumnKey(columns, k))
    .filter((k): k is string => !!k)

  const valueKey = resolveColumnKey(columns, vizCfg.valueKey)

  const yKeys = configuredYKeys.length
    ? configuredYKeys
    : valueKey
      ? [valueKey]
      : columns.filter((c) => c !== xKey)

  return { xKey, yKeys }
}

export const buildDualAxisScales = (
  datasets: Array<{ data: number[] }>,
  chartType: 'bar' | 'line',
): Record<string, unknown> => {
  const left = resolveDatasetYScale(datasets[0]?.data ?? [], chartType)
  const right = resolveDatasetYScale(datasets[1]?.data ?? [], chartType)
  return {
    y: {
      min: left.min,
      max: left.max,
      ticks: { stepSize: left.stepSize },
      position: 'left',
      beginAtZero: left.min >= 0,
    },
    y1: {
      min: right.min,
      max: right.max,
      ticks: { stepSize: right.stepSize },
      position: 'right',
      grid: { drawOnChartArea: false },
      beginAtZero: right.min >= 0,
    },
  }
}
