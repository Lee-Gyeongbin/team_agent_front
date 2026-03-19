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
      <span class="com-setting-section-title">임베딩 및 벡터DB</span>
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
      <!-- 임베딩 모델 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">임베딩 모델</label>
        <div class="com-setting-field-input" style="flex: 1">
          <UiSelect
            :model-value="modelValue.embeddingModel"
            :options="props.embeddingModelOptions"
            size="sm"
            @update:model-value="onUpdate('embeddingModel', $event)"
          />
          <span class="com-setting-hint">API 키는 암호화되어 저장됩니다</span>
        </div>
      </div>

      <!-- 벡터 DB / 임베딩 정규화 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">벡터 DB</label>
          <UiSelect
            :model-value="modelValue.vectorDb"
            :options="props.vectorDbOptions"
            size="sm"
            @update:model-value="onUpdate('vectorDb', $event)"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">임베딩 정규화</label>
          <UiSelect
            :model-value="modelValue.embeddingNormalization"
            :options="props.normalizationOptions"
            size="sm"
            @update:model-value="onUpdate('embeddingNormalization', $event)"
          />
        </div>
      </div>

      <!-- Pooling 전략 / 차수 축소 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Pooling 전략</label>
          <UiSelect
            :model-value="modelValue.poolingStrategy"
            :options="props.poolingOptions"
            size="sm"
            @update:model-value="onUpdate('poolingStrategy', $event)"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">차수 축소 (선택)</label>
          <UiSelect
            :model-value="modelValue.dimensionReduction"
            :options="props.dimensionOptions"
            size="sm"
            @update:model-value="onUpdate('dimensionReduction', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocDatasetForm } from '~/types/doc-dataset'

interface Props {
  modelValue: DocDatasetForm
  collapsed?: boolean
  embeddingModelOptions: { label: string; value: string }[]
  vectorDbOptions: { label: string; value: string }[]
  normalizationOptions: { label: string; value: string }[]
  poolingOptions: { label: string; value: string }[]
  dimensionOptions: { label: string; value: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: true,
  embeddingModelOptions: () => [],
  vectorDbOptions: () => [],
  normalizationOptions: () => [],
  poolingOptions: () => [],
  dimensionOptions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: DocDatasetForm]
  'update:collapsed': [value: boolean]
}>()

const isCollapsed = ref(props.collapsed)

watch(() => props.collapsed, (v) => { isCollapsed.value = v })

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

const onUpdate = (key: keyof DocDatasetForm, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

</script>
