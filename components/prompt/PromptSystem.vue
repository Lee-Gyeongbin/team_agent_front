<template>
  <div class="prompt-system">
    <div class="prompt-box">
      <!-- 설정 영역 -->
      <PromptSystemSetting
        v-model="settingForm"
        @save="onSave"
        @test="onTest"
      />

      <!-- 구분선 -->
      <div class="prompt-box-divider" />

      <!-- 저장된 프롬프트 목록 -->
      <div class="prompt-saved-section">
        <div class="prompt-saved-title">저장된 프롬프트</div>
        <div class="prompt-saved-list">
          <PromptSystemCard
            v-for="item in systemPromptList"
            :key="item.id"
            :prompt="item"
            @edit="onEdit"
            @copy="onCopy"
            @delete="onDelete"
          />
        </div>
      </div>
    </div>

    <!-- 저장 확인 모달 -->
    <UiDialogModal
      :is-open="isSaveModalOpen"
      title="프롬프트 저장"
      message="프롬프트를 저장하시겠습니까?"
      confirm-text="저장"
      @close="isSaveModalOpen = false"
      @confirm="doSave"
    />

    <!-- 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isDeleteModalOpen"
      title="프롬프트 삭제"
      :message="`'${deletingPrompt?.name}' 프롬프트를 삭제하시겠습니까?`"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { SystemPrompt } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { systemPromptList, handleSelectSystemPromptList, handleSaveSystemPrompt, handleDeleteSystemPrompt } = usePromptStore()

// 설정 폼
const settingForm = ref<Partial<SystemPrompt>>({
  name: '기본 프롬프트 (전체 공통)',
  content:
    '당신은 전문적이고 친절한 B2B 업무 지원 AI 어시스턴트입니다.\n\n다음 지침을 따라주세요:\n- 사용자의 질문에 정확하고 간결하게 답변하세요\n- 업무 관련 정보는 공식 매뉴얼과 데이터베이스를 우선 참고하세요\n- 불확실한 정보는 추측하지 말고 확인이 필요함을 알려주세요\n- 개인정보와 민감한 업무 정보는 보안 규정에 따라 처리하세요\n- 항상 예의바르고 전문적인 톤을 유지하세요',
  temperature: 0.7,
  topP: 0.9,
  targets: ['LLM', 'RAG', 'TextToSQL'],
})

// 초기 조회
onMounted(() => handleSelectSystemPromptList())

// 저장
const isSaveModalOpen = ref(false)
const savingForm = ref<Partial<SystemPrompt>>({})

const onSave = (form: Partial<SystemPrompt>) => {
  savingForm.value = form
  isSaveModalOpen.value = true
}

const doSave = async () => {
  await handleSaveSystemPrompt(savingForm.value)
}

// 테스트
const onTest = () => {
  console.warn('[TODO] 프롬프트 테스트')
}

// 수정 — 폼에 로드
const onEdit = (prompt: SystemPrompt) => {
  settingForm.value = { ...prompt }
}

// 삭제
const isDeleteModalOpen = ref(false)
const deletingPrompt = ref<SystemPrompt | null>(null)

const onDelete = (prompt: SystemPrompt) => {
  deletingPrompt.value = prompt
  isDeleteModalOpen.value = true
}

const doDelete = async () => {
  if (!deletingPrompt.value) return
  await handleDeleteSystemPrompt(deletingPrompt.value.id)
  deletingPrompt.value = null
}

// 복사 — id 제거 후 폼에 로드
const onCopy = (prompt: SystemPrompt) => {
  const { id, ...rest } = prompt
  settingForm.value = { ...rest, name: `${rest.name} (복사)` }
}
</script>
