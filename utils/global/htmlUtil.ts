/**
 * HTML 처리 유틸리티
 */

/** HTML 이스케이프 맵 */
export const escapeHTMLMap: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '&amp;#160;': '',
}

/** HTML 언이스케이프 맵 */
export const unescapeHTMLMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
}

/** HTML 이스케이프 */
export const escapeHTML = (s: unknown): string => {
  if (!isNotEmpty(s)) return ''
  let str = String(s)
  for (const k in escapeHTMLMap) {
    str = str.replaceAll(k, escapeHTMLMap[k])
  }
  return str
}

/** HTML 언이스케이프 */
export const unescapeHTML = (s: unknown): string => {
  if (!isNotEmpty(s)) return ''
  let str = String(s)
  for (const k in unescapeHTMLMap) {
    str = str.replaceAll(k, unescapeHTMLMap[k])
  }
  return str
}

/** HTML 이스케이프하지 않음 */
export const nonEscapeHTML = (s: unknown): unknown => {
  if (Array.isArray(s)) {
    for (const idx in s) {
      if (typeof s[idx] === 'object') continue
      const val = String(s[idx])
      if (val) {
        if (val.endsWith('&#8203;')) {
          const lastIndex = val.lastIndexOf('&#8203;')
          s[idx] = val.substring(0, lastIndex) + val.substring(lastIndex + 7)
          return s
        }
      }
      for (const k in unescapeHTMLMap) {
        s[idx] = val.replaceAll(k, unescapeHTMLMap[k])
      }
    }
    return s
  } else {
    let str = String(s)
    if (str) {
      if (str.endsWith('&#8203;')) {
        const lastIndex = str.lastIndexOf('&#8203;')
        return str.substring(0, lastIndex) + str.substring(lastIndex + 7)
      }
    }
    for (const k in unescapeHTMLMap) {
      str = str.replaceAll(k, unescapeHTMLMap[k])
    }
    return str
  }
}

/** 객체의 HTML 이스케이프 */
export const escapeHTMLObject = (o: Record<string, unknown>): Record<string, unknown> => {
  if (typeof o === 'object') {
    for (const k in o) {
      o[k] = escapeHTML(o[k])
    }
  }
  return o
}

/** 객체의 HTML 언이스케이프 */
export const nonEscapeHTMLObject = (o: Record<string, unknown>): Record<string, unknown> => {
  if (typeof o === 'object') {
    for (const k in o) {
      o[k] = nonEscapeHTML(o[k])
    }
  }
  return o
}

/** 배열의 객체들 HTML 언이스케이프 */
export const nonEscapeHTMLArrayByObject = (a: Record<string, unknown>[]): Record<string, unknown>[] => {
  if (typeof a === 'object') {
    for (const k in a) {
      a[k] = nonEscapeHTMLObject(a[k] as Record<string, unknown>)
    }
  }
  return a
}

/** 객체 내 배열의 HTML 언이스케이프 */
export const nonEscapeHTMLArrayInObject = (a: Record<string, unknown>): Record<string, unknown> => {
  if (typeof a === 'object') {
    for (const k in a) {
      if (a[k] instanceof Array) {
        nonEscapeHTMLArrayByObject(a[k] as Record<string, unknown>[])
      } else {
        a[k] = nonEscapeHTMLObject(a[k] as Record<string, unknown>)
      }
    }
  }
  return a
}

/** URL을 링크로 변환 */
export const withLinks = (theText: string): string => {
  theText = escapeHTML(theText)
  const URLMatcher =
    /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/gim
  if (isEmpty(theText)) return theText
  return theText.replace(
    URLMatcher,
    (match) => `<a href="${match}" style="color:#0e62dd!important" target="_blank">${match}</a>`,
  )
}
