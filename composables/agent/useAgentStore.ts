import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent } from '~/types/agent'

const { fetchAgentList, fetchSaveAgent } = useAgentApi() // API 함수 가져오기

const agentList = ref<Agent[]>([]) // 빈 배열

const handleSelectAgentList = async () => {
  const res = await fetchAgentList() // API 호출
  agentList.value = res.list // 결과 저장
}

const handleSaveAgent = async (agent: Partial<Agent>) => {
  await fetchSaveAgent(agent) // API 호출
  await handleSelectAgentList() // 저장 후 목록 다시 조회
}

export const useAgentStore = () => {
  return { agentList, handleSelectAgentList, handleSaveAgent }
}
