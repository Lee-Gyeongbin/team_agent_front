<template>
  <div class="prompt-limit-section">
    <div class="prompt-limit-section-title">사용량 제한</div>

    <div class="prompt-limit-fields-wide">
    <!-- 사용자당 일일 요청 한도 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">사용자당 일일 요청 한도</label>
      <UiInput
        :model-value="modelValue.dayUserLmt"
        type="number"
        size="sm"
        desc="0 = 무제한"
        @update:model-value="onUpdate('dayUserLmt', $event)"
      />
    </div>

    <!-- 조직 전체 월간 한도 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">조직 전체 월간 한도</label>
      <UiInput
        :model-value="modelValue.monOrgLmt"
        type="number"
        size="sm"
        desc="전체 조직의 월간 API 호출 제한"
        @update:model-value="onUpdate('monOrgLmt', $event)"
      />
    </div>

    <!-- Rate Limit -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">Rate Limit (분당 요청)</label>
      <UiInput
        :model-value="modelValue.rateLmtRpm"
        type="number"
        size="sm"
        desc="남용 방지를 위한 속도 제한"
        @update:model-value="onUpdate('rateLmtRpm', $event)"
      />
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
