import type { Agent } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

/** Agent 관리 메뉴 — TB_AGT_SUB_CFG.SUB_TY 값 */
export const PLANNER_SUB_TY = 'PLANNER'

/** svcTy=C · USE_YN=Y · subTy=PLANNER — 채팅 에이전트 선택·전송용 */
export const isPlannerAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === PLANNER_SUB_TY
}
