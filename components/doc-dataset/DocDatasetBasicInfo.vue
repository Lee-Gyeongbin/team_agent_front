<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 100px"
  >
    <div
      class="com-setting-section-header"
      @click="toggleCollapse"
    >
      <span class="com-setting-section-title">기본 정보</span>
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
      <!-- 데이터셋 이름 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">
          <span class="is-required">*</span>
          데이터셋 이름
        </label>
        <UiInput
          :model-value="modelValue.name"
          placeholder="예: ERP 지식베이스"
          size="sm"
          @update:model-value="onUpdate('name', $event)"
        />
      </div>

      <!-- 설명 -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">설명</label>
        <UiTextarea
          :model-value="modelValue.description"
          placeholder="데이터셋에 대한 간단한 설명을 입력하세요"
          :rows="3"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="5"
          @update:model-value="onUpdate('description', $event)"
        />
      </div>

      <!-- 버전 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">버전</label>
        <UiInput
          :model-value="modelValue.version"
          placeholder="예: v1.0"
          size="sm"
          @update:model-value="onUpdate('version', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRaw } from 'vue'
import type { DocDatasetForm } from '~/types/doc-dataset'

interface Props {
  modelValue: DocDatasetForm
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), { collapsed: false })

const emit = defineEmits<{
  'update:modelValue': [value: DocDatasetForm]
  'update:collapsed': [value: boolean]
}>()

const isCollapsed = ref(props.collapsed)

watch(
  () => props.collapsed,
  (v) => {
    isCollapsed.value = v
  },
)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

const onUpdate = (key: keyof DocDatasetForm, value: string) => {
  emit('update:modelValue', { ...toRaw(props.modelValue), [key]: value } as DocDatasetForm)
}
</script>
