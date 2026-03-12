/**
 * 날짜 처리 유틸리티
 */

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
 * YYYY-MM-DD HH:mm:ss 형식을 YYYY.MM.DD HH:mm 형식으로 변환
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
