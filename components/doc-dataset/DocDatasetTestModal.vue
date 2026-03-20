<template>
  <UiModal
    :is-open="isTestModalOpen"
    title="RAG 검색 테스트"
    max-width="720px"
    custom-class="doc-dataset-test-modal"
    @close="emit('close')"
  >
    <!-- 테스트 쿼리 -->
    <div class="doc-dataset-test-section">
      <p class="doc-dataset-test-section-title">테스트 쿼리</p>
      <UiInput
        v-model="query"
        placeholder="검색할 질문을 입력하세요.."
        size="sm"
        @enter="onSearch"
      >
        <template #icon-right>
          <i
            class="icon-search size-20"
            style="cursor: pointer"
            @click="onSearch"
          />
        </template>
      </UiInput>
    </div>

    <!-- 검색 파라미터 -->
    <div class="doc-dataset-test-section">
      <p class="doc-dataset-test-section-title">검색 파라미터</p>
      <div class="doc-dataset-test-params">
        <div class="doc-dataset-test-param">
          <label class="doc-dataset-test-param-label">Top k</label>
          <UiInput
            v-model="topK"
            placeholder="예: v1.0"
            size="sm"
            number-only
          />
        </div>
        <div class="doc-dataset-test-param">
          <label class="doc-dataset-test-param-label">유사도 임계값</label>
          <UiInput
            v-model="threshold"
            placeholder="예: v1.0"
            size="sm"
            number-only
            allow-decimal
          />
        </div>
        <div class="doc-dataset-test-param">
          <label class="doc-dataset-test-param-label">재순위 적용</label>
        </div>
        <div class="doc-dataset-test-param">
          <UiSelect
            v-model="category"
            :options="categoryOptions"
            size="sm"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- 검색 결과 -->
    <div class="doc-dataset-test-results">
      <div class="doc-dataset-test-results-header">
        <p class="doc-dataset-test-section-title">검색 결과</p>
        <p
          v-if="searchResults.length > 0"
          class="doc-dataset-test-results-summary"
        >
          <strong>{{ searchSummary.totalChunks }}개</strong> 청크 검색됨 · 평균 유사도
          <strong>{{ searchSummary.avgSimilarity }}</strong>
        </p>
      </div>

      <!-- 로딩 -->
      <div
        v-if="isSearching"
        class="doc-dataset-test-results-loading"
      >
        검색 중...
      </div>

      <!-- 빈 상태 -->
      <UiEmpty
        v-else-if="searchResults.length === 0"
        title="검색 결과가 없습니다."
      />

      <!-- 결과 카드 리스트 -->
      <div
        v-else
        class="doc-dataset-test-results-list"
      >
        <div
          v-for="result in searchResults"
          :key="result.chunkId"
          class="doc-dataset-test-result-card"
        >
          <!-- 상단: 청크ID + 유사도 -->
          <div class="doc-dataset-test-result-top">
            <span class="doc-dataset-test-result-chunk">청크 #{{ result.chunkId }}</span>
            <span class="doc-dataset-test-result-similarity">
              <span class="doc-dataset-test-result-similarity-label">유사도</span>
              <strong>{{ result.similarity }}</strong>
            </span>
          </div>
          <!-- 중단: 내용 -->
          <p class="doc-dataset-test-result-content">{{ result.content }}</p>
          <!-- 하단: 출처 + 페이지 -->
          <div class="doc-dataset-test-result-meta">
            <span class="doc-dataset-test-result-meta-item">
              <span class="doc-dataset-test-result-meta-label">출처</span>
              {{ result.source }}
            </span>
            <span class="doc-dataset-test-result-meta-item">
              <span class="doc-dataset-test-result-meta-label">페이지</span>
              {{ result.page }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 푸터 -->
    <template #footer>
      <div class="doc-dataset-test-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="emit('close')"
        >
          닫기
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useDocDatasetStore } from '~/composables/doc-dataset/useDocDatasetStore'

interface Props {
  datasetId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { isTestModalOpen, searchResults, searchSummary, isSearching, handleSearchDocDataset, resetSearchResults } =
  useDocDatasetStore()

// 폼
const query = ref('')
const topK = ref('5')
const threshold = ref('0.7')
const category = ref('all')

const categoryOptions = [{ label: '전체 카테고리', value: 'all' }]

// 모달 열릴 때 초기화
watch(
  () => isTestModalOpen.value,
  (open) => {
    if (open) {
      query.value = ''
      topK.value = '5'
      threshold.value = '0.7'
      resetSearchResults()
    }
  },
)

// 검색 실행
const onSearch = async () => {
  if (!query.value.trim()) return
  await handleSearchDocDataset({
    datasetId: props.datasetId,
    query: query.value.trim(),
    topK: Number(topK.value) || 5,
    threshold: Number(threshold.value) || 0.7,
    rerank: 'none',
  })
}
</script>
