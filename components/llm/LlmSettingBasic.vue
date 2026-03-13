<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 80px;"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">기본 정보</span>
      <span class="com-setting-section-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <div class="com-setting-section-body">
      <!-- 모델명 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          모델명
        </label>
        <UiInput
          :model-value="modelValue.name"
          placeholder="예: GPT-4o"
          size="sm"
          @update:model-value="onUpdate('name', $event)"
        />
      </div>

      <!-- 모델 ID -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          모델 ID
        </label>
        <UiInput
          :model-value="modelValue.modelId"
          placeholder="예: GPT-4o"
          size="sm"
          @update:model-value="onUpdate('modelId', $event)"
        />
      </div>

      <!-- Provider -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          Provider
        </label>
        <UiSelect
          :model-value="modelValue.provider"
          :options="providerOptions"
          placeholder="선택하세요"
          size="sm"
          @update:model-value="onUpdate('provider', $event)"
        />
      </div>

      <!-- 버전 / 상태 -->
      <div class="com-setting-row">
        <div class="com-setting-field-row" style="flex: 1;">
          <label class="com-setting-label">버전</label>
          <UiInput
            :model-value="modelValue.version"
            placeholder="예: 2024-11-20"
            size="sm"
            @update:model-value="onUpdate('version', $event)"
          />
        </div>
        <div class="com-setting-field-row" style="flex: 1;">
          <label class="com-setting-label">
            <span class="is-required">*</span>
            상태
          </label>
          <UiSelect
            :model-value="modelValue.status"
            :options="statusOptions"
            size="sm"
            @update:model-value="onUpdate('status', $event)"
          />
        </div>
      </div>

      <!-- 설명 -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">설명</label>
        <UiTextarea
          :model-value="modelValue.description"
          placeholder="모델에 대한 설명을 입력하세요"
          :rows="3"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="5"
          @update:model-value="onUpdate('description', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BasicForm {
  name: string
  modelId: string
  provider: string
  version: string
  status: string
  description: string
}

interface Props {
  modelValue: BasicForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BasicForm]
}>()

const isCollapsed = ref(false)

const onUpdate = (key: keyof BasicForm, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const providerOptions = [
  { label: 'OpenAI', value: 'OpenAI' },
  { label: 'Google', value: 'Google' },
  { label: 'Anthropic', value: 'Anthropic' },
  { label: 'Meta', value: 'Meta' },
]

const statusOptions = [
  { label: '활성', value: '활성' },
  { label: '비활성', value: '비활성' },
]
</script>
