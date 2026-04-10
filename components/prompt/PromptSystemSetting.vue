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

      <!-- 적용 대상 (LLM은 폼 applyLlmYn, 에이전트는 promptAppAgtList) -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">적용 대상</label>
        <UiMultiSelect
          id="prompt-apply-targets"
          :model-value="applyTargetsUiModel"
          name="prompt-apply-targets"
          :options="applyTargetOptions"
          size="sm"
          placeholder="적용 대상 선택"
          class="prompt-apply-targets-select"
          @update:model-value="onApplyTargetsMultiChange"
        />
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

/** LLM 질의 — agentId와 겹치지 않는 sentinel (멀티셀렉트 표시 ↔ 폼 applyLlmYn) */
const APPLY_LLM_KEY = '__prompt_apply_llm__'

const applyTargetOptions = computed(() => [
  { label: 'LLM 질의', value: APPLY_LLM_KEY },
  ...agentList.value.map((a) => ({ label: a.agentNm, value: a.agentId })),
])

const applyTargetsUiModel = computed(() => {
  const currentPromptId = form.value?.promptId ?? ''
  const agentIds: string[] = []
  for (const item of promptAppAgtList.value) {
    if (item.promptId === currentPromptId && item.applyYn === 'Y') {
      agentIds.push(String(item.agentId))
    }
  }
  const llm = form.value?.applyLlmYn === 'Y' ? [APPLY_LLM_KEY] : []
  return [...llm, ...agentIds]
})

const onApplyTargetsMultiChange = (next: Array<string | number>) => {
  const n = next.map(String)
  const hasLlm = n.includes(APPLY_LLM_KEY)
  const prevLlm = props.modelValue.applyLlmYn === 'Y'
  if (hasLlm !== prevLlm) {
    emit('update:modelValue', { ...props.modelValue, applyLlmYn: hasLlm ? 'Y' : 'N' })
  }

  const reals = agentList.value.map((a) => String(a.agentId))
  const selected = n.filter((x) => x !== APPLY_LLM_KEY && reals.includes(x))
  const selectedSet = new Set(selected)
  const currentPromptId = form.value?.promptId ?? ''

  const nextList = [...promptAppAgtList.value]
  for (const agentId of reals) {
    const shouldApply = selectedSet.has(agentId)
    const idx = nextList.findIndex((item) => item.promptId === currentPromptId && String(item.agentId) === agentId)
    if (idx >= 0) {
      nextList[idx] = { ...nextList[idx], applyYn: shouldApply ? 'Y' : 'N' }
    } else if (shouldApply) {
      nextList.push({ promptId: currentPromptId, agentId, applyYn: 'Y' })
    }
  }
  promptAppAgtList.value = nextList
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

// 적용 대상 멀티셀렉트 (필드 행 나머지 폭)
.prompt-apply-targets-select {
  flex: 1;
  min-width: 0;
}

:deep(.prompt-apply-targets-select.ui-multi-select-wrap) {
  width: 100%;
}
</style>
