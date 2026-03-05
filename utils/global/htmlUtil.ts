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
export const escapeHTML = (s: any): string => {
    if (isNotEmpty(s)) {
        s = s.toString()
        for (const k in escapeHTMLMap) {
            s = s.replaceAll(k, escapeHTMLMap[k])
        }
    }
    return s
}

/** HTML 언이스케이프 */
export const unescapeHTML = (s: any): any => {
    if (isNotEmpty(s)) {
        s = s.toString()
        for (const k in unescapeHTMLMap) {
            s = s.replaceAll(k, unescapeHTMLMap[k])
        }
    }
    return s
}

/** HTML 이스케이프하지 않음 */
export const nonEscapeHTML = (s: any): any => {
    if (Array.isArray(s)) {
        for (const idx in s) {
            if (typeof s[idx] === 'object') continue
            let val = s[idx].toString()
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
        s = s.toString()
        if (s) {
            if (s.endsWith('&#8203;')) {
                const lastIndex = s.lastIndexOf('&#8203;')
                s = s.substring(0, lastIndex) + s.substring(lastIndex + 7)
                return s
            }
        }
        for (const k in unescapeHTMLMap) {
            s = s.replaceAll(k, unescapeHTMLMap[k])
        }
        return s
    }
}

/** 객체의 HTML 이스케이프 */
export const escapeHTMLObject = (o: any): any => {
    if (typeof o === 'object') {
        for (const k in o) {
            o[k] = escapeHTML(o[k])
        }
    }
    return o
}

/** 객체의 HTML 언이스케이프 */
export const nonEscapeHTMLObject = (o: any): any => {
    if (typeof o === 'object') {
        for (const k in o) {
            o[k] = nonEscapeHTML(o[k])
        }
    }
    return o
}

/** 배열의 객체들 HTML 언이스케이프 */
export const nonEscapeHTMLArrayByObject = (a: any): any => {
    if (typeof a === 'object') {
        for (const k in a) {
            a[k] = nonEscapeHTMLObject(a[k])
        }
    }
    return a
}

/** 객체 내 배열의 HTML 언이스케이프 */
export const nonEscapeHTMLArrayInObject = (a: any): any => {
    if (typeof a === 'object') {
        for (const k in a) {
            if (a[k] instanceof Array) {
                nonEscapeHTMLArrayByObject(a[k])
            } else {
                a[k] = nonEscapeHTMLObject(a[k])
            }
        }
    }
    return a
}

/** URL을 링크로 변환 */
export const withLinks = (theText: string): string => {
    theText = escapeHTML(theText)
    const URLMatcher =
        /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim
    if (isEmpty(theText)) return theText
    return theText.replace(
        URLMatcher,
        match =>
            `<a href="${match}" style="color:#0e62dd!important" target="_blank">${match}</a>`
    )
}