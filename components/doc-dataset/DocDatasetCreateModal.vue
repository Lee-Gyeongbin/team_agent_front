<template>
  <UiModal
    :is-open="isOpen"
    title="새 RAG 데이터셋 생성"
    max-width="720px"
    custom-class="doc-dataset-create-modal"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="doc-dataset-create-form com-setting-form">
      <!-- 기본 정보 -->
      <DocDatasetBasicInfo
        :model-value="formData"
        :collapsed="sectionCollapsed[0]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[0] = $event"
      />

      <!-- 데이터 소스 선택 -->
      <DocDatasetSourceSelect
        :model-value="formData"
        :category-list="selectedDatasetCategoryList ?? []"
        :doc-list="selectedDatasetDocList ?? []"
        :url-list="selectedDatasetUrlList ?? []"
        :collapsed="sectionCollapsed[1]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[1] = $event"
      />

      <!-- 전처리 옵션 설정 -->
      <DocDatasetPreprocess
        :model-value="formData"
        :chunk-algorithm-options="chunkAlgorithmOptions"
        :header-inclusion-options="headerInclusionOptions"
        :sentence-split-options="sentenceSplitOptions"
        :language-detection-options="languageDetectionOptions"
        :collapsed="sectionCollapsed[2]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[2] = $event"
      />

      <!-- 임베딩 및 벡터DB -->
      <DocDatasetEmbedding
        :model-value="formData"
        :embedding-model-options="embeddingModelOptions"
        :vector-db-options="vectorDbOptions"
        :normalization-options="normalizationOptions"
        :pooling-options="poolingOptions"
        :dimension-options="dimensionOptions"
        :collapsed="sectionCollapsed[3]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[3] = $event"
      />
    </div>

    <template #footer>
      <div class="doc-dataset-create-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <div class="doc-dataset-create-footer-right">
          <UiButton
            variant="primary-line"
            size="md"
            @click="onSaveLater"
          >
            저장 후 나중에 구축
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            @click="onBuildStart"
          >
            데이터셋 구축 시작
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import DocDatasetBasicInfo from '~/components/doc-dataset/DocDatasetBasicInfo.vue'
import DocDatasetSourceSelect from '~/components/doc-dataset/DocDatasetSourceSelect.vue'
import DocDatasetPreprocess from '~/components/doc-dataset/DocDatasetPreprocess.vue'
import DocDatasetEmbedding from '~/components/doc-dataset/DocDatasetEmbedding.vue'
import type { DocDatasetForm } from '~/types/doc-dataset'
const {
  selectedDatasetCategoryList,
  selectedDatasetDocList,
  selectedDatasetUrlList,
  formData,
  getDefaultForm,
  chunkAlgorithmOptions,
  headerInclusionOptions,
  embeddingModelOptions,
  vectorDbOptions,
  normalizationOptions,
  poolingOptions,
  dimensionOptions,
  sentenceSplitOptions,
  languageDetectionOptions,
  handleSelectCodeOptions,
  sectionCollapsed,
  validate,
} = useDocDatasetStore()

const props = defineProps<{
  isOpen: boolean
  mode?: 'create' | 'edit'
  initialFormData?: Partial<DocDatasetForm>
}>()

const emit = defineEmits<{
  close: []
  save: [data: DocDatasetForm, startBuild: boolean]
}>()

// 모달 열릴 때 폼 초기화 + 데이터 로드
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      Object.assign(formData, getDefaultForm())
      if (props.mode === 'edit' && props.initialFormData) {
        Object.assign(formData, props.initialFormData)
      }
      Object.assign(sectionCollapsed, [false, true, true, true])
    }
  },
)

onMounted(() => {
  handleSelectCodeOptions()
})

// ===== 액션 =====
const onSaveLater = () => {
  if (!validate()) return
  emit('save', { ...formData }, false)
}

const onBuildStart = () => {
  if (!validate()) return
  emit('save', { ...formData }, true)
}
</script>
