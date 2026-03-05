/**
 * 객체/값 기본처리 유틸리티
 */

/** null/undefined 체크 후 기본값 반환 */
export const nvl = <T>(val: T | null | undefined, altVal: T): T => (isEmpty(val) ? altVal : (val as T))

/** null 값을 빈 문자열로 변환 */
export const removeNull = (val: unknown): string => (isEmpty(val) ? '' : String(val))

/** 빈 값을 빈 문자열로 변환 */
export const removeEmpty = (val: unknown): string => (isEmpty(val) ? '' : String(val))
