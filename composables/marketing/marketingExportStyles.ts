// =========================================================
// 마케팅 콘텐츠 내보내기 공통 스타일
// _doc-content.scss의 doc-content-styles mixin을 SCSS 변수
// 없이 plain CSS 문자열로 재현 (PDF / DOCX 각각 별도 버전)
// — meetingExportStyles.ts와 동일 패턴. TM000009(마케팅 내보내기
//   템플릿)도 tmpl 관리화면에서 이 mixin을 입혀 작성되므로,
//   내보내기 시점에도 같은 스타일을 재현해야 화면과 동일하게 나온다.
// =========================================================

const H_ID = (hostId: string) => `#${hostId}`

// =========================================================
// PDF 인쇄용 CSS
// window.print() 방식 — 브라우저 렌더 엔진이 적용하므로
// meetingExportStyles.ts의 buildMeetingPrintCss와 동일 규칙 사용
// =========================================================
export const buildMarketingPrintCss = (hostId: string): string => {
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
  }
  ${H} * { box-sizing: border-box !important; }

  /* 템플릿 로고 이미지만 타겟 — > 없이 img:first-of-type만 쓰면 본문에 중첩된 첫 시안 이미지도
     부모 기준 첫 img로 같이 걸려 64px로 쪼그라든다(meetingExportStyles.ts와 동일 실수 방지) */
  ${H} > img:first-of-type {
    display: block !important;
    margin: 0 auto 12px !important;
    width: 64px !important;
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
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 150% !important;
    color: #3c69db !important;
    margin: 32px 0 8px !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid #dce4e9 !important;
    text-align: left !important;
  }

  /* ── p ── */
  ${H} p {
    margin: 0 0 16px !important;
    font-size: 14px !important;
    font-weight: 450 !important;
    line-height: 1.7 !important;
    color: #5c6677 !important;
    text-align: left !important;
  }
  ${H} p:last-child { margin-bottom: 0 !important; }

  /* ── table ── */
  ${H} table {
    width: 100% !important;
    margin: 0 0 24px !important;
    border-collapse: collapse !important;
    border: 1px solid #dce4e9 !important;
    table-layout: fixed !important;
    text-align: left !important;
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
    width: 120px !important;
  }
  ${H} td {
    background: #fff !important;
    font-weight: 450 !important;
    text-align: left !important;
  }
  ${H} th p, ${H} td p {
    margin: 0 !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
  }

  /* ── img (시안 이미지 등 본문 내 이미지) ── */
  ${H} img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 4px !important;
    margin: 8px 0 !important;
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
// 삽입. Word는 flex/mask-image 등 미지원이므로 단순화된 규칙만 사용.
// =========================================================
export const MARKETING_DOCX_CSS = `
body {
  font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: #5c6677;
  margin: 0;
  padding: 0;
  text-align: left;
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
  text-align: left;
}

p {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #5c6677;
  text-align: left;
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
  width: 120px;
}

td {
  text-align: left;
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

strong, b { font-weight: 700; }
em, i { font-style: italic; }
u { text-decoration: underline; }
`

// =========================================================
// html-docx-js-typescript는 HTML을 docx XML로 바꾸지 않고 MHTML로 감싸
// Word가 열게 한다. Word 레거시 HTML 필터는 <style>의 태그 선택자(정렬 등)를
// 안정적으로 반영하지 않으므로, 반드시 지켜야 하는 값은 인라인 style로 넣는다.
// =========================================================

/** MARKETING_DOCX_CSS와 동일한 정렬 규칙을 인라인 style로 주입 — Word가 확실히 반영하도록 */
export const applyMarketingDocxInlineAlign = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const setAlign = (selector: string, align: string) => {
    doc.body.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.textAlign = align
    })
  }
  setAlign('h1', 'center')
  setAlign('h2, p', 'left')
  setAlign('th', 'center')
  setAlign('td', 'left')

  // variants 본문은 백엔드에서 <p> 없이 <br/>로만 이어붙여 렌더링된다.
  // div에 text-align만 지정하면 브라우저는 상속받아 좌측 정렬로 보이지만,
  // Word 레거시 HTML 필터는 <p>가 아닌 컨테이너의 정렬 상속을 반영하지 않고
  // 기본값(양쪽 정렬)으로 채운다. table/p/div가 중첩되지 않은 텍스트 div만
  // 명시적 <p>로 감싸 강제한다.
  doc.body.querySelectorAll<HTMLElement>('div').forEach((el) => {
    if (el.querySelector('p, div, table')) return
    const p = doc.createElement('p')
    p.style.textAlign = 'left'
    p.innerHTML = el.innerHTML
    el.replaceWith(p)
  })

  return doc.body.innerHTML
}
