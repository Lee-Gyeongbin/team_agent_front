import { useChatRooms } from '~/composables/chat/useChatRooms'
import { useDataQuestionApi } from '~/composables/chat/useDataQuestionApi'
import { scoreFromText } from '~/utils/chat/dataQuestionRubric'
import type { QuestionDiagnosis } from '~/types/dataQuestion'

/**
 * 데이터분석(SVC_TY='S') 질문 품질 게이트
 *
 * 흐름: 질문 작성 → [검증] LLM 진단 → 통과 시에만 [요청](Text-to-SQL) 활성.
 * - 평가기준/배점/임계는 백엔드 LLM 프롬프트에 위치 (프론트는 결과만 소비)
 * - 게이트는 'S' 모드에서만 적용 — 다른 에이전트 동작에 영향 없음
 * - 검증 후 질문을 수정하면 자동으로 다시 검증 필요 상태가 됨(파생 계산)
 *
 * 모듈 단일 상태 — ChatInput(버튼)과 DataQuestionGuide(보완)가 공유.
 */

type GateStatus = 'idle' | 'validating' | 'needs_fix' | 'passed'

const gateStatus = ref<GateStatus>('idle')
const diagnosis = ref<QuestionDiagnosis | null>(null)
const validatedQuestion = ref('')
const isValidating = ref(false)

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

export const useDataQuestionGate = () => {
  const { chatMessage } = useChatRooms()
  const { activeSearchModes, riskAgentActive, subOptions, selectedSubOptions } = useChatStore()
  const { fetchDiagnoseQuestion } = useDataQuestionApi()

  /** 데이터분석(S) 모드에서만 게이트 적용 */
  const isGateActive = computed(() => activeSearchModes.value.includes('S') && !riskAgentActive.value)

  /** 검증·진단 대상 데이터마트 ID */
  const currentDatamartId = computed(() => {
    const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
    return selected ?? String(subOptions.value[0]?.value ?? '')
  })

  /** 검증 시점 질문과 현재 질문이 동일한지 (편집하면 무효화) */
  const matchesValidated = computed(() => normalize(chatMessage.value) === normalize(validatedQuestion.value))

  /** 검증 통과 + 미편집 상태 */
  const isValidated = computed(() => gateStatus.value === 'passed' && matchesValidated.value)

  /** 진단 결과(보완 등) 노출 여부 — 편집으로 stale 되면 숨김 */
  const showDiagnosis = computed(() => !!diagnosis.value && matchesValidated.value)

  /** 필수항목(무엇을·기간) 충족 여부 — 미충족 시 검증 요청 자체를 막는다 */
  const requiredFilled = computed(() => {
    const sc = scoreFromText(chatMessage.value)
    return sc.criteria.filter((c) => c.required).every((c) => c.met)
  })

  /** 전송 가능 — 게이트 비활성(다른 에이전트)이면 항상 true */
  const canSend = computed(() => (isGateActive.value ? isValidated.value : true))

  /** 검증 실행 — 백엔드 LLM 진단 호출 (필수항목 미충족 시 차단) */
  const validate = async () => {
    const question = chatMessage.value.trim()
    if (!question || isValidating.value || !requiredFilled.value) return
    isValidating.value = true
    gateStatus.value = 'validating'
    try {
      const result = await fetchDiagnoseQuestion({ question, datamartId: currentDatamartId.value })
      diagnosis.value = result
      validatedQuestion.value = chatMessage.value
      gateStatus.value = result.status === 'READY' && result.sqlGenerationAllowed ? 'passed' : 'needs_fix'
    } catch {
      diagnosis.value = null
      gateStatus.value = 'idle'
      openToast({ message: '질의 검증에 실패했습니다. 잠시 후 다시 시도해주세요.', type: 'error' })
    } finally {
      isValidating.value = false
    }
  }

  /** 게이트 초기화 (질문 보완 후 재검증 대기) */
  const resetGate = () => {
    gateStatus.value = 'idle'
    diagnosis.value = null
    validatedQuestion.value = ''
  }

  /** 범위 밖 대체 통계 클릭 → 질문 치환 후 재검증 대기 */
  const applyAlternative = (alt: string) => {
    chatMessage.value = alt
    resetGate()
  }

  return {
    isGateActive,
    isValidating,
    isValidated,
    requiredFilled,
    canSend,
    diagnosis,
    showDiagnosis,
    validate,
    resetGate,
    applyAlternative,
  }
}
