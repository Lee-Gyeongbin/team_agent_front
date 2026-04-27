import type { LibraryGeneratedReportValues } from '~/types/library'
import type { LibraryReportRow } from '~/utils/library/libraryReportPrintUtil'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { escapeHTML } from '~/utils/global/htmlUtil'

/** 문자열이 이미 HTML 태그로 시작하는지 여부 (round-trip 시 toHtmlContent 재처리 방지) */
const isHtmlValue = (s: string): boolean => /^\s*</.test(s)

/**
 * 보고서 JSON → Tiptap 에디터용 2열 표 HTML
 *   - <th data-label-key="..."><p>라벨</p></th>
 *   - <td data-value-key="...">HTML 값 내용</td>
 */
export const buildReportEditorHtml = (
  values: LibraryGeneratedReportValues,
  rows: LibraryReportRow[],
): string => {
  if (rows.length === 0) return ''

  const bodyRows = rows
    .map((row) => {
      const labelText = escapeHTML(String(values[row.labelKey] ?? ''))
      const rawValue = String(values[row.valueKey] ?? '')
      // 이미 HTML이면 그대로 사용 → round-trip 안정성 확보
      // 아니면 toHtmlContent로 마크다운/플레인 텍스트를 HTML로 변환
      const valueHtml =
        rawValue.trim() ? (isHtmlValue(rawValue) ? rawValue : toHtmlContent(rawValue)) : '<p></p>'
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
