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
            :options="embeddingModelOptions"
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
            :options="vectorDbOptions"
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
            :options="normalizationOptions"
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
            :options="poolingOptions"
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
            :options="dimensionOptions"
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
}

const props = withDefaults(defineProps<Props>(), { collapsed: true })

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

// ===== 셀렉트 옵션 =====
const embeddingModelOptions = [
  { label: 'text-embedding-3-large (OpenAI)', value: 'text-embedding-3-large' },
  { label: 'text-embedding-3-small (OpenAI)', value: 'text-embedding-3-small' },
  { label: 'voyage-3 (Anthropic)', value: 'voyage-3' },
  { label: 'bge-m3 (BAAI)', value: 'bge-m3' },
]

const vectorDbOptions = [
  { label: 'Pinecone', value: 'pinecone' },
  { label: 'Weaviate', value: 'weaviate' },
  { label: 'Milvus', value: 'milvus' },
  { label: 'ChromaDB', value: 'chromadb' },
]

const normalizationOptions = [
  { label: 'L2 정규화 (권장)', value: 'l2' },
  { label: '정규화 없음', value: 'none' },
  { label: 'Min-Max', value: 'minmax' },
]

const poolingOptions = [
  { label: 'Mean pooling', value: 'mean' },
  { label: 'CLS pooling', value: 'cls' },
  { label: 'Max pooling', value: 'max' },
]

const dimensionOptions = [
  { label: '사용 안 함', value: 'none' },
  { label: 'PCA', value: 'pca' },
  { label: 'UMAP', value: 'umap' },
]
</script>
