<template>
  <div class="prompt-limit-section">
    <div class="prompt-limit-section-title">토큰 제한</div>

    <div class="prompt-limit-fields">
    <!-- 최대 입력 토큰 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">최대 입력 토큰</label>
      <UiInput
        :model-value="modelValue.maxInputTokens"
        type="number"
        size="sm"
        desc="사용자 입력 + 시스템 프롬프트 합산"
        @update:model-value="onUpdate('maxInputTokens', $event)"
      />
    </div>

    <!-- 최대 출력 토큰 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">최대 출력 토큰</label>
      <UiInput
        :model-value="modelValue.maxOutputTokens"
        type="number"
        size="sm"
        desc="챗봇 응답 최대 길이"
        @update:model-value="onUpdate('maxOutputTokens', $event)"
      />
    </div>

    <!-- 컨텍스트 윈도우 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">컨텍스트 윈도우</label>
      <UiInput
        :model-value="modelValue.contextWindow"
        type="number"
        size="sm"
        desc="대화 이력 유지 범위"
        @update:model-value="onUpdate('contextWindow', $event)"
      />
    </div>

    <!-- 예상 비용 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label is-warning">💡 예상 비용</label>
      <div class="prompt-limit-highlight is-yellow">
        현재 설정 기준 약 $0.15/요청 (GPT-4o 기준)
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PromptLimitData } from '~/types/prompt'

interface Props {
  modelValue: PromptLimitData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: PromptLimitData]
}>()

const onUpdate = (key: keyof PromptLimitData, value: number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
