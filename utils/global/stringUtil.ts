/**
 * 문자열 처리 유틸리티
 */

/** 줄바꿈 문자를 <br/> 태그로 변경 */
export const nl2br = (str: string): string => removeNull(str).replace(/\n/g, '<br/>')

/** 줄바꿈을 <br> 태그로 변환 */
export const makeBr = (content: string): string =>
  content
    .replace(/(?:\r\n|\r|\n)/g, '<br />')
    .split('\n')
    .join('<br />')

/** 값 포함 여부 확인 */
export const contains = (obj: unknown, checkVal: unknown): boolean => {
  if (obj == '' || obj == null || obj == undefined) {
    return false
  } else if (typeof obj == 'object') {
    return obj.includes(checkVal)
  } else if (typeof obj == 'string') {
    return obj == checkVal
  } else if (typeof obj == 'number') {
    return Number(obj) == Number(checkVal)
  } else {
    return false
  }
}
