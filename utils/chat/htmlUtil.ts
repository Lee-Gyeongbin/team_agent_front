import DOMPurify from 'dompurify'
import { marked } from 'marked'

/** GFM(표·취소선 등) + 단일 줄바꿈을 <br>로 (채팅 본문 UX) */
marked.setOptions({
  gfm: true,
  breaks: true,
})

/** 마크다운 셀 안의 | 이스케이프 */
const escapeMdCell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/**
 * 데이터 행: "1 미국 약 28조 달러" / "1. 미국 약 …" 등 (순위 + 국가/항목 + 나머지)
 * 한국어 답변에서 흔한 "… 약 N조 …" 패턴 우선
 */
const parseThreeColumnDataLine = (line: string): [string, string, string] | null => {
  const t = line.trim()
  // 순위(숫자) + 중간열 + "약…" 로 끝나는 열 (GDP 등)
  const mKorean = t.match(/^(\d+)[.)]?\s+(.+?)\s+(약.+)$/u)
  if (mKorean) return [mKorean[1], mKorean[2].trim(), mKorean[3].trim()]
  // 일반: 순위 + 첫 토큰 + 나머지
  const mGeneric = t.match(/^(\d+)[.)]?\s+(\S+)\s+(.+)$/)
  if (mGeneric) return [mGeneric[1], mGeneric[2].trim(), mGeneric[3].trim()]
  return null
}

/** 헤더 한 줄을 3열로 (공백 기준: 앞 두 단어 + 나머지) */
const splitHeaderThree = (header: string): [string, string, string] => {
  const parts = header.trim().split(/\s+/u)
  if (parts.length >= 3) return [parts[0], parts[1], parts.slice(2).join(' ')]
  if (parts.length === 2) return [parts[0], parts[1], '']
  return [parts[0] ?? '', '', '']
}

const buildGfmPipeTable = (headers: [string, string, string], rows: [string, string, string][]) => {
  const h = headers.map(escapeMdCell)
  const sep = ['---', '---', '---']
  const body = rows.map((r) => r.map(escapeMdCell).join(' | '))
  return [`| ${h.join(' | ')} |`, `| ${sep.join(' | ')} |`, ...body.map((line) => `| ${line} |`)].join('\n')
}

/**
 * LLM이 파이프 없이 "헤더 줄 + 숫자로 시작하는 행들"만 줄 때 → GFM 표 문자열로 변환
 * (marked는 | 표만 테이블로 인식)
 * 예:
 *   순위 국가 GDP
      1. 미국 약 28조 달러
      2. 중국 약 18조 달러
      3. 독일 약 4조 달러
 */
const convertPlainTextTableBlocksToGfm = (text: string): string => {
  const lines = text.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 후보 헤더: 숫자로 시작하지 않음, 리스트/제목/마크다운 표 행(|…) 아님
    const couldBeHeader =
      trimmed.length > 0 &&
      !/^\d+[.)]?\s/.test(trimmed) &&
      !/^[-*+]\s/.test(trimmed) &&
      !/^#{1,6}\s/.test(trimmed) &&
      !trimmed.startsWith('|')

    if (couldBeHeader && i + 1 < lines.length) {
      const rows: [string, string, string][] = []
      let j = i + 1
      while (j < lines.length) {
        const parsed = parseThreeColumnDataLine(lines[j])
        if (!parsed) break
        rows.push(parsed)
        j++
      }
      // 최소 2개 데이터 행이 있을 때만 표로 간주 (오탐 줄임)
      if (rows.length >= 2) {
        const [h1, h2, h3] = splitHeaderThree(trimmed)
        out.push(buildGfmPipeTable([h1, h2, h3], rows))
        i = j
        continue
      }
    }

    out.push(line)
    i++
  }

  return out.join('\n')
}

/**
 * 채팅/지식창고 답변 본문(마크다운)을 화면 표시용 HTML로 변환
 * - 파이프 없는 "텍스트 표"는 GFM 표로 정규화 후 marked 파싱
 * - DOMPurify로 XSS 방지 (v-html 전제)
 */
export const toHtmlContent = (value: string) => {
  // 줄바꿈 정규화
  const normalized = value.replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
  if (!normalized.trim()) return ''

  // 파이프 없는 "텍스트 표"는 GFM 표로 정규화 후 marked 파싱
  const markdown = convertPlainTextTableBlocksToGfm(normalized)

  // DOMPurify로 XSS 방지 (v-html 전제)
  const html = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(html)
}
