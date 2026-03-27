<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 120px"
  >
    <div
      class="com-setting-section-header"
      @click="toggleCollapse"
    >
      <span class="com-setting-section-title">LLM 설정</span>
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
      <div class="com-setting-field-row">
        <label class="com-setting-label">LLM</label>
        <div
          class="com-setting-field-input"
          style="flex: 1"
        >
          <UiSelect
            :model-value="modelValue.llmCd"
            :options="llmOptions"
            size="sm"
            @update:model-value="onUpdate('llmCd', $event)"
          />
        </div>
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
  llmOptions: { label: string; value: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: true,
  llmOptions: () => [],
})

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
