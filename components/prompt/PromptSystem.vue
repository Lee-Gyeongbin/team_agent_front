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
        <div class="prompt-saved-header">
          <div class="prompt-saved-title">저장된 프롬프트</div>
          <UiSelect
            :model-value="selectedApplyAgentId"
            :options="savedPromptFilterOptions"
            size="sm"
            placeholder="적용 에이전트 선택"
            class="prompt-saved-agent-select"
            @update:model-value="onChangeSelectedApplyAgent"
          />
        </div>
        <template v-if="filteredSystemPromptList.length === 0">
          <UiEmpty description="조건에 맞는 시스템 프롬프트가 없습니다." />
        </template>
        <div
          v-else
          class="prompt-saved-list"
        >
          <PromptSystemCard
            v-for="item in filteredSystemPromptList"
            :key="item.promptId"
            :prompt="item"
            @edit="onEdit"
            @copy="onCopy"
            @toggle="onToggle"
            @delete="onDelete"
          />
        </div>
      </div>
    </div>

    <!-- 프롬프트 테스트 모달 -->
    <PromptTestModal
      :is-open="isTestOpen"
      :prompt-content="settingForm.content ?? ''"
      @close="isTestOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { SystemPrompt } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const {
  systemPromptList,
  settingForm,
  applyAgentOptions,
  promptAppAgtList,
  handleSelectSystemPromptList,
  handleToggleSystemPrompt,
  handleDeleteSystemPrompt,
  handleSaveSystemPrompt,
} = usePromptStore()

const settingFormModel = computed({
  get: () => settingForm.value,
  set: (value: Partial<SystemPrompt>) => {
    settingForm.value = value
  },
})

const selectedApplyAgentId = ref('')

const savedPromptFilterOptions = computed(() => [{ label: '전체', value: '' }, ...applyAgentOptions.value])

const filteredSystemPromptList = computed(() => {
  if (isEmpty(selectedApplyAgentId.value)) {
    return systemPromptList.value
  }

  const selectedAgentId = String(selectedApplyAgentId.value)
  const matchedPromptIdSet = new Set(
    promptAppAgtList.value
      .filter((item) => String(item.agentId) === selectedAgentId && item.applyYn === 'Y')
      .map((item) => item.promptId),
  )
  return systemPromptList.value.filter((item) => matchedPromptIdSet.has(item.promptId))
})

const onChangeSelectedApplyAgent = (value: string | number) => {
  selectedApplyAgentId.value = String(value ?? '')
}

onMounted(() => {
  handleSelectSystemPromptList()
})

/** 프롬프트 테스트 */
const isTestOpen = ref(false)
const onTest = () => {
  if (isEmpty(settingForm.value.content)) {
    openToast({ message: '프롬프트 내용을 입력해주세요.' })
    return
  }
  isTestOpen.value = true
}

/** 프롬프트 저장 */
const onSave = async (prompt: Partial<SystemPrompt>) => {
  await handleSaveSystemPrompt(prompt)
}

/** 프롬프트 수정 */
const onEdit = (prompt: SystemPrompt) => {
  settingForm.value = { ...prompt }
}

/** 프롬프트 활성/비활성 토글 */
const onToggle = async (prompt: SystemPrompt) => {
  await handleToggleSystemPrompt({
    ...prompt,
    useYn: prompt.useYn === 'Y' ? 'N' : 'Y',
  })
}

/** 프롬프트 삭제 */
const onDelete = async (prompt: SystemPrompt) => {
  await handleDeleteSystemPrompt(prompt)
}

/** 프롬프트 복사 */
const onCopy = async (prompt: SystemPrompt) => {
  await copyToClipboard(prompt.content)
  openToast({ message: '프롬프트가 복사되었습니다.' })
}
</script>

<style lang="scss" scoped>
.prompt-saved-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prompt-saved-agent-select {
  width: 220px;
  flex-shrink: 0;
}
</style>
