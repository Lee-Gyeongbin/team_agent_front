import { usePromptApi } from '~/composables/prompt/usePromptApi'
import type { SystemPrompt, PromptTemplate } from '~/types/prompt'

const {
  fetchSystemPromptList,
  fetchSaveSystemPrompt,
  fetchDeleteSystemPrompt,
  fetchTemplateList,
  fetchSaveTemplate,
  fetchDeleteTemplate,
} = usePromptApi()

// ===== 상태 변수 =====
const systemPromptList = ref<SystemPrompt[]>([])
const templateList = ref<PromptTemplate[]>([])

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

// ===== 템플릿 조회 =====
const handleSelectTemplateList = async () => {
  const res = await fetchTemplateList()
  templateList.value = res.list
}

// ===== 템플릿 추가/수정/삭제 =====
const handleSaveTemplate = async (template: Partial<PromptTemplate>) => {
  await fetchSaveTemplate(template)
  await handleSelectTemplateList()
}

const handleDeleteTemplate = async (id: string) => {
  await fetchDeleteTemplate(id)
  await handleSelectTemplateList()
}

export const usePromptStore = () => {
  return {
    systemPromptList,
    handleSelectSystemPromptList,
    handleSaveSystemPrompt,
    handleDeleteSystemPrompt,
    templateList,
    handleSelectTemplateList,
    handleSaveTemplate,
    handleDeleteTemplate,
  }
}
