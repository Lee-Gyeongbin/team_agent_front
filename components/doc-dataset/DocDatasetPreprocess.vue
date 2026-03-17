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
              :options="chunkAlgorithmOptions"
              size="sm"
              @update:model-value="onUpdate('chunkAlgorithm', $event)"
            />
          </div>
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">청크 크기 (토큰)</label>
            <UiInput
              :model-value="String(modelValue.chunkSize)"
              size="sm"
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
              :model-value="String(modelValue.chunkOverlap)"
              size="sm"
              @update:model-value="onUpdate('chunkOverlap', Number($event))"
            />
          </div>
          <div
            class="com-setting-field-row"
            style="flex: 1"
          >
            <label class="com-setting-label">최소 청크 크기</label>
            <UiInput
              :model-value="String(modelValue.minChunkSize)"
              size="sm"
              @update:model-value="onUpdate('minChunkSize', Number($event))"
            />
          </div>
        </div>

        <!-- 제목/헤더 포함 여부 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">제목/헤더 포함 여부</label>
          <UiSelect
            :model-value="modelValue.headerInclusion"
            :options="headerInclusionOptions"
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
              :model-value="modelValue.useHtmlTagRemoval"
              label="HTML 태그 제거 & 디코딩"
              @update:model-value="onUpdate('useHtmlTagRemoval', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.useStopwordRemoval"
              label="불용어(Stop words) 제거"
              @update:model-value="onUpdate('useStopwordRemoval', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.useCodeBlockPreserve"
              label="숫자/코드 블록 유지 (개발 문서 보존)"
              @update:model-value="onUpdate('useCodeBlockPreserve', $event)"
            />
          </div>
        </div>

        <!-- 문장 분리 알고리즘 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">문장 분리 알고리즘</label>
          <UiSelect
            :model-value="modelValue.sentenceSplitAlgorithm"
            :options="sentenceSplitOptions"
            size="sm"
            @update:model-value="onUpdate('sentenceSplitAlgorithm', $event)"
          />
        </div>

        <!-- 언어 감지 -->
        <div class="com-setting-field-row">
          <label class="com-setting-label">언어 감지</label>
          <UiSelect
            :model-value="modelValue.languageDetection"
            :options="languageDetectionOptions"
            size="sm"
            @update:model-value="onUpdate('languageDetection', $event)"
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

const onUpdate = (key: keyof DocDatasetForm, value: string | number | boolean) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// ===== 셀렉트 옵션 =====
const chunkAlgorithmOptions = [
  { label: 'Recursive (재귀적 분할)', value: 'recursive' },
  { label: 'Character (문자 기반)', value: 'character' },
  { label: 'Token (토큰 기반)', value: 'token' },
  { label: 'Semantic (의미 기반)', value: 'semantic' },
]

const headerInclusionOptions = [
  { label: '상위 제목을 각 청크 앞에 포함', value: 'prepend' },
  { label: '포함하지 않음', value: 'none' },
  { label: '메타데이터로 저장', value: 'metadata' },
]

const sentenceSplitOptions = [
  { label: '규칙 기반 (마침표/문장부호)', value: 'rule' },
  { label: 'NLP 기반 (spaCy)', value: 'nlp' },
  { label: '줄바꿈 기반', value: 'newline' },
]

const languageDetectionOptions = [
  { label: '자동 감지 (권장)', value: 'auto' },
  { label: '한국어', value: 'ko' },
  { label: '영어', value: 'en' },
  { label: '일본어', value: 'ja' },
]
</script>
