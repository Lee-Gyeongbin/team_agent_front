<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <div
      class="com-setting-section-header"
      @click="toggleCollapse"
    >
      <span class="com-setting-section-title">데이터 소스 선택</span>
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
      <!-- 문서 패널 -->
      <DocDatasetSourceDoc
        :use-document="modelValue.useDocument"
        :selected-doc-ids="modelValue.selectedDocIds"
        :doc-list="docList"
        :category-list="categoryList"
        @update:use-document="onUpdate('useDocument', $event)"
        @update:selected-doc-ids="onUpdate('selectedDocIds', $event)"
      />

      <!-- URL 패널 -->
      <DocDatasetSourceUrl
        :use-url="modelValue.useUrl"
        :selected-url-ids="modelValue.selectedUrlIds"
        :url-list="urlList"
        :category-list="categoryList"
        @update:use-url="onUpdate('useUrl', $event)"
        @update:selected-url-ids="onUpdate('selectedUrlIds', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocDatasetSourceDoc from '~/components/doc-dataset/DocDatasetSourceDoc.vue'
import DocDatasetSourceUrl from '~/components/doc-dataset/DocDatasetSourceUrl.vue'
import type { CategoryItem, DocDatasetForm, DocDatasetSelectedDoc, DocDatasetSelectedUrl } from '~/types/doc-dataset'

interface Props {
  modelValue: DocDatasetForm
  categoryList: CategoryItem[]
  docList: DocDatasetSelectedDoc[]
  urlList: DocDatasetSelectedUrl[]
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), { collapsed: true })

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

const onUpdate = (key: keyof DocDatasetForm, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
