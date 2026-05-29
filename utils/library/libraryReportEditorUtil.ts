import type { LibraryGeneratedReportValues } from '~/types/library'
import type { LibraryReportRow } from '~/utils/library/libraryReportPrintUtil'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { escapeHTML } from '~/utils/global/htmlUtil'

/** 에디터 HTML에서 파싱한 보고서 항목 — 인사이트 분석 등 선택 UI용 */
export interface LibraryReportSectionOption {
  labelKey: string
  valueKey: string
  label: string
}

/** 인사이트 분석 반영 방식 */
export type LibraryReportInsightMode = 'add' | 'replace'

/** 인사이트 분석 요청 payload */
export interface LibraryReportInsightRequest {
  mode: LibraryReportInsightMode
  labelKey?: string
  valueKey?: string
  /** 지식 카드 원본 답변 HTML */
  rContent: string
  currentHtml: string
}

const stripHtmlTags = (s: string): string =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** 템플릿 multiline 필드 — LibraryReportEditor와 동일 속성명 */
const TMPL_FIELD_MULTILINE_H2 = 'data-tmpl-field-multiline'
const TMPL_FIELD_MULTILINE_P = 'data-tmpl-field-multiline-p'
const TMPL_FIELD_MULTILINE_TABLE = 'data-tmpl-field-multiline-table'
const TMPL_FIELD_MULTILINE_LIST = 'data-tmpl-field-multiline-list'
const LABEL_SUFFIX = '_label'

interface ReportSectionCandidate {
  node: Element
  option: LibraryReportSectionOption
  dedupeKey: string
}

/** h2 다음 형제(또는 tableWrapper 등)에서 첫 table 탐색 */
const findNextTableAfter = (el: Element): HTMLTableElement | null => {
  let node: Element | null = el.nextElementSibling
  while (node) {
    if (node.tagName === 'TABLE') return node as HTMLTableElement
    const nested = node.querySelector('table')
    if (nested) return nested as HTMLTableElement
    node = node.nextElementSibling
  }
  return null
}

/** multiline 표 — td[data-value-key] 또는 data-tmpl-json-key 로 valueKey 추출 */
const extractValueKeyFromMultilineTable = (table: Element): string | null => {
  const tdWithKey = table.querySelector('td[data-value-key]')
  const fromTd = tdWithKey?.getAttribute('data-value-key')?.trim()
  if (fromTd) return fromTd

  const jsonEl = table.querySelector('[data-tmpl-json-key]')
  const fromJson = jsonEl?.getAttribute('data-tmpl-json-key')?.trim()
  return fromJson || null
}

/** multiline 데이터 표 여부 (No./내용 형태 포함) */
const isMultilineDataTable = (table: Element): boolean => {
  if (table.hasAttribute(TMPL_FIELD_MULTILINE_TABLE)) return true
  return (
    !!table.querySelector(`p[${TMPL_FIELD_MULTILINE_P}]`) ||
    !!table.querySelector('td[data-value-key] [data-tmpl-json-key]')
  )
}

/** tr이 multiline 데이터 표 안의 본문 행인지 */
const isRowInsideMultilineTable = (tr: Element, doc: Document): boolean => {
  const table = tr.closest('table')
  if (!table) return false
  if (isMultilineDataTable(table)) return true

  const h2List = doc.querySelectorAll(`h2[${TMPL_FIELD_MULTILINE_H2}]`)
  for (const h2 of h2List) {
    const linked = findNextTableAfter(h2)
    if (linked === table) return true
  }
  return false
}

const compareDocumentOrder = (a: Element, b: Element): number => {
  const pos = a.compareDocumentPosition(b)
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

const collectReportSectionCandidates = (doc: Document): ReportSectionCandidate[] => {
  const candidates: ReportSectionCandidate[] = []
  const multilineTableHandled = new Set<string>()

  // 1) 템플릿 multiline — h2(섹션 제목) + 하위 표
  doc.querySelectorAll(`h2[${TMPL_FIELD_MULTILINE_H2}]`).forEach((h2) => {
    const fieldId = h2.getAttribute(TMPL_FIELD_MULTILINE_H2)?.trim() ?? ''
    const sectionLabel = stripHtmlTags(h2.textContent ?? '')

    const table =
      (fieldId ? doc.querySelector(`table[${TMPL_FIELD_MULTILINE_TABLE}="${fieldId}"]`) : null) ??
      findNextTableAfter(h2)
    if (!table) return

    const valueKey = extractValueKeyFromMultilineTable(table)
    if (!valueKey) return

    const dedupeKey = `multiline-table:${fieldId || sectionLabel}:${valueKey}`
    if (multilineTableHandled.has(dedupeKey)) return
    multilineTableHandled.add(dedupeKey)

    candidates.push({
      node: h2,
      dedupeKey,
      option: {
        labelKey: `${valueKey}${LABEL_SUFFIX}`,
        valueKey,
        label: sectionLabel || '(라벨 없음)',
      },
    })
  })

  // 2) data-tmpl-field-multiline-table 속성만 남은 표 (h2 삭제된 경우)
  doc.querySelectorAll(`table[${TMPL_FIELD_MULTILINE_TABLE}]`).forEach((table) => {
    const fieldId = table.getAttribute(TMPL_FIELD_MULTILINE_TABLE)?.trim() ?? ''
    const dedupePrefix = `multiline-table:${fieldId}:`
    if ([...multilineTableHandled].some((key) => key.startsWith(dedupePrefix))) return

    const valueKey = extractValueKeyFromMultilineTable(table)
    if (!valueKey) return

    const h2 = fieldId ? doc.querySelector(`h2[${TMPL_FIELD_MULTILINE_H2}="${fieldId}"]`) : null
    const sectionLabel = h2 ? stripHtmlTags(h2.textContent ?? '') : stripHtmlTags(valueKey)

    const dedupeKey = `${dedupePrefix}${valueKey}`
    if (multilineTableHandled.has(dedupeKey)) return
    multilineTableHandled.add(dedupeKey)

    candidates.push({
      node: (h2 ?? table) as Element,
      dedupeKey,
      option: {
        labelKey: `${valueKey}${LABEL_SUFFIX}`,
        valueKey,
        label: sectionLabel || '(라벨 없음)',
      },
    })
  })

  // 3) 표준 2열 행 — th + td (multiline 표 본문 행 제외)
  doc.querySelectorAll('table tr').forEach((tr) => {
    if (isRowInsideMultilineTable(tr, doc)) return

    const th = tr.querySelector('th')
    const td = tr.querySelector('td')
    if (!th || !td) return

    const labelKey = th.getAttribute('data-label-key')?.trim()
    const valueKey = td.getAttribute('data-value-key')?.trim()
    const labelText = stripHtmlTags(th.textContent ?? '')

    // 헤더 행(No./내용 등) 스킵
    if (!valueKey && !labelKey && !labelText) return
    if (!valueKey && tr.querySelectorAll('th').length >= 2 && !tr.querySelector('td[data-value-key]')) return

    if (labelKey && valueKey) {
      candidates.push({
        node: tr,
        dedupeKey: `standard:${valueKey}`,
        option: {
          labelKey,
          valueKey,
          label: labelText || '(라벨 없음)',
        },
      })
      return
    }

    if (valueKey) {
      candidates.push({
        node: tr,
        dedupeKey: `standard:${valueKey}`,
        option: {
          labelKey: labelKey ?? `${valueKey}${LABEL_SUFFIX}`,
          valueKey,
          label: labelText || valueKey,
        },
      })
      return
    }

    // 사용자 추가 행 — 라벨만 있는 경우
    if (!labelText) return
    const extraIndex = candidates.filter((c) => c.dedupeKey.startsWith('extra:')).length + 1
    candidates.push({
      node: tr,
      dedupeKey: `extra:${extraIndex}:${labelText}`,
      option: {
        labelKey: `extra_${extraIndex}_label`,
        valueKey: `extra_${extraIndex}`,
        label: labelText,
      },
    })
  })

  // 4) multiline 리스트 — ol > li (항목명 p + 내용 p)
  doc.querySelectorAll(`ol[${TMPL_FIELD_MULTILINE_LIST}] > li`).forEach((li) => {
    const ps = li.querySelectorAll(`p[${TMPL_FIELD_MULTILINE_P}]`)
    if (!ps.length) return

    const anchor = ps[0]!
    const valueKey = anchor.getAttribute('data-tmpl-json-key')?.trim()
    if (!valueKey) return

    const fieldId = anchor.getAttribute(TMPL_FIELD_MULTILINE_P)?.trim() ?? ''
    const sectionLabel = stripHtmlTags(anchor.textContent ?? '')

    candidates.push({
      node: li,
      dedupeKey: `multiline-list:${fieldId}:${valueKey}`,
      option: {
        labelKey: `${valueKey}${LABEL_SUFFIX}`,
        valueKey,
        label: sectionLabel || '(라벨 없음)',
      },
    })
  })

  return candidates
}

const mergeReportSectionCandidates = (candidates: ReportSectionCandidate[]): LibraryReportSectionOption[] => {
  const sorted = [...candidates].sort((a, b) => compareDocumentOrder(a.node, b.node))
  const seen = new Set<string>()
  const options: LibraryReportSectionOption[] = []

  for (const candidate of sorted) {
    if (seen.has(candidate.dedupeKey)) continue
    seen.add(candidate.dedupeKey)
    options.push(candidate.option)
  }

  return options
}

/** 문자열이 이미 HTML 태그로 시작하는지 여부 (round-trip 시 toHtmlContent 재처리 방지) */
const isHtmlValue = (s: string): boolean => /^\s*</.test(s)

/**
 * 보고서 JSON → Tiptap 에디터용 2열 표 HTML
 *   - <th data-label-key="..."><p>라벨</p></th>
 *   - <td data-value-key="...">HTML 값 내용</td>
 */
export const buildReportEditorHtml = (values: LibraryGeneratedReportValues, rows: LibraryReportRow[]): string => {
  if (rows.length === 0) return ''

  const bodyRows = rows
    .map((row) => {
      const labelText = escapeHTML(String(values[row.labelKey] ?? ''))
      const rawValue = String(values[row.valueKey] ?? '')
      // 이미 HTML이면 그대로 사용 → round-trip 안정성 확보
      // 아니면 toHtmlContent로 마크다운/플레인 텍스트를 HTML로 변환
      const valueHtml = rawValue.trim() ? (isHtmlValue(rawValue) ? rawValue : toHtmlContent(rawValue)) : '<p></p>'
      return (
        `<tr>` +
        `<th data-label-key="${row.labelKey}"><p>${labelText}</p></th>` +
        `<td data-value-key="${row.valueKey}">${valueHtml}</td>` +
        `</tr>`
      )
    })
    .join('')

  // 표 앞뒤로 빈 단락 추가 → 커서가 표 밖에 위치할 수 있어 floating 툴바 상시 노출 방지
  return `<table><tbody>${bodyRows}</tbody></table><p></p>`
}

/**
 * Tiptap getHTML() 결과 → 보고서 JSON (역파싱)
 *   - data-label-key / data-value-key 속성으로 키 복원
 *   - 키 없는 사용자 추가 행은 extra_N 형태로 자동 키 생성
 *   - 키 없고 라벨도 빈 행은 무시
 */
export const parseReportEditorHtml = (html: string): LibraryGeneratedReportValues => {
  if (typeof document === 'undefined' || !html.trim()) return {}

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result: LibraryGeneratedReportValues = {}
  let extraCounter = 0

  const rows = doc.querySelectorAll('table tr')
  rows.forEach((tr) => {
    const th = tr.querySelector('th')
    const td = tr.querySelector('td')
    if (!th || !td) return

    const labelKey = th.getAttribute('data-label-key')
    const valueKey = td.getAttribute('data-value-key')
    const labelText = (th.textContent ?? '').trim()
    const valueHtml = td.innerHTML

    if (labelKey && valueKey) {
      result[labelKey] = labelText
      result[valueKey] = valueHtml
    } else {
      // 사용자가 추가한 행 — 자동 키 생성
      if (!labelText) return
      extraCounter++
      result[`extra_${extraCounter}_label`] = labelText
      result[`extra_${extraCounter}`] = valueHtml
    }
  })

  return result
}

/**
 * 현재 에디터 HTML → 보고서 항목 선택지 목록
 * - 표준 2열 행 (data-label-key / data-value-key)
 * - 템플릿 multiline: h2[data-tmpl-field-multiline] + 하위 표
 * - 템플릿 multiline 리스트: ol[data-tmpl-field-multiline-list] > li
 */
export const getReportSectionOptionsFromHtml = (html: string): LibraryReportSectionOption[] => {
  if (typeof document === 'undefined' || !html.trim()) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const candidates = collectReportSectionCandidates(doc)
  return mergeReportSectionCandidates(candidates)
}
