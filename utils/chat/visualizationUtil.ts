import type {
  VisualizationChartType,
  VisualizationSchema,
  VisualizationSelectOption,
  VisualizationViewModel,
} from '~/types/chat'
import type { TableColumn } from '~/types/table'
import { resolveColumnLabel, resolveDisplayValue } from '~/utils/chat/visualizationLabelMap'

const TIME_AXIS_KEY = '__TIME_AXIS__'
const EMPTY_VALUE = '-'

interface ChartBuildOptions {
  chartType: VisualizationChartType
  metricKey?: string
  legendKey?: string
}

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

const isNumericColumn = (rows: Array<Record<string, unknown>>, key: string) => {
  let numericCount = 0
  let valueCount = 0
  rows.forEach((row) => {
    const current = row[key]
    if (current == null || current === '') return
    valueCount += 1
    if (toNumber(current) !== null) {
      numericCount += 1
    }
  })
  if (valueCount === 0) return false
  return numericCount === valueCount
}

const getColumnKeys = (rows: Array<Record<string, unknown>>) => {
  const keySet = new Set<string>()
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => keySet.add(key))
  })
  return Array.from(keySet)
}

const getPreferredDimension = (dimensionKeys: string[]) => {
  const priority = ['MON', 'QUARTER', 'REGN_CD', 'DETAIL_ITEM_CD', 'RESULT', 'STAT_ID']
  return priority.find((key) => dimensionKeys.includes(key)) ?? dimensionKeys[0] ?? ''
}

const getPreferredLegend = (dimensionKeys: string[], xAxisKey: string) => {
  const priority = ['STAT_ID', 'REGN_CD', 'DETAIL_ITEM_CD', 'RESULT', 'YEAR', 'MON', 'QUARTER']
  return priority.find((key) => key !== xAxisKey && dimensionKeys.includes(key)) ?? ''
}

const padMonth = (value: unknown) => String(value ?? '').padStart(2, '0')

const getTimeAxisLabel = (row: Record<string, unknown>, schema: VisualizationSchema) => {
  if (schema.hasYearMonth) {
    return `${row.YEAR ?? ''}-${padMonth(row.MON)}`
  }
  if (schema.hasYearQuarter) {
    return `${row.YEAR ?? ''}-Q${row.QUARTER ?? ''}`
  }
  return ''
}

const getTimeAxisSortValue = (row: Record<string, unknown>, schema: VisualizationSchema) => {
  if (schema.hasYearMonth) {
    const year = Number(row.YEAR ?? 0)
    const month = Number(row.MON ?? 0)
    return year * 100 + month
  }
  if (schema.hasYearQuarter) {
    const year = Number(row.YEAR ?? 0)
    const quarter = Number(row.QUARTER ?? 0)
    return year * 10 + quarter
  }
  return 0
}

const getXAxisValue = (row: Record<string, unknown>, schema: VisualizationSchema) => {
  if (schema.xAxisKey === TIME_AXIS_KEY) {
    return getTimeAxisLabel(row, schema)
  }
  return resolveDisplayValue(schema.xAxisKey, row[schema.xAxisKey])
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

  const columns = getColumnKeys(rows)
  const metricKeys = columns.filter((key) => isNumericColumn(rows, key))
  const dimensionKeys = columns.filter((key) => !metricKeys.includes(key))

  const hasYearMonth = columns.includes('YEAR') && columns.includes('MON')
  const hasYearQuarter = columns.includes('YEAR') && columns.includes('QUARTER')
  const isTimeAxis = hasYearMonth || hasYearQuarter
  const xAxisKey = isTimeAxis ? TIME_AXIS_KEY : getPreferredDimension(dimensionKeys)
  const defaultLegendKey = getPreferredLegend(dimensionKeys, xAxisKey)
  const defaultMetricKey = metricKeys[0] ?? ''

  return {
    columns,
    dimensionKeys,
    metricKeys,
    xAxisKey,
    defaultLegendKey,
    defaultMetricKey,
    isTimeAxis,
    hasYearMonth,
    hasYearQuarter,
  }
}

export const buildVisualizationViewModel = (params: {
  messageId: string
  sql?: string
  tableData?: string
}): VisualizationViewModel => {
  const parsed = parseTableData(params.tableData ?? '')
  const rows = buildRowsFromColumnarJson(parsed)
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
  }
}

export const buildTableModel = (viewModel: VisualizationViewModel) => {
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

export const buildMetricOptions = (schema: VisualizationSchema | null): VisualizationSelectOption[] => {
  if (!schema) return []
  return schema.metricKeys.map((key) => ({
    label: resolveColumnLabel(key),
    value: key,
  }))
}

export const buildLegendOptions = (schema: VisualizationSchema | null): VisualizationSelectOption[] => {
  if (!schema) return []
  return schema.dimensionKeys.map((key) => ({
    label: resolveColumnLabel(key),
    value: key,
  }))
}

export const getDefaultChartType = (schema: VisualizationSchema | null): VisualizationChartType => {
  if (!schema) return 'bar'
  return schema.isTimeAxis ? 'line' : 'bar'
}

export const buildChartModel = (
  viewModel: VisualizationViewModel,
  options: ChartBuildOptions,
): Record<string, unknown> | null => {
  const schema = viewModel.schema
  if (!schema || !options.metricKey) return null

  const metricKey = options.metricKey
  const legendKey = options.legendKey ?? ''

  if (options.chartType === 'pie') {
    const pieMap = new Map<string, number>()
    viewModel.rows.forEach((row) => {
      const key = legendKey ? resolveDisplayValue(legendKey, row[legendKey]) : getXAxisValue(row, schema)
      const value = toNumber(row[metricKey]) ?? 0
      pieMap.set(key, (pieMap.get(key) ?? 0) + value)
    })

    const items = Array.from(pieMap.entries()).map(([name, value]) => ({ name, value }))
    return { items, type: 'outerLabel', style: 'regionRatio' }
  }

  const rowList = [...viewModel.rows]
  if (schema.isTimeAxis) {
    rowList.sort((a, b) => getTimeAxisSortValue(a, schema) - getTimeAxisSortValue(b, schema))
  }

  const categories: string[] = []
  const categorySet = new Set<string>()
  rowList.forEach((row) => {
    const xValue = getXAxisValue(row, schema)
    if (!categorySet.has(xValue)) {
      categorySet.add(xValue)
      categories.push(xValue)
    }
  })

  const useSeries = Boolean(legendKey) && legendKey !== schema.xAxisKey
  if (!useSeries) {
    const valueMap = new Map<string, number>()
    rowList.forEach((row) => {
      const category = getXAxisValue(row, schema)
      const value = toNumber(row[metricKey]) ?? 0
      valueMap.set(category, (valueMap.get(category) ?? 0) + value)
    })
    const data = categories.map((category) => valueMap.get(category) ?? 0)
    if (options.chartType === 'line') {
      return {
        categories,
        datasets: [{ label: resolveColumnLabel(metricKey), data, colorKey: 'line.primary' }],
      }
    }
    return {
      categories,
      data,
      colorKey: 'bar.set1',
      showDataLabels: true,
    }
  }

  const seriesMap = new Map<string, Map<string, number>>()
  const seriesOrder: string[] = []
  rowList.forEach((row) => {
    const seriesName = resolveDisplayValue(legendKey, row[legendKey])
    const category = getXAxisValue(row, schema)
    const value = toNumber(row[metricKey]) ?? 0
    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, new Map<string, number>())
      seriesOrder.push(seriesName)
    }
    const categoryMap = seriesMap.get(seriesName)!
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + value)
  })

  const datasets = seriesOrder.map((seriesName, index) => {
    const categoryMap = seriesMap.get(seriesName)!
    return {
      label: seriesName,
      data: categories.map((category) => categoryMap.get(category) ?? 0),
      colorKey: options.chartType === 'line' ? 'line.set2' : 'bar.set2',
      colorIndex: index,
    }
  })

  return { categories, datasets }
}

export const getTimeAxisKey = () => TIME_AXIS_KEY
