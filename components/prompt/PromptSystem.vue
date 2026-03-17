<template>
  <div class="prompt-system">
    <div class="prompt-box">
      <!-- 설정 영역 -->
      <PromptSystemSetting
        v-model="settingFormModel"
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
            :key="item.promptId"
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
      :message="`'${deletingPrompt?.promptName}' 프롬프트를 삭제하시겠습니까?`"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { SystemPrompt } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const {
  systemPromptList,
  settingForm,
  handleSelectSystemPromptList,
  handleSaveSystemPrompt,
  handleDeleteSystemPrompt,
} = usePromptStore()

const settingFormModel = computed({
  get: () => settingForm.value,
  set: (value: Partial<SystemPrompt>) => {
    settingForm.value = value
  },
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
  isSaveModalOpen.value = false
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
  await handleDeleteSystemPrompt(deletingPrompt.value.promptId)
  isDeleteModalOpen.value = false
  deletingPrompt.value = null
}

// 복사 — id 제거 후 폼에 로드
const onCopy = (prompt: SystemPrompt) => {
  const { promptId, ...rest } = prompt
  const baseName = rest.promptName ?? '새 프롬프트'
  settingForm.value = { ...rest, promptName: `${baseName} (복사)` }
}
</script>
