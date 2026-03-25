/**
 * 바이트 단위 문자열 처리 유틸리티
 * - 문자열 UTF-8 바이트 길이, textarea 제한, 파일 용량 표시
 */

/** formatFileSize 옵션 */
export type FormatFileSizeOptions = {
  /** 1024: KB/MB (일반 파일·OS 표기), 1000: SI (10³) 단위 */
  base?: 1024 | 1000
  /** KB 이상일 때 소수 자릿수 (0이면 정수) */
  decimals?: number
}

/**
 * 바이트를 B / KB / MB / GB / TB 문자열로 변환
 * @param bytes - 바이트 수 (음수·NaN은 0 B로 처리)
 */
export const formatFileSize = (bytes: number, options: FormatFileSizeOptions = {}): string => {
  const base = options.base ?? 1024
  const decimals = options.decimals ?? 1

  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }

  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let size = bytes
  let i = 0

  while (size >= base && i < units.length - 1) {
    size /= base
    i += 1
  }

  if (i === 0) {
    return `${Math.round(size)} B`
  }

  const rounded = Number(size.toFixed(decimals))
  return `${rounded} ${units[i]}`
}

/** 문자열의 바이트 길이 계산 */
export const lengthb = (str: string): number => new TextEncoder().encode(str || '').length

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
    (val) => {
      byteCountRef.value = lengthb(val)
    },
    { immediate: true },
  )
}

/** 바이트 제한 설정 (초과 시 자동 자르기) */
export const setMaxLengthById = (textRef: Ref<string>, maxBytes: number) => {
  watch(textRef, (val) => {
    const newVal = lengthbCut(val, maxBytes)
    if (val !== newVal) textRef.value = newVal
  })
}
