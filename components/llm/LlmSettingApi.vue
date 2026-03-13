<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 100px;"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">API 설정</span>
      <span class="com-setting-section-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <div class="com-setting-section-body">
      <!-- API 엔드포인트 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          API 엔드포인트
        </label>
        <UiInput
          :model-value="modelValue.apiEndpoint"
          placeholder="https://api.openai.com/v1/chat/completions"
          size="sm"
          @update:model-value="onUpdate('apiEndpoint', $event)"
        />
      </div>

      <!-- API 키 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          API 키
        </label>
        <UiInput
          :model-value="modelValue.apiKey"
          placeholder="API 키를 입력하세요"
          size="sm"
          type="password"
          desc="API 키는 암호화되어 저장됩니다"
          @update:model-value="onUpdate('apiKey', $event)"
        />
      </div>

      <!-- 타임아웃 / 재시도 횟수 -->
      <div class="com-setting-row">
        <div class="com-setting-field-row" style="flex: 1;">
          <label class="com-setting-label">타임아웃 (초)</label>
          <UiInput
            :model-value="modelValue.timeout"
            placeholder="예: GPT-4o"
            type="number"
            size="sm"
            @update:model-value="onUpdate('timeout', $event)"
          />
        </div>
        <div class="com-setting-field-row" style="flex: 1;">
          <label class="com-setting-label">재시도 횟수</label>
          <UiInput
            :model-value="modelValue.retryCount"
            type="number"
            size="sm"
            @update:model-value="onUpdate('retryCount', $event)"
          />
        </div>
      </div>

      <!-- 추가 헤더 (JSON) -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">추가 헤더 (JSON)</label>
        <UiTextarea
          :model-value="modelValue.extraHeaders"
          placeholder='{"X-Custom-Header" : "Value"}'
          :rows="3"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="5"
          @update:model-value="onUpdate('extraHeaders', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ApiForm {
  apiEndpoint: string
  apiKey: string
  timeout: number
  retryCount: number
  extraHeaders: string
}

interface Props {
  modelValue: ApiForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ApiForm]
}>()

const isCollapsed = ref(true)

const onUpdate = (key: keyof ApiForm, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
