import type {
  VisualizationChartSelection,
  VisualizationChartType,
  VisualizationChartOptionPayload,
  VisualizationColumnProfile,
  VisualizationSchema,
  VisualizationSelectableOptions,
  VisualizationSelectOption,
  VisualizationStatDetailItem,
  VisualizationStatItem,
  VisualizationViewModel,
} from '~/types/chat'
import type { TableColumn } from '~/types/table'
import {
  normalizeColumnKeyForMapping,
  registerDynamicMappings,
  resolveColumnLabel,
  resolveDisplayValue,
} from '~/utils/chat/visualizationLabelMap'
import { calculateChartScale } from '~/utils/chat/visualizationChartUtil'

const EMPTY_VALUE = '-'
const DEFAULT_CHART_TYPE: VisualizationChartType = 'bar'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
const toChartType = (value: unknown): VisualizationChartType | null => {
  if (value === 'bar' || value === 'line' || value === 'pie') return value
  return null
}
const normalizeChartOption = (value: unknown): VisualizationChartOptionPayload | null => {
  if (!value) return null
  const raw = typeof value === 'string' ? parseTableData(value) : value
  if (!isRecord(raw)) return null
  const chart = toChartType(raw.chart)
  const x = Array.isArray(raw.x) ? raw.x.filter((item): item is string => typeof item === 'string') : []
  const y = Array.isArray(raw.y) ? raw.y.filter((item): item is string => typeof item === 'string') : []
  return {
    ...(chart ? { chart } : {}),
    ...(x.length > 0 ? { x } : {}),
    ...(y.length > 0 ? { y } : {}),
  }
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

// 컬럼 프로파일 조회 (표 정렬/표시 보조용)
const getColumnProfile = (rows: Array<Record<string, unknown>>, key: string): VisualizationColumnProfile => {
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

  // 숫자형인지 여부 확인
  const isNumeric = nonEmptyCount > 0 && numericCount === nonEmptyCount
  // 유니크 값 개수 조회
  const uniqueCount = uniqueSet.size
  // 유니크 값 비율 조회
  const uniqueRatio = nonEmptyCount > 0 ? uniqueCount / nonEmptyCount : 0

  return {
    key,
    uniqueCount,
    nonEmptyCount,
    uniqueRatio,
    isNumeric,
    isTimeLike: false,
    isCodeLike: false,
    isLikelyMetric: false,
  }
}

const getAvailableSeriesKeys = (options: VisualizationSelectableOptions): string[] => {
  return options.chartTargetKeys
}

/**
 * 선택한 X축을 제외한 나머지 X축 후보(시간축 제외)가 정확히 1개일 때 그 컬럼을 시리즈로 사용 (그룹 막대).
 * getDefaultSelection과 동일 규칙.
 */
export const inferSeriesKeyFromChartTargets = (chartTargetKeys: string[], selectedChartTargetKey: string): string => {
  const available = chartTargetKeys.filter((key) => key !== selectedChartTargetKey)
  return available[0] ?? ''
}

const pickColumnKeysFromChartOption = (columns: string[], keys: string[] | undefined): string[] => {
  if (!keys?.length) return []
  return keys.filter((key, index, arr) => columns.includes(key) && arr.indexOf(key) === index)
}

/** 통계ID 컬럼 기준 유니크 값 목록 (차트 통계 지정 UI) */
export const getUniqueStatIdsFromRows = (rows: Array<Record<string, unknown>>, statIdColumnKey: string): string[] => {
  const set = new Set<string>()
  rows.forEach((row) => {
    const v = row[statIdColumnKey]
    if (v != null && String(v).trim() !== '') set.add(String(v))
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
}

const getXAxisValue = (row: Record<string, unknown>, xAxisKey: string) => {
  return resolveDisplayValue(xAxisKey, row[xAxisKey])
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

/** 표에 나열할 컬럼 우선순위 (canonical 키 기준, stat_id 등은 normalizeColumnKeyForMapping으로 매칭) */
const TABLE_COLUMN_DISPLAY_PRIORITY = [
  'STAT_ID',
  'YEAR',
  'MON',
  'QUARTER',
  'REGN_CD',
  'DETAIL_ITEM_CD',
  'RESULT',
] as const

const orderColumnsForTableDisplay = (keys: string[]): string[] => {
  const used = new Set<string>()
  const priorityKeys: string[] = []
  for (const canon of TABLE_COLUMN_DISPLAY_PRIORITY) {
    const match = keys.find((k) => normalizeColumnKeyForMapping(k) === canon)
    if (match && !used.has(match)) {
      used.add(match)
      priorityKeys.push(match)
    }
  }
  const rest = keys.filter((k) => !used.has(k))
  return [...priorityKeys, ...rest]
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** 헤더·셀 표시 문자열 길이 기준 col 너비 (UiTable colgroup) */
const estimateTableColumnWidthPx = (headerLabel: string, cellTexts: string[]): string => {
  const samples = [headerLabel, ...cellTexts].map((s) => String(s ?? ''))
  const maxLen = samples.reduce((m, s) => Math.max(m, [...s].length), 0)
  const looksNumericColumn =
    cellTexts.length > 0 &&
    cellTexts.every((t) => {
      const s = String(t ?? '').trim()
      return s === '' || s === '-' || /^-?[\d,.\s]+$/.test(s)
    })
  const perChar = looksNumericColumn ? 10 : 13
  const padding = 44
  const px = clamp(Math.ceil(maxLen * perChar + padding), 72, 520)
  return `${px}px`
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

/**
 * 표 데이터 + AI chartOption으로 시각화 스키마를 구성한다.
 * - 표: tableData 전체 컬럼 기반
 * - 차트: chartOption(chart/x/y)만 사용
 */
export const inferSchema = (
  rows: Array<Record<string, unknown>>,
  chartOption: VisualizationChartOptionPayload | null,
): VisualizationSchema | null => {
  if (rows.length === 0) return null

  const columns = getColumnKeys(rows)
  const profiles = columns.map((key) => getColumnProfile(rows, key))
  const xAxisKeys = pickColumnKeysFromChartOption(columns, chartOption?.x)
  const metricKeys = pickColumnKeysFromChartOption(columns, chartOption?.y).slice(0, 2)
  const dimensionKeys = columns.filter((key) => !metricKeys.includes(key))
  const chartType = chartOption?.chart ?? DEFAULT_CHART_TYPE
  const hasChartOption = xAxisKeys.length > 0 && metricKeys.length > 0 && !!chartOption?.chart
  const statIdColumnKey = columns.find((k) => normalizeColumnKeyForMapping(k) === 'STAT_ID')

  const selectableOptions: VisualizationSelectableOptions = {
    chartTargetKeys: hasChartOption ? xAxisKeys : [],
    yAxisKeys: hasChartOption ? metricKeys : [],
    seriesKeys: hasChartOption ? xAxisKeys.slice(1) : [],
    chartTypes: hasChartOption ? [chartType] : [],
    canStack: true,
    canDualAxis: hasChartOption && metricKeys.length >= 2,
  }

  const statIdValues = statIdColumnKey ? getUniqueStatIdsFromRows(rows, statIdColumnKey) : []
  const defaultStatIdFilter = statIdValues.length > 0 ? statIdValues[0] : ''

  const defaultSelection: VisualizationChartSelection = {
    chartType,
    chartTargetKey: hasChartOption ? (xAxisKeys[0] ?? '') : '',
    yAxisKeys: hasChartOption ? metricKeys : [],
    seriesKey: hasChartOption ? (xAxisKeys[1] ?? '') : '',
    stack: false,
    dualAxis: hasChartOption && metricKeys.length >= 2,
    statIdFilter: defaultStatIdFilter,
  }

  return {
    columns,
    dimensionKeys,
    metricKeys,
    profiles,
    selectableOptions,
    defaultSelection,
    statIdColumnKey,
  }
}

// 시각화 뷰 모델 생성
export const buildVisualizationViewModel = (params: {
  messageId: string
  sql?: string
  tableData?: string
  chartOption?: VisualizationChartOptionPayload | string
  statList?: VisualizationStatItem[]
  statDetailList?: VisualizationStatDetailItem[]
}): VisualizationViewModel => {
  // 테이블 데이터 파싱
  const parsed = parseTableData(params.tableData ?? '')
  // 테이블 데이터 파싱 결과를 행 데이터로 변환
  const rows = buildRowsFromColumnarJson(parsed)
  // chartOption 기준 차트 스키마 구성
  const normalizedChartOption = normalizeChartOption(params.chartOption)
  const resolvedSchema = inferSchema(rows, normalizedChartOption)

  // 테이블 데이터가 없으면 빈 뷰 모델 반환
  if (!params.tableData) {
    return {
      messageId: params.messageId,
      status: 'empty',
      sql: params.sql ?? '',
      rawTableData: '',
      rows: [],
      schema: resolvedSchema,
    }
  }

  // 행 데이터가 0건이면 빈 뷰 모델 반환
  if (rows.length === 0) {
    return {
      messageId: params.messageId,
      status: 'empty',
      sql: params.sql ?? '',
      rawTableData: params.tableData ?? '',
      rows: [],
      schema: resolvedSchema,
    }
  }

  // 성공 뷰 모델 반환
  return {
    messageId: params.messageId,
    status: 'success',
    sql: params.sql ?? '',
    rawTableData: params.tableData ?? '',
    rows,
    schema: resolvedSchema,
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

  const orderedKeys = orderColumnsForTableDisplay(schema.columns)

  const columns: TableColumn[] = orderedKeys.map((key) => {
    const label = resolveColumnLabel(key)
    const cellTexts = viewModel.rows.map((row) => formatTableValue(key, row[key], schema.metricKeys))
    return {
      key,
      label,
      width: estimateTableColumnWidthPx(label, cellTexts),
      align: schema.metricKeys.includes(key) ? 'right' : 'center',
      headerAlign: 'center',
    }
  })

  const data = viewModel.rows.map((row) => {
    const mapped: Record<string, unknown> = {}
    orderedKeys.forEach((key) => {
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
      statIdFilter: '',
    }
  }
  return {
    ...schema.defaultSelection,
    yAxisKeys: [...schema.defaultSelection.yAxisKeys],
    statIdFilter: schema.defaultSelection.statIdFilter ?? '',
  }
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
  // seriesKey 활성 시 dualAxis 비활성 / 이축은 통계값 2개 이상일 때만 가능
  const dualAxis =
    !seriesKey &&
    selection.dualAxis &&
    validYAxisKeys.length >= 2 &&
    chartType !== 'pie' &&
    schema.selectableOptions.canDualAxis
  const stack = selection.stack && chartType === 'bar' && !dualAxis

  let statIdFilter = ''
  if (schema.statIdColumnKey && selection.statIdFilter?.trim()) {
    statIdFilter = selection.statIdFilter.trim()
  }

  return {
    chartType,
    chartTargetKey,
    yAxisKeys: validYAxisKeys,
    seriesKey,
    dualAxis,
    stack,
    statIdFilter,
  }
}

/** 파이 차트: X축 카테고리별 Y값 합산 (buildChartModel 파이와 동일 규칙) */
const buildPieValueMap = (chartRows: Array<Record<string, unknown>>, chartTargetKey: string, metricKey: string) => {
  const pieMap = new Map<string, number>()
  chartRows.forEach((row) => {
    const key = getXAxisValue(row, chartTargetKey)
    if (!key) return
    const value = toNumber(row[metricKey]) ?? 0
    pieMap.set(key, (pieMap.get(key) ?? 0) + value)
  })
  return pieMap
}

/**
 * 파이 차트로 그릴 수 없는 데이터인지 (음수 조각 포함 또는 전체 합 ≤ 0)
 * — ChatVisualizationPanel 등에서 안내 문구 표시용
 */
export const isPieChartUnavailable = (
  viewModel: VisualizationViewModel,
  selectionInput: VisualizationChartSelection,
): boolean => {
  const schema = viewModel.schema
  if (!schema) return false

  const selection = sanitizeSelection(schema, selectionInput)
  if (selection.chartType !== 'pie') return false

  const yAxisKeys = selection.yAxisKeys.slice(0, 2)
  if (!selection.chartTargetKey || yAxisKeys.length === 0) return false
  if (schema.statIdColumnKey && !selection.statIdFilter) return false

  const chartRows =
    schema.statIdColumnKey && selection.statIdFilter
      ? viewModel.rows.filter((row) => String(row[schema.statIdColumnKey!] ?? '') === selection.statIdFilter)
      : viewModel.rows

  const metricKey = yAxisKeys[0]
  const pieMap = buildPieValueMap(chartRows, selection.chartTargetKey, metricKey)
  const values = Array.from(pieMap.values())
  const total = values.reduce((sum, v) => sum + v, 0)
  if (values.some((v) => v < 0)) return true
  if (total <= 0) return true
  return false
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

/** 막대 차트: 음수가 하나라도 있으면 Y축 음수 구간 포함, 전부 양수면 min 0 기준 */
const resolveYAxisScaleForBar = (datasets: Array<{ data: number[] }>) => {
  const values = datasets.flatMap((dataset) => dataset.data).filter((value) => Number.isFinite(value))
  if (values.length === 0) return { min: 0, max: 100, stepSize: 20 }
  const hasNegative = values.some((v) => v < 0)
  return calculateChartScale(values, 0.1, hasNegative)
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

  if (schema.statIdColumnKey && !selection.statIdFilter) return null

  const chartRows =
    schema.statIdColumnKey && selection.statIdFilter
      ? viewModel.rows.filter((row) => String(row[schema.statIdColumnKey!] ?? '') === selection.statIdFilter)
      : viewModel.rows

  if (selection.chartType === 'pie') {
    const metricKey = yAxisKeys[0]
    const pieMap = buildPieValueMap(chartRows, selection.chartTargetKey, metricKey)
    const values = Array.from(pieMap.values())
    const total = values.reduce((sum, v) => sum + v, 0)
    if (values.some((v) => v < 0) || total <= 0) return null

    const items = Array.from(pieMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 1000) / 10,
    }))
    return { items, type: 'outerLabel', style: 'analystatSet' }
  }

  const rowList = [...chartRows]
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

    const yScale = resolveYAxisScaleForBar(datasets)
    const config: Record<string, unknown> = {
      categories,
      datasets,
      minValue: yScale.min,
      maxValue: yScale.max,
      yAxisStepSize: yScale.stepSize,
    }
    if (selection.stack) {
      config.scales = {
        x: { stacked: true },
        y: {
          stacked: true,
          min: yScale.min,
          max: yScale.max,
          ticks: { stepSize: yScale.stepSize },
          beginAtZero: yScale.min >= 0,
        },
      }
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
      // bar 이축은 음수 존재 시에만 음수축 허용, line 이축은 기존 스케일(항상 allowNegative) 유지
      const leftScale =
        selection.chartType === 'bar' ? resolveYAxisScaleForBar([datasets[0]]) : resolveYAxisScale([datasets[0]])
      const rightScale =
        selection.chartType === 'bar' ? resolveYAxisScaleForBar([datasets[1]]) : resolveYAxisScale([datasets[1]])
      config.scales = {
        y: {
          min: leftScale.min,
          max: leftScale.max,
          ticks: { stepSize: leftScale.stepSize },
          position: 'left',
          beginAtZero: leftScale.min >= 0,
        },
        y1: {
          min: rightScale.min,
          max: rightScale.max,
          ticks: { stepSize: rightScale.stepSize },
          position: 'right',
          grid: { drawOnChartArea: false },
          beginAtZero: rightScale.min >= 0,
        },
      }
    } else if (selection.stack) {
      const yScale = resolveYAxisScaleForBar(datasets)
      config.minValue = yScale.min
      config.maxValue = yScale.max
      config.yAxisStepSize = yScale.stepSize
      config.scales = {
        x: { stacked: true },
        y: {
          stacked: true,
          min: yScale.min,
          max: yScale.max,
          ticks: { stepSize: yScale.stepSize },
          beginAtZero: yScale.min >= 0,
        },
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
      datasets: [{ label: resolveColumnLabel(metricKey), data, colorKey: 'line.analystatSet', colorIndex: 0 }],
    }
  }
  const hasNegative = data.some((v) => Number.isFinite(v) && v < 0)
  const yScale = calculateChartScale(data, 0.1, hasNegative)
  const config: Record<string, unknown> = {
    categories,
    datasets: [
      {
        label: resolveColumnLabel(metricKey),
        data,
        colorKey: 'bar.analystatSet',
        yAxisID: 'y',
      },
    ],
    minValue: yScale.min,
    maxValue: yScale.max,
    yAxisStepSize: yScale.stepSize,
  }
  if (selection.stack) {
    config.scales = {
      x: { stacked: true },
      y: {
        stacked: true,
        min: yScale.min,
        max: yScale.max,
        ticks: { stepSize: yScale.stepSize },
        beginAtZero: yScale.min >= 0,
      },
    }
  }
  return config
}
