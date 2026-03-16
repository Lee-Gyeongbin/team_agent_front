<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 100px"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">API 설정</span>
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
      <!-- API URL -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          API URL
        </label>
        <UiInput
          :model-value="modelValue.apiUrl"
          placeholder="API URL을 입력하세요"
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
          placeholder="API 키를 입력하세요"
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
            type="number"
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
            type="number"
            size="sm"
            @update:model-value="onUpdate('retryCnt', $event)"
          />
        </div>
      </div>

      <!-- 추가 헤더 (JSON) -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">추가 헤더 (JSON)</label>
        <UiTextarea
          :model-value="modelValue.custHeaders"
          placeholder="추가 헤더를 입력하세요"
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
/** API 설정 폼 (modelId는 기본 정보에서 관리) */
interface ApiForm {
  apiUrl: string
  apiKey: string
  tmoSec: number
  retryCnt: number
  custHeaders: string
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
