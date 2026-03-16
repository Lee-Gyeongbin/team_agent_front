<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    title="모델 테스트"
    max-width="560px"
    @close="$emit('close')"
  >
    <div class="llm-test-modal-body">
      <!-- 테스트 프롬프트 -->
      <div class="llm-test-form-row">
        <label class="llm-test-label">테스트 프롬프트</label>
        <UiTextarea
          v-model="testPrompt"
          placeholder="테스트할 프롬프트를 입력하세요"
          :rows="4"
          border
          size="lg"
        />
      </div>

      <!-- 테스트 실행 버튼 -->
      <UiButton
        class="llm-test-run-btn"
        variant="primary"
        size="xlg"
        full-width
        @click="onRunTest"
      >
        테스트 실행
      </UiButton>

      <!-- 응답 결과 (테스트 실행 후에만 노출) -->
      <div
        v-if="hasRunTest"
        class="llm-test-result"
      >
        <label class="llm-test-label">응답 결과</label>
        <div class="llm-test-response-box">
          {{ responseText }}
        </div>
        <div class="llm-test-metrics">
          <div class="llm-test-metric-card">
            <span class="llm-test-metric-label">응답 시간</span>
            <strong class="llm-test-metric-value">{{ responseTime }}</strong>
          </div>
          <div class="llm-test-metric-card">
            <span class="llm-test-metric-label">입력 토큰</span>
            <strong class="llm-test-metric-value">{{ inputTokens }}</strong>
          </div>
          <div class="llm-test-metric-card">
            <span class="llm-test-metric-label">출력 토큰</span>
            <strong class="llm-test-metric-value">{{ outputTokens }}</strong>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { LlmModel } from '~/types/llm'

interface Props {
  isOpen: boolean
  model: LlmModel | null
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const testPrompt = ref('')
const hasRunTest = ref(false)

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const responseText = ref('')
const responseTime = ref('')
const inputTokens = ref('')
const outputTokens = ref('')

// 모달 열릴 때 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    testPrompt.value = ''
    hasRunTest.value = false
    responseText.value = ''
    responseTime.value = ''
    inputTokens.value = ''
    outputTokens.value = ''
  },
)

const onRunTest = () => {
  hasRunTest.value = true
  // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
  responseText.value =
    '안녕하세요! 저는 GPT-4o 모델입니다. 저는 OpenAI가 개발한 대규모 언어 모델로, 다양한 주제에 대해 대화하고 질문에 답변할 수 있습니다.'
  responseTime.value = '1.23초'
  inputTokens.value = '23'
  outputTokens.value = '67'
}
</script>

<style lang="scss" scoped>
.llm-test-modal-body {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: $spacing-md;
  padding: 0;
  min-height: auto;
  width: 100%;
}

.llm-test-form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.llm-test-label {
  @include typo($body-medium-bold);
  color: $color-text-primary;
}

.llm-test-run-btn {
  margin-top: $spacing-xs;
}

.llm-test-result {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
}

.llm-test-response-box {
  padding: $spacing-md;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  color: $color-text-primary;
  font-size: $font-size-base;
  line-height: $line-height-base;
  min-height: 60px;
}

.llm-test-metrics {
  display: flex;
  gap: $spacing-sm;
}

.llm-test-metric-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
}

.llm-test-metric-label {
  @include typo($body-small);
  color: $color-text-secondary;
}

.llm-test-metric-value {
  @include typo($body-medium-bold);
  color: $color-text-heading;
}
</style>
