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
      <span class="com-setting-section-title">전처리 옵션 설정</span>
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
      <!-- 청킹 옵션 -->
      <div class="doc-dataset-subsection">
        <div class="doc-dataset-subsection-header">
          <span class="doc-dataset-subsection-title">• 청킹 옵션</span>
          <span class="doc-dataset-subsection-desc">질문/답변 품질에 직접적인 영향을 줍니다.</span>
        </div>

        <!-- 청킹 알고리즘 / 청크 크기 -->
        <div class="com-setting-row">
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">청킹 알고리즘</label>
            <UiSelect
              :model-value="modelValue.chunkAlgorithm"
              :options="props.chunkAlgorithmOptions"
              size="sm"
              @update:model-value="onChunkAlgorithmChange"
            />
          </div>
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">청크 크기 (토큰)</label>
            <UiInput
              :model-value="modelValue.chunkSize === null ? '' : String(modelValue.chunkSize)"
              size="sm"
              :disabled="isChunkSizeDisabled"
              @update:model-value="onUpdate('chunkSize', Number($event))"
            />
          </div>
        </div>

        <!-- 오버랩 / 최소 청크 크기 -->
        <div class="com-setting-row">
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">오버랩 (토큰)</label>
            <UiInput
              :model-value="modelValue.chunkOverlap === null ? '' : String(modelValue.chunkOverlap)"
              size="sm"
              :disabled="isChunkOverlapDisabled"
              @update:model-value="onUpdate('chunkOverlap', Number($event))"
            />
          </div>
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">최소 청크 크기</label>
            <UiInput
              :model-value="modelValue.minChunkSize === null ? '' : String(modelValue.minChunkSize)"
              size="sm"
              :disabled="isMinChunkSizeDisabled"
              @update:model-value="onUpdate('minChunkSize', Number($event))"
            />
          </div>
        </div>

        <!-- 청킹 알고리즘별 상세 옵션 -->
        <div
          v-if="hasChunkDetailFields"
          class="doc-dataset-chunk-detail"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">상세 옵션</label>
            <span class="doc-dataset-subsection-desc">청킹 알고리즘에 따라 필요한 값만 입력됩니다.</span>
          </div>

          <div
            v-if="showSeparators"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">분리자 목록</label>
            <UiInput
              :model-value="modelValue.chunkOptSeparatorsText ?? ''"
              placeholder="\n\n,\n, ,"
              size="sm"
              @update:model-value="onUpdate('chunkOptSeparatorsText', $event)"
            />
          </div>

          <div
            v-if="showSentenceSeparator"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">문장 구분 함수</label>
            <UiInput
              :model-value="modelValue.chunkOptSentenceSep ?? ''"
              placeholder="nltk"
              size="sm"
              @update:model-value="onUpdate('chunkOptSentenceSep', $event)"
            />
          </div>

          <div
            v-if="showSeparator"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">문자 구분자</label>
            <UiInput
              :model-value="modelValue.chunkOptSeparator ?? ''"
              placeholder=" "
              size="sm"
              @update:model-value="onUpdate('chunkOptSeparator', $event)"
            />
          </div>

          <div
            v-if="showParagraphSeparator"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">문단 구분자</label>
            <UiInput
              :model-value="modelValue.chunkOptParagraphSeparator ?? ''"
              placeholder="\n\n\n"
              size="sm"
              @update:model-value="onUpdate('chunkOptParagraphSeparator', $event)"
            />
          </div>

          <div
            v-if="showBufferSize"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">버퍼 크기</label>
            <UiInput
              :model-value="modelValue.chunkOptBufferSize === null ? '' : String(modelValue.chunkOptBufferSize)"
              size="sm"
              number-only
              @update:model-value="onUpdate('chunkOptBufferSize', Number($event))"
            />
          </div>

          <div
            v-if="showBreakpointPercentileThreshold"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">의미 분할 임계값</label>
            <UiInput
              :model-value="
                modelValue.chunkOptBreakpointPercentileThreshold === null
                  ? ''
                  : String(modelValue.chunkOptBreakpointPercentileThreshold)
              "
              size="sm"
              number-only
              @update:model-value="onUpdate('chunkOptBreakpointPercentileThreshold', Number($event))"
            />
          </div>

          <div
            v-if="showHtmlTags"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">분리 태그</label>
            <UiInput
              :model-value="modelValue.chunkOptHtmlTagsText ?? ''"
              placeholder="p,h1,h2,h3,h4,h5,h6,li,b,i,u,section"
              size="sm"
              @update:model-value="onUpdate('chunkOptHtmlTagsText', $event)"
            />
          </div>

          <div
            v-if="showHeaderPathSeparator"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">헤더 경로 구분자</label>
            <UiInput
              :model-value="modelValue.chunkOptHeaderPathSeparator ?? ''"
              placeholder="/"
              size="sm"
              @update:model-value="onUpdate('chunkOptHeaderPathSeparator', $event)"
            />
          </div>

          <div
            v-if="showMinTokens"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">페이지 최소 토큰 수</label>
            <UiInput
              :model-value="modelValue.chunkOptMinTokens === null ? '' : String(modelValue.chunkOptMinTokens)"
              size="sm"
              number-only
              @update:model-value="onUpdate('chunkOptMinTokens', Number($event))"
            />
          </div>
        </div>

        <!-- 제목/헤더 포함 여부 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">제목/헤더 포함 여부</label>
          <UiSelect
            :model-value="modelValue.headerInclusion"
            :options="props.headerInclusionOptions"
            size="sm"
            @update:model-value="onUpdate('headerInclusion', $event)"
          />
        </div>
      </div>

      <!-- 텍스트 전처리 옵션 -->
      <div class="doc-dataset-subsection">
        <div class="doc-dataset-subsection-header">
          <span class="doc-dataset-subsection-title">• 텍스트 전처리 옵션</span>
          <span class="doc-dataset-subsection-desc">노이즈 제거 및 일관된 표현으로 임베딩 품질을 높입니다.</span>
        </div>

        <!-- 체크박스 그리드 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">옵션</label>
          <div class="doc-dataset-checkbox-grid">
            <UiCheckbox
              :model-value="modelValue.useLowercasing"
              label="소문자 변환 (Lowercasing)"
              @update:model-value="onUpdate('useLowercasing', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.useWhitespaceNorm"
              label="공백 정규화 (중복 공백/개행 제거)"
              @update:model-value="onUpdate('useWhitespaceNorm', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.useSpecialCharRemoval"
              label="특수문자/이모지 제거"
              @update:model-value="onUpdate('useSpecialCharRemoval', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.useSingleCellText"
              label="단일 셀 테이블 텍스트화"
              @update:model-value="onUpdate('useSingleCellText', $event)"
            />
          </div>
        </div>

        <!-- 문장 분리 알고리즘 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">문장 분리 알고리즘</label>
          <UiSelect
            :model-value="modelValue.sentenceSplitAlgorithm"
            :options="props.sentenceSplitOptions"
            size="sm"
            @update:model-value="onUpdate('sentenceSplitAlgorithm', $event)"
          />
        </div>

        <!-- 언어 감지 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">언어 감지</label>
          <UiSelect
            :model-value="modelValue.languageDetection"
            :options="props.languageDetectionOptions"
            size="sm"
            @update:model-value="onUpdate('languageDetection', $event)"
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
  chunkAlgorithmOptions?: { label: string; value: string }[]
  headerInclusionOptions?: { label: string; value: string }[]
  sentenceSplitOptions?: { label: string; value: string }[]
  languageDetectionOptions?: { label: string; value: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: true,
  chunkAlgorithmOptions: () => [],
  headerInclusionOptions: () => [],
  sentenceSplitOptions: () => [],
  languageDetectionOptions: () => [],
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

const CHUNK_ALGO_CODE = {
  recursive: '001',
  semantic: '002',
  fixed: '003',
  sentence: '004',
  html: '005',
  markdown: '006',
  paging: '007',
} as const

const hasChunkDetailFields = computed(() => Boolean(props.modelValue.chunkAlgorithm))
const showSeparators = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.recursive)
const showSentenceSeparator = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.semantic)
const showBufferSize = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.semantic)
const showBreakpointPercentileThreshold = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.semantic)
const showSeparator = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.sentence)
const showParagraphSeparator = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.sentence)
const showHtmlTags = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.html)
const showHeaderPathSeparator = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.markdown)
const showMinTokens = computed(() => props.modelValue.chunkAlgorithm === CHUNK_ALGO_CODE.paging)
const chunkSizeEnabledCodes: string[] = [CHUNK_ALGO_CODE.recursive, CHUNK_ALGO_CODE.fixed, CHUNK_ALGO_CODE.sentence]
const isChunkSizeDisabled = computed(() => {
  const code = props.modelValue.chunkAlgorithm
  return !chunkSizeEnabledCodes.includes(code)
})
const isChunkOverlapDisabled = computed(() => {
  const code = props.modelValue.chunkAlgorithm
  return !chunkSizeEnabledCodes.includes(code)
})
const isMinChunkSizeDisabled = computed(() => props.modelValue.chunkAlgorithm !== CHUNK_ALGO_CODE.paging)

const onUpdate = (key: keyof DocDatasetForm, value: string | number | boolean) => {
  emit('update:modelValue', { ...toRaw(props.modelValue), [key]: value } as DocDatasetForm)
}

const onChunkAlgorithmChange = (value: string | number) => {
  const algoCode = String(value)
  // 알고리즘별로 비활성화/숨김되는 필드는 값이 남아있지 않도록 `null`로 초기화합니다.
  const patch: Partial<DocDatasetForm> = {
    chunkAlgorithm: algoCode,
    chunkSize: null,
    chunkOverlap: null,
    minChunkSize: null,
    chunkOptSeparatorsText: null,
    chunkOptSeparator: null,
    chunkOptParagraphSeparator: null,
    chunkOptSentenceSep: null,
    chunkOptBufferSize: null,
    chunkOptBreakpointPercentileThreshold: null,
    chunkOptHtmlTagsText: null,
    chunkOptHeaderPathSeparator: null,
    chunkOptMinTokens: null,
  }

  if (algoCode === CHUNK_ALGO_CODE.recursive) {
    patch.chunkSize = 4000
    patch.chunkOverlap = 200
    patch.chunkOptSeparatorsText = '\\n\\n,\\n, ,'
  } else if (algoCode === CHUNK_ALGO_CODE.semantic) {
    patch.chunkOptSentenceSep = 'nltk'
    patch.chunkOptBufferSize = 1
    patch.chunkOptBreakpointPercentileThreshold = 95
  } else if (algoCode === CHUNK_ALGO_CODE.fixed) {
    patch.chunkSize = 1024
    patch.chunkOverlap = 20
  } else if (algoCode === CHUNK_ALGO_CODE.sentence) {
    patch.chunkSize = 1024
    patch.chunkOverlap = 20
    patch.chunkOptSeparator = ' '
    patch.chunkOptParagraphSeparator = '\\n\\n\\n'
  } else if (algoCode === CHUNK_ALGO_CODE.html) {
    patch.chunkOptHtmlTagsText = 'p,h1,h2,h3,h4,h5,h6,li,b,i,u,section'
  } else if (algoCode === CHUNK_ALGO_CODE.markdown) {
    patch.chunkOptHeaderPathSeparator = '/'
  } else if (algoCode === CHUNK_ALGO_CODE.paging) {
    patch.minChunkSize = 300
    patch.chunkOptMinTokens = 300
  }

  emit('update:modelValue', { ...toRaw(props.modelValue), ...patch } as DocDatasetForm)
}
</script>

<style lang="scss" scoped>
.doc-dataset-chunk-detail {
  margin: 8px 0 12px;
  padding: 4px 0;

  .com-setting-field-row {
    margin-bottom: 10px;
  }
}
</style>
