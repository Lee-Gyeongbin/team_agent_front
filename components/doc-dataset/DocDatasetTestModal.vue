<template>
  <UiModal
    :is-open="isTestModalOpen"
    title="RAG 검색 테스트"
    max-width="720px"
    custom-class="doc-dataset-test-modal"
    @close="emit('close')"
  >
    <!-- 검색 파라미터 상단 바 -->
    <div class="doc-dataset-test-params-bar">
      <div class="doc-dataset-test-param">
        <label class="doc-dataset-test-param-label">Top k</label>
        <UiInput
          v-model="topK"
          size="sm"
          number-only
          min="1"
          max="10"
        />
      </div>
      <div class="doc-dataset-test-param">
        <label class="doc-dataset-test-param-label">유사도 임계값</label>
        <UiInput
          v-model="threshold"
          size="sm"
          min="0"
          max="1"
          step="0.01"
          number-only
          allow-decimal
        />
      </div>
    </div>

    <!-- 채팅 메시지 영역 -->
    <div
      ref="chatAreaRef"
      class="doc-dataset-test-chat-area"
    >
      <div class="doc-dataset-test-chat-inner">
        <!-- 빈 상태 -->
        <div
          v-if="testMessages.length === 0"
          class="doc-dataset-test-chat-empty"
        >
          <UiEmpty title="질문을 입력하여 RAG 검색을 테스트해 보세요." />
        </div>

        <!-- 메시지 목록 -->
        <template v-else>
          <div
            v-for="msg in testMessages"
            :key="msg.id"
            class="doc-dataset-test-msg"
            :class="`role-${msg.type}`"
          >
            <!-- 사용자 메시지 -->
            <div
              v-if="msg.type === 'user'"
              class="doc-dataset-test-msg-bubble"
            >
              {{ msg.content }}
            </div>

            <!-- 어시스턴트 메시지 -->
            <template v-else>
              <div class="doc-dataset-test-msg-avatar">
                <i class="icon-bot size-16" />
              </div>
              <div class="doc-dataset-test-msg-body">
                <!-- 로딩 -->
                <div
                  v-if="msg.loading"
                  class="doc-dataset-test-msg-loading"
                >
                  <span class="doc-dataset-test-loading-dot" />
                  <span class="doc-dataset-test-loading-dot" />
                  <span class="doc-dataset-test-loading-dot" />
                </div>

                <!-- 결과 없음 -->
                <UiEmpty
                  v-else-if="!msg.results || msg.results.length === 0"
                  title="검색 결과가 없습니다."
                />

                <!-- 결과 있음 -->
                <template v-else>
                  <p
                    v-if="msg.summary"
                    class="doc-dataset-test-msg-summary"
                  >
                    <strong>{{ msg.summary.totalChunks }}개</strong> 청크 검색됨 · 평균 유사도
                    <strong>{{ msg.summary.avgSimilarity }}</strong>
                  </p>
                  <div
                    v-for="result in msg.results"
                    :key="result.chunkId"
                    class="doc-dataset-test-result-card"
                  >
                    <div class="doc-dataset-test-result-top">
                      <span class="doc-dataset-test-result-chunk">청크 #{{ result.chunkId }}</span>
                      <span class="doc-dataset-test-result-similarity">
                        <span class="doc-dataset-test-result-similarity-label">유사도</span>
                        <strong>{{ result.similarity }}</strong>
                      </span>
                    </div>
                    <p class="doc-dataset-test-result-content">{{ result.content }}</p>
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
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 입력 바 -->
    <div class="doc-dataset-test-input-bar">
      <UiInput
        v-model="query"
        placeholder="검색할 질문을 입력하세요..."
        size="sm"
        class="doc-dataset-test-input"
        @enter="onSearch"
      />
      <UiButton
        variant="primary"
        size="sm"
        :disabled="isSending || !query.trim()"
        @click="onSearch"
      >
        전송
      </UiButton>
    </div>

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
import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import { useDocDatasetStore } from '~/composables/doc-dataset/useDocDatasetStore'
import type { DocDatasetSearchResult, DocDatasetSearchSummary } from '~/types/doc-dataset'

interface Props {
  datasetId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { isTestModalOpen } = useDocDatasetStore()
const { fetchSearchDocDataset } = useDocDatasetApi()

// 파라미터
const query = ref('')
const topK = ref('5')
const threshold = ref('0.7')

// 채팅 메시지 로컬 상태
interface TestMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  loading?: boolean
  results?: DocDatasetSearchResult[]
  summary?: DocDatasetSearchSummary
}

const testMessages = ref<TestMessage[]>([])
const isSending = ref(false)

// 채팅 영역 ref (자동 스크롤)
const chatAreaRef = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

// 모달 열릴 때 초기화
watch(
  () => isTestModalOpen.value,
  (open) => {
    if (open) {
      query.value = ''
      topK.value = '5'
      threshold.value = '0.7'
      testMessages.value = []
    }
  },
)

// RAG 응답 행 매핑 (store의 mapDocDatasetTestSearchRow와 동일)
const mapSearchRow = (row: Record<string, unknown>): DocDatasetSearchResult => {
  const meta =
    typeof row.metadata === 'object' && row.metadata !== null ? (row.metadata as Record<string, unknown>) : {}

  const pickStr = (keys: string[]): string => {
    for (const src of [row, meta]) {
      for (const k of keys) {
        const v = src[k]
        if (v != null && v !== '') return String(v)
      }
    }
    return ''
  }
  const pickNum = (keys: string[]): number => {
    for (const src of [row, meta]) {
      for (const k of keys) {
        const v = src[k]
        if (typeof v === 'number' && !Number.isNaN(v)) return v
        if (typeof v === 'string' && v.trim() !== '') {
          const n = Number(v)
          if (!Number.isNaN(n)) return n
        }
      }
    }
    return 0
  }

  let source = pickStr(['source', 'doc_title', 'filename', 'file_name', 'document', 'doc_nm', 'file_path'])
  if (source) {
    const normalized = source.replace(/\\/g, '/')
    const base = normalized.split('/').pop()
    if (base) source = base
  }

  return {
    chunkId: pickStr(['chunkId', 'chunk_id', 'id']),
    content: pickStr(['content', 'text', 'chunk_text', 'chunk']),
    source,
    page: Math.max(0, Math.floor(pickNum(['page', 'page_no', 'pageNum', 'page_number']))),
    similarity: pickNum(['similarity', 'score', 'sml', 'sml_score', 'cosine_similarity']),
  }
}

const buildSummary = (results: DocDatasetSearchResult[]): DocDatasetSearchSummary => {
  const n = results.length
  if (n === 0) return { totalChunks: 0, avgSimilarity: 0 }
  const sum = results.reduce((s, r) => s + r.similarity, 0)
  return { totalChunks: n, avgSimilarity: Math.round((sum / n) * 100) / 100 }
}

// 검색 실행
const onSearch = async () => {
  const text = query.value.trim()
  if (!text || isSending.value) return

  // 사용자 메시지 추가
  const userMsgId = `user-${Date.now()}`
  testMessages.value.push({ id: userMsgId, type: 'user', content: text })
  query.value = ''
  scrollToBottom()

  // 어시스턴트 로딩 메시지 추가
  const assistantMsgId = `assistant-${Date.now()}`
  testMessages.value.push({ id: assistantMsgId, type: 'assistant', loading: true, content: '' })
  scrollToBottom()

  isSending.value = true
  try {
    const res = await fetchSearchDocDataset({
      datasetId: props.datasetId,
      query: text,
      topK: Number(topK.value) || 5,
      threshold: Number(threshold.value) || 0.7,
      rerank: 'none',
    })
    const rawList = Array.isArray(res.data) ? res.data : []
    const results = rawList.map((item) =>
      mapSearchRow(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}),
    )
    // 로딩 메시지를 결과로 교체
    const idx = testMessages.value.findIndex((m) => m.id === assistantMsgId)
    if (idx > -1) {
      testMessages.value[idx] = {
        id: assistantMsgId,
        type: 'assistant',
        content: '',
        loading: false,
        results,
        summary: buildSummary(results),
      }
    }
  } catch (e) {
    const idx = testMessages.value.findIndex((m) => m.id === assistantMsgId)
    if (idx > -1) {
      testMessages.value[idx] = {
        id: assistantMsgId,
        type: 'assistant',
        content: '',
        loading: false,
        results: [],
      }
    }
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}
</script>
