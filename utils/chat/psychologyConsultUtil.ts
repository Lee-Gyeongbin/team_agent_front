// ============================================================
// 산업심리 상담 에이전트 (AG000010) 전용 설문 유틸
// - 모든 문항 데이터, 타입, 반응형 상태, 비즈니스 로직을 여기서 관리
// - useChatStore 에서는 import 후 호출만 수행
// ============================================================

import { useApi } from '~/composables/com/useApi'
import type { ChatMessage } from '~/types/chat'
import type { StressLevel, StressScoreItem } from '~/types/stress'
import type {
  PsychologySurveyQuestion,
  PsychologySurveyCategory,
  PsychologySurveyScoreOption,
} from '~/types/psychology-consult'

export type { PsychologySurveyQuestion, PsychologySurveyCategory, PsychologySurveyScoreOption }

export const PSYCHOLOGY_SURVEY_CATEGORIES: PsychologySurveyCategory[] = [
  {
    no: 1,
    title: '직무 요구 및 통제',
    titleEn: 'Job Demand & Control',
    questions: [
      { no: 1, text: '업무량이 과다하여 정해진 시간 내에 끝내기 어렵다.', categoryNo: 1 },
      { no: 2, text: '업무 수행 과정에서 나에게 주어진 결정권이나 권한이 거의 없다.', categoryNo: 1 },
      { no: 3, text: '여러 가지 일을 동시에 수행해야 하거나 업무 중단이 잦아 집중하기 어렵다.', categoryNo: 1 },
      { no: 4, text: '내 업무가 회사 전체에서 어떤 기여를 하는지 불명확하고 역할이 모호하다.', categoryNo: 1 },
    ],
  },
  {
    no: 2,
    title: '직무 소진 및 정서적 고갈',
    titleEn: 'Burnout & Exhaustion',
    questions: [
      { no: 5, text: '퇴근할 때쯤이면 업무로 인해 에너지가 완전히 고갈된 느낌이다.', categoryNo: 2 },
      { no: 6, text: '업무에 대해 냉소적으로 변했으며, 일의 의미를 찾기 어렵다.', categoryNo: 2 },
      { no: 7, text: '아침에 출근할 생각을 하면 가슴이 답답하거나 심리적 압박감을 느낀다.', categoryNo: 2 },
      { no: 8, text: '예전보다 업무 성취감이 현저히 떨어지고, 실수가 잦아졌다.', categoryNo: 2 },
    ],
  },
  {
    no: 3,
    title: '관계 및 조직 체계',
    titleEn: 'Interpersonal & System',
    questions: [
      { no: 9, text: '직장 내 상사나 동료로부터 적절한 지지나 도움을 받지 못하고 있다.', categoryNo: 3 },
      { no: 10, text: '조직 내 의사결정 과정이 불투명하고 공정하지 않다고 느낀다.', categoryNo: 3 },
      { no: 11, text: '업무 성과에 비해 적절한 보상(금전적, 심리적)이 이루어지지 않고 있다.', categoryNo: 3 },
      { no: 12, text: '부서 간의 협조가 원활하지 않아 불필요한 마찰이 잦다.', categoryNo: 3 },
    ],
  },
  {
    no: 4,
    title: '신체화 증상 및 인지 기능',
    titleEn: 'Somatization & Cognitive',
    questions: [
      { no: 13, text: '스트레스로 인해 뒷목이 뻣뻣하거나 소화기 장애 등 신체 증상이 나타난다.', categoryNo: 4 },
      { no: 14, text: '사소한 일에도 감정 조절이 어렵고 분노나 불안을 자주 느낀다.', categoryNo: 4 },
      { no: 15, text: '업무와 관련된 정보를 기억하거나 복잡한 판단을 내리는 능력이 저하되었다.', categoryNo: 4 },
    ],
  },
  {
    no: 5,
    title: '회복력 / 개인 자원',
    titleEn: 'Resilience',
    questions: [
      { no: 16, text: '나는 업무 스트레스를 스스로 해소할 수 있는 방법을 가지고 있다.', categoryNo: 5 },
      { no: 17, text: '힘든 상황에서도 비교적 빠르게 심리적 균형을 회복하는 편이다.', categoryNo: 5 },
    ],
  },
  {
    no: 6,
    title: '워라밸 / 경계',
    titleEn: 'Work-Life Boundary',
    questions: [
      { no: 18, text: '퇴근 후에도 업무 생각이나 걱정이 머릿속에서 계속 이어진다.', categoryNo: 6 },
      { no: 19, text: '업무로 인해 개인 시간(휴식, 가족, 취미)이 충분히 보장되지 않는다.', categoryNo: 6 },
    ],
  },
  {
    no: 7,
    title: '심리적 안전감',
    titleEn: 'Psychological Safety',
    questions: [
      { no: 20, text: '조직 내에서 내 의견을 자유롭게 말하기 어렵다.', categoryNo: 7 },
      { no: 21, text: '실수했을 때 비난이나 불이익을 받을까 봐 걱정된다.', categoryNo: 7 },
    ],
  },
  {
    no: 8,
    title: '일의 의미 / 동기',
    titleEn: 'Meaning & Motivation',
    questions: [
      { no: 22, text: '현재 하는 일이 개인적으로 의미 있다고 느낀다.', categoryNo: 8 },
      { no: 23, text: '일을 통해 성장하고 있다는 느낌이 있다.', categoryNo: 8 },
      { no: 24, text: '현재 업무는 나의 역량이나 적성과 잘 맞지 않는다.', categoryNo: 8 },
      { no: 25, text: '현재 직장에서의 미래가 불확실하게 느껴진다.', categoryNo: 8 },
    ],
  },
]

export const PSYCHOLOGY_SURVEY_SCORE_OPTIONS: PsychologySurveyScoreOption[] = [
  { value: 1, label: '전혀 아니다' },
  { value: 2, label: '아니다' },
  { value: 3, label: '그렇다' },
  { value: 4, label: '매우 그렇다' },
]

export const PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS = 25

// ============================================================
// 진단 프롬프트 빌더
// ============================================================

/**
 * 사용자의 응답(answers)을 채워 LLM에 전송할 진단 프롬프트 문자열을 반환
 * # Input Data 섹션만 동적으로 생성하고 나머지는 고정 템플릿 사용
 */
export const buildDiagnosticPrompt = (answers: Record<number, number>): string => {
  const inputDataJson =
    '{\n' +
    Array.from({ length: PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS }, (_, i) => {
      const no = i + 1
      return ` "Q${no}": ${answers[no] ?? 1}`
    }).join(',\n') +
    '\n}'

  return `# Role
당신은 기업 구성원의 심리적 웰빙을 책임지는 '전문 산업심리 상담사 및 멘탈 웰니스 코치'입니다. 
사용자가 작성한 직무 스트레스 진단(IS-MSI) 결과를 분석하여, 따뜻한 공감과 함께 실질적인 정신 건강 가이드를 제공하는 것이 당신의 임무입니다.
모든 답변은 **한국어**로 작성하세요. (곡명·아티스트명·이미지 키워드는 영어 허용)

# Scale
1: 전혀 아니다 / 2: 아니다 / 3: 그렇다 / 4: 매우 그렇다

# 문항 구조
A. 직무 요구
Q1 과도한 업무 / Q2 권한 부족 / Q3 멀티태스킹 / Q4 역할 모호

B. 번아웃
Q5 에너지 고갈 / Q6 냉소 / Q7 출근 압박 / Q8 성취감 저하

C. 조직/관계
Q9 지원 부족 / Q10 불공정 / Q11 보상 불만 / Q12 협업 문제

D. 신체/인지
Q13 신체화 / Q14 감정조절 어려움 / Q15 인지 저하

E. 회복력
Q16 스트레스 해소능력 / Q17 회복속도

F. 워라밸
Q18 업무침투 / Q19 개인시간 부족

G. 심리적 안전감
Q20 의견 표현 어려움 / Q21 실수 두려움

H. 의미/동기
Q22 일의 의미 / Q23 성장감 / Q24 적성 불일치 / Q25 미래 불안

# Input Data
${inputDataJson}

# Reverse Scoring
Q16, Q17, Q22, Q23 역코딩 후 계산
(1점→4점, 2점→3점, 3점→2점, 4점→1점)

# Scoring Rule
모든 평균 = 역코딩 적용 후 계산
High Risk 판단 = 원점수 기준

# Risk Level
1.00~1.59 안정
1.60~2.29 관심
2.30~2.99 주의
3.00~4.00 고위험

# High Risk Flag (4점)
Q7 출근압박 / Q13 신체화 / Q14 감정 / Q15 인지 / Q18 워라밸 / Q21 위축
2개 이상 → 주의군
3개 이상 → 고위험군

# Stress Type
업무과중: Q1,Q3 ≥3
번아웃: B≥3
관계: Q9 or Q12 ≥3
조직불신: Q10 or Q11 ≥3
신체화: Q13≥3 & (Q14 or Q15≥3)
워라밸붕괴: Q18,Q19 ≥3
저회복력: (E 역코딩) ≥2.8
의미상실: H ≥2.8

# Priority
최고 점수 영역 = 핵심 원인
동률 시: 번아웃 > 신체/인지 > 워라밸 > 안전감 > 직무요구

# Output Format
각 섹션 사이에는 반드시 --- 구분선을 삽입하세요.

### 1. 현재 상태 요약
위험군 뱃지와 상태 설명을 아래 HTML 형식으로 출력하세요.
반드시 두 줄만 출력하며, 두 줄 사이에 빈 줄·공백·들여쓰기를 절대 넣지 마세요.
첫째 줄: 위험군 뱃지 span 태그 하나만
둘째 줄: 상태 설명 span 태그 하나만

출력 예시 (risk level에 맞는 클래스 하나 선택):

안정군인 경우:
<span class="risk-badge risk-safe">안정군</span>
<span class="risk-status risk-status--safe">{설명}</span>

관심군인 경우:
<span class="risk-badge risk-caution">관심군</span>
<span class="risk-status risk-status--caution">{설명}</span>

주의군인 경우:
<span class="risk-badge risk-warning">주의군</span>
<span class="risk-status risk-status--warning">{설명}</span>

고위험군인 경우:
<span class="risk-badge risk-danger">고위험군</span>
<span class="risk-status risk-status--danger">{설명}</span>

⚠️ 두 span 태그 사이에 빈 줄이나 들여쓰기를 넣으면 안 됩니다. 반드시 연속된 두 줄로만 출력하세요.

---

### 2. 핵심 원인
(상위 1~2개 영역 + 증상 중심 설명 — 문항 번호·점수 언급 없이 경험 내용만 서술)

---

### 3. 심리 상태
정서 / 인지 / 행동
섹션 3 본문을 모두 작성한 뒤, 반드시 아래 마커를 단독으로 한 줄 출력하세요 (들여쓰기·공백 없이):
[방사형그래프]

---

### 4. 스트레스 유형

---

### 5. 맞춤 처방 (회복을 위한 작은 가이드)
#### ① 지금 가장 먼저 해보면 좋은 것 (1~2개)
→ 가장 효과적인 행동 1개는 반드시 포함
#### ② 생각을 조금 가볍게 바꾸는 방법 (2~3개)
→ 해석/관점 전환 중심
#### ③ 일상에서 바로 실천해볼 수 있는 것들 (2~3개)
→ 업무/생활 행동
#### ④ 몸과 마음을 편안하게 만드는 방법 (2~3개)
→ 신체 + 감정 안정

---

### 6. 심리 안정 음악 (반드시 포함)
현재 심리 상태에 맞는 음악 3곡을 아래 형식으로 빠짐없이 출력하세요.

출력 형식:
[번호]. 곡명 - 아티스트
   이유: {지금 이 사람에게 왜 이 곡이 도움이 되는지 1~2문장}

---

### 7. 회복에 도움이 되는 이미지 (반드시 포함)
현재 사용자의 심리 상태에 맞는 이미지 키워드 4개를 아래 형식으로 출력하세요.

출력 형식:
[번호]. 이미지키워드: {영어-키워드-하이픈연결}

예시:
1. 이미지키워드: peaceful-forest-path

---

<h3>{현재 심리 상태에 맞는 한 줄 응원 메시지.}</h3>

# Constraints (반드시 준수)
- **출력 언어: 모든 본문은 한국어로 작성하세요. 단, 곡명·아티스트명·이미지 키워드는 영어 허용. 아랍어·중국어 등 그 외 언어는 절대 포함하지 마세요.**
- 의료 진단 금지 (대신 심각할 경우 전문의 상담을 권고)
- 약물처방 금지
- 과도한 긍정 금지
- 비난 금지
- "열심히" 금지, "잠시 멈춰도 괜찮다"는 허용의 메시지 전달
- 점수의 계산방법(점수체계, 역코딩 등)은 설명하지 마세요.
- 섹션 3 본문 마지막에 반드시 [방사형그래프] 한 줄만 출력하세요 (생략 불가, 다른 텍스트 혼입 금지).
- 문항 번호(Q1, Q5~Q8 등) 및 점수 수치를 답변에 절대 노출하지 마세요. 대신 해당 문항이 나타내는 경험(에너지 고갈, 냉소 등)을 자연스러운 문장으로 서술하세요.

# Markdown Format Rules (절대 준수 — 예외 없음)
답변 작성 시 마크다운 형식을 다음과 같이 통일하세요:
- 섹션 제목(1~7번): Output Format의 ### 헤딩 구조를 그대로 사용
- 마지막 응원 메시지: 헤딩·레이블 없이 <h3> 태그 한 줄만 출력
- 소제목: #### 헤딩 사용
- 강조 텍스트: **볼드** 사용 (소제목 대용 금지)
- 본문 내 일반 목록에서 숫자를 헤딩 대용으로 사용하지 마세요
- 각 섹션 사이 --- 구분선 반드시 유지

# Tone
- 공감 중심
- 따듯하고 친근한 말투
- 현실적
- 행동 유도
- 고위험군 → 위트 제거`
}

// ============================================================
// 설문 메시지 생성 헬퍼
// ============================================================

/**
 * 진단 프롬프트 문자열에서 Q1~Q25 응답값을 파싱
 * - buildDiagnosticPrompt가 생성한 # Input Data 섹션 JSON을 파싱
 * - 파싱 실패 시 빈 객체 반환
 */
export const parseSurveyAnswersFromPrompt = (promptText: string): Record<number, number> => {
  try {
    const match = promptText.match(/# Input Data\s*\n(\{[\s\S]*?\})/)
    if (!match) return {}
    const json = JSON.parse(match[1]) as Record<string, unknown>
    const answers: Record<number, number> = {}
    for (let i = 1; i <= PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS; i++) {
      const val = json[`Q${i}`]
      if (typeof val === 'number' && val >= 1 && val <= 4) {
        answers[i] = val
      }
    }
    return answers
  } catch {
    return {}
  }
}

/** 채팅 메시지 목록에 인라인으로 삽입할 설문 메시지 객체 생성 */
export const createSurveyMessage = (answers: Record<number, number>, submitted: boolean): ChatMessage => ({
  logId: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'survey',
  createdAt: new Date().toISOString(),
  agentId: 'AG000010',
  surveyAnswers: { ...answers },
  surveySubmitted: submitted,
})

// ============================================================
// LLM 응답 파싱: 회복 이미지 키워드 섹션
// ============================================================

/** ← 여기에 Pexels API 키 입력 (https://www.pexels.com/api/) */
const PEXELS_API_KEY = 'ZfMCftGUUwMVyRLpkijpkbMfC0AXC22TUNzTv5USRoeXItGM8S2m22Dx'

/**
 * Pexels 이미지들을 바둑판식 그리드 HTML로 조립
 * - 1개: 단일 이미지
 * - 2개+: 왼쪽 floor(n/2)개, 오른쪽 ceil(n/2)개로 균등 분할 (각 col 내부는 세로 스택)
 *   예) 3개→1/2, 4개→2/2, 5개→2/3
 */
const buildPexelsGrid = (images: { keyword: string; url: string; fullUrl: string }[]): string => {
  const imgTag = (img: { keyword: string; url: string; fullUrl: string }) =>
    `<img class="pexels-img" src="${img.url}" data-full="${img.fullUrl}" alt="${img.keyword}">`

  if (images.length === 1) {
    return `<div class="pexels-grid pexels-grid--single">${imgTag(images[0])}</div>`
  }

  const leftCount = Math.floor(images.length / 2)
  const leftCol = images.slice(0, leftCount).map(imgTag).join('')
  const rightCol = images.slice(leftCount).map(imgTag).join('')
  return `<div class="pexels-grid"><div class="pexels-grid__col">${leftCol}</div><div class="pexels-grid__col">${rightCol}</div></div>`
}

/**
 * LLM 응답 텍스트에서 "키워드:" 패턴을 찾아 Pexels API로 이미지 URL을 조회
 *
 * 처리하는 형식:
 *   키워드: peaceful-forest-path          (일반)
 *   1. 키워드: peaceful-forest-path       (번호 목록)
 *   **키워드:** peaceful-forest-path      (볼드 레이블)
 *
 * @returns beforeText  키워드 블록 이전 마크다운 텍스트
 * @returns afterText   키워드 블록 이후 마크다운 텍스트
 * @returns gridHtml    그리드 이미지 HTML (marked를 거치지 않고 두 텍스트 사이에 삽입)
 *
 * - 스트리밍 완료 후 1회만 호출
 * - Pexels API 실패한 키워드는 제외, 성공한 것만 그리드에 포함
 * - 키워드 미발견 시 beforeText=answer, afterText='', gridHtml='' 반환
 */

/** 키워드 패턴 (removeKeywordLines / extractKeywordSection / fetch 공용) */
const KEYWORD_REGEX =
  /^[\s\-•*]*(?:\d+[.)]\s*)?\*{0,2}이미지키워드\*{0,2}\s*:?\s*\*{0,2}\s*([a-zA-Z][a-zA-Z0-9-]*)\s*\*{0,2}\s*$/gmu

/**
 * 스트리밍 중 키워드 라인 즉시 제거 — 텍스트 날것 노출 및 높이 번쩍임 방지
 * 완성된 라인뿐 아니라 스트리밍 중인 **불완전 라인**도 제거 (`[^\n\r]*` 로 줄 끝까지 삭제)
 * 예) "1. 이미지키워드: quiet-" (미완성) → 즉시 제거
 */
export const removeKeywordLines = (answer: string): string =>
  answer.replace(/^[\s\-•*]*(?:\d+[.)]\s*)?\*{0,2}이미지키워드\*{0,2}[^\n\r]*/gmu, '')

/**
 * 키워드 섹션의 앞/뒤 텍스트를 동기적으로 추출
 * 스트리밍 완료 직후 즉시 before+로딩스피너+after 렌더링에 사용
 */
export const extractKeywordSection = (answer: string): { beforeText: string; afterText: string } => {
  const matches = [...answer.matchAll(new RegExp(KEYWORD_REGEX.source, KEYWORD_REGEX.flags))]
  if (!matches.length) return { beforeText: answer, afterText: '' }

  const firstStart = matches[0].index ?? 0
  const lastEnd = (matches[matches.length - 1].index ?? 0) + matches[matches.length - 1][0].length

  return { beforeText: answer.substring(0, firstStart), afterText: answer.substring(lastEnd) }
}

/** Pexels 이미지 로딩 중 표시할 스피너 HTML (v-html 삽입용) */
export const PEXELS_LOADING_HTML = '<div class="pexels-loading"><div class="pexels-loading__spinner"></div></div>'

export const fetchAndInjectPexelsImages = async (
  answer: string,
  logId?: string,
): Promise<{ beforeText: string; afterText: string; gridHtml: string }> => {
  // logId가 있으면 캐시 먼저 확인 — API 재호출 없이 즉시 반환
  if (logId) {
    const cached = getPexelsImageCache(logId)
    if (cached) return cached
  }

  const matches = [...answer.matchAll(new RegExp(KEYWORD_REGEX.source, KEYWORD_REGEX.flags))]
  if (!matches.length) return { beforeText: answer, afterText: '', gridHtml: '' }

  // 첫 번째 키워드 시작 ~ 마지막 키워드 끝 범위를 그리드로 대체 (위치 보존)
  const firstMatchStart = matches[0].index ?? 0
  const lastMatch = matches[matches.length - 1]
  const lastMatchEnd = (lastMatch.index ?? 0) + lastMatch[0].length

  const beforeText = answer.substring(0, firstMatchStart)
  const afterText = answer.substring(lastMatchEnd)

  const imageResults = await Promise.all(
    matches.map(async (m) => {
      const [, keyword] = m
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`, {
          headers: { Authorization: PEXELS_API_KEY },
        })
        const data = (await res.json()) as { photos?: { src?: { large?: string; large2x?: string } }[] }
        return {
          keyword,
          url: data.photos?.[0]?.src?.large ?? null,
          fullUrl: data.photos?.[0]?.src?.large2x ?? data.photos?.[0]?.src?.large ?? null,
        }
      } catch {
        return { keyword, url: null, fullUrl: null }
      }
    }),
  )

  const validImages = imageResults.filter(
    (img): img is { keyword: string; url: string; fullUrl: string } => img.url !== null,
  )

  if (!validImages.length) {
    const emptyResult = { beforeText, afterText, gridHtml: '' }
    if (logId) setPexelsImageCache(logId, emptyResult)
    return emptyResult
  }

  // DOM 교체 전에 모든 이미지를 브라우저 캐시에 미리 적재
  // → renderedHtml 갱신 시점에 이미지가 이미 캐시에 있어 레이아웃 재계산 없이 한 번에 렌더링됨
  await Promise.all(
    validImages.map(
      ({ url }) =>
        new Promise<void>((resolve) => {
          const el = new window.Image()
          el.onload = () => resolve()
          el.onerror = () => resolve()
          el.src = url
        }),
    ),
  )

  const result = { beforeText, afterText, gridHtml: buildPexelsGrid(validImages) }
  if (logId) setPexelsImageCache(logId, result)
  return result
}

// ============================================================
// 방사형 차트 데이터 타입
// - LLM JSON 응답을 파싱한 결과 — 차트 컴포넌트에 주입하는 단일 DTO
// ============================================================

/** 방사형 차트용 8개 영역 점수 (1~4 척도 → 0~100 선형 환산, LLM·백엔드 응답 키는 영어 camelCase) */
export type RadarChartScore = {
  jobDemands: number
  burnout: number
  organizationalRelations: number
  physicalCognition: number
  resilience: number
  workLifeBalance: number
  psychologicalSafety: number
  meaningMotivation: number
}

export type RadarChartRiskLevel = '안정' | '관심' | '주의' | '고위험'

/** LLM JSON 응답 → 차트 컴포넌트 주입 DTO */
export type RadarChartData = {
  /** 8개 영역별 평균 점수 (역코딩 적용 후 1.0~4.0 → 0~100 환산, 키는 영어) */
  scores: RadarChartScore
  /** 위험군 레이블 */
  riskLevel: RadarChartRiskLevel
  /** 위험군 주색 hex (예: #f59e0b 주의) */
  riskColor: string
  /** 위험군 배경색 hex (예: #fffbeb 주의 배경) */
  riskBgColor: string
  /** 위험 수준 한 줄 설명 */
  riskSummary: string
  /** 핵심 원인 한 줄 (가장 높은 영역 1~2개 중심) */
  coreAreasSummary: string
}

/** 방사형 차트 scores 키 표시 순서 (JSON 영어 키 → UI 한글 라벨) */
export const PSYCHOLOGY_RADAR_SCORE_KEYS: readonly (keyof RadarChartScore)[] = [
  'jobDemands',
  'burnout',
  'organizationalRelations',
  'physicalCognition',
  'resilience',
  'workLifeBalance',
  'psychologicalSafety',
  'meaningMotivation',
] as const

/** scores 영어 키 → 그리드/차트 축 한글명 */
export const PSYCHOLOGY_RADAR_LABEL_KO: Record<keyof RadarChartScore, string> = {
  jobDemands: '직무요구',
  burnout: '번아웃',
  organizationalRelations: '조직관계',
  physicalCognition: '신체인지',
  resilience: '회복력',
  workLifeBalance: '워라밸',
  psychologicalSafety: '심리안전감',
  meaningMotivation: '의미동기',
}

/** 구 응답(한글 키) 호환 */
const LEGACY_RADAR_SCORE_KO_TO_EN: Record<string, keyof RadarChartScore> = {
  직무요구: 'jobDemands',
  번아웃: 'burnout',
  조직관계: 'organizationalRelations',
  신체인지: 'physicalCognition',
  회복력: 'resilience',
  워라밸: 'workLifeBalance',
  심리안전감: 'psychologicalSafety',
  의미동기: 'meaningMotivation',
}

const coerceRadarScoreNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * 0~100 환산 점수 → 항목별 등급 (내부적으로 1~4 척도 구간과 동일: x = 1 + score/100*3)
 */
export const stressLevelFromPsychologyRadarScore100 = (score: number): StressLevel => {
  const x = 1 + (score / 100) * 3
  if (x <= 1.59) return '안정'
  if (x <= 2.29) return '관심'
  if (x <= 2.99) return '주의'
  return '고위험'
}

/** RadarChartData → StressScoreGrid props.items */
export const buildStressItemsFromRadarChartData = (data: RadarChartData): StressScoreItem[] => {
  return PSYCHOLOGY_RADAR_SCORE_KEYS.map((key) => {
    const raw = data.scores[key]
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
    return {
      name: PSYCHOLOGY_RADAR_LABEL_KO[key],
      value,
      level: stressLevelFromPsychologyRadarScore100(value),
    }
  })
}

/**
 * guide/ui-chart.vue 의 radarStressConfig 와 동일 형태 — max 0~100, riskColor 로 라인 색
 */
export const buildPsychologyRadarUiChartConfig = (data: RadarChartData): Record<string, unknown> => {
  const items = buildStressItemsFromRadarChartData(data)
  return {
    categories: items.map((i) => i.name),
    data: items.map((i) => i.value),
    color: data.riskColor || '#ef4444',
    maxValue: 100,
    stepSize: 20,
    fillOpacity: 0.25,
    pointLabelFormat: (name: string, value: number) =>
      `${name} (${typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : String(value)})`,
  }
}

function normalizeRadarChartData(raw: Record<string, unknown>): RadarChartData | null {
  const scoresRaw = raw.scores
  if (!scoresRaw || typeof scoresRaw !== 'object') return null
  const obj = scoresRaw as Record<string, unknown>
  const scores: Partial<RadarChartScore> = {}

  for (const key of PSYCHOLOGY_RADAR_SCORE_KEYS) {
    const n = coerceRadarScoreNumber(obj[key])
    if (n != null) scores[key] = n
  }
  for (const [ko, en] of Object.entries(LEGACY_RADAR_SCORE_KO_TO_EN)) {
    if (scores[en] != null) continue
    const n = coerceRadarScoreNumber(obj[ko])
    if (n != null) scores[en] = n
  }
  if (PSYCHOLOGY_RADAR_SCORE_KEYS.some((k) => scores[k] == null)) return null

  const rl = raw.riskLevel
  const riskLevel: RadarChartRiskLevel =
    rl === '안정' || rl === '관심' || rl === '주의' || rl === '고위험' ? rl : '관심'

  return {
    scores: scores as RadarChartScore,
    riskLevel,
    riskColor: typeof raw.riskColor === 'string' ? raw.riskColor : '#3b82f6',
    riskBgColor: typeof raw.riskBgColor === 'string' ? raw.riskBgColor : '#eff6ff',
    riskSummary: typeof raw.riskSummary === 'string' ? raw.riskSummary : '',
    coreAreasSummary: typeof raw.coreAreasSummary === 'string' ? raw.coreAreasSummary : '',
  }
}

// ============================================================
// 인메모리 캐시 (logId 기반, 탭 이동 시 재호출 방지)
// - Pexels 이미지 그리드: pexelsImageCache
// - 방사형 차트 데이터: radarChartCache
// - 페이지 새로고침 시 초기화되는 것은 허용
// ============================================================

type PexelsCacheEntry = { beforeText: string; afterText: string; gridHtml: string }
const pexelsImageCache = new Map<string, PexelsCacheEntry>()

/** logId에 대한 캐시된 Pexels 이미지 그리드 반환 (없으면 null) */
export const getPexelsImageCache = (logId: string): PexelsCacheEntry | null => pexelsImageCache.get(logId) ?? null

/** logId에 대해 Pexels 이미지 그리드 결과를 캐시에 저장 */
export const setPexelsImageCache = (logId: string, entry: PexelsCacheEntry): void => {
  pexelsImageCache.set(logId, entry)
}

const radarChartCache = new Map<string, RadarChartData>()

/** logId에 대한 캐시된 방사형 차트 데이터 반환 (없으면 null) */
export const getRadarChartCache = (logId: string): RadarChartData | null => radarChartCache.get(logId) ?? null

/** logId에 대해 방사형 차트 데이터를 캐시에 저장 */
export const setRadarChartCache = (logId: string, data: RadarChartData): void => {
  radarChartCache.set(logId, data)
}

// ============================================================
// [방사형그래프] 마커 파싱 — Pexels 키워드 패턴과 동일한 방식
// ============================================================

/** 섹션3 끝에 LLM이 출력하는 고정 마커 패턴 */
const AI_IMAGE_MARKER_REGEX = /^\[방사형그래프\]\s*$/mu

/** AI 이미지 로딩 스피너 HTML — 마커 위치에 즉시 주입 (pexels-loading 재사용) */
export const AI_IMAGE_LOADING_HTML = '<div class="pexels-loading"><div class="pexels-loading__spinner"></div></div>'

/**
 * LLM 응답에서 [방사형그래프] 마커를 찾아 앞/뒤 텍스트 분리
 * - found: true  → before: 섹션1~3, after: 섹션4~7
 * - found: false → before: 전체 응답, after: ''
 */
export const extractAiImageMarkerSection = (answer: string): { before: string; after: string; found: boolean } => {
  const match = answer.match(AI_IMAGE_MARKER_REGEX)
  if (!match || match.index == null) return { before: answer, after: '', found: false }
  return {
    before: answer.substring(0, match.index),
    after: answer.substring(match.index + match[0].length),
    found: true,
  }
}

// ============================================================
// 섹션 1~4 기반 방사형 차트 JSON 데이터 요청 (백엔드 API 연동)
// - Pexels 이미지(섹션 7 키워드) 와는 완전히 별개 기능
// - 섹션 1~4 응답 텍스트 + 설문 답변 → JSON 수신 → 차트 컴포넌트 주입
// ============================================================

/**
 * LLM 응답에서 섹션 1(현재 상태 요약) ~ 4(스트레스 유형) 텍스트만 추출
 * 백엔드 이미지 생성 API의 프롬프트로 사용
 */
export const extractSections1to4 = (answer: string): string => {
  const section5Match = answer.match(/^###\s*5\./m)
  if (!section5Match?.index) return answer.slice(0, 2000)
  return answer.substring(0, section5Match.index).trim()
}

/** 역코딩 대상 문항 번호 (1→4, 2→3, 3→2, 4→1) */
const REVERSE_SCORE_QNO = new Set([16, 17, 22, 23])

/** 역코딩 변환 */
const applyReverse = (score: number): number => 5 - score

/** 카테고리 문항 번호 목록 (역코딩 적용 포함) → 소수점 2자리 평균 문자열 반환 */
const calcCategoryAvg = (qNos: number[], answers: Record<number, number>): string => {
  const scores = qNos.map((no) => {
    const raw = answers[no] ?? 2
    return REVERSE_SCORE_QNO.has(no) ? applyReverse(raw) : raw
  })
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return avg.toFixed(2)
}

/** 1~4 평균(소수 둘째 자리 문자열) → scores와 동일 공식의 0~100 환산 문자열 */
const radarScore100FromAvg14 = (avgFixed2: string): string => {
  const x = Number(avgFixed2)
  if (!Number.isFinite(x)) return '0.00'
  return (((x - 1) / 3) * 100).toFixed(2)
}

/**
 * 프롬프트 내 「동일 구간을 0~100으로 나타내면」표와 동일 경계 (844~847행)
 * - coreAreasSummary 단계 표기·예시 생성에 사용
 */
const stressTierFromScore100Bands = (score100: number): RadarChartRiskLevel => {
  if (score100 <= 19.67) return '안정'
  if (score100 <= 43.0) return '관심'
  if (score100 <= 66.33) return '주의'
  return '고위험'
}

/** LLM 응답 텍스트에서 위험군 클래스명을 읽어 색상 매핑 — SCSS .risk-safe/caution/warning/danger 및 $color-* 디자인 토큰과 동일 */
const resolveRiskColorsFromResponse = (sectionsText: string): { riskBg: string; riskColor: string } => {
  const match = sectionsText.match(/class="risk-badge\s+(risk-\w+)"/)
  const cls = match?.[1] ?? ''
  if (cls === 'risk-safe') return { riskBg: '#ecfdf5', riskColor: '#22c55e' }
  if (cls === 'risk-caution') return { riskBg: '#eff6ff', riskColor: '#3b82f6' }
  if (cls === 'risk-warning') return { riskBg: '#fffbeb', riskColor: '#f59e0b' }
  if (cls === 'risk-danger') return { riskBg: '#fef2f2', riskColor: '#ef4444' }
  return { riskBg: '#ffffff', riskColor: '#ef4444' }
}

/** risk-badge 클래스 → 방사형 JSON riskLevel */
const RISK_BADGE_CLASS_TO_LEVEL: Record<string, RadarChartRiskLevel> = {
  'risk-safe': '안정',
  'risk-caution': '관심',
  'risk-warning': '주의',
  'risk-danger': '고위험',
}

/**
 * 진단 분석 섹션 1(현재 상태 요약) HTML에서 위험군·색·상태 설명 추출
 * - 1차 LLM이 판정한 위험군과 방사형 JSON을 맞추기 위함 (8영역 MAX 재계산 불일치 방지)
 */
const parseSection1ForRadarChart = (
  sectionsText: string,
): { riskLevel: RadarChartRiskLevel; riskColor: string; riskBgColor: string; riskSummary: string } | null => {
  const badgeMatch = sectionsText.match(
    /<span class="risk-badge\s+(risk-(?:safe|caution|warning|danger))">([^<]*)<\/span>/,
  )
  if (!badgeMatch?.[1]) return null
  const badgeClass = badgeMatch[1]
  const riskLevel = RISK_BADGE_CLASS_TO_LEVEL[badgeClass]
  if (!riskLevel) return null
  const { riskColor, riskBg: riskBgColor } = resolveRiskColorsFromResponse(`class="risk-badge ${badgeClass}"`)
  const statusMatch = sectionsText.match(/<span class="risk-status\s+[^"]+">([\s\S]*?)<\/span>/)
  const riskSummary = (statusMatch?.[1] ?? '').replace(/<[^>]+>/g, '').trim()
  return { riskLevel, riskColor, riskBgColor, riskSummary }
}

/**
 * Q1~Q25 응답값으로 방사형 차트 JSON 데이터 요청 프롬프트 빌드
 * - 역코딩 규칙은 buildDiagnosticPrompt 와 동일
 * - sectionsText에 섹션1 HTML(risk-badge/risk-status)이 있으면 riskLevel·색·riskSummary는 해당 값으로 고정 (MAX 재판정 불가)
 * - 섹션1 파싱 실패 시에만 8영역 MAX·구간표로 위험 판정 지시
 * - LLM 은 이미지 생성 없이 JSON 만 반환
 */
const buildRadarChartPrompt = (answers: Record<number, number>, sectionsText: string): string => {
  const 직무요구 = calcCategoryAvg([1, 2, 3, 4], answers)
  const 번아웃 = calcCategoryAvg([5, 6, 7, 8], answers)
  const 조직관계 = calcCategoryAvg([9, 10, 11, 12], answers)
  const 신체인지 = calcCategoryAvg([13, 14, 15], answers)
  const 회복력 = calcCategoryAvg([16, 17], answers)
  const 워라밸 = calcCategoryAvg([18, 19], answers)
  const 심리안전감 = calcCategoryAvg([20, 21], answers)
  const 의미동기 = calcCategoryAvg([22, 23, 24, 25], answers)

  const 직무요구100 = radarScore100FromAvg14(직무요구)
  const 번아웃100 = radarScore100FromAvg14(번아웃)
  const 조직관계100 = radarScore100FromAvg14(조직관계)
  const 신체인지100 = radarScore100FromAvg14(신체인지)
  const 회복력100 = radarScore100FromAvg14(회복력)
  const 워라밸100 = radarScore100FromAvg14(워라밸)
  const 심리안전감100 = radarScore100FromAvg14(심리안전감)
  const 의미동기100 = radarScore100FromAvg14(의미동기)

  const areas100Sorted = [
    { ko: '직무요구', s100: 직무요구100 },
    { ko: '번아웃', s100: 번아웃100 },
    { ko: '조직관계', s100: 조직관계100 },
    { ko: '신체인지', s100: 신체인지100 },
    { ko: '회복력', s100: 회복력100 },
    { ko: '워라밸', s100: 워라밸100 },
    { ko: '심리안전감', s100: 심리안전감100 },
    { ko: '의미동기', s100: 의미동기100 },
  ].sort((a, b) => Number(b.s100) - Number(a.s100))
  const topA = areas100Sorted[0]
  const topB = areas100Sorted[1]
  const coreAreasSummaryExample =
    topA && topB
      ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100Bands(Number(topA.s100))})·${topB.ko}(${topB.s100}, ${stressTierFromScore100Bands(Number(topB.s100))}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
      : topA
        ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100Bands(Number(topA.s100))}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
        : '"(영역명)(0~100값, 안정|관심|주의|고위험) 형식으로 기재"'

  const section1Anchors = parseSection1ForRadarChart(sectionsText)
  const { riskColor } = resolveRiskColorsFromResponse(sectionsText)

  const section1LockBlock = section1Anchors
    ? `
위 진단 분석 본문 중 "### 1. 현재 상태 요약"에 이미 출력된 HTML을 기준으로, 아래 네 값은 **이미 확정된 결과**입니다.
8개 영역 평균의 MAX·구간표로 riskLevel을 **다시 계산하거나 바꾸지 마세요.** JSON 필드에 **글자 단위로 동일하게** 넣으세요.

- riskLevel: ${JSON.stringify(section1Anchors.riskLevel)}
- riskColor: ${JSON.stringify(section1Anchors.riskColor)}
- riskBgColor: ${JSON.stringify(section1Anchors.riskBgColor)}
- riskSummary: ${JSON.stringify(section1Anchors.riskSummary)}
`
    : ''

  const riskJudgementBlock = section1Anchors
    ? `
위험 수준 (riskLevel·riskColor·riskBgColor·riskSummary): 위 「이미 확정된 결과」블록과 **완전히 동일**하게만 출력합니다. 임의 수정·요약 재작성 금지.
`
    : `
위험 수준 판정 (필수): 위 1.0~4.0 척도 8개 영역 평균 중 최댓값(MAX)을 구한 뒤, 아래 「1~4 척도 구간표」만으로 riskLevel·riskColor·riskBgColor를 결정하세요. (scores의 0~100 환산값으로 위험 단계를 판정하지 마세요.)

1~4 척도 구간표 (위험 단계 판정 전용, 디자인 토큰과 동일한 hex):
- 1.00~1.59: 안정  → riskLevel: "안정", riskColor: "#22c55e", riskBgColor: "#ecfdf5" ($color-success 계열)
- 1.60~2.29: 관심  → riskLevel: "관심", riskColor: "#3b82f6", riskBgColor: "#eff6ff" ($color-info 계열)
- 2.30~2.99: 주의  → riskLevel: "주의", riskColor: "#f59e0b", riskBgColor: "#fffbeb" ($color-warning 계열)
- 3.00~4.00: 고위험 → riskLevel: "고위험", riskColor: "#ef4444", riskBgColor: "#fef2f2" ($color-error 계열)
`

  const riskSummaryRule = section1Anchors
    ? '- riskSummary: 위 「이미 확정된 결과」의 riskSummary 문자열과 동일 (공백·줄바꿈 포함 그대로)'
    : '- riskSummary: 현재 위험군을 한 문장으로 설명 (예: "전반적으로 번아웃과 조직관계 영역에서 주의 수준의 스트레스가 감지됩니다.")'

  const riskLevelColorRule = section1Anchors
    ? '- riskLevel / riskColor / riskBgColor: 위 「이미 확정된 결과」블록과 동일 (MAX·구간표로 재판정 금지)'
    : '- riskLevel / riskColor / riskBgColor: 8개 영역 1~4 평균의 최댓값이 속한 「1~4 척도 구간표」에서 선택'

  const coreAreasSummaryRule = `- coreAreasSummary: **scores의 0~100 값**으로 영역 간 상대 크기를 비교해 가장 큰 영역 1~2개를 고릅니다. 각 영역의 단계(안정/관심/주의/고위험)는 반드시 아래 「동일 구간을 0~100으로 나타내면」표(0.00~19.67 안정 … 66.67~100.00 고위험)에 **해당 0~100 점수를 넣어** 판정합니다. 문장·괄호 안에 **1~4 척도 원점수는 쓰지 마세요.** 괄호 안 형식: 한글 영역명(0~100값, 구간표 단계) (예: ${coreAreasSummaryExample})`

  return `[방사형 차트 데이터 요청]
아래 진단 결과를 바탕으로 방사형 차트 컴포넌트에 주입할 데이터를 JSON 형식으로 응답하세요.
마크다운 코드블록(\`\`\`) 없이 순수 JSON 문자열만 출력하세요. 다른 텍스트는 절대 추가하지 마세요.
${section1LockBlock}
영역별 점수 (역코딩 적용, 소수점 2자리, 내부 판정·비교용 1.0~4.0 척도):
- 직무요구: ${직무요구}
- 번아웃: ${번아웃}
- 조직관계: ${조직관계}
- 신체인지: ${신체인지}
- 회복력: ${회복력}
- 워라밸: ${워라밸}
- 심리안전감: ${심리안전감}
- 의미동기: ${의미동기}

영역별 0~100 환산값 (위 공식과 동일하며 JSON scores에 넣을 숫자와 **반드시 일치**해야 함, 소수 둘째 자리):
- 직무요구(jobDemands): ${직무요구100}
- 번아웃(burnout): ${번아웃100}
- 조직관계(organizationalRelations): ${조직관계100}
- 신체인지(physicalCognition): ${신체인지100}
- 회복력(resilience): ${회복력100}
- 워라밸(workLifeBalance): ${워라밸100}
- 심리안전감(psychologicalSafety): ${심리안전감100}
- 의미동기(meaningMotivation): ${의미동기100}

scores 키 매핑 (JSON scores에는 반드시 오른쪽 영어만 사용):
- 직무요구 → jobDemands
- 번아웃 → burnout
- 조직관계 → organizationalRelations
- 신체인지 → physicalCognition
- 회복력 → resilience
- 워라밸 → workLifeBalance
- 심리안전감 → psychologicalSafety
- 의미동기 → meaningMotivation

${section1Anchors ? '' : `현재 판정된 위험군 색상 참고 (진단 분석에서 추출):\n- riskColor: ${riskColor}\n`}

${riskJudgementBlock}
0~100 환산 (scores 필드에만 적용): 각 영역의 1~4 척도 값 x에 대해 ((x - 1) / 3) * 100 을 계산하고 소수점 둘째 자리까지 반올림하여 number로 기재. (예: 1.00→0, 2.50→50, 4.00→100)
동일 구간을 0~100으로 나타내면 (참고·해석용${section1Anchors ? '' : ', 위험 판정은 반드시 MAX의 1~4 값으로 위 표를 따를 것'}):
- 0.00~19.67: 안정에 해당 (1.00~1.59와 동치)
- 20.00~43.00: 관심에 해당 (1.60~2.29와 동치)
- 43.33~66.33: 주의에 해당 (2.30~2.99와 동치)
- 66.67~100.00: 고위험에 해당 (3.00~4.00와 동치)

응답 JSON 스키마 (키 이름·타입 정확히 준수):
{
  "scores": {
    "jobDemands": number,
    "burnout": number,
    "organizationalRelations": number,
    "physicalCognition": number,
    "resilience": number,
    "workLifeBalance": number,
    "psychologicalSafety": number,
    "meaningMotivation": number
  },
  "riskLevel": "안정" | "관심" | "주의" | "고위험",
  "riskColor": string,
  "riskBgColor": string,
  "riskSummary": string,
  "coreAreasSummary": string
}

필드 작성 규칙:
- scores: 위 「영역별 0~100 환산값」목록과 **동일한 숫자**만 기재 (문자열 금지), 키는 반드시 영어 스키마대로. 재계산·반올림 방식을 바꾸지 마세요.
${riskLevelColorRule}
${riskSummaryRule}
${coreAreasSummaryRule}
`
}

/**
 * 섹션 1~4 텍스트 + Q1~Q25 응답값을 기반으로 방사형 차트 JSON 데이터 요청
 * - 백엔드 엔드포인트: /ai/chatbot/getPsychologyChartData.do (백엔드 연결 시 확인 필요)
 * @param sectionsText 섹션 1~4 LLM 응답 텍스트 (위험군 파싱에 사용)
 * @param answers Q1~Q25 원점수 — 카테고리 평균 계산 및 프롬프트 생성에 필수
 * @returns RadarChartData (차트 컴포넌트 주입용), 실패 시 null
 */
export const fetchPsychologyRadarChartData = async (
  sectionsText: string,
  answers: Record<number, number>,
): Promise<RadarChartData | null> => {
  try {
    const { post } = useApi()
    const prompt = `${sectionsText}\n\n${buildRadarChartPrompt(answers, sectionsText)}`
    // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 (엔드포인트·응답 키 확인 필요)
    const data = await post<{ chartData?: string; result?: string }>('/ai/chatbot/getPsychologyChartData.do', {
      prompt,
    })

    // 백엔드가 JSON 문자열을 chartData 또는 result 키로 반환하는 경우 모두 처리
    const raw = data.chartData ?? data.result ?? null
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeRadarChartData(parsed)
  } catch {
    return null
  }
}

// ============================================================
// 모듈 스코프 반응형 상태 (useChatStore와 동일한 패턴)
// ============================================================
const isSurveyVisible = ref(false)
const surveyAnswers = ref<Record<number, number>>({})

/**
 * 설문 제출을 통해 생성된 채팅방 ID
 * - 해당 방에서는 첫 번째 question 메시지(진단 프롬프트)를 UI에서 숨김
 */
const surveyRoomIds = ref<Set<string>>(new Set())

export const usePsychologySurvey = () => {
  /** 설문 시작: 답변 초기화 후 노출 */
  const openPsychologySurvey = () => {
    surveyAnswers.value = {}
    isSurveyVisible.value = true
  }

  /** 설문 닫기 */
  const closePsychologySurvey = () => {
    isSurveyVisible.value = false
  }

  /** 특정 문항 답변 저장 */
  const setSurveyAnswer = (questionNo: number, score: number) => {
    surveyAnswers.value = { ...surveyAnswers.value, [questionNo]: score }
  }

  /** 현재까지 응답한 문항 수 */
  const answeredCount = computed(() => Object.keys(surveyAnswers.value).length)

  /** 전체 문항 응답 완료 여부 */
  const isSurveyComplete = computed(() => Object.keys(surveyAnswers.value).length === PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS)

  /** 설문 제출 채팅방으로 등록 (질문 메시지 숨김 처리용) */
  const registerSurveyRoom = (roomId: string) => {
    surveyRoomIds.value = new Set([...surveyRoomIds.value, roomId])
  }

  /**
   * 해당 roomId가 설문 제출 채팅방인지 확인
   * - true이면 첫 번째 question 메시지를 렌더링에서 제외
   */
  const isSurveyRoom = (roomId: string) => surveyRoomIds.value.has(roomId)

  return {
    isSurveyVisible,
    surveyAnswers,
    answeredCount,
    isSurveyComplete,
    openPsychologySurvey,
    closePsychologySurvey,
    setSurveyAnswer,
    registerSurveyRoom,
    isSurveyRoom,
  }
}
