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

