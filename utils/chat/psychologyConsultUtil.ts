// ============================================================
// 산업심리 상담 에이전트 (AG000010) 전용 설문 유틸
// - 모든 문항 데이터, 타입, 반응형 상태, 비즈니스 로직을 여기서 관리
// - useChatStore 에서는 import 후 호출만 수행
// ============================================================

import type { ChatMessage } from '~/types/chat'
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
1. 현재 상태 요약
(위험군 + 한 줄 상태)

2. 핵심 원인
(상위 1~2개 영역 + 문항 기반 설명)

3. 심리 상태
정서 / 인지 / 행동

4. 스트레스 유형

5. 맞춤 처방 (회복을 위한 작은 가이드)
### ① 지금 가장 먼저 해보면 좋은 것 (1~2개)
→ 가장 효과적인 행동 1개는 반드시 포함
### ② 생각을 조금 가볍게 바꾸는 방법 (2~3개)
→ 해석/관점 전환 중심
### ③ 일상에서 바로 실천해볼 수 있는 것들 (2~3개)
→ 업무/생활 행동
### ④ 몸과 마음을 편안하게 만드는 방법 (2~3개)
→ 신체 + 감정 안정

6. 한 줄 응원

# Optional
- 심리상태를 안정시키는 음악 : 3곡 (현재 상태에 맞는 이유 포함)
- 회복에 도움이 되는 이미지 : 3~5개

# Constraints (반드시 준수)
- 의료 진단 금지 (대신 심각할 경우 전문의 상담을 권고)
- 약물처방 금지
- 과도한 긍정 금지
- 비난 금지
- "열심히" 금지, "잠시 멈춰도 괜찮다"는 허용의 메시지 전달
- 점수의 계산방법(점수체계, 역코딩 등)은 설명하지 마세요.

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
  surveyAnswers: { ...answers },
  surveySubmitted: submitted,
})

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
