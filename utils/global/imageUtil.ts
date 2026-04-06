/**
 * 이미지 src(data URL·base64·외부 URL) 정규화 유틸리티
 */

/**
 * API 등에서 내려온 썸네일 문자열을 `<img src>`에 넣을 수 있는 값으로 변환합니다.
 * - 비어 있으면 `fallbackSrc` 반환
 * - 완성된 data URL(`data:...`)·http(s) URL은 그대로 사용
 * - `image/png;base64,...`처럼 MIME만 있는 경우 `data:` 접두 추가
 * - 그 외는 순수 base64로 보고 `rawBase64DefaultMime`으로 data URL 생성
 */
export const resolveDataUrlImageSrc = (
  raw: string | undefined | null,
  fallbackSrc: string,
  rawBase64DefaultMime: string = 'image/png',
): string => {
  const s = (raw ?? '').trim()
  if (!s) return fallbackSrc
  if (s.startsWith('data:')) return s
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (/^image\/[^;]+;base64,/i.test(s)) return `data:${s}`
  return `data:${rawBase64DefaultMime};base64,${s}`
}
