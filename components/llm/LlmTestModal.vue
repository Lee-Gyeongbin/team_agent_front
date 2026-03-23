<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    title="모델 테스트"
    max-width="560px"
    @close="$emit('close')"
  >
    <div class="llm-test-modal-body">
      <!-- 모델 정보 -->
      <div
        v-if="model"
        class="llm-test-model-info"
      >
        <span class="llm-test-model-name">{{ model.modelName }}</span>
        <span
          v-if="model.version"
          class="llm-test-model-badge"
        >
          v{{ model.version }}
        </span>
        <span
          v-if="model.providerName"
          class="llm-test-model-provider"
        >
          {{ model.providerName }}
        </span>
      </div>

      <!-- 테스트 프롬프트 -->
      <div class="llm-test-form-row">
        <UiTextarea
          v-model="testPrompt"
          placeholder="테스트할 프롬프트를 입력하세요"
          :rows="4"
          border
        />
      </div>

      <!-- 테스트 실행 버튼 -->
      <div class="llm-test-action">
        <UiButton
          variant="primary"
          size="md"
          :disabled="isTestStreaming || !testPrompt.trim()"
          @click="onRunTest"
        >
          {{ isTestStreaming ? '응답 대기 중...' : '테스트 실행' }}
        </UiButton>
      </div>

      <!-- 응답 결과 (테스트 실행 후에만 노출) -->
      <div
        v-if="hasRunTest"
        class="llm-test-result"
      >
        <label class="llm-test-label">응답 결과</label>
        <div class="llm-test-response-box">
          <!-- 스트리밍 로딩 -->
          <div
            v-if="isTestStreaming && !testResponseText"
            class="llm-test-loading"
          >
            <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
          </div>
          <!-- 오류 -->
          <div
            v-else-if="testErrorText"
            class="llm-test-error"
          >
            {{ testErrorText }}
          </div>
          <!-- 응답 텍스트 -->
          <template v-else>
            {{ testResponseText }}
          </template>
        </div>

        <!-- 성능 지표 -->
        <div
          v-if="!isTestStreaming && testResponseText && elapsedTime > 0"
          class="llm-test-stats"
        >
          <span class="llm-test-stat-item">
            <i class="icon-time size-14" />
            응답시간: {{ formattedElapsedTime }}
          </span>
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

const { testResponseText, isTestStreaming, testErrorText, sendTestMessage, disconnectTestSocket } = useChatTestSocket()

const testPrompt = ref('')
const hasRunTest = ref(false)
const startTime = ref(0)
const elapsedTime = ref(0)

const formattedElapsedTime = computed(() => {
  if (elapsedTime.value < 1000) return `${elapsedTime.value}ms`
  return `${(elapsedTime.value / 1000).toFixed(1)}s`
})

// 스트리밍 완료 시 경과 시간 기록
watch(isTestStreaming, (streaming, wasStreaming) => {
  if (wasStreaming && !streaming && startTime.value > 0) {
    elapsedTime.value = Date.now() - startTime.value
  }
})

// 모달 열릴/닫힐 때 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      testPrompt.value = ''
      hasRunTest.value = false
      startTime.value = 0
      elapsedTime.value = 0
    } else {
      disconnectTestSocket()
    }
  },
)

const onRunTest = () => {
  if (!props.model?.modelId || !testPrompt.value.trim()) return
  hasRunTest.value = true
  elapsedTime.value = 0
  startTime.value = Date.now()
  sendTestMessage(testPrompt.value.trim(), props.model.modelId)
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

.llm-test-model-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: $color-background;
  border-radius: $border-radius-base;
}

.llm-test-model-name {
  @include typo($body-medium-bold);
  color: var(--color-primary);
}

.llm-test-model-badge {
  @include typo($body-xsmall);
  color: $color-text-muted;
  padding: 2px 8px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
}

.llm-test-model-provider {
  @include typo($body-small);
  color: $color-text-secondary;
  margin-left: auto;
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

.llm-test-action {
  display: flex;
  justify-content: flex-end;
}

.llm-test-result {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
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
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  @include custom-scrollbar;
}

.llm-test-loading {
  display: flex;
  align-items: center;
  gap: 4px;

  .typing-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-text-secondary;
    animation: typingBounce 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typingBounce {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.llm-test-error {
  color: $color-error;
}

.llm-test-stats {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 8px 12px;
  background: $color-background;
  border-radius: $border-radius-base;
}

.llm-test-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  @include typo($body-small);
  color: $color-text-muted;
}
</style>
