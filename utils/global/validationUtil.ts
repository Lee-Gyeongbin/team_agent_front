/**
 * 값 검증 유틸리티
 */

/** undefined 여부 확인 */
export const isUndefined = (val: unknown): boolean => typeof val === 'undefined'

/** null 여부 확인 */
export const isNull = (val: unknown): boolean => val === null

/** 값이 비어있는지 확인 */
export const isEmpty = (val: unknown): boolean => {
  return (
    typeof val === 'undefined' ||
    val === null ||
    (typeof val === 'string' && val.trim() === '') ||
    (Array.isArray(val) && val.length === 0)
  )
}

/** 값이 비어있지 않은지 확인 */
export const isNotEmpty = (val: unknown): boolean => !isEmpty(val)

/** 이메일 형식 검증 */
export const checkEmail = (email: string): boolean => {
  const emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/
  return emailRegex.test(email)
}

/** YYYY.MM 형식 날짜 유효성 검증 및 변환 */
export const validateDateFormat = (date: string | null | undefined): string | null => {
  if (!date) return null
  const datePattern = /^\d{4}\.(0[1-9]|1[0-2])$/
  return datePattern.test(date) ? date : null
}
