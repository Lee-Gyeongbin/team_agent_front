/**
 * 숫자 처리 유틸리티
 * - 콤마 포맷팅, 숫자 입력 제한, 소수점 제거
 */

/**
 * 숫자를 3자리마다 콤마(,)가 들어가도록 포맷팅하는 함수
 * @param value - 숫자 또는 숫자 형태의 문자열
 * @returns 포맷팅된 문자열 (유효하지 않은 값이면 빈 문자열)
 */
export const formatNumberWithComma = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }

  const num = Number(value)

  if (Number.isNaN(num)) {
    return ''
  }

  const [integerPart, decimalPart] = String(num).split('.')

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

/** 콤마 제거 */
export const removeComma = (val: string): string => {
  if (isEmpty(val)) return ''
  return val.toString().replace(/,/g, '')
}

/** 숫자 입력 제한 (음수, 소수점 포함) */
export const numeric = (obj: HTMLInputElement, _event: Event): string => {
  const text = obj.value
  const reg = /(^[-])?([0-9]*[.]?[0-9]*)/g
  const res = text.match(reg)
  const result = res ? res[0] : ''
  obj.value = result
  return result
}

/** 확장 숫자 입력 제한 */
export const numericExt = (
  obj: HTMLInputElement,
  event: Event,
  negative: boolean = false,
  intLang?: number,
  point?: number,
): string => {
  let val = (event.target as HTMLInputElement).value

  if (negative) {
    val = val.replace('-', '')
  }

  const intLangTxt = intLang ? `{1,${intLang}}` : '*'
  const pointTxt = point ? `{0,${point}}` : '*'
  const regTxt = `^-?\\d${intLangTxt}(\\.\\d${pointTxt})?`
  const pattern = new RegExp(regTxt, 'g')
  const res = val.match(pattern)
  const result = res && res.length > 0 ? res[0] : ''

  ;(event.target as HTMLInputElement).value = result
  obj.value = result
  return result
}

/** 소수점 이하 0 제거 */
export const removePointZeros = (
  val: number | string,
  replaceIsNaN?: string | number,
  removeZero?: boolean,
): string | number => {
  if (removeZero === undefined) removeZero = true
  if (Number.isNaN(Number(val))) {
    return replaceIsNaN ?? ''
  } else {
    if (removeZero) {
      return val
        .toString()
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0*/, '$1')
    } else {
      return val
    }
  }
}

/** 숫자 입력 제한 처리 함수 */
export const inputNumeric = (event: Event): string => {
  const target = event.target as HTMLInputElement
  const value = target.value
  const reg = /(^[-])?([0-9]*[.]?[0-9]*)/g
  const matched = value.match(reg)
  const result = matched ? matched[0] : ''
  target.value = result
  return result
}

/** 전화번호 입력값에서 앞뒤 공백 제거 후 숫자만 추출 */
export const toPhoneDigits = (value: string | undefined | null): string =>
  String(value ?? '')
    .trim()
    .replace(/\D/g, '')

/** 전화번호 형식 포맷 */
export const formatPhone = (value: string | undefined | null): string => {
  const digits = toPhoneDigits(value)
  if (!digits) return ''

  if (digits.length < 9 || digits.length > 11) return digits

  const headLength = digits.length === 9 ? 2 : 3
  const head = digits.slice(0, headLength)
  const middle = digits.slice(headLength, -4)
  const tail = digits.slice(-4)

  return `${head}-${middle}-${tail}`
}
