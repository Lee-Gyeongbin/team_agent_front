import DOMPurify from 'dompurify'

/** 아이디어 본문·관리자 코멘트에 허용하는 태그 (서식 에디터 툴바 범위) */
const IDEA_ALLOWED_TAGS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'h3',
  'blockquote',
  'a',
]

const escapeText = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  )

const htmlTag = /<\/?[a-z][\w-]*(?=[\s/>])[^>]*>/i
const escapedIdeaTag = new RegExp(
  `&lt;/?(?:${IDEA_ALLOWED_TAGS.join('|')})(?=\\s|/|&gt;|>)(?:(?!&lt;|&gt;)[^<>])*(?:&gt;|>)`,
  'gi',
)

const restoreEscapedTags = (text: string) =>
  text.replace(escapedIdeaTag, (tag) =>
    tag.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'"),
  )

/**
 * 본문을 화면 표시용 HTML로 변환 (v-html 전제)
 * - HTML이면 허용 태그만 남기고 정제, 일반 텍스트면 이스케이프 후 줄바꿈만 <br>로 변환
 * - 백엔드 연결 시 서버에서도 동일하게 정제 필요
 */
export const toIdeaContentHtml = (value?: string | null): string => {
  const text = value ?? ''
  // The multipart filter preserves paragraph tags but escapes other formatting.
  // The final closing tag can also have only its opening bracket escaped.
  const html = restoreEscapedTags(text)
  if (!htmlTag.test(html)) return escapeText(text).replace(/\r\n?|\n/g, '<br>')
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: IDEA_ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'target', 'rel', 'start'] })
}

/** 파일 크기 표시 (목업과 동일: 1MB 이상은 MB, 미만은 KB) */
export const formatIdeaFileSize = (bytes: number): string =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
