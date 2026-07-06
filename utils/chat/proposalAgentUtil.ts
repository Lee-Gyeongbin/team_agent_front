import type { Agent } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

/** Agent 관리 메뉴 — TB_AGT_SUB_CFG.SUB_TY 값 */
export const PROPOSAL_SUB_TY = 'PROPOSAL'

/** svcTy=D · USE_YN=Y · subTy=PROPOSAL — 채팅 에이전트 선택·전송용 */
export const isProposalAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'D') return false
  return getAgentSubTy(agent.subCfg) === PROPOSAL_SUB_TY
}
