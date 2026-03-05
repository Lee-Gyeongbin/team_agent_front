/**
 * 바이트 단위 문자열 처리 유틸리티
 */

/** 문자열의 바이트 길이 계산 */
export const lengthb = (str: string): number =>
    new TextEncoder().encode(str || '').length

/** 바이트 기준으로 문자열 자르기 */
export const lengthbCut = (str: string, maxBytes: number): string => {
    let bytes = 0
    let result = ''

    for (const char of str) {
        const charByte = new TextEncoder().encode(char).length
        if (bytes + charByte > maxBytes) break
        bytes += charByte
        result += char
    }

    return result
}

/** textarea 바이트 길이 표시 */
export const showBytes = (textRef: Ref<string>, byteCountRef: Ref<number>) => {
    watch(
        textRef,
        val => {
            byteCountRef.value = lengthb(val)
        },
        {immediate: true}
    )
}

/** 바이트 제한 설정 (초과 시 자동 자르기) */
export const setMaxLengthById = (textRef: Ref<string>, maxBytes: number) => {
    watch(textRef, val => {
        const newVal = lengthbCut(val, maxBytes)
        if (val !== newVal) textRef.value = newVal
    })
}