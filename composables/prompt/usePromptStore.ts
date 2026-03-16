import { usePromptApi } from '~/composables/prompt/usePromptApi'
import type { SystemPrompt } from '~/types/prompt'

const { fetchSystemPromptList, fetchSaveSystemPrompt, fetchDeleteSystemPrompt } = usePromptApi()

// ===== 상태 변수 =====
const systemPromptList = ref<SystemPrompt[]>([])

// ===== 시스템 프롬프트 조회 =====
const handleSelectSystemPromptList = async () => {
  const res = await fetchSystemPromptList()
  systemPromptList.value = res.list
}

// ===== 시스템 프롬프트 추가/수정/삭제 =====
const handleSaveSystemPrompt = async (prompt: Partial<SystemPrompt>) => {
  await fetchSaveSystemPrompt(prompt)
  await handleSelectSystemPromptList()
}

const handleDeleteSystemPrompt = async (id: string) => {
  await fetchDeleteSystemPrompt(id)
  await handleSelectSystemPromptList()
}

export const usePromptStore = () => {
  return {
    systemPromptList,
    handleSelectSystemPromptList,
    handleSaveSystemPrompt,
    handleDeleteSystemPrompt,
  }
}
