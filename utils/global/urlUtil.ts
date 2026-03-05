/**
 * URL/쿼리스트링 처리 유틸리티
 */

/** 객체를 URLSearchParams로 변환 */
export const getUrlSearchParams = (obj: Record<string, unknown>): URLSearchParams => {
  const params = new URLSearchParams()
  Object.keys(obj).forEach((key) => {
    const val = obj[key]
    if (Array.isArray(val)) {
      val.forEach((item: Record<string, unknown>, index: number) => {
        Object.keys(item).forEach((subKey) => {
          params.append(key + '[' + index + '].' + subKey, String(item[subKey] ?? ''))
        })
      })
    } else {
      params.append(key, String(nvl(val, '')))
    }
  })
  return params
}
