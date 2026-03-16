<template>
  <div class="prompt-limit-section">
    <div class="prompt-limit-section-title">응답 품질 제어</div>

    <div class="prompt-limit-fields">
    <!-- 최소 응답 길이 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">최소 응답 길이</label>
      <UiInput
        :model-value="modelValue.minResponseLength"
        type="number"
        size="sm"
        desc="너무 짧은 응답 방지 (토큰 수)"
        @update:model-value="onUpdate('minResponseLength', $event)"
      />
    </div>

    <!-- 응답 타임아웃 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">응답 타임아웃</label>
      <UiInput
        :model-value="modelValue.responseTimeout"
        type="number"
        size="sm"
        desc="최대 대기 시간 (초)"
        @update:model-value="onUpdate('responseTimeout', $event)"
      />
    </div>

    <!-- 재시도 횟수 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">재시도 횟수</label>
      <div class="prompt-limit-field-input">
        <UiSelect
          :model-value="String(modelValue.retryCount)"
          :options="retryOptions"
          size="sm"
          @update:model-value="onUpdate('retryCount', Number($event))"
        />
        <p class="prompt-limit-hint">오류 발생 시 재시도 횟수</p>
      </div>
    </div>

    <!-- 스트리밍 응답 -->
    <div class="prompt-limit-field">
      <label class="prompt-limit-label">스트리밍 응답</label>
      <div class="prompt-limit-field-input">
        <UiSelect
          :model-value="modelValue.streamingEnabled ? 'true' : 'false'"
          :options="streamingOptions"
          size="sm"
          @update:model-value="onUpdateStreaming($event)"
        />
        <p class="prompt-limit-hint">실시간 응답 스트리밍</p>
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

const retryOptions = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '5', value: '5' },
]

const streamingOptions = [
  { label: '활성화', value: 'true' },
  { label: '비활성화', value: 'false' },
]

const onUpdate = (key: keyof PromptLimitData, value: number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onUpdateStreaming = (value: string) => {
  emit('update:modelValue', { ...props.modelValue, streamingEnabled: value === 'true' })
}
</script>
