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
import {
  normalizeColumnKeyForMapping,
  registerDynamicMappings,
  resolveColumnLabel,
  resolveDisplayValue,
} from '~/utils/chat/visualizationLabelMap'
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

// 차트의 x축, y축, 시리즈 컬럼 추론을 위한 컬럼 프로파일 조회
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

  // 숫자형인지 여부 확인
  const isNumeric = nonEmptyCount > 0 && numericCount === nonEmptyCount
  // 유니크 값 개수 조회
  const uniqueCount = uniqueSet.size
  // 유니크 값 비율 조회
  const uniqueRatio = nonEmptyCount > 0 ? uniqueCount / nonEmptyCount : 0
  // 시간형인지 여부 확인
  const isTimeLike = isLikelyTimeKey(key, label)
  // 코드형인지 여부 확인
  const isCodeLike = isLikelyCodeKey(key, label)
  // 통계값 힌트 여부 확인
  const metricHint = isLikelyMetricKey(key, label)
  // 숫자 컬럼이지만 ID처럼 행마다 거의 다른 값(고유값 비율 높은)인 컬럼을 걸러내기 위함 - 이런 컬럼을 y축으로 쓰면 차트가 깨짐
  const idLikeHighCardinality = uniqueRatio >= 0.9 && nonEmptyCount >= 12
  // 차트의 y축으로 쓸 만한 컬럼인지 최종 판정. 숫자형이고 시간형이나 코드형이 아니며 통계값 힌트가 있거나 고유도 값 비율이 90% 이상이고 비어있지 않은 값이 12개 이상인 컬럼은 통계값 힌트가 있는지 여부에 따라 판정.
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

const getPreferredChartTargetKey = (keys: string[]) => {
  const priority = ['STAT_ID', 'REGN_CD', 'DETAIL_ITEM_CD', 'RESULT']
  return priority.find((p) => keys.some((k) => normalizeColumnKeyForMapping(k) === p)) ?? keys[0] ?? ''
}

const isTimeAxisKey = (key: string) => key === TIME_AXIS_YEAR_MONTH || key === TIME_AXIS_YEAR_QUARTER

/** 시리즈 후보: X축 옵션 중 시간축(년-월, 년-분기) 제외 */
const getAvailableSeriesKeys = (options: VisualizationSelectableOptions): string[] => {
  return options.chartTargetKeys.filter((key) => !isTimeAxisKey(key))
}

/**
 * 선택한 X축을 제외한 나머지 X축 후보(시간축 제외)가 정확히 1개일 때 그 컬럼을 시리즈로 사용 (그룹 막대).
 * getDefaultSelection과 동일 규칙.
 */
export const inferSeriesKeyFromChartTargets = (chartTargetKeys: string[], selectedChartTargetKey: string): string => {
  const available = chartTargetKeys.filter((key) => !isTimeAxisKey(key) && key !== selectedChartTargetKey)
  return available.length === 1 ? available[0] : ''
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
    statIdFilter: '',
  }
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

/** x축, y축, 시리즈 컬럼 추론
 * 1. 모든 컬럼 조회
 * 2. 컬럼 프로파일 조회
 * 3. 통계값(Y축) 컬럼 조회
 * 4. X축 컬럼 조회
 * 5. X축 컬럼 후보 조회
 * 6. X축 컬럼 정렬
 * 7. 선호하는 X축 컬럼 조회
 * 8. X축 컬럼 정렬 후 선호하는 X축 컬럼 제외 나머지 X축 컬럼 추가
 * 9. 시리즈 키 후보 조회
 */
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
  // 통계ID 컬럼 — 서로 다른 통계가 섞인 조회 시 축/시리즈 후보에서 제외하고 별도 통계 지정 UI로 선택
  const statIdColumnKey = columns.find((k) => normalizeColumnKeyForMapping(k) === 'STAT_ID')
  const isStatIdColumn = (key: string) => !!statIdColumnKey && key === statIdColumnKey

  // X축 컬럼 후보 (통계ID 제외 — 가상 연·월/연·분기 축은 선택지에서 제외, YEAR/MON 등 원본 컬럼으로만 구성)
  const rawChartTargetKeys = profiles
    .filter((profile) => !profile.isLikelyMetric && profile.uniqueCount > 1 && !isStatIdColumn(profile.key))
    .map((profile) => profile.key)
  const sortedChartTargetKeys: string[] = []
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

  // 시리즈 키 후보: 비수치, 비시간형, 유니크값 2~20개인 dimension (통계ID 제외)
  const seriesKeys = profiles
    .filter(
      (profile) =>
        !profile.isLikelyMetric &&
        !profile.isTimeLike &&
        !isStatIdColumn(profile.key) &&
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

  const statIdValues = statIdColumnKey ? getUniqueStatIdsFromRows(rows, statIdColumnKey) : []
  const defaultStatIdFilter = statIdValues.length > 0 ? statIdValues[0] : ''

  const defaultSelection: VisualizationChartSelection = {
    ...getDefaultSelection(selectableOptions),
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
  statList?: VisualizationStatItem[]
  statDetailList?: VisualizationStatDetailItem[]
}): VisualizationViewModel => {
  // 테이블 데이터 파싱
  const parsed = parseTableData(params.tableData ?? '')
  // 테이블 데이터 파싱 결과를 행 데이터로 변환
  const rows = buildRowsFromColumnarJson(parsed)
  // x축, y축, 시리즈 컬럼 추론
  const schema = inferSchema(rows)

  // 테이블 데이터가 없으면 빈 뷰 모델 반환
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

  // 행 데이터가 0건이면 빈 뷰 모델 반환
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

  // 성공 뷰 모델 반환
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
      const leftScale = resolveYAxisScale([datasets[0]])
      const rightScale = resolveYAxisScale([datasets[1]])
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

export const getTimeAxisKeys = () => ({
  yearMonth: TIME_AXIS_YEAR_MONTH,
  yearQuarter: TIME_AXIS_YEAR_QUARTER,
})
