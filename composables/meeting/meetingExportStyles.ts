// =========================================================
// 회의록 내보내기 공통 스타일
// _doc-content.scss의 doc-content-styles mixin을 SCSS 변수
// 없이 plain CSS 문자열로 재현 (PDF / DOCX 각각 별도 버전)
// =========================================================

const H_ID = (hostId: string) => `#${hostId}`

// ------------------------------------
// h2 ::before 아이콘 — _doc-content.scss 동일 SVG
// ------------------------------------
const CHECK_SVG_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m8 12 3 3 5-6'/%3E%3C%2Fsvg%3E\")"

// =========================================================
// PDF 인쇄용 CSS
// window.print() 방식 — 브라우저 렌더 엔진이 적용하므로
// ::before / mask-image / display:flex 모두 사용 가능
// =========================================================
export const buildMeetingPrintCss = (hostId: string): string => {
  const H = H_ID(hostId)
  return `
@media screen {
  ${H} {
    position: fixed;
    left: -99999px;
    top: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    pointer-events: none;
  }
}

@media print {
  @page { margin: 15mm 15mm; }
  body * { visibility: hidden !important; }
  ${H}, ${H} * { visibility: visible !important; }

  /* ── 기본 컨테이너 ── */
  ${H} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    clip: auto !important;
    margin: 0 !important;
    padding: 16px 24px !important;
    background: #fff !important;
    box-sizing: border-box !important;
    font-family: 'Pretendard', -apple-system, sans-serif !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 150% !important;
    color: #5c6677 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center !important;
  }
  ${H} * { box-sizing: border-box !important; }

  /* ── 본문 블록 요소 — 좌측 정렬 재설정 ── */
  ${H} > p,
  ${H} > ul,
  ${H} > ol,
  ${H} > blockquote,
  ${H} > pre,
  ${H} > table,
  ${H} > h2,
  ${H} > h3 { text-align: left !important; }

  /* ── 로고 이미지
       에디터 DOM: VueNodeViewRenderer가 <figure>로 감싸서 표시
       저장 HTML (getHTML()): ResizableImage의 renderHTML이 attr만 재정의하므로
       실제 직렬화는 기본 Image extension 동작인 <img>로 저장됨
       → figure + img 둘 다 타겟 ── */
  ${H} > figure:first-of-type,
  ${H} > img:first-of-type {
    display: inline-block !important;
    vertical-align: middle !important;
    margin: 0 16px 32px 0 !important;
  }

  /* ── 로고 옆 h1 ── */
  ${H} > figure:first-of-type + h1,
  ${H} > img:first-of-type + h1 {
    display: inline-block !important;
    vertical-align: middle !important;
    margin: 0 0 32px 0 !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;
  }

  /* ── 헤더(로고+제목) 다음 첫 요소 구분선 ── */
  ${H} > figure:first-of-type + h1 + *,
  ${H} > img:first-of-type + h1 + * {
    border-top: 1px solid #dce4e9 !important;
    padding-top: 16px !important;
  }

  /* ── h1 ── */
  ${H} h1 {
    font-size: 26px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    color: #5c6677 !important;
    text-align: center !important;
    margin: 0 0 24px !important;
    padding-bottom: 16px !important;
    border-bottom: 1px solid #dce4e9 !important;
  }

  /* ── h2 ── */
  ${H} h2 {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 150% !important;
    color: #3c69db !important;
    margin: 32px 0 8px !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid #dce4e9 !important;
  }
  ${H} h2::before {
    content: '' !important;
    flex-shrink: 0 !important;
    width: 18px !important;
    height: 18px !important;
    background-color: #3c69db !important;
    mask-image: ${CHECK_SVG_URL} !important;
    mask-repeat: no-repeat !important;
    mask-position: center !important;
    mask-size: contain !important;
    -webkit-mask-image: ${CHECK_SVG_URL} !important;
    -webkit-mask-repeat: no-repeat !important;
    -webkit-mask-position: center !important;
    -webkit-mask-size: contain !important;
  }

  /* ── h3 ── */
  ${H} h3 {
    font-size: 14px !important;
    font-weight: 700 !important;
    line-height: 150% !important;
    color: #5c6677 !important;
    margin: 16px 0 8px !important;
  }
  ${H} h3:first-child { margin-top: 0 !important; }

  /* ── p ── */
  ${H} p {
    margin: 0 0 16px !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 1.7 !important;
    color: #5c6677 !important;
  }
  ${H} p:last-child { margin-bottom: 0 !important; }

  /* ── ul ── */
  ${H} ul {
    list-style: none !important;
    margin: 0 0 16px !important;
    padding-left: 0 !important;
  }
  ${H} ul li {
    position: relative !important;
    padding-left: 18px !important;
    margin-bottom: 10px !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 1.7 !important;
    color: #5c6677 !important;
  }
  ${H} ul li::before {
    content: '' !important;
    position: absolute !important;
    left: 4px !important;
    top: 0.65em !important;
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: #5c6677 !important;
  }
  ${H} ul ul {
    margin: 8px 0 0 !important;
    padding-left: 12px !important;
  }

  /* ── ol ── */
  ${H} ol {
    list-style: decimal outside !important;
    margin: 0 0 16px !important;
    padding-left: 26px !important;
  }
  ${H} ol li {
    margin-bottom: 16px !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 1.7 !important;
    color: #5c6677 !important;
  }
  /* 안건 텍스트 (ol 직접 자식 p) */
  ${H} ol > li > p { color: #2d3139 !important; }
  /* ol 안의 dash 리스트 */
  ${H} ol > li > ul {
    margin: 4px 0 0 !important;
    padding-left: 4px !important;
  }
  ${H} ol > li > ul > li {
    padding-left: 14px !important;
    margin-bottom: 2px !important;
  }
  ${H} ol > li > ul > li::before {
    content: '-' !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: auto !important;
    height: auto !important;
    background: transparent !important;
    border-radius: 0 !important;
    color: #6f7a93 !important;
    font-weight: 450 !important;
    font-size: inherit !important;
    line-height: inherit !important;
  }
  ${H} ol ol {
    list-style: lower-alpha outside !important;
    margin: 4px 0 0 !important;
  }

  /* ── li > p (font/color inherit) ── */
  ${H} li > p {
    margin: 0 !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
  }

  /* ── blockquote ── */
  ${H} blockquote {
    margin: 0 0 16px !important;
    padding: 8px 16px !important;
    border-left: 3px solid #3c69db !important;
    background: rgba(60,105,219,0.04) !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 1.7 !important;
    color: #5c6677 !important;
    font-style: italic !important;
  }

  /* ── table ── */
  ${H} table {
    width: 100% !important;
    margin: 0 0 24px !important;
    border-collapse: collapse !important;
    border: 1px solid #dce4e9 !important;
    table-layout: fixed !important;
  }
  ${H} th,
  ${H} td {
    padding: 6px 10px !important;
    border: 1px solid #dce4e9 !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
    vertical-align: middle !important;
    color: #5c6677 !important;
    word-break: break-word !important;
  }
  ${H} th {
    background: #f4f7f9 !important;
    font-weight: 700 !important;
    text-align: center !important;
  }
  ${H} td {
    background: #fff !important;
    font-weight: 450 !important;
    text-align: left !important;
  }
  /* 정보 표 라벨 컬럼 폭 고정 */
  ${H} tbody tr > th:first-child { width: 120px !important; }
  ${H} tbody tr > th:nth-child(3) { width: 100px !important; }
  /* 표 안 p 초기화 */
  ${H} th p, ${H} td p {
    margin: 0 !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
  }

  /* ── hr ── */
  ${H} hr {
    border: none !important;
    border-top: 1px solid #dce4e9 !important;
    margin: 8px 0 !important;
  }

  /* ── img ── */
  ${H} img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 4px !important;
    margin: 8px 0 !important;
  }

  /* ── a ── */
  ${H} a {
    color: #3c69db !important;
    text-decoration: underline !important;
  }

  /* ── mark ── */
  ${H} mark {
    padding: 1px 2px !important;
    border-radius: 2px !important;
  }

  /* ── pre / code ── */
  ${H} pre {
    margin: 0 0 16px !important;
    padding: 8px 16px !important;
    background: #2d3139 !important;
    color: #fff !important;
    border-radius: 6px !important;
    overflow-x: auto !important;
    font-family: 'Menlo', 'Consolas', monospace !important;
    font-size: 13px !important;
  }
  ${H} pre code {
    background: transparent !important;
    color: inherit !important;
    padding: 0 !important;
  }
  ${H} code {
    padding: 2px 4px !important;
    background: #f4f7f9 !important;
    border-radius: 3px !important;
    font-family: 'Menlo', 'Consolas', monospace !important;
    font-size: 0.9em !important;
    color: #d92d20 !important;
  }

  /* ── strong / em / u ── */
  ${H} strong, ${H} b { font-weight: 700 !important; }
  ${H} em, ${H} i { font-style: italic !important; }
  ${H} u { text-decoration: underline !important; }
}
`
}

// =========================================================
// DOCX 변환용 CSS
// html-docx-js-typescript의 asBlob()에 전달하는 전체 HTML에
// 삽입. Word는 ::before / mask-image / flex 미지원이므로 단순화.
// =========================================================
export const MEETING_DOCX_CSS = `
body {
  font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: #5c6677;
  margin: 0;
  padding: 0;
}

h1 {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.4;
  color: #5c6677;
  text-align: center;
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #dce4e9;
}

h2 {
  font-size: 16px;
  font-weight: 700;
  line-height: 150%;
  color: #3c69db;
  margin: 32px 0 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dce4e9;
}

h3 {
  font-size: 14px;
  font-weight: 700;
  line-height: 150%;
  color: #5c6677;
  margin: 16px 0 8px;
}

p {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #5c6677;
}

ul {
  list-style: disc outside;
  margin: 0 0 16px;
  padding-left: 18px;
}

ul li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #5c6677;
}

ol {
  list-style: decimal outside;
  margin: 0 0 16px;
  padding-left: 26px;
}

ol li {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #5c6677;
}

ol > li > p {
  color: #2d3139;
}

li > p {
  margin: 0;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

blockquote {
  margin: 0 0 16px;
  padding: 8px 16px;
  border-left: 3px solid #3c69db;
  background: #eef2fb;
  font-size: 14px;
  line-height: 1.7;
  color: #5c6677;
  font-style: italic;
}

table {
  width: 100%;
  margin: 0 0 24px;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #dce4e9;
}

th, td {
  padding: 6px 10px;
  border: 1px solid #dce4e9;
  font-size: 14px;
  line-height: 1.6;
  vertical-align: middle;
  color: #5c6677;
  word-break: break-word;
}

th {
  background: #f4f7f9;
  font-weight: 700;
  text-align: center;
}

td {
  text-align: left;
}

tbody tr > th:first-child {
  width: 120px;
}

tbody tr > th:nth-child(3) {
  width: 100px;
}

th p, td p {
  margin: 0;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  color: #3c69db;
  text-decoration: underline;
}

mark {
  padding: 1px 2px;
  border-radius: 2px;
}

pre {
  margin: 0 0 16px;
  padding: 8px 16px;
  background: #2d3139;
  color: #fff;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 13px;
}

code {
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  color: #d92d20;
  background: #f4f7f9;
  padding: 2px 4px;
}

strong, b { font-weight: 700; }
em, i { font-style: italic; }
u { text-decoration: underline; }
`
