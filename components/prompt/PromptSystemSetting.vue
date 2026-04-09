<template>
  <div class="prompt-system-setting">
    <div class="prompt-box-header">
      <div class="prompt-box-title">
        <span class="prompt-box-name">시스템 프롬프트 설정</span>
        <span class="prompt-box-sub">부서별, 역할별로 다른 시스템 프롬프트를 설정할 수 있습니다.</span>
      </div>
      <UiButton
        variant="secondary"
        size="sm"
        @click="resetSettingForm"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        새 프롬프트
      </UiButton>
    </div>

    <div class="prompt-system-setting-body">
      <!-- 상세 설정 타이틀 -->
      <div class="com-setting-section-title is-inline">상세 설정</div>

      <section
        v-if="form.sysPtYn === 'Y'"
        class="tmpl-edit-notice"
        aria-label="시스템 프롬프트 안내"
      >
        <i
          class="icon icon-info size-18 tmpl-edit-notice__icon"
          aria-hidden="true"
        />
        <p class="tmpl-edit-notice__text">
          ※ 시스템 프롬프트는 시스템 내장형 프롬프트로, LLM 질의 및 선택한 에이전트에 공통으로 적용되는 기본 지침입니다.
          정보수정에 주의해주세요.
        </p>
      </section>

      <!-- 프롬프트 명 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span> 프롬프트 명</label>
        <UiInput
          :disabled="form.sysPtYn === 'Y'"
          :model-value="form.promptName"
          size="sm"
          placeholder="프롬프트 명을 입력하세요"
          @update:model-value="onUpdateForm('promptName', $event)"
        />
      </div>

      <!-- 프롬프트 유형 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span> 프롬프트 유형</label>
        <UiSelect
          :disabled="form.sysPtYn === 'Y'"
          :model-value="form.promptTypeCd"
          :options="typeOptions"
          size="sm"
          placeholder="프롬프트 유형 선택"
          @update:model-value="onUpdateForm('promptTypeCd', $event)"
        />
      </div>

      <!-- 우선순위 -->
      <!-- <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span> 우선순위</label>
        <UiInput
          :disabled="form.sysPtYn === 'Y'"
          :model-value="form.priority ?? ''"
          size="sm"
          number-only
          placeholder="우선순위를 입력하세요"
          @update:model-value="onUpdateForm('priority', $event === '' ? 0 : Number($event))"
        />
      </div> -->

      <!-- 시스템 프롬프트 -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">프롬프트</label>
        <UiTextarea
          :model-value="form.content"
          placeholder="프롬프트를 입력하세요"
          :rows="6"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="12"
          @update:model-value="onUpdateForm('content', $event)"
        />
      </div>

      <!-- 적용 대상 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">적용 대상</label>
        <div class="com-setting-checkbox-group">
          <UiCheckbox
            :model-value="form.applyLlmYn === 'Y'"
            label="LLM 질의"
            @update:model-value="onToggleApply('applyLlmYn', $event)"
          />
          <UiCheckbox
            v-for="agent in agentList"
            :key="agent.agentId"
            :model-value="isAgentApplied(agent.agentId)"
            :label="agent.agentNm"
            @update:model-value="onToggleAgentApply(agent.agentId, $event)"
          />
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="prompt-system-setting-footer">
      <UiButton
        variant="primary-line"
        size="md"
        @click="$emit('test')"
      >
        테스트
      </UiButton>
      <UiButton
        variant="primary"
        size="md"
        @click="$emit('save', form)"
      >
        저장
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeItem } from '~/types/codes'
import type { SystemPrompt } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

interface Props {
  modelValue: Partial<SystemPrompt>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<SystemPrompt>]
  save: [form: Partial<SystemPrompt>]
  test: []
}>()

const { resetSettingForm, agentList, promptAppAgtList } = usePromptStore()

const form = computed(() => props.modelValue)

const typeOptions = ref<{ label: string; value: string }[]>([])
const initTypeOptions = async () => {
  const codes = await getCodes('PR000001')
  typeOptions.value = [
    { label: '선택', value: '' },
    ...codes.map((item: CodeItem) => ({
      label: item.codeNm,
      value: item.codeId,
    })),
  ]
}

onMounted(() => {
  initTypeOptions()
})

const onUpdateForm = (key: string, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onToggleApply = (key: 'applyLlmYn', checked: boolean) => {
  emit('update:modelValue', { ...props.modelValue, [key]: checked ? 'Y' : 'N' })
}

const agentApplyYnMap = computed(() => {
  const map = new Map<string, boolean>()
  const currentPromptId = form.value?.promptId ?? ''
  for (const item of promptAppAgtList.value) {
    if (item.promptId === currentPromptId) {
      map.set(item.agentId, item.applyYn === 'Y')
    }
  }
  return map
})

const isAgentApplied = (agentId: string) => agentApplyYnMap.value.get(agentId) ?? false

const onToggleAgentApply = (agentId: string, checked: boolean) => {
  const currentPromptId = form.value?.promptId ?? ''

  const nextApplyYn: 'Y' | 'N' = checked ? 'Y' : 'N'
  const exists = promptAppAgtList.value.some((item) => item.promptId === currentPromptId && item.agentId === agentId)

  promptAppAgtList.value = exists
    ? promptAppAgtList.value.map((item) => {
        if (item.promptId === currentPromptId && item.agentId === agentId) {
          return { ...item, applyYn: nextApplyYn }
        }
        return item
      })
    : [...promptAppAgtList.value, { promptId: currentPromptId, agentId, applyYn: nextApplyYn }]
}
</script>

<style lang="scss" scoped>
// TmplFormPanel.vue의 .tmpl-edit-notice와 동일 (내장 템플릿 수정 안내 박스)
.tmpl-edit-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: $color-background;
}

.tmpl-edit-notice__icon {
  flex-shrink: 0;
  color: $color-text-secondary;
  margin-top: 1px;
}

.tmpl-edit-notice__text {
  margin: 0;
  @include typo($body-small);
  color: var(--color-primary);
  line-height: $line-height-base;
}
</style>
