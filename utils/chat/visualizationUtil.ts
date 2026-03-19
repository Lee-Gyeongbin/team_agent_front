import type {
  VisualizationChartSelection,
  VisualizationChartType,
  VisualizationColumnProfile,
  VisualizationSchema,
  VisualizationSelectableOptions,
  VisualizationSelectOption,
  VisualizationStatDetailItem,
  VisualizationStatItem,
  VisualizationViewModel,
} from '~/types/chat'
import type { TableColumn } from '~/types/table'
import { registerDynamicMappings, resolveColumnLabel, resolveDisplayValue } from '~/utils/chat/visualizationLabelMap'
import { calculateChartScale } from '~/utils/chat/visualizationChartUtil'

const TIME_AXIS_YEAR_MONTH = '__TIME_AXIS_YEAR_MONTH__'
const TIME_AXIS_YEAR_QUARTER = '__TIME_AXIS_YEAR_QUARTER__'
const EMPTY_VALUE = '-'
const DEFAULT_CHART_TYPE: VisualizationChartType = 'bar'
const CHART_TYPES: VisualizationChartType[] = ['bar', 'line', 'pie']

const METRIC_HINT_PATTERNS = [
  'TOTAL_VAL',
  'AVG_VAL',
  'RATIO_PERCENT',
  'ALL_TOTAL',
  'DIFF_VAL',
  'GROWTH_RATE',
  'MAX',
  'MIN',
  'STAT_VAL',
  'MON_VAL',
  'SUM_TOTAL',
]

const TIME_HINT_PATTERNS = ['YEAR', 'MON', 'MONTH', 'QUARTER', 'QTR', 'DATE', 'DAY', 'YM', 'YMD']
const CODE_HINT_PATTERNS = ['_CD', '_ID', 'CODE', 'SEQ', 'ORDER_NO', 'ORDER', 'NO']

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const getColumnKeys = (rows: Array<Record<string, unknown>>) => {
  const keySet = new Set<string>()
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => keySet.add(key))
  })
  return Array.from(keySet)
}

const normalizeKey = (key: string) => key.trim().toUpperCase()

const includesAnyPattern = (value: string, patterns: string[]) => {
  return patterns.some((pattern) => value.includes(pattern))
}

const isLikelyTimeKey = (key: string, label: string) => {
  const upper = normalizeKey(key)
  const upperLabel = label.toUpperCase()
  return includesAnyPattern(upper, TIME_HINT_PATTERNS) || /(년|월|분기|일자|날짜)/.test(upperLabel)
}

const isLikelyCodeKey = (key: string, label: string) => {
  const upper = normalizeKey(key)
  const upperLabel = label.toUpperCase()
  const isCodePattern =
    includesAnyPattern(upper, CODE_HINT_PATTERNS) || upper.endsWith('_CD') || upper.endsWith('_ID') || upper === 'ID'
  return isCodePattern || /(코드|식별|순번|번호|ID)/.test(upperLabel)
}

const isLikelyMetricKey = (key: string, label: string) => {
  const upper = normalizeKey(key)
  const upperLabel = label.toUpperCase()
  return (
    includesAnyPattern(upper, METRIC_HINT_PATTERNS) ||
    /(금액|매출|비율|건수|점수|수량|총계|합계|평균|통계|지표)/.test(upperLabel)
  )
}

const getColumnProfile = (rows: Array<Record<string, unknown>>, key: string): VisualizationColumnProfile => {
  const label = resolveColumnLabel(key)
  const uniqueSet = new Set<string>()
  let nonEmptyCount = 0
  let numericCount = 0

  rows.forEach((row) => {
    const raw = row[key]
    if (raw == null || raw === '') return
    nonEmptyCount += 1
    uniqueSet.add(String(raw))
    if (toNumber(raw) !== null) {
      numericCount += 1
    }
  })

  const isNumeric = nonEmptyCount > 0 && numericCount === nonEmptyCount
  const uniqueCount = uniqueSet.size
  const uniqueRatio = nonEmptyCount > 0 ? uniqueCount / nonEmptyCount : 0
  const isTimeLike = isLikelyTimeKey(key, label)
  const isCodeLike = isLikelyCodeKey(key, label)
  const metricHint = isLikelyMetricKey(key, label)
  const idLikeHighCardinality = uniqueRatio >= 0.9 && nonEmptyCount >= 12
  const isLikelyMetric = isNumeric && !isTimeLike && !isCodeLike && (metricHint || !idLikeHighCardinality)

  return {
    key,
    uniqueCount,
    nonEmptyCount,
    uniqueRatio,
    isNumeric,
    isTimeLike,
    isCodeLike,
    isLikelyMetric,
  }
}

const hasYearMonthAxis = (rows: Array<Record<string, unknown>>, columns: string[]) => {
  if (!columns.includes('YEAR') || !columns.includes('MON')) return false
  const uniqueAxis = new Set<string>()
  rows.forEach((row) => {
    const year = String(row.YEAR ?? '').trim()
    const month = String(row.MON ?? '').trim()
    if (!year || !month) return
    uniqueAxis.add(`${year}-${month}`)
  })
  return uniqueAxis.size > 1
}

const hasYearQuarterAxis = (rows: Array<Record<string, unknown>>, columns: string[]) => {
  if (!columns.includes('YEAR') || !columns.includes('QUARTER')) return false
  const uniqueAxis = new Set<string>()
  rows.forEach((row) => {
    const year = String(row.YEAR ?? '').trim()
    const quarter = String(row.QUARTER ?? '').trim()
    if (!year || !quarter) return
    uniqueAxis.add(`${year}-Q${quarter}`)
  })
  return uniqueAxis.size > 1
}

const getPreferredChartTargetKey = (keys: string[]) => {
  const priority = ['STAT_ID', 'REGN_CD', 'DETAIL_ITEM_CD', 'RESULT']
  return priority.find((key) => keys.includes(key)) ?? keys[0] ?? ''
}

const isTimeAxisKey = (key: string) => key === TIME_AXIS_YEAR_MONTH || key === TIME_AXIS_YEAR_QUARTER

/** 시리즈 후보: X축 옵션 중 시간축(년-월, 년-분기) 제외 */
const getAvailableSeriesKeys = (options: VisualizationSelectableOptions): string[] => {
  return options.chartTargetKeys.filter((key) => !isTimeAxisKey(key))
}

const getDefaultSelection = (options: VisualizationSelectableOptions): VisualizationChartSelection => {
  const chartTargetKey = options.chartTargetKeys[0] ?? ''
  const availableSeries = getAvailableSeriesKeys(options).filter((key) => key !== chartTargetKey)
  const seriesKey = availableSeries.length === 1 ? availableSeries[0] : ''
  return {
    chartType: isTimeAxisKey(chartTargetKey) ? 'line' : DEFAULT_CHART_TYPE,
    chartTargetKey,
    yAxisKeys: options.yAxisKeys.slice(0, seriesKey ? 1 : options.yAxisKeys.length > 1 ? 2 : 1),
    seriesKey,
    stack: false,
    dualAxis: false,
  }
}

const padMonth = (value: unknown) => String(value ?? '').padStart(2, '0')

const getTimeAxisLabel = (row: Record<string, unknown>, xAxisKey: string) => {
  if (xAxisKey === TIME_AXIS_YEAR_MONTH) {
    return `${row.YEAR ?? ''}-${padMonth(row.MON)}`
  }
  if (xAxisKey === TIME_AXIS_YEAR_QUARTER) {
    return `${row.YEAR ?? ''}-Q${row.QUARTER ?? ''}`
  }
  return ''
}

const getXAxisValue = (row: Record<string, unknown>, xAxisKey: string) => {
  if (xAxisKey === TIME_AXIS_YEAR_MONTH || xAxisKey === TIME_AXIS_YEAR_QUARTER) {
    return getTimeAxisLabel(row, xAxisKey)
  }
  return resolveDisplayValue(xAxisKey, row[xAxisKey])
}

const getXAxisSortValue = (row: Record<string, unknown>, xAxisKey: string) => {
  if (xAxisKey === TIME_AXIS_YEAR_MONTH) {
    const year = Number(row.YEAR ?? 0)
    const month = Number(row.MON ?? 0)
    return year * 100 + month
  }
  if (xAxisKey === TIME_AXIS_YEAR_QUARTER) {
    const year = Number(row.YEAR ?? 0)
    const quarter = Number(row.QUARTER ?? 0)
    return year * 10 + quarter
  }
  return 0
}

const formatTableMetric = (value: unknown) => {
  const numericValue = toNumber(value)
  if (numericValue === null) return EMPTY_VALUE
  return numericValue.toLocaleString('ko-KR')
}

const formatTableValue = (key: string, value: unknown, metricKeys: string[]) => {
  if (metricKeys.includes(key)) {
    return formatTableMetric(value)
  }
  const text = resolveDisplayValue(key, value)
  return text || EMPTY_VALUE
}

export const parseTableData = (tableData: string) => {
  if (!tableData?.trim()) return null
  try {
    return JSON.parse(tableData)
  } catch (error) {
    console.warn('[chat] tableData parsing error:', error)
    return null
  }
}

export const buildRowsFromColumnarJson = (raw: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(raw)) {
    return raw.filter((item) => isRecord(item)) as Array<Record<string, unknown>>
  }
  if (!isRecord(raw)) {
    return []
  }

  const keys = Object.keys(raw)
  if (keys.length === 0) return []

  const isColumnar = keys.every((key) => {
    const value = raw[key]
    if (!isRecord(value)) return false
    return Object.keys(value).every((itemKey) => /^\d+$/.test(itemKey))
  })

  if (!isColumnar) {
    return [raw]
  }

  const rowIndexSet = new Set<number>()
  keys.forEach((key) => {
    const value = raw[key] as Record<string, unknown>
    Object.keys(value).forEach((idx) => rowIndexSet.add(Number(idx)))
  })

  const sortedIndexes = Array.from(rowIndexSet).sort((a, b) => a - b)
  return sortedIndexes.map((rowIdx) => {
    const row: Record<string, unknown> = {}
    keys.forEach((key) => {
      const value = raw[key] as Record<string, unknown>
      row[key] = value[String(rowIdx)]
    })
    return row
  })
}

export const inferSchema = (rows: Array<Record<string, unknown>>): VisualizationSchema | null => {
  if (rows.length === 0) return null

  // 모든 컬럼
  const columns = getColumnKeys(rows)
  // 컬럼 프로파일
  const profiles = columns.map((key) => getColumnProfile(rows, key))
  // 통계값(Y축) 컬럼
  const metricKeys = profiles.filter((profile) => profile.isLikelyMetric).map((profile) => profile.key)
  // X축 컬럼
  const dimensionKeys = columns.filter((key) => !metricKeys.includes(key))
  // X축 컬럼 후보
  const rawChartTargetKeys = profiles
    .filter((profile) => !profile.isLikelyMetric && profile.uniqueCount > 1)
    .map((profile) => profile.key)

  // X축 컬럼 정렬
  const sortedChartTargetKeys: string[] = []
  if (hasYearMonthAxis(rows, columns)) {
    sortedChartTargetKeys.push(TIME_AXIS_YEAR_MONTH)
  } else if (hasYearQuarterAxis(rows, columns)) {
    sortedChartTargetKeys.push(TIME_AXIS_YEAR_QUARTER)
  }
  // 선호하는 X축 컬럼
  const preferredChartTarget = getPreferredChartTargetKey(rawChartTargetKeys)
  // X축 컬럼 정렬
  const orderedDimensionKeys = [
    preferredChartTarget,
    ...rawChartTargetKeys.filter((key) => key !== preferredChartTarget),
  ].filter(Boolean)
  orderedDimensionKeys.forEach((key) => {
    if (!sortedChartTargetKeys.includes(key)) sortedChartTargetKeys.push(key)
  })

  // 시리즈 키 후보: 비수치, 비시간형, 유니크값 2~20개인 dimension
  const seriesKeys = profiles
    .filter(
      (profile) =>
        !profile.isLikelyMetric &&
        !profile.isTimeLike &&
        profile.uniqueCount >= 2 &&
        profile.uniqueCount <= 20 &&
        profile.nonEmptyCount > 0,
    )
    .map((profile) => profile.key)

  const selectableOptions: VisualizationSelectableOptions = {
    chartTargetKeys: sortedChartTargetKeys,
    yAxisKeys: metricKeys,
    seriesKeys,
    chartTypes: metricKeys.length > 0 ? CHART_TYPES : [],
    canStack: true,
    canDualAxis: metricKeys.length >= 2,
  }
  const defaultSelection = getDefaultSelection(selectableOptions)

  return {
    columns,
    dimensionKeys,
    metricKeys,
    profiles,
    selectableOptions,
    defaultSelection,
  }
}

export const buildVisualizationViewModel = (params: {
  messageId: string
  sql?: string
  tableData?: string
  statList?: VisualizationStatItem[]
  statDetailList?: VisualizationStatDetailItem[]
}): VisualizationViewModel => {
  // 테이블 데이터 파싱
  const parsed = parseTableData(params.tableData ?? '')
  // 테이블 데이터 파싱 결과를 행 데이터로 변환
  const rows = buildRowsFromColumnarJson(parsed)
  // 스키마 추론
  const schema = inferSchema(rows)

  if (!params.tableData) {
    return {
      messageId: params.messageId,
      status: 'empty',
      sql: params.sql ?? '',
      rawTableData: '',
      rows: [],
      schema: null,
    }
  }

  if (rows.length === 0) {
    return {
      messageId: params.messageId,
      status: 'empty',
      sql: params.sql ?? '',
      rawTableData: params.tableData ?? '',
      rows: [],
      schema: null,
    }
  }

  return {
    messageId: params.messageId,
    status: 'success',
    sql: params.sql ?? '',
    rawTableData: params.tableData ?? '',
    rows,
    schema,
    statList: params.statList,
    statDetailList: params.statDetailList,
  }
}

// 테이블 모델 생성
export const buildTableModel = (viewModel: VisualizationViewModel) => {
  registerDynamicMappings(viewModel.statList, viewModel.statDetailList)
  const schema = viewModel.schema
  if (!schema) {
    return { columns: [] as TableColumn[], data: [] as Array<Record<string, unknown>> }
  }

  const columns: TableColumn[] = schema.columns.map((key) => ({
    key,
    label: resolveColumnLabel(key),
    align: schema.metricKeys.includes(key) ? 'right' : 'left',
    headerAlign: 'center',
  }))

  const data = viewModel.rows.map((row) => {
    const mapped: Record<string, unknown> = {}
    schema.columns.forEach((key) => {
      mapped[key] = formatTableValue(key, row[key], schema.metricKeys)
    })
    return mapped
  })

  return { columns, data }
}

// 통계값(Y축) 컬럼 옵션 생성
export const buildMetricOptions = (schema: VisualizationSchema | null): VisualizationSelectOption[] => {
  if (!schema) return []
  return schema.selectableOptions.yAxisKeys.map((key) => ({
    label: resolveColumnLabel(key),
    value: key,
  }))
}

// 시리즈 키 옵션 생성
export const buildSeriesKeyOptions = (
  schema: VisualizationSchema | null,
  selectedChartTargetKey?: string,
): VisualizationSelectOption[] => {
  if (!schema) return []
  return getAvailableSeriesKeys(schema.selectableOptions)
    .filter((key) => key !== selectedChartTargetKey)
    .map((key) => ({
      label: resolveColumnLabel(key),
      value: key,
    }))
}

// X축 컬럼 옵션 생성
export const buildChartTargetOptions = (schema: VisualizationSchema | null): VisualizationSelectOption[] => {
  if (!schema) return []
  return schema.selectableOptions.chartTargetKeys.map((key) => {
    const label = resolveColumnLabel(key)
    return { label, value: key }
  })
}

// 기본 차트 타입 생성
export const getDefaultChartType = (schema: VisualizationSchema | null): VisualizationChartType => {
  if (!schema) return 'bar'
  return schema.defaultSelection.chartType
}

// 기본 차트 선택 생성
export const buildDefaultChartSelection = (schema: VisualizationSchema | null): VisualizationChartSelection => {
  if (!schema) {
    return {
      chartType: 'bar',
      chartTargetKey: '',
      yAxisKeys: [],
      seriesKey: '',
      stack: false,
      dualAxis: false,
    }
  }
  return { ...schema.defaultSelection, yAxisKeys: [...schema.defaultSelection.yAxisKeys] }
}

// 차트 선택 유효성 검증
const sanitizeSelection = (
  schema: VisualizationSchema,
  selection: VisualizationChartSelection,
): VisualizationChartSelection => {
  const chartType = schema.selectableOptions.chartTypes.includes(selection.chartType)
    ? selection.chartType
    : schema.defaultSelection.chartType
  const chartTargetKey = schema.selectableOptions.chartTargetKeys.includes(selection.chartTargetKey)
    ? selection.chartTargetKey
    : schema.defaultSelection.chartTargetKey

  // seriesKey 유효성 검증 (pie에서는 미사용, chartTargetKey와 중복 불가)
  const availableSeries = getAvailableSeriesKeys(schema.selectableOptions)
  const seriesKey =
    selection.seriesKey &&
    chartType !== 'pie' &&
    selection.seriesKey !== chartTargetKey &&
    availableSeries.includes(selection.seriesKey)
      ? selection.seriesKey
      : ''

  const filteredYKeys = selection.yAxisKeys.filter((key) => schema.selectableOptions.yAxisKeys.includes(key))
  // seriesKey 활성 시 Y축은 1개만 사용 (시리즈가 이미 다차원 분리 역할)
  const maxYKeys = seriesKey ? 1 : 2
  const yAxisKeys = filteredYKeys.slice(0, maxYKeys)
  const validYAxisKeys = yAxisKeys.length > 0 ? yAxisKeys : [schema.defaultSelection.yAxisKeys[0]].filter(Boolean)
  // seriesKey 활성 시 dualAxis 비활성
  const dualAxis = !seriesKey && selection.dualAxis && validYAxisKeys.length >= 2 && chartType !== 'pie'
  const stack = selection.stack && chartType === 'bar' && !dualAxis

  return {
    chartType,
    chartTargetKey,
    yAxisKeys: validYAxisKeys,
    seriesKey,
    dualAxis,
    stack,
  }
}

const buildCategories = (rows: Array<Record<string, unknown>>, xAxisKey: string) => {
  const categories: string[] = []
  const categorySet = new Set<string>()
  rows.forEach((row) => {
    const xValue = getXAxisValue(row, xAxisKey)
    if (!xValue || categorySet.has(xValue)) return
    categorySet.add(xValue)
    categories.push(xValue)
  })
  return categories
}

const buildSingleMetricValueMap = (rows: Array<Record<string, unknown>>, xAxisKey: string, yKey: string) => {
  const valueMap = new Map<string, number>()
  rows.forEach((row) => {
    const category = getXAxisValue(row, xAxisKey)
    if (!category) return
    const value = toNumber(row[yKey]) ?? 0
    valueMap.set(category, (valueMap.get(category) ?? 0) + value)
  })
  return valueMap
}

const resolveYAxisScale = (datasets: Array<{ data: number[] }>) => {
  const values = datasets.flatMap((dataset) => dataset.data).filter((value) => Number.isFinite(value))
  return calculateChartScale(values, 0.1, true)
}

export const buildChartModel = (
  viewModel: VisualizationViewModel,
  selectionInput: VisualizationChartSelection,
): Record<string, unknown> | null => {
  registerDynamicMappings(viewModel.statList, viewModel.statDetailList)
  const schema = viewModel.schema
  if (!schema) return null

  const selection = sanitizeSelection(schema, selectionInput)
  const yAxisKeys = selection.yAxisKeys.slice(0, 2)
  if (!selection.chartTargetKey || yAxisKeys.length === 0) return null

  if (selection.chartType === 'pie') {
    const metricKey = yAxisKeys[0]
    const pieMap = new Map<string, number>()
    viewModel.rows.forEach((row) => {
      const key = getXAxisValue(row, selection.chartTargetKey)
      if (!key) return
      const value = toNumber(row[metricKey]) ?? 0
      pieMap.set(key, (pieMap.get(key) ?? 0) + value)
    })

    const total = Array.from(pieMap.values()).reduce((sum, v) => sum + v, 0)
    const items = Array.from(pieMap.entries()).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    return { items, type: 'outerLabel', style: 'regionRatio' }
  }

  const rowList = [...viewModel.rows]
  if (selection.chartTargetKey === TIME_AXIS_YEAR_MONTH || selection.chartTargetKey === TIME_AXIS_YEAR_QUARTER) {
    rowList.sort(
      (a, b) => getXAxisSortValue(a, selection.chartTargetKey) - getXAxisSortValue(b, selection.chartTargetKey),
    )
  }
  const categories = buildCategories(rowList, selection.chartTargetKey)
  if (categories.length === 0) return null

  // seriesKey 피벗: 행의 dimension 값을 시리즈로 분리해 다중 데이터셋 생성
  if (selection.seriesKey) {
    const metricKey = yAxisKeys[0]
    const seriesValueSet = new Set<string>()
    rowList.forEach((row) => {
      const sv = resolveDisplayValue(selection.seriesKey, row[selection.seriesKey])
      if (sv) seriesValueSet.add(sv)
    })
    const seriesValues = Array.from(seriesValueSet)

    const datasets = seriesValues.map((seriesValue, index) => {
      const filtered = rowList.filter(
        (row) => resolveDisplayValue(selection.seriesKey, row[selection.seriesKey]) === seriesValue,
      )
      const valueMap = buildSingleMetricValueMap(filtered, selection.chartTargetKey, metricKey)
      return {
        label: seriesValue,
        data: categories.map((cat) => valueMap.get(cat) ?? 0),
        colorKey: selection.chartType === 'line' ? 'line.analystatSet' : 'bar.analystatSet',
        colorIndex: index,
        yAxisID: 'y',
        ...(selection.stack ? { stack: 'total' } : {}),
      }
    })

    const config: Record<string, unknown> = { categories, datasets }
    if (selection.stack) {
      config.scales = { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
    return config
  }

  if (yAxisKeys.length >= 2) {
    const datasets = yAxisKeys.slice(0, 2).map((yKey, index) => {
      const valueMap = buildSingleMetricValueMap(rowList, selection.chartTargetKey, yKey)
      return {
        label: resolveColumnLabel(yKey),
        data: categories.map((category) => valueMap.get(category) ?? 0),
        colorKey: selection.chartType === 'line' ? 'line.analystatSet' : 'bar.analystatSet',
        colorIndex: index,
        yAxisID: selection.dualAxis ? (index === 0 ? 'y' : 'y1') : 'y',
        ...(selection.stack ? { stack: 'total' } : {}),
      }
    })
    const config: Record<string, unknown> = { categories, datasets }
    if (selection.dualAxis) {
      const leftScale = resolveYAxisScale([datasets[0]])
      const rightScale = resolveYAxisScale([datasets[1]])
      config.scales = {
        y: {
          min: leftScale.min,
          max: leftScale.max,
          ticks: { stepSize: leftScale.stepSize },
          position: 'left',
        },
        y1: {
          min: rightScale.min,
          max: rightScale.max,
          ticks: { stepSize: rightScale.stepSize },
          position: 'right',
          grid: { drawOnChartArea: false },
        },
      }
    } else if (selection.stack) {
      config.scales = {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true },
      }
    }
    return config
  }

  const metricKey = yAxisKeys[0]
  const valueMap = buildSingleMetricValueMap(rowList, selection.chartTargetKey, metricKey)
  const data = categories.map((category) => valueMap.get(category) ?? 0)
  if (selection.chartType === 'line') {
    return {
      categories,
      datasets: [{ label: resolveColumnLabel(metricKey), data, colorKey: 'line.primary' }],
    }
  }
  const config: Record<string, unknown> = {
    categories,
    data,
    colorKey: 'bar.set1',
  }
  if (selection.stack) {
    config.scales = {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    }
  }
  return config
}

export const getTimeAxisKeys = () => ({
  yearMonth: TIME_AXIS_YEAR_MONTH,
  yearQuarter: TIME_AXIS_YEAR_QUARTER,
})
