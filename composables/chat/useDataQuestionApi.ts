import { useApi } from '~/composables/com/useApi'
import type { QuestionDiagnosis } from '~/types/dataQuestion'

/**
 * 데이터분석 질문 Tier 2 진단 API (LLM)
 *
 * 검증(검증 버튼) 시 백엔드 LLM이 평가기준(지표/기간/대상/집계/데이터매핑/출력)을
 * 프롬프트로 적용해 점수·상태·보완질문을 산정한다. (제안서 §2·§3·§6)
 * - 평가기준/배점/임계는 백엔드 프롬프트에 위치 (프론트는 결과만 소비)
 * - 응답 계약: QuestionDiagnosis
 *
 * ⚠️ 엔드포인트 경로는 백엔드 구현에 맞춰 확정 필요.
 */
export const useDataQuestionApi = () => {
  const { post } = useApi()

  /** 질문 진단 — status별 후속 흐름 결정 */
  const fetchDiagnoseQuestion = async (params: {
    question: string
    datamartId: string
  }): Promise<QuestionDiagnosis> => {
    return post<QuestionDiagnosis>('/ai/chatbot/diagnoseQuestion.do', params)
  }

  return { fetchDiagnoseQuestion }
}
