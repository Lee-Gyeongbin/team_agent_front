import DOMPurify from 'dompurify'

/** 미리보기 — 에디터 HTML 기준 가상 폭(px) */
export const MY_DOC_PREVIEW_BASE_WIDTH = 720

/** Tiptap 보고서 HTML — v-html 미리보기용 sanitize */
const MY_DOC_PREVIEW_PURIFY_CONFIG: DOMPurify.Config = {
  ADD_ATTR: [
    'target',
    'style',
    'class',
    'data-align',
    'colwidth',
    'rowspan',
    'colspan',
    'data-value-key',
    'data-tmpl-json-key',
    'data-tmpl-field-multiline',
    'data-tmpl-field-multiline-p',
    'data-tmpl-field-multiline-table',
    'data-tmpl-field-multiline-list',
    'data-placeholder',
    'data-html-code',
  ],
  ADD_TAGS: ['figure', 'colgroup', 'col'],
}

/** docHtml → 미리보기용 sanitize HTML */
export const sanitizeMyDocPreviewHtml = (html: string | null | undefined): string => {
  const trimmed = html?.trim() ?? ''
  if (!trimmed) return ''
  return DOMPurify.sanitize(trimmed, MY_DOC_PREVIEW_PURIFY_CONFIG)
}

/** 미리보기 — 패널 너비에 맞춤 (세로는 허용 높이까지 상단만 표시) */
export const getMyDocPreviewWidthFitScale = (
  viewportWidth: number,
  baseWidth = MY_DOC_PREVIEW_BASE_WIDTH,
): number => {
  if (viewportWidth <= 0) return 0.4
  return Math.min(viewportWidth / baseWidth, 1) * 0.98
}
