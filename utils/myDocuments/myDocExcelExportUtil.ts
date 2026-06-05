/** HTML 조각 → 엑셀 셀용 평문 (블록 요소는 줄바꿈) */
export const htmlFragmentToPlainText = (html: string): string => {
  if (!html.trim()) return ''
  if (typeof document === 'undefined') {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  const blockTags = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'])

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') return '\n'
    if (tag === 'table') return ''

    const inner = Array.from(el.childNodes)
      .map(walk)
      .join('')
    return blockTags.has(tag) ? `${inner}\n` : inner
  }

  return Array.from(root.childNodes)
    .map(walk)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** tr 직계 자식 셀만 추출 */
const getDirectRowCells = (tr: Element): HTMLElement[] =>
  Array.from(tr.children).filter((el): el is HTMLElement => el.tagName === 'TH' || el.tagName === 'TD')

/** 해당 table의 직계 tr만 (중첩 표 제외) */
const getDirectTableRows = (table: Element): HTMLTableRowElement[] =>
  Array.from(table.querySelectorAll('tr')).filter((tr) => tr.closest('table') === table) as HTMLTableRowElement[]

/** 결재란 등 다열 헤더 표 스킵 */
const isApprovalTable = (table: Element): boolean => {
  const firstTr = getDirectTableRows(table)[0]
  if (!firstTr) return false

  const cells = getDirectRowCells(firstTr)
  if (cells.length < 3) return false

  const firstText = (cells[0].textContent ?? '').trim()
  return firstText === '결재' || cells.filter((c) => c.tagName === 'TH').length >= 3
}

/** multiline 표 헤더 행(No. / 내용) 스킵 */
const isNoContentHeaderRow = (cells: HTMLElement[]): boolean => {
  if (cells.length < 2 || !cells.every((cell) => cell.tagName === 'TH')) return false
  const [first, second] = cells.map((cell) => (cell.textContent ?? '').trim())
  return first === 'No.' && second === '내용'
}

/** 중첩 데이터 표(기간/타겟/해지 건수 등) → 엑셀 행 */
const extractNestedDataTableRows = (table: Element, section: string, rows: string[][]): void => {
  const trs = getDirectTableRows(table)
  let headers: string[] = []

  for (const tr of trs) {
    const cells = getDirectRowCells(tr)
    if (cells.length < 2) continue

    const texts = cells.map((cell) => (cell.textContent ?? '').trim())

    if (cells.every((cell) => cell.tagName === 'TH')) {
      headers = texts
      continue
    }

    const sectionPrefix = section ? `[${section}] ` : ''

    if (headers.length === texts.length && headers.length >= 2) {
      const summary = headers.map((header, idx) => `${header}: ${texts[idx] ?? ''}`).join(', ')
      rows.push([sectionPrefix + (texts[0] ?? ''), summary])
      continue
    }

    if (texts.length >= 3) {
      rows.push([`${sectionPrefix}${texts[0]} · ${texts[1]}`, texts[2] ?? ''])
      continue
    }

    rows.push([sectionPrefix + texts[0], texts.slice(1).join(' | ')])
  }
}

/** multiline 단일 열 td — 텍스트 + 내부 중첩 표 */
const extractMultilineCellRow = (cell: HTMLElement, section: string, rows: string[][]): void => {
  const clone = cell.cloneNode(true) as HTMLElement
  clone.querySelectorAll('table').forEach((table) => table.remove())

  const text = htmlFragmentToPlainText(clone.innerHTML)
  const sectionPrefix = section ? `[${section}] ` : ''

  if (text) {
    rows.push([`${sectionPrefix}내용`, text])
  }

  cell.querySelectorAll('table').forEach((nested) => {
    extractNestedDataTableRows(nested, section, rows)
  })
}

/** 최상위 table 파싱 */
const extractTopLevelTableRows = (table: Element, section: string, rows: string[][]): void => {
  if (isApprovalTable(table)) return

  for (const tr of getDirectTableRows(table)) {
    const cells = getDirectRowCells(tr)
    if (cells.length === 0) continue

    // 표준 2열 (th + td)
    if (cells.length === 2 && !cells.every((cell) => cell.tagName === 'TH')) {
      const label = (cells[0].textContent ?? '').trim()
      const value = htmlFragmentToPlainText(cells[1].innerHTML)
      if (label || value) rows.push([label, value])
      continue
    }

    // multiline 단일 열 td
    if (cells.length === 1 && cells[0].tagName === 'TD') {
      extractMultilineCellRow(cells[0], section, rows)
      continue
    }

    // 단일 th 헤더(내용) / No.·내용 행 스킵
    if (cells.length === 1 && cells[0].tagName === 'TH') continue
    if (isNoContentHeaderRow(cells)) continue
    if (cells.every((cell) => cell.tagName === 'TH')) continue

    // 다열 td 데이터 행
    if (cells.length >= 2 && cells.every((cell) => cell.tagName === 'TD')) {
      const texts = cells.map((cell) => (cell.textContent ?? '').trim())
      if (texts.some(Boolean)) {
        rows.push([section ? `[${section}] ${texts[0]}` : texts[0], texts.slice(1).join(' | ')])
      }
    }
  }
}

/** 에디터 HTML → 2열 표 행 [항목, 내용] 추출 */
export const extractReportRowsFromHtml = (html: string): string[][] => {
  if (!html.trim() || typeof document === 'undefined') return []

  const doc = new DOMParser().parseFromString(`<div id="my-doc-export-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('my-doc-export-root') ?? doc.body

  const rows: string[][] = []
  let currentSection = ''

  const walkNodes = (parent: Element) => {
    Array.from(parent.children).forEach((node) => {
      const tag = node.tagName

      if (tag === 'H2') {
        currentSection = (node.textContent ?? '').trim()
        return
      }

      if (tag === 'TABLE' && node.closest('table') === node) {
        extractTopLevelTableRows(node, currentSection, rows)
        return
      }

      if (node.children.length > 0) {
        walkNodes(node)
      }
    })
  }

  walkNodes(root)

  // fallback: 문서 순회로 못 찾은 경우 전체 table tr 재스캔
  if (rows.length === 0) {
    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.closest('table')) return
      extractTopLevelTableRows(table, '', rows)
    })
  }

  return rows
}

/** 추출된 표 행 → TXT 본문 */
export const formatReportRowsAsPlainText = (rows: string[][]): string =>
  rows
    .map(([label, value]) => (value ? `${label}\n${value}` : label))
    .join('\n\n')
    .trim()

/** HTML 전체 → 평문 (행 추출 실패 시 fallback) */
export const htmlDocumentToPlainText = (html: string): string => {
  if (!html.trim()) return ''
  if (typeof document === 'undefined') {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const doc = new DOMParser().parseFromString(`<div id="my-doc-txt-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('my-doc-txt-root')
  if (!root) return ''

  const blockTags = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'tr'])

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') return '\n'

    const inner = Array.from(el.childNodes)
      .map(walk)
      .join('')
    return blockTags.has(tag) ? `${inner}\n` : inner
  }

  return Array.from(root.childNodes)
    .map(walk)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
