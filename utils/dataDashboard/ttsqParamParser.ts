import type { DataDashboardSqlVariable } from '~/types/data-dashboard'

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

  // 1. 배열 포맷
  if (Array.isArray(parsed)) {
    return parsed.map(mapItemToVariable).filter(Boolean) as DataDashboardSqlVariable[]
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
