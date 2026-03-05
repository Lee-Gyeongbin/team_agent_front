/**
 * URL/쿼리스트링 처리 유틸리티
 */

/** 객체를 URLSearchParams로 변환 */
export const getUrlSearchParams = (obj: Record<string, any>): URLSearchParams => {
    const params = new URLSearchParams()
    Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
                Object.keys(item).forEach(subKey => {
                    params.append(
                        key + '[' + index + '].' + subKey,
                        obj[key][index][subKey]
                    )
                })
            })
        } else {
            params.append(key, nvl(obj[key], ''))
        }
    })
    return params
}