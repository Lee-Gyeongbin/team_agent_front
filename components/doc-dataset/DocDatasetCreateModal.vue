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
        :doc-list="docList"
        :url-list="urlList"
        :collapsed="sectionCollapsed[1]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[1] = $event"
      />

      <!-- 전처리 옵션 설정 -->
      <DocDatasetPreprocess
        :model-value="formData"
        :collapsed="sectionCollapsed[2]"
        @update:model-value="Object.assign(formData, $event)"
        @update:collapsed="sectionCollapsed[2] = $event"
      />

      <!-- 임베딩 및 벡터DB -->
      <DocDatasetEmbedding
        :model-value="formData"
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
import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import { openToast } from '~/composables/useToast'
import type { DocDatasetForm, DocFile, DocUrl } from '~/types/doc-dataset'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: DocDatasetForm, startBuild: boolean]
}>()

const { fetchDocFileList, fetchUrlList } = useDocDatasetApi()

// ===== 폼 상태 =====
const getDefaultForm = (): DocDatasetForm => ({
  name: '',
  description: '',
  version: '',
  useDocument: true,
  selectedDocIds: [],
  useUrl: true,
  selectedUrlIds: [],
  chunkAlgorithm: 'recursive',
  chunkSize: 128000,
  chunkOverlap: 0,
  minChunkSize: 0,
  headerInclusion: 'prepend',
  useLowercasing: true,
  useWhitespaceNorm: false,
  useSpecialCharRemoval: false,
  useHtmlTagRemoval: true,
  useStopwordRemoval: true,
  useCodeBlockPreserve: true,
  sentenceSplitAlgorithm: 'rule',
  languageDetection: 'auto',
  embeddingModel: 'text-embedding-3-large',
  vectorDb: 'pinecone',
  embeddingNormalization: 'l2',
  poolingStrategy: 'mean',
  dimensionReduction: 'none',
})

const formData = reactive<DocDatasetForm>(getDefaultForm())

// ===== 섹션 접기 상태 (기본정보만 열림) =====
const sectionCollapsed = reactive([false, true, true, true])

// ===== 데이터 소스 목록 =====
const docList = ref<DocFile[]>([])
const urlList = ref<DocUrl[]>([])

const handleSelectSources = async () => {
  const [docRes, urlRes] = await Promise.all([fetchDocFileList(), fetchUrlList()])
  docList.value = docRes.list
  urlList.value = urlRes.list
}

// 모달 열릴 때 폼 초기화 + 데이터 로드
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      Object.assign(formData, getDefaultForm())
      Object.assign(sectionCollapsed, [false, true, true, true])
      handleSelectSources()
    }
  },
)

// ===== 유효성 검사 =====
const validate = (): boolean => {
  if (!formData.name.trim()) {
    openToast({ message: '데이터셋 이름을 입력해주세요.', type: 'warning' })
    sectionCollapsed[0] = false
    return false
  }
  return true
}

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
