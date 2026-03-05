/**
 * 객체/값 기본처리 유틸리티
 */

/** null/undefined 체크 후 기본값 반환 */
export const nvl = (val: any, altVal: any): any => (isEmpty(val) ? altVal : val)

/** null 값을 빈 문자열로 변환 */
export const removeNull = (val: any): string => (isEmpty(val) ? '' : val)

/** 빈 값을 빈 문자열로 변환 */
export const removeEmpty = (val: any): string => (isEmpty(val) ? '' : val)