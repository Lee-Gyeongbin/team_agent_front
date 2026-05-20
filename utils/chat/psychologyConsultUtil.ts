// ============================================================
// 산업심리 상담 에이전트 (AG000010) 전용 설문 유틸
// - 모든 문항 데이터, 타입, 반응형 상태, 비즈니스 로직을 여기서 관리
// - useChatStore 에서는 import 후 호출만 수행
// ============================================================

import { nextTick } from 'vue'
import { useApi } from '~/composables/com/useApi'
import type { ChatMessage } from '~/types/chat'
import type { StressLevel, StressScoreItem } from '~/types/stress'
import type {
  PsychologySurveyQuestion,
  PsychologySurveyCategory,
  PsychologySurveyScoreOption,
} from '~/types/psychology-consult'

export type { PsychologySurveyQuestion, PsychologySurveyCategory, PsychologySurveyScoreOption }

/** 설문 성별 (KOSS-SF1 참고치 판정 기준) */
export type SurveyGender = 'male' | 'female'

export const PSYCHOLOGY_SURVEY_CATEGORIES: PsychologySurveyCategory[] = [
  {
    no: 1,
    title: '물리적 환경',
    titleEn: 'Physical Environment',
    questions: [
      { no: 1, text: '내 일은 위험하여 사고를 당할 가능성이 있다.', categoryNo: 1 },
      { no: 2, text: '나는 불편한 자세로 오랫동안 일을 해야 한다.', categoryNo: 1 },
    ],
  },
  {
    no: 2,
    title: '직무 요구',
    titleEn: 'Job Demand',
    questions: [
      { no: 3, text: '나는 일이 많아 항상 시간에 쫓기며 일한다.', categoryNo: 2 },
      { no: 4, text: '업무량이 현저하게 증가하였다.', categoryNo: 2 },
      { no: 5, text: '업무 수행 중에 충분한 휴식(짬)이 주어진다.', categoryNo: 2 },
      { no: 6, text: '여러 가지 일을 동시에 해야 한다.', categoryNo: 2 },
    ],
  },
  {
    no: 3,
    title: '직무 자율',
    titleEn: 'Job Autonomy',
    questions: [
      { no: 7, text: '내 업무는 창의력을 필요로 한다.', categoryNo: 3 },
      { no: 8, text: '내 업무를 수행하기 위해서는 높은 수준의 기술이나 지식이 필요하다.', categoryNo: 3 },
      { no: 9, text: '작업시간, 업무 수행 과정에서 내가 스스로 결정할 권한이 주어진다.', categoryNo: 3 },
      { no: 10, text: '나의 업무량과 작업 스케줄을 스스로 조절할 수 있다.', categoryNo: 3 },
    ],
  },
  {
    no: 4,
    title: '관계 갈등',
    titleEn: 'Interpersonal Conflict',
    questions: [
      { no: 11, text: '나의 상사는 업무를 수행하는 데 도움을 준다.', categoryNo: 4 },
      { no: 12, text: '나의 동료는 업무를 수행하는 데 도움을 준다.', categoryNo: 4 },
      { no: 13, text: '직장에서 내가 힘들 때 내가 힘들다는 것을 알아주고 이해해 주는 사람이 있다.', categoryNo: 4 },
    ],
  },
  {
    no: 5,
    title: '직무 불안정',
    titleEn: 'Job Insecurity',
    questions: [
      { no: 14, text: '직장 사정이 불안하여 미래가 불확실하다.', categoryNo: 5 },
      {
        no: 15,
        text: '나의 근무조건이나 상황에 바람직하지 못한 변화(예, 구조조정)가 있었거나 있을 것으로 예상된다.',
        categoryNo: 5,
      },
    ],
  },
  {
    no: 6,
    title: '조직 체계',
    titleEn: 'Organizational System',
    questions: [
      {
        no: 16,
        text: '우리 직장은 근무 평가, 인사제도(예, 승진, 부서 배치) 등의 정책 결정 과정이 공정하고 합리적이다.',
        categoryNo: 6,
      },
      { no: 17, text: '업무 수행에 필요한 인원, 공간, 시설, 장비, 훈련 등의 지원이 이루어지고 있다.', categoryNo: 6 },
      { no: 18, text: '우리 부서와 타 부서 간에는 마찰이 없고 업무 협조가 잘 이루어진다.', categoryNo: 6 },
      { no: 19, text: '업무 수행 과정에 나의 생각을 반영할 수 있는 기회와 통로가 있다.', categoryNo: 6 },
    ],
  },
  {
    no: 7,
    title: '보상 부적절',
    titleEn: 'Inadequate Compensation',
    questions: [
      {
        no: 20,
        text: '내가 쏟는 노력과 업적을 고려할 때, 나는 직장에서 제대로 존중과 신임을 받고 있다.',
        categoryNo: 7,
      },
      { no: 21, text: '내 사정이 앞으로 더 좋아질 것을 생각하면 힘든 줄 모르고 일하게 된다.', categoryNo: 7 },
      { no: 22, text: '나의 능력을 개발하고 발휘할 수 있는 기회가 주어진다.', categoryNo: 7 },
    ],
  },
  {
    no: 8,
    title: '직장 문화',
    titleEn: 'Workplace Culture',
    questions: [
      { no: 23, text: '회식 자리가 불편하다.', categoryNo: 8 },
      { no: 24, text: '기준이나 일관성이 없는 상태로 업무지시를 받는다.', categoryNo: 8 },
      { no: 25, text: '직장의 분위기가 권위적이고 수직적이다.', categoryNo: 8 },
      { no: 26, text: '남성, 여성이라는 성적인 차이로 불이익을 받는다.', categoryNo: 8 },
    ],
  },
]

export const PSYCHOLOGY_SURVEY_SCORE_OPTIONS: PsychologySurveyScoreOption[] = [
  { value: 1, label: '전혀 그렇지 않다' },
  { value: 2, label: '그렇지 않다' },
  { value: 3, label: '그렇다' },
  { value: 4, label: '매우 그렇다' },
]

export const PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS = 26

// ============================================================
// 진단 프롬프트 빌더
// ============================================================

/**
 * 사용자의 응답(answers)을 채워 LLM에 전송할 진단 프롬프트 문자열을 반환
 */
export const buildDiagnosticPrompt = (answers: Record<number, number>, gender: SurveyGender | null): string => {
  const inputDataJson =
    '{\n' +
    Array.from({ length: PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS }, (_, i) => {
      const no = i + 1
      return ` "Q${no}": ${answers[no] ?? 1}`
    }).join(',\n') +
    '\n}'

  return `# Role
당신은 기업 구성원의 심리적 웰빙을 책임지는 '전문 산업심리 상담사 및 멘탈 웰니스 코치'입니다.
사용자가 작성한 한국인 직무스트레스 요인 평가도구 단축형(KOSS-SF1) 결과를 분석하여, 따뜻한 공감과 함께 실질적인 정신 건강 가이드를 제공하는 것이 당신의 임무입니다.
모든 답변은 **한국어**로 작성하세요. (곡명·아티스트명·이미지 키워드는 영어 허용)

# Scale
1: 전혀 그렇지 않다 / 2: 그렇지 않다 / 3: 그렇다 / 4: 매우 그렇다

# 문항 구조 (KOSS-SF1 26문항)
A. 물리적 환경 (Q1~Q2)
Q1 사고위험 / Q2 불편한자세

B. 직무 요구 (Q3~Q6)
Q3 시간압박 / Q4 업무량증가 / Q5 휴식부족[역] / Q6 멀티태스킹

C. 직무 자율 (Q7~Q10, 모두 역코딩)
Q7 창의력필요[역] / Q8 기술지식필요[역] / Q9 결정권한[역] / Q10 스케줄조절[역]

D. 관계 갈등 (Q11~Q13, 모두 역코딩)
Q11 상사도움[역] / Q12 동료도움[역] / Q13 이해공감[역]

E. 직무 불안정 (Q14~Q15)
Q14 미래불확실 / Q15 근무조건변화

F. 조직 체계 (Q16~Q19, 모두 역코딩)
Q16 인사공정성[역] / Q17 업무지원[역] / Q18 부서협조[역] / Q19 의견반영[역]

G. 보상 부적절 (Q20~Q22, 모두 역코딩)
Q20 존중신임[역] / Q21 미래기대[역] / Q22 능력발휘[역]

H. 직장 문화 (Q23~Q26)
Q23 회식불편 / Q24 업무지시일관성 / Q25 권위적분위기 / Q26 성차별

# Input Data
${inputDataJson}

# Reverse Scoring
[역] 표시 문항(Q5, Q7~Q13, Q16~Q22) 역코딩 후 계산
(1점→4점, 2점→3점, 3점→2점, 4점→1점)

# Scoring Rule (산업안전보건연구원 KOSS-SF1 평가점수 산출 공식 — PDF 규정 준수)
[영역별 환산 점수]
각 영역별 환산 점수 = (해당 영역에서 평가한 실제 점수의 합 − 문항 개수) ÷ (해당 영역에서 예상 가능한 최고 점수의 합 − 문항 개수) × 100

- 평가 척도: 1점(전혀 그렇지 않다) ~ 4점(매우 그렇다)
- 한 문항의 최고 점수 = 4점 → 영역별 「예상 가능한 최고 점수의 합」 = 4 × 문항 개수
- [역] 표시 문항은 역코딩(1↔4, 2↔3) 후 합산
- 결과 범위: 0~100점

[총점 (KOSS-SF1, 8개 영역)]
총점 = (8개 영역의 환산 점수의 총합) ÷ 8

# Risk Level (KOSS-SF1 참고치 기준 — ${gender === 'female' ? '여성' : '남성'} 기준 적용)
**총점 기준:**
- ${gender === 'female' ? '50.0' : '48.4'} 이하: 정상
- ${gender === 'female' ? '50.1~55.6' : '48.5~54.7'}: 경계
- ${gender === 'female' ? '55.7' : '54.8'} 이상: 고위험

**영역별 기준 (판정 참고용):**
| 영역 | 정상 | 경계 | 고위험 |
|------|------|------|--------|
| 물리적환경 | ≤44.4 | 44.5~${gender === 'female' ? '55.5' : '66.6'} | ≥${gender === 'female' ? '55.6' : '66.7'} |
| 직무요구 | ≤${gender === 'female' ? '58.3' : '50.0'} | ${gender === 'female' ? '58.4~66.6' : '50.1~58.3'} | ≥${gender === 'female' ? '66.7' : '58.4'} |
| 직무자율 | ≤${gender === 'female' ? '58.3' : '50.0'} | ${gender === 'female' ? '58.4~66.6' : '50.1~66.6'} | ≥66.7 |
| 관계갈등 | ≤33.3 | 33.4~44.4 | ≥44.5 |
| 직무불안정 | ≤${gender === 'female' ? '33.3' : '50.0'} | ${gender === 'female' ? '33.4~50.0' : '50.1~66.6'} | ≥${gender === 'female' ? '50.1' : '66.7'} |
| 조직체계 | ≤50.0 | 50.1~66.6 | ≥66.7 |
| 보상부적절 | ≤55.5 | 55.6~66.6 | ≥66.7 |
| 직장문화 | ≤41.6 | 41.7~50.0 | ≥50.1 |

# High Risk Flag
고위험 기준 초과 영역이 3개 이상이면 종합 판정을 고위험으로 상향 조정

# Stress Type (KOSS-SF1 공식 영역명 기준)
물리적환경 위험: A영역 경계 이상
직무요구 과부하: B영역 경계 이상
직무자율 결여: C영역 경계 이상
관계갈등(사회적 지지 부족): D영역 경계 이상
직무불안정: E영역 경계 이상
조직체계 불공정: F영역 경계 이상
보상 부적절: G영역 경계 이상
직장문화 갈등: H영역 경계 이상

# Priority
환산점수가 가장 높은 1~2개 영역 = 핵심 원인
동률인 경우 해당 영역 모두 언급

# Output Format
각 섹션 사이에는 반드시 --- 구분선을 삽입하세요.

### 1. 현재 상태 요약
위험군 뱃지와 상태 설명을 아래 HTML 형식으로 출력하세요.
반드시 두 줄만 출력하며, 두 줄 사이에 빈 줄·공백·들여쓰기를 절대 넣지 마세요.
첫째 줄: 위험군 뱃지 span 태그 하나만
둘째 줄: 상태 설명 span 태그 하나만

출력 예시 (risk level에 맞는 클래스 하나 선택):

정상군인 경우:
<span class="risk-badge risk-safe">정상군</span>
<span class="risk-status risk-status--safe">{설명}</span>

경계군인 경우:
<span class="risk-badge risk-caution">경계군</span>
<span class="risk-status risk-status--caution">{설명}</span>

고위험군인 경우:
<span class="risk-badge risk-danger">고위험군</span>
<span class="risk-status risk-status--danger">{설명}</span>

⚠️ 두 span 태그 사이에 빈 줄이나 들여쓰기를 넣으면 안 됩니다. 반드시 연속된 두 줄로만 출력하세요.

---

### 2. 핵심 원인
(상위 1~2개 영역 + 증상 중심 설명 — 문항 번호·점수 언급 없이 경험 내용만 서술)

---

### 3. 심리 상태
정서·인지·행동 세 항목을 다룰 때, **각 항목 앞에 반드시 말머리 기호(\`- \`)를 붙이고** 한 줄 이상으로 서술하세요.
예: \`- 정서: …\`, \`- 인지: …\`, \`- 행동: …\` (하위 설명이 있으면 추가 줄도 모두 \`- \`로 시작)
섹션 3 본문을 모두 작성한 뒤, 반드시 아래 마커를 단독으로 한 줄 출력하세요 (들여쓰기·공백 없이):
[방사형그래프]

---

### 4. 스트레스 유형

---

### 5. 맞춤 처방
회복을 위한 작은 가이드를 항목별로 출력합니다.
#### ① 지금 가장 먼저 해보면 좋은 것 (1~2개)
→ 가장 효과적인 행동 1개는 반드시 포함
#### ② 생각을 조금 가볍게 바꾸는 방법 (2~3개)
→ 해석/관점 전환 중심
#### ③ 일상에서 바로 실천해볼 수 있는 것들 (2~3개)
→ 업무/생활 행동
#### ④ 몸과 마음을 편안하게 만드는 방법 (2~3개)
→ 신체 + 감정 안정

---

### 6. 심리 안정 음악
현재 심리 상태에 맞는 음악 3곡을 아래 형식으로 빠짐없이 출력하세요.

선곡 기준:
- 대중적으로 유명한 곡보다 **심리 상태에 진짜 어울리는 곡**을 우선 선택하세요.
- 장르·시대·국가를 다양하게 섞으세요 (예: 클래식, 재즈, 인디, 어쿠스틱, 앰비언트, 월드뮤직 등).
- 매번 동일한 유명 곡(예: 비틀즈, 에드 시런 등 과도하게 반복되는 아티스트)은 피하고, 상대적으로 덜 알려진 곡도 적극 포함하세요.
- 3곡이 서로 다른 장르·분위기여야 합니다.

출력 형식:
[번호]. 곡명 - 아티스트
   이유: {지금 이 사람에게 왜 이 곡이 도움이 되는지 1~2문장}

---

### 7. 회복에 도움이 되는 이미지
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
- 점수의 계산방법(점수체계, 역코딩, 환산공식 등)은 설명하지 마세요.
- 섹션 3: 정서·인지·행동은 각 항목 \`- \` 말머리 목록으로 작성하고, 본문 마지막에 반드시 [방사형그래프] 한 줄만 출력하세요 (생략 불가, 다른 텍스트 혼입 금지).
- 문항 번호(Q1, Q5~Q8 등) 및 점수 수치를 답변에 절대 노출하지 마세요. 대신 해당 문항이 나타내는 경험(사고위험, 시간압박 등)을 자연스러운 문장으로 서술하세요.

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
 * - 각 이미지 하단에 사진작가별 Pexels attribution 라벨 표시 (API 이용 정책 준수)
 */
const buildPexelsGrid = (
  images: { keyword: string; url: string; fullUrl: string; photographer: string; photographerUrl: string }[],
): string => {
  // 이미지 + 사진작가 attribution을 하나의 래퍼로 묶음
  const imgWrap = (img: {
    keyword: string
    url: string
    fullUrl: string
    photographer: string
    photographerUrl: string
  }) =>
    `<div class="pexels-img-wrap">` +
    `<img class="pexels-img" src="${img.url}" data-full="${img.fullUrl}" alt="${img.keyword}">` +
    `<a class="pexels-attribution" href="${img.photographerUrl}" target="_blank" rel="noopener noreferrer">Photo by ${img.photographer} on Pexels</a>` +
    `</div>`

  if (images.length === 1) {
    return `<div class="pexels-grid pexels-grid--single">${imgWrap(images[0])}</div>`
  }

  const leftCount = Math.floor(images.length / 2)
  const leftCol = images.slice(0, leftCount).map(imgWrap).join('')
  const rightCol = images.slice(leftCount).map(imgWrap).join('')
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
        const data = (await res.json()) as {
          photos?: {
            src?: { large?: string; large2x?: string }
            photographer?: string
            photographer_url?: string
          }[]
        }
        const photo = data.photos?.[0]
        return {
          keyword,
          url: photo?.src?.large ?? null,
          fullUrl: photo?.src?.large2x ?? photo?.src?.large ?? null,
          photographer: photo?.photographer ?? null,
          photographerUrl: photo?.photographer_url ?? null,
        }
      } catch {
        return { keyword, url: null, fullUrl: null, photographer: null, photographerUrl: null }
      }
    }),
  )

  const validImages = imageResults.filter(
    (img): img is { keyword: string; url: string; fullUrl: string; photographer: string; photographerUrl: string } =>
      img.url !== null && img.photographer !== null && img.photographerUrl !== null,
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

/** 방사형 차트용 8개 영역 점수 (KOSS-SF1 환산 공식 적용 → 0~100, LLM·백엔드 응답 키는 영어 camelCase) */
export type RadarChartScore = {
  physicalEnvironment: number // 물리적 환경
  jobDemand: number // 직무 요구
  jobAutonomy: number // 직무 자율 (자율성 결여)
  interpersonalConflict: number // 관계 갈등
  jobInsecurity: number // 직무 불안정
  organizationalSystem: number // 조직 체계
  inadequateCompensation: number // 보상 부적절
  workplaceCulture: number // 직장 문화
}

/** KOSS-SF1 3단계 — StressLevel 과 동일 (타입 호환 별칭) */
export type RadarChartRiskLevel = StressLevel

/**
 * KOSS-SF1 별표 4 — 성별별 영역 참고치 (0~100 환산 점수 기준)
 * 정상Max: A등급 상한, 경계Max: B등급 상한 (초과 시 C 고위험)
 */
export const KOSS_SF1_RISK_TABLE: Record<
  SurveyGender,
  Record<keyof RadarChartScore, { 정상Max: number; 경계Max: number }>
> = {
  male: {
    physicalEnvironment: { 정상Max: 44.4, 경계Max: 66.6 },
    jobDemand: { 정상Max: 50.0, 경계Max: 58.3 },
    jobAutonomy: { 정상Max: 50.0, 경계Max: 66.6 },
    interpersonalConflict: { 정상Max: 33.3, 경계Max: 44.4 },
    jobInsecurity: { 정상Max: 50.0, 경계Max: 66.6 },
    organizationalSystem: { 정상Max: 50.0, 경계Max: 66.6 },
    inadequateCompensation: { 정상Max: 55.5, 경계Max: 66.6 },
    workplaceCulture: { 정상Max: 41.6, 경계Max: 50.0 },
  },
  female: {
    physicalEnvironment: { 정상Max: 44.4, 경계Max: 55.5 },
    jobDemand: { 정상Max: 58.3, 경계Max: 66.6 },
    jobAutonomy: { 정상Max: 58.3, 경계Max: 66.6 },
    interpersonalConflict: { 정상Max: 33.3, 경계Max: 44.4 },
    jobInsecurity: { 정상Max: 33.3, 경계Max: 50.0 },
    organizationalSystem: { 정상Max: 50.0, 경계Max: 66.6 },
    inadequateCompensation: { 정상Max: 55.5, 경계Max: 66.6 },
    workplaceCulture: { 정상Max: 41.6, 경계Max: 50.0 },
  },
}

/** KOSS-SF1 별표 4 — 성별별 총점 참고치 */
export const KOSS_SF1_TOTAL_RISK: Record<SurveyGender, { 정상Max: number; 경계Max: number }> = {
  male: { 정상Max: 48.4, 경계Max: 54.7 },
  female: { 정상Max: 50.0, 경계Max: 55.6 },
}

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
  'physicalEnvironment',
  'jobDemand',
  'jobAutonomy',
  'interpersonalConflict',
  'jobInsecurity',
  'organizationalSystem',
  'inadequateCompensation',
  'workplaceCulture',
] as const

/** scores 영어 키 → 그리드/차트 축 한글명 */
export const PSYCHOLOGY_RADAR_LABEL_KO: Record<keyof RadarChartScore, string> = {
  physicalEnvironment: '물리적환경',
  jobDemand: '직무요구',
  jobAutonomy: '직무자율',
  interpersonalConflict: '관계갈등',
  jobInsecurity: '직무불안정',
  organizationalSystem: '조직체계',
  inadequateCompensation: '보상부적절',
  workplaceCulture: '직장문화',
}

/** 구 응답(한글 키) 호환 */
const LEGACY_RADAR_SCORE_KO_TO_EN: Record<string, keyof RadarChartScore> = {
  물리적환경: 'physicalEnvironment',
  직무요구: 'jobDemand',
  직무자율: 'jobAutonomy',
  관계갈등: 'interpersonalConflict',
  직무불안정: 'jobInsecurity',
  조직체계: 'organizationalSystem',
  보상부적절: 'inadequateCompensation',
  직장문화: 'workplaceCulture',
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
 * 0~100 환산 점수 → 항목별 등급 (KOSS-SF1 PDF 23p 영역별 참고치 기반)
 * - area 지정 시: 영역별 참고치 적용 (gender 미지정 시 남성 기준 fallback)
 * - area 미지정 시: 총점·일반 평가용 보수적 공통 구간(0~100 균등 분할) 적용
 *   ※ 영역별 단계 판정은 area 인자를 반드시 함께 전달할 것
 */
export const stressLevelFromPsychologyRadarScore100 = (
  score: number,
  gender?: SurveyGender | null,
  area?: keyof RadarChartScore,
): StressLevel => {
  if (area) {
    const thresholds = KOSS_SF1_RISK_TABLE[gender ?? 'male'][area]
    if (score <= thresholds.정상Max) return '정상'
    if (score <= thresholds.경계Max) return '경계'
    return '고위험'
  }
  if (score <= 33.3) return '정상'
  if (score <= 66.6) return '경계'
  return '고위험'
}

/** StressScoreGrid `.item-level` / 레이더 축 라벨 — KOSS-SF1 3단계, SCSS $color-success·warning·error 와 동일 */
export const STRESS_LEVEL_LABEL_HEX: Record<StressLevel, string> = {
  정상: '#22c55e',
  경계: '#f59e0b',
  고위험: '#ef4444',
}

export const hexForStressLevel = (level: StressLevel): string => STRESS_LEVEL_LABEL_HEX[level] ?? '#64748b'

/** RadarChartData → StressScoreGrid props.items (gender 지정 시 성별 참고치 적용) */
export const buildStressItemsFromRadarChartData = (
  data: RadarChartData,
  gender?: SurveyGender | null,
): StressScoreItem[] => {
  return PSYCHOLOGY_RADAR_SCORE_KEYS.map((key) => {
    const raw = data.scores[key]
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
    return {
      name: PSYCHOLOGY_RADAR_LABEL_KO[key],
      value,
      level: stressLevelFromPsychologyRadarScore100(value, gender, key),
    }
  })
}

/**
 * guide/ui-chart.vue 의 radarStressConfig 와 동일 형태 — max 0~100, riskColor 로 라인 색
 * - gender 전달 시: KOSS-SF1 PDF 23p 영역별·성별 참고치로 영역 단계(점·라벨 색) 결정
 * - gender 미전달 시: 남성 기준 영역별 참고치 fallback
 */
export const buildPsychologyRadarUiChartConfig = (
  data: RadarChartData,
  gender?: SurveyGender | null,
): Record<string, unknown> => {
  const items = buildStressItemsFromRadarChartData(data, gender)
  const levelColors = items.map((i) => hexForStressLevel(i.level))
  return {
    categories: items.map((i) => i.name),
    data: items.map((i) => i.value),
    color: data.riskColor || '#ef4444',
    maxValue: 100,
    stepSize: 20,
    fillOpacity: 0.25,
    pointLabelFormat: (name: string, value: number) =>
      `${name} (${typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : String(value)})`,
    /** 축 라벨(이름+점수) — 항목별 위험등급 색 */
    pointLabelColors: levelColors,
    /** 꼭짓점(호버 포함) — 라인·면은 `color`(종합 riskColor) 유지 */
    pointBackgroundColors: levelColors,
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
  const riskLevel: RadarChartRiskLevel = rl === '정상' || rl === '경계' || rl === '고위험' ? rl : '경계'

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

/** 캐시 히트 후 같은 tick 에 차트가 붙지 않도록 지연 주입 — canvas 초기화 레이스 완화 */
export function schedulePsychologyRadarUiInjection(fn: () => void): () => void {
  if (typeof window === 'undefined') {
    queueMicrotask(fn)
    return () => {}
  }
  const id = window.setTimeout(() => nextTick(fn), 160)
  return () => clearTimeout(id)
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

/**
 * KOSS-SF1 역코딩 대상 문항 번호 (1→4, 2→3, 3→2, 4→1)
 * Q5: 충분한 휴식, Q7~Q10: 직무자율, Q11~Q13: 관계갈등, Q16~Q19: 조직체계, Q20~Q22: 보상부적절
 */
const REVERSE_SCORE_QNO = new Set([5, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22])

/** 역코딩 변환 */
const applyReverse = (score: number): number => 5 - score

/**
 * KOSS-SF1 영역별 통계 — 산업안전보건연구원 PDF 평가점수 산출 공식 직접 적용
 * 환산 점수 = (실제 점수의 합 − 문항 개수) ÷ (예상 가능한 최고 점수의 합 − 문항 개수) × 100
 * - 1~4점 척도이므로 영역별 「최고 점수의 합」 = 4 × 문항 개수
 * - [역] 표시 문항은 역코딩(1↔4, 2↔3) 후 합산
 */
const calcCategoryStats = (qNos: number[], answers: Record<number, number>) => {
  const itemCount = qNos.length
  const sumActual = qNos.reduce((acc, no) => {
    const raw = answers[no] ?? 2
    return acc + (REVERSE_SCORE_QNO.has(no) ? applyReverse(raw) : raw)
  }, 0)
  const sumMax = 4 * itemCount
  const denom = sumMax - itemCount
  const score100 = denom === 0 ? 0 : ((sumActual - itemCount) / denom) * 100
  const avg = itemCount === 0 ? 0 : sumActual / itemCount
  return {
    itemCount,
    sumActual,
    sumMax,
    avg: avg.toFixed(2),
    score100: score100.toFixed(2),
  }
}

/**
 * 영역별 0~100 환산 점수 → KOSS-SF1 PDF 23p 영역별 참고치 기준 위험 단계
 * - coreAreasSummary 예시 생성에 사용 (LLM이 동일 기준으로 단계 표기하도록)
 * - gender 미전달 시 남성 기준 영역별 참고치 fallback
 */
const stressTierFromScore100ByArea = (
  score100: number,
  area: keyof RadarChartScore,
  gender: SurveyGender | null,
): RadarChartRiskLevel => stressLevelFromPsychologyRadarScore100(score100, gender, area)

/**
 * LLM 응답 텍스트에서 위험군 클래스명을 읽어 색상 매핑
 * KOSS-SF1 3단계: risk-safe(정상) / risk-caution(경계) / risk-danger(고위험)
 */
const resolveRiskColorsFromResponse = (sectionsText: string): { riskBg: string; riskColor: string } => {
  const match = sectionsText.match(/class="risk-badge\s+(risk-\w+)"/)
  const cls = match?.[1] ?? ''
  if (cls === 'risk-safe') return { riskBg: '#ecfdf5', riskColor: '#22c55e' }
  if (cls === 'risk-caution') return { riskBg: '#fffbeb', riskColor: '#f59e0b' }
  if (cls === 'risk-danger') return { riskBg: '#fef2f2', riskColor: '#ef4444' }
  return { riskBg: '#ffffff', riskColor: '#ef4444' }
}

/** risk-badge 클래스 → 방사형 JSON riskLevel (KOSS-SF1 3단계) */
const RISK_BADGE_CLASS_TO_LEVEL: Record<string, RadarChartRiskLevel> = {
  'risk-safe': '정상',
  'risk-caution': '경계',
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
 * Q1~Q26 응답값으로 방사형 차트 JSON 데이터 요청 프롬프트 빌드
 * - 점수 산출은 산업안전보건연구원 KOSS-SF1 PDF 평가점수 산출 공식 그대로 적용
 *   환산 점수 = (실제 점수의 합 − 문항 개수) ÷ (예상 가능한 최고 점수의 합 − 문항 개수) × 100
 *   총점 = (8개 영역의 환산 점수의 총합) ÷ 8
 * - 역코딩 규칙은 buildDiagnosticPrompt 와 동일
 * - sectionsText에 섹션1 HTML(risk-badge/risk-status)이 있으면 riskLevel·색·riskSummary는 해당 값으로 고정 (PDF 공식 재판정 금지)
 * - 섹션1 파싱 실패 시에만 PDF 공식 총점·구간표로 위험 판정 지시
 * - LLM 은 이미지 생성 없이 JSON 만 반환
 */
const buildRadarChartPrompt = (
  answers: Record<number, number>,
  sectionsText: string,
  gender: SurveyGender | null,
): string => {
  // KOSS-SF1 영역별 통계 — PDF 평가점수 산출 공식 직접 적용
  const 물리적환경Stats = calcCategoryStats([1, 2], answers)
  const 직무요구Stats = calcCategoryStats([3, 4, 5, 6], answers)
  const 직무자율Stats = calcCategoryStats([7, 8, 9, 10], answers)
  const 관계갈등Stats = calcCategoryStats([11, 12, 13], answers)
  const 직무불안정Stats = calcCategoryStats([14, 15], answers)
  const 조직체계Stats = calcCategoryStats([16, 17, 18, 19], answers)
  const 보상부적절Stats = calcCategoryStats([20, 21, 22], answers)
  const 직장문화Stats = calcCategoryStats([23, 24, 25, 26], answers)

  // 8개 영역 환산 점수의 총합 ÷ 8 = KOSS-SF1 총점 (PDF 규정)
  const allStats = [
    { ko: '물리적환경', en: 'physicalEnvironment', stats: 물리적환경Stats },
    { ko: '직무요구', en: 'jobDemand', stats: 직무요구Stats },
    { ko: '직무자율', en: 'jobAutonomy', stats: 직무자율Stats },
    { ko: '관계갈등', en: 'interpersonalConflict', stats: 관계갈등Stats },
    { ko: '직무불안정', en: 'jobInsecurity', stats: 직무불안정Stats },
    { ko: '조직체계', en: 'organizationalSystem', stats: 조직체계Stats },
    { ko: '보상부적절', en: 'inadequateCompensation', stats: 보상부적절Stats },
    { ko: '직장문화', en: 'workplaceCulture', stats: 직장문화Stats },
  ]
  const totalScore = (allStats.reduce((acc, a) => acc + Number(a.stats.score100), 0) / allStats.length).toFixed(2)

  const areas100Sorted = [...allStats]
    .map((a) => ({ ko: a.ko, en: a.en as keyof RadarChartScore, s100: a.stats.score100 }))
    .sort((a, b) => Number(b.s100) - Number(a.s100))
  const topA = areas100Sorted[0]
  const topB = areas100Sorted[1]
  const coreAreasSummaryExample =
    topA && topB
      ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100ByArea(Number(topA.s100), topA.en, gender)})·${topB.ko}(${topB.s100}, ${stressTierFromScore100ByArea(Number(topB.s100), topB.en, gender)}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
      : topA
        ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100ByArea(Number(topA.s100), topA.en, gender)}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
        : '"(영역명)(0~100값, 정상|경계|고위험) 형식으로 기재"'

  const section1Anchors = parseSection1ForRadarChart(sectionsText)
  const { riskColor } = resolveRiskColorsFromResponse(sectionsText)

  const section1LockBlock = section1Anchors
    ? `
위 진단 분석 본문 중 "### 1. 현재 상태 요약"에 이미 출력된 HTML을 기준으로, 아래 네 값은 **이미 확정된 결과**입니다.
8개 영역의 환산 점수·총점·구간표로 riskLevel을 **다시 계산하거나 바꾸지 마세요.** JSON 필드에 **글자 단위로 동일하게** 넣으세요.

- riskLevel: ${JSON.stringify(section1Anchors.riskLevel)}
- riskColor: ${JSON.stringify(section1Anchors.riskColor)}
- riskBgColor: ${JSON.stringify(section1Anchors.riskBgColor)}
- riskSummary: ${JSON.stringify(section1Anchors.riskSummary)}
`
    : ''

  const genderLabel = gender === 'female' ? '여성' : '남성'
  const totalRisk = gender ? KOSS_SF1_TOTAL_RISK[gender] : KOSS_SF1_TOTAL_RISK.male
  const riskJudgementBlock = section1Anchors
    ? `
위험 수준 (riskLevel·riskColor·riskBgColor·riskSummary): 위 「이미 확정된 결과」블록과 **완전히 동일**하게만 출력합니다. 임의 수정·요약 재작성 금지.
`
    : `
위험 수준 판정 (${genderLabel} 기준 KOSS-SF1 참고치 적용):
PDF 규정에 따라 산출한 총점 = (8개 영역의 환산 점수의 총합) ÷ 8 을 계산한 뒤 아래 구간표로 riskLevel을 결정하세요.

총점 구간표 (${genderLabel} 기준):
- ≤${totalRisk.정상Max}: 정상  → riskLevel: "정상", riskColor: "#22c55e", riskBgColor: "#ecfdf5"
- ${totalRisk.정상Max + 0.1}~${totalRisk.경계Max}: 경계  → riskLevel: "경계", riskColor: "#f59e0b", riskBgColor: "#fffbeb"
- ≥${totalRisk.경계Max + 0.1}: 고위험 → riskLevel: "고위험", riskColor: "#ef4444", riskBgColor: "#fef2f2"

단, 고위험 영역이 3개 이상이면 총점에 무관하게 riskLevel을 "고위험"으로 판정합니다.
`

  const riskSummaryRule = section1Anchors
    ? '- riskSummary: 위 「이미 확정된 결과」의 riskSummary 문자열과 동일 (공백·줄바꿈 포함 그대로)'
    : '- riskSummary: 현재 위험군을 한 문장으로 설명 (예: "전반적으로 직무요구와 조직체계 영역에서 경계 수준의 스트레스가 감지됩니다.")'

  const riskLevelColorRule = section1Anchors
    ? '- riskLevel / riskColor / riskBgColor: 위 「이미 확정된 결과」블록과 동일 (PDF 공식·구간표로 재판정 금지)'
    : '- riskLevel / riskColor / riskBgColor: 「(8개 영역 환산 점수의 총합) ÷ 8」로 계산한 총점이 속한 「KOSS-SF1 총점 구간표」에서 선택'

  const coreAreasSummaryRule = `- coreAreasSummary: **scores의 0~100 값**으로 영역 간 상대 크기를 비교해 가장 큰 영역 1~2개를 고릅니다. 각 영역의 단계(정상/경계/고위험)는 반드시 아래 「영역별 단계 판정 기준」표(KOSS-SF1 PDF 23p 참고치)에 해당 영역의 0~100 점수를 대입해 판정합니다. **균등한 33.33/66.67 분할 표를 절대 사용하지 마세요.** 영역마다 임계값이 다릅니다. 문장·괄호 안에 **1~4 척도 원점수는 쓰지 마세요.** 괄호 안 형식: 한글 영역명(0~100값, 구간표 단계) (예: ${coreAreasSummaryExample})`

  // 영역별 PDF 공식 산출 과정 표 (LLM에게 분자·분모를 명시적으로 전달)
  const areaCalcTable = allStats
    .map(
      ({ ko, en, stats }) =>
        `- ${ko}(${en}): 실제 점수의 합 ${stats.sumActual}, 문항 개수 ${stats.itemCount}, 예상 가능한 최고 점수의 합 ${stats.sumMax}` +
        ` → (${stats.sumActual} − ${stats.itemCount}) ÷ (${stats.sumMax} − ${stats.itemCount}) × 100 = ${stats.score100}`,
    )
    .join('\n')

  const areaScoreList = allStats.map(({ ko, en, stats }) => `- ${ko}(${en}): ${stats.score100}`).join('\n')

  // 영역별 단계 판정 기준 표 (KOSS-SF1 PDF 23p — 성별별 참고치)
  const riskTableForGender = KOSS_SF1_RISK_TABLE[gender ?? 'male']
  const areaThresholdTable = allStats
    .map(({ ko, en }) => {
      const t = riskTableForGender[en as keyof RadarChartScore]
      return `| ${ko} | ≤${t.정상Max} | ${t.정상Max} 초과 ~ ${t.경계Max} | ${t.경계Max} 초과 |`
    })
    .join('\n')

  return `[방사형 차트 데이터 요청]
아래 진단 결과를 바탕으로 방사형 차트 컴포넌트에 주입할 데이터를 JSON 형식으로 응답하세요.
마크다운 코드블록(\`\`\`) 없이 순수 JSON 문자열만 출력하세요. 다른 텍스트는 절대 추가하지 마세요.
${section1LockBlock}
[KOSS-SF1 평가점수 산출 공식 — 산업안전보건연구원 PDF 규정]
각 영역별 환산 점수 = (해당 영역에서 평가한 실제 점수의 합 − 문항 개수) ÷ (해당 영역에서 예상 가능한 최고 점수의 합 − 문항 개수) × 100
- 평가 척도: 1점(전혀 그렇지 않다) ~ 4점(매우 그렇다)
- 한 문항의 최고 점수 = 4점 → 영역별 「예상 가능한 최고 점수의 합」 = 4 × 문항 개수
- [역] 표시 문항은 역코딩(1↔4, 2↔3) 후 합산
- 결과 범위: 0~100점

총점(KOSS-SF1) = (8개 영역의 환산 점수의 총합) ÷ 8

[영역별 PDF 공식 산출 과정 — 역코딩 적용 후]
${areaCalcTable}

[영역별 0~100 환산 점수 (JSON scores에 넣을 숫자와 **반드시 일치**, 소수 둘째 자리)]
${areaScoreList}

[총점] (8개 영역의 환산 점수의 총합) ÷ 8 = ${totalScore}

scores 키 매핑 (JSON scores에는 반드시 오른쪽 영어만 사용):
- 물리적환경 → physicalEnvironment
- 직무요구 → jobDemand
- 직무자율 → jobAutonomy
- 관계갈등 → interpersonalConflict
- 직무불안정 → jobInsecurity
- 조직체계 → organizationalSystem
- 보상부적절 → inadequateCompensation
- 직장문화 → workplaceCulture

${section1Anchors ? '' : `현재 판정된 위험군 색상 참고 (진단 분석에서 추출):\n- riskColor: ${riskColor}\n`}

${riskJudgementBlock}
[scores 필드 환산 규칙]
각 영역의 0~100 환산 점수는 위 「KOSS-SF1 평가점수 산출 공식」을 그대로 적용합니다.
즉, scores[영역] = (실제 점수의 합 − 문항 개수) ÷ (예상 가능한 최고 점수의 합 − 문항 개수) × 100, 소수 둘째 자리까지 반올림하여 number로 기재.
(예: 실제합=문항수×1 → 0, 실제합=문항수×2.5 → 50, 실제합=문항수×4 → 100)

영역별 단계 판정 기준 (KOSS-SF1 PDF 23p — ${genderLabel} 기준 참고치 / coreAreasSummary 단계 표기 시 **반드시 이 표 사용**${section1Anchors ? '' : ' / 단, 종합 위험 판정은 위 총점 구간표를 따를 것'}):

| 영역 | 정상 | 경계 | 고위험 |
|------|------|------|--------|
${areaThresholdTable}

⚠️ 영역마다 임계값이 다릅니다. 모든 영역에 균등하게 0~33.33/33.34~66.67/66.68~100을 적용하면 잘못된 단계가 됩니다. 반드시 위 표의 해당 영역 행을 읽어 단계를 결정하세요.

응답 JSON 스키마 (키 이름·타입 정확히 준수):
{
  "scores": {
    "physicalEnvironment": number,
    "jobDemand": number,
    "jobAutonomy": number,
    "interpersonalConflict": number,
    "jobInsecurity": number,
    "organizationalSystem": number,
    "inadequateCompensation": number,
    "workplaceCulture": number
  },
  "riskLevel": "정상" | "경계" | "고위험",
  "riskColor": string,
  "riskBgColor": string,
  "riskSummary": string,
  "coreAreasSummary": string
}

필드 작성 규칙:
- scores: 위 「영역별 0~100 환산 점수」목록과 **동일한 숫자**만 기재 (문자열 금지), 키는 반드시 영어 스키마대로. PDF 공식 외 다른 방식으로 재계산하거나 반올림 방식을 바꾸지 마세요.
${riskLevelColorRule}
${riskSummaryRule}
${coreAreasSummaryRule}
`
}

/**
 * 섹션 1~4 텍스트 + Q1~Q26 응답값을 기반으로 방사형 차트 JSON 데이터 요청
 * - 백엔드 엔드포인트: /ai/chatbot/getPsychologyChartData.do (백엔드 연결 시 확인 필요)
 * @param sectionsText 섹션 1~4 LLM 응답 텍스트 (위험군 파싱에 사용)
 * @param answers Q1~Q26 원점수 — KOSS-SF1 PDF 평가점수 산출 공식 적용 및 프롬프트 생성에 필수
 * @returns RadarChartData (차트 컴포넌트 주입용), 실패 시 null
 */
export const fetchPsychologyRadarChartData = async (
  sectionsText: string,
  answers: Record<number, number>,
  gender: SurveyGender | null = null,
): Promise<RadarChartData | null> => {
  try {
    const { post } = useApi()
    const prompt = `${sectionsText}\n\n${buildRadarChartPrompt(answers, sectionsText, gender)}`
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
/** 성별 선택 단계 표시 여부 (설문 시작 전 Step 0) */
const isGenderStepVisible = ref(false)
/** 선택된 성별 (KOSS-SF1 참고치 판정에 사용) */
const surveyGender = ref<SurveyGender | null>(null)

/**
 * 설문 제출을 통해 생성된 채팅방 ID
 * - 해당 방에서는 첫 번째 question 메시지(진단 프롬프트)를 UI에서 숨김
 */
const surveyRoomIds = ref<Set<string>>(new Set())

export const usePsychologySurvey = () => {
  /**
   * 성별 선택 단계 시작 (설문 시작 전 Step 0)
   * - index 모드: 이후 confirmGender() 호출 시 isSurveyVisible = true 로 전환
   * - room 모드: 설문 메시지는 caller가 즉시 추가, 이후 confirmGender() 호출 시 isGenderStepVisible = false 로 전환
   */
  const openGenderStep = () => {
    surveyAnswers.value = {}
    surveyGender.value = null
    isGenderStepVisible.value = true
    isSurveyVisible.value = false
  }

  /** 성별 선택 완료 후 설문 진입 */
  const confirmGender = (gender: SurveyGender) => {
    surveyGender.value = gender
    isGenderStepVisible.value = false
    isSurveyVisible.value = true
  }

  /** 설문 닫기 (성별 단계 포함) */
  const closePsychologySurvey = () => {
    isSurveyVisible.value = false
    isGenderStepVisible.value = false
  }

  /** 설문 시작: 답변 초기화 후 노출 (성별 선택 없이 직접 시작하는 경우) */
  const openPsychologySurvey = () => {
    surveyAnswers.value = {}
    isSurveyVisible.value = true
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
    isGenderStepVisible,
    surveyGender,
    surveyAnswers,
    answeredCount,
    isSurveyComplete,
    openGenderStep,
    confirmGender,
    openPsychologySurvey,
    closePsychologySurvey,
    setSurveyAnswer,
    registerSurveyRoom,
    isSurveyRoom,
  }
}
