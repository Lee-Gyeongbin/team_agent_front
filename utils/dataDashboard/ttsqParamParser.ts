import type { DataDashboardSqlVariable } from '~/types/data-dashboard'

/**
 * SQL의 WHERE 절에서 파라미터 값들을 현재 필터값으로 치환한다.
 * filterValues에서 빈 값('')은 치환하지 않는다 (원본 유지).
 *
 * 지원 패턴:
 *   key IN ('old1', 'old2') → key IN ('newVal')
 *   key = 'old'             → key = 'newVal'
 *   key = 123               → key = newVal
 */
/** 쉼표 구분 값 → SQL IN 목록 문자열 (`'v1', 'v2'` 형식) */
const buildInList = (value: string): string => {
  const parts = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return parts.length > 1 ? parts.map((v) => `'${v}'`).join(', ') : `'${parts[0] ?? value}'`
}

export const substituteWhereValues = (sql: string, filterValues: Record<string, string>): string => {
  let result = sql
  for (const [key, value] of Object.entries(filterValues)) {
    if (!value) continue
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const isMulti = value.includes(',')
    // IN (...) → 멀티값이면 IN ('v1', 'v2'), 단일값이면 IN ('v')
    result = result.replace(new RegExp(`(\\b${escaped}\\s+IN\\s*\\()([^)]*)(\\))`, 'gi'), `$1${buildInList(value)}$3`)
    if (!isMulti) {
      const qv = `'${value}'`
      // = 'old' / = "old"
      result = result.replace(new RegExp(`(\\b${escaped}\\s*=\\s*)'[^']*'`, 'gi'), `$1${qv}`)
      result = result.replace(new RegExp(`(\\b${escaped}\\s*=\\s*)"[^"]*"`, 'gi'), `$1${qv}`)
      // = 123 (순수 숫자만)
      result = result.replace(new RegExp(`(\\b${escaped}\\s*=\\s*)\\d+(?![\\w.])`, 'gi'), `$1${value}`)
    }
  }
  return result
}

/**
 * SQL 문자열의 WHERE 절에서 지정된 컬럼 키들의 값을 추출한다.
 *
 * 지원 패턴 (대소문자 무시, 테이블 별칭 접두사 무시):
 *   key IN ('v1', 'v2') → 첫 번째 값
 *   key IN (1, 2)       → 첫 번째 값
 *   key = 'value'       → value
 *   key = "value"       → value
 *   key = 123           → '123'
 *
 * JOIN 조건의 컬럼 참조(key = alias.col)는 의도적으로 제외한다.
 * 값이 없으면 해당 키는 결과에서 제외된다.
 */
export const extractSqlWhereValues = (sql: string, keys: string[]): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // 1. IN (...) — 괄호 안 모든 작은따옴표 값을 쉼표 구분으로 추출
    const inBlock = new RegExp(`\\b${escaped}\\s+IN\\s*\\(([^)]*)\\)`, 'i').exec(sql)
    if (inBlock) {
      const vals = [...inBlock[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).filter(Boolean)
      if (vals.length) {
        result[key] = vals.join(',')
        continue
      }
      // 숫자 IN (1, 2, ...)
      const numVals = [...inBlock[1].matchAll(/\b(\d+)\b/g)].map((m) => m[1])
      if (numVals.length) {
        result[key] = numVals.join(',')
        continue
      }
    }

    // 2. = 'value'
    const sq = new RegExp(`\\b${escaped}\\s*=\\s*'([^']*)'`, 'i').exec(sql)
    if (sq) {
      result[key] = sq[1]
      continue
    }

    // 3. = "value"
    const dq = new RegExp(`\\b${escaped}\\s*=\\s*"([^"]*)"`, 'i').exec(sql)
    if (dq) {
      result[key] = dq[1]
      continue
    }

    // 4. = 숫자 (컬럼 참조 제외)
    const num = new RegExp(`\\b${escaped}\\s*=\\s*(\\d+)(?![\\w.])`, 'i').exec(sql)
    if (num) result[key] = num[1]
  }
  return result
}

type VarType = DataDashboardSqlVariable['type']

const TYPE_MAP: Record<string, VarType> = {
  date: 'date',
  DATE: 'date',
  month: 'month',
  MONTH: 'month',
  number: 'number',
  NUMBER: 'number',
  integer: 'number',
  INTEGER: 'number',
  int: 'number',
  INT: 'number',
  bigint: 'number',
  BIGINT: 'number',
  select: 'select',
  SELECT: 'select',
  enum: 'select',
  ENUM: 'select',
  string: 'text',
  STRING: 'text',
  varchar: 'text',
  VARCHAR: 'text',
  text: 'text',
  TEXT: 'text',
}

const normalizeType = (raw: unknown): VarType => {
  if (typeof raw !== 'string') return 'text'
  return TYPE_MAP[raw] ?? 'text'
}

/**
 * TTSQ_PARAM JSON 문자열을 DataDashboardSqlVariable[] 로 변환
 *
 * 지원 포맷:
 * 1. 배열: [{ key, label?, type, defaultValue?, options? }, ...]
 * 2. params 래핑: { params: [...] } 또는 { parameters: [...] }
 * 3. 플랫 오브젝트: { start_date: "date", end_date: "date" }
 * 4. 플랫 오브젝트 (상세): { start_date: { type: "date", label: "시작일", default: "..." } }
 */
export const parseTtsqParam = (ttsqParam: string | null | undefined): DataDashboardSqlVariable[] => {
  if (!ttsqParam) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(ttsqParam)
  } catch {
    return []
  }

  // 1. 배열 포맷 — 문자열 요소(키만 있는 경우)도 처리
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) =>
        typeof item === 'string'
          ? { key: item, label: item.toUpperCase(), type: 'text' as const, defaultValue: '' }
          : mapItemToVariable(item),
      )
      .filter(Boolean) as DataDashboardSqlVariable[]
  }

  if (typeof parsed !== 'object' || parsed === null) return []

  const obj = parsed as Record<string, unknown>

  // 2. params/parameters 래핑
  const wrapped = obj.params ?? obj.parameters ?? obj.variables
  if (Array.isArray(wrapped)) {
    return wrapped.map(mapItemToVariable).filter(Boolean) as DataDashboardSqlVariable[]
  }

  // 3. 플랫 오브젝트 포맷 { key: "type" | { type, label, ... } }
  return Object.entries(obj)
    .map(([key, val]) => {
      if (typeof val === 'string') {
        // { start_date: "date" }
        return {
          key,
          label: key,
          type: normalizeType(val),
          defaultValue: '',
        }
      }
      if (typeof val === 'object' && val !== null) {
        // { start_date: { type: "date", label: "시작일", default: "2026-01-01" } }
        const v = val as Record<string, unknown>
        return {
          key: String(v.key ?? key),
          label: String(v.label ?? v.description ?? v.name ?? key),
          type: normalizeType(v.type),
          defaultValue: String(v.defaultValue ?? v.default ?? v.default_value ?? ''),
          options: Array.isArray(v.options) ? v.options : undefined,
        }
      }
      return null
    })
    .filter(Boolean) as DataDashboardSqlVariable[]
}

/**
 * LAST_TTSQ_PARAMS JSON → filterValues Record
 * - 백엔드 JSON 문자열 또는 객체 모두 수용
 * - 배열 값은 쉼표 구분 문자열로 정규화 (sqlParams 전송 형식과 동일)
 */
export const parseLastTtsqParams = (raw: unknown): Record<string, string> => {
  if (!raw) return {}

  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {}
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      result[key] = value.map(String).filter(Boolean).join(',')
    } else {
      result[key] = String(value)
    }
  }
  return result
}

/**
 * TTSQ_PERIOD_PARAM JSON 문자열 → 기간 관련 컬럼 키 목록
 * 예: '["year", "mon"]'
 */
export const parseTtsqPeriodParam = (ttsqPeriodParam: string | null | undefined): string[] => {
  if (!ttsqPeriodParam) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(ttsqPeriodParam)
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed.map((item) => String(item).trim()).filter(Boolean)
}

/** 기간 파라미터 키 목록에 포함되는지 확인 (대소문자 무시) */
export const isPeriodParamKey = (key: string, periodKeys: string[]): boolean => {
  if (!periodKeys.length) return false
  const normalized = key.trim().toLowerCase()
  return periodKeys.some((pk) => pk.trim().toLowerCase() === normalized)
}

/** variables에 isPeriod 플래그 주입 */
export const markPeriodVariables = (
  variables: DataDashboardSqlVariable[],
  periodKeys: string[],
): DataDashboardSqlVariable[] => {
  if (!periodKeys.length) return variables
  return variables.map((v) => ({
    ...v,
    isPeriod: isPeriodParamKey(v.key, periodKeys),
  }))
}

/**
 * 오늘(또는 referenceDate) 기준 기간 변수값 생성
 * - 변수 type(date/month) 및 컬럼명(year, mon 등) 휴리스틱 적용
 */
export const buildTodayPeriodValues = (
  variables: Pick<DataDashboardSqlVariable, 'key' | 'type'>[],
  referenceDate: Date = new Date(),
): Record<string, string> => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() + 1
  const day = referenceDate.getDate()
  const quarter = Math.ceil(month / 3)
  const monthPadded = String(month).padStart(2, '0')
  const dayPadded = String(day).padStart(2, '0')

  const result: Record<string, string> = {}

  for (const v of variables) {
    const keyLower = v.key.trim().toLowerCase()

    if (v.type === 'date') {
      result[v.key] = `${year}-${monthPadded}-${dayPadded}`
      continue
    }
    if (v.type === 'month') {
      result[v.key] = `${year}-${monthPadded}`
      continue
    }

    // 기간 변수 처리 (시스템에 따라 case 추가 필요)
    if (keyLower === 'year' || keyLower === 'yyyy' || keyLower.endsWith('_year')) {
      result[v.key] = String(year)
    } else if (keyLower === 'mon' || keyLower === 'month' || keyLower.endsWith('_mon') || keyLower.endsWith('_month')) {
      result[v.key] = String(month)
    } else if (keyLower === 'day' || keyLower === 'dd' || keyLower.endsWith('_day')) {
      result[v.key] = String(day)
    } else if (keyLower.includes('quarter') || keyLower === 'qtr' || keyLower === 'qrt') {
      result[v.key] = String(quarter)
    } else if (keyLower.includes('start') && keyLower.includes('date')) {
      result[v.key] = `${year}-${monthPadded}-01`
    } else if (keyLower.includes('end') && keyLower.includes('date')) {
      result[v.key] = `${year}-${monthPadded}-${dayPadded}`
    }
  }

  return result
}

/** 기간 변수 필터값이 referenceDate(기본: 오늘) 기준과 일치하는지 확인 */
export const isTodayPeriodFilterValues = (
  variables: Pick<DataDashboardSqlVariable, 'key' | 'type' | 'isPeriod'>[],
  filterValues: Record<string, string>,
  referenceDate: Date = new Date(),
): boolean => {
  const periodVars = variables.filter((v) => v.isPeriod)
  if (!periodVars.length) return false

  const todayValues = buildTodayPeriodValues(periodVars, referenceDate)

  for (const v of periodVars) {
    const expected = todayValues[v.key]
    if (expected === undefined) return false
    const current = (filterValues[v.key] ?? '').trim()
    if (current !== expected) return false
  }

  return true
}

/** 기간 변수 필터값 요약 (툴팁·뱃지 보조 텍스트) */
export const formatPeriodFilterSummary = (
  variables: Pick<DataDashboardSqlVariable, 'key' | 'label' | 'isPeriod'>[],
  filterValues: Record<string, string>,
): string => {
  const parts = variables
    .filter((v) => v.isPeriod)
    .map((v) => {
      const value = (filterValues[v.key] ?? '').trim()
      return value ? `${v.label}: ${value}` : ''
    })
    .filter(Boolean)

  return parts.join(' · ')
}

const mapItemToVariable = (item: unknown): DataDashboardSqlVariable | null => {
  if (typeof item !== 'object' || item === null) return null
  const p = item as Record<string, unknown>

  const key = String(p.key ?? p.name ?? p.param ?? p.paramName ?? '')
  if (!key) return null

  return {
    key,
    label: String(p.label ?? p.description ?? p.desc ?? key),
    type: normalizeType(p.type),
    defaultValue: String(p.defaultValue ?? p.default ?? p.default_value ?? ''),
    options: Array.isArray(p.options) ? (p.options as { label: string; value: string }[]) : undefined,
  }
}
