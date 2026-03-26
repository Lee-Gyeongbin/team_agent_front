/**
 * 날짜 처리 유틸리티
 */

import type { CalendarDate, CalendarDateTime, DateValue, ZonedDateTime } from '@internationalized/date'
import { parseAbsoluteToLocal, parseDateTime, toCalendarDateTime } from '@internationalized/date'

/** API/서버 datetime 문자열 → UiDatePicker용 DateValue */
export const dateValueFromApiString = (s: string): DateValue | undefined => {
  if (!s?.trim()) return undefined
  const t = s.trim()
  try {
    return toCalendarDateTime(parseAbsoluteToLocal(t))
  } catch {
    try {
      const isoLike = t.includes('T') ? t : t.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
      return parseDateTime(isoLike)
    } catch {
      return undefined
    }
  }
}

/** DatePicker DateValue → API 저장용 MySQL DATETIME 문자열 */
export const apiStringFromDateValue = (v: DateValue | undefined): string => {
  if (!v) return ''
  try {
    const dateTime = toCalendarDateTime(v as CalendarDate | CalendarDateTime | ZonedDateTime)
    const year = String(dateTime.year).padStart(4, '0')
    const month = String(dateTime.month).padStart(2, '0')
    const day = String(dateTime.day).padStart(2, '0')
    const hour = String(dateTime.hour).padStart(2, '0')
    const minute = String(dateTime.minute).padStart(2, '0')
    const second = String(dateTime.second ?? 0).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  } catch {
    return ''
  }
}

/** date형 날짜를 string형 yyyymmdd 형태로 변환 */
export const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/** 날짜에서 일(day) 추출 */
export const getDatepickerDay = (date: string | Date): number => new Date(date).getDate()

/**
 * YYYY-MM-DD HH:mm:ss → YYYY.MM.DD HH:mm
 * @example formatDateTimeDisplay('2026-03-11 18:16:05') → '2026.03.11 18:16'
 */
export const formatDateTimeDisplay = (dateTime: string): string => {
  if (!dateTime) return ''
  const d = new Date(dateTime)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}
