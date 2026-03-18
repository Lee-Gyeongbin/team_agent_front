<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 120px"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">API 및 파라미터 설정</span>
      <span class="com-setting-section-arrow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 10l4-4 4 4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
          :model-value="modelValue.apiUrl"
          placeholder="https://api.openai.com/v1/chat/completions"
          size="sm"
          @update:model-value="onUpdate('apiUrl', $event)"
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
          placeholder="sk-..."
          size="sm"
          type="password"
          desc="API 키는 암호화되어 저장됩니다"
          @update:model-value="onUpdate('apiKey', $event)"
        />
      </div>

      <!-- 타임아웃 (초) / 재시도 횟수 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">타임아웃 (초)</label>
          <UiInput
            :model-value="modelValue.tmoSec"
            placeholder="30"
            number-only
            size="sm"
            @update:model-value="onUpdate('tmoSec', $event)"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">재시도 횟수</label>
          <UiInput
            :model-value="modelValue.retryCnt"
            number-only
            size="sm"
            @update:model-value="onUpdate('retryCnt', $event)"
          />
        </div>
      </div>

      <!-- Temperature / Max Tokens -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Temperature</label>
          <UiInput
            :model-value="modelValue.temperature"
            number-only
            allow-decimal
            size="sm"
            desc="0 (결정적) ~ 2 (창의적)"
            @update:model-value="onUpdate('temperature', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Max Tokens</label>
          <UiInput
            :model-value="modelValue.maxTokens"
            number-only
            size="sm"
            @update:model-value="onUpdate('maxTokens', Number($event))"
          />
        </div>
      </div>

      <!-- 추가 헤더 (JSON) -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">추가 헤더 (JSON)</label>
        <UiTextarea
          :model-value="modelValue.custHeaders"
          placeholder='{"X-Custom-Header": "value"}'
          :rows="3"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="5"
          @update:model-value="onUpdate('custHeaders', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** API 및 파라미터 통합 폼 */
interface ApiParamForm {
  apiUrl: string
  apiKey: string
  tmoSec: number
  retryCnt: number
  temperature: number
  maxTokens: number
  custHeaders: string
}

interface Props {
  modelValue: ApiParamForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ApiParamForm]
}>()

const isCollapsed = ref(true)

const onUpdate = (key: keyof ApiParamForm, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
