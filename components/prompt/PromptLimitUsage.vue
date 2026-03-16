<template>
  <div class="prompt-limit-section">
    <div class="prompt-limit-section-title">사용량 제한</div>

    <div class="prompt-limit-fields-wide">
    <!-- 사용자당 일일 요청 한도 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">사용자당 일일 요청 한도</label>
      <UiInput
        :model-value="modelValue.dailyRequestLimit"
        type="number"
        size="sm"
        desc="0 = 무제한"
        @update:model-value="onUpdate('dailyRequestLimit', $event)"
      />
    </div>

    <!-- 조직 전체 월간 한도 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">조직 전체 월간 한도</label>
      <UiInput
        :model-value="modelValue.monthlyOrgLimit"
        type="number"
        size="sm"
        desc="전체 조직의 월간 API 호출 제한"
        @update:model-value="onUpdate('monthlyOrgLimit', $event)"
      />
    </div>

    <!-- Rate Limit -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">Rate Limit (분당 요청)</label>
      <UiInput
        :model-value="modelValue.rateLimit"
        type="number"
        size="sm"
        desc="남용 방지를 위한 속도 제한"
        @update:model-value="onUpdate('rateLimit', $event)"
      />
    </div>

    <!-- 현재 사용량 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label is-primary">📈 현재 사용량</label>
      <div class="prompt-limit-highlight is-blue">
        오늘: <strong>{{ modelValue.todayUsage.toLocaleString() }}</strong> / 일일한도 없음<br>
        이번 달: <strong>{{ modelValue.monthUsage.toLocaleString() }}</strong> / <strong>{{ modelValue.monthLimit.toLocaleString() }}</strong>
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
