<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    title="프롬프트 테스트"
    max-width="560px"
    @close="$emit('close')"
  >
    <div class="prompt-test-modal-body">
      <!-- 시스템 프롬프트 (읽기 전용) -->
      <div class="prompt-test-form-row">
        <label class="prompt-test-label">시스템 프롬프트</label>
        <div class="prompt-test-readonly-box">
          {{ promptContent }}
        </div>
      </div>

      <!-- 테스트 질문 -->
      <div class="prompt-test-form-row">
        <label class="prompt-test-label">테스트 질문</label>
        <UiTextarea
          v-model="testPrompt"
          placeholder="테스트할 질문을 입력하세요"
          :rows="4"
          border
          size="lg"
        />
      </div>

      <!-- 테스트 실행 버튼 -->
      <UiButton
        class="prompt-test-run-btn"
        variant="primary"
        size="xlg"
        full-width
        :disabled="isTestStreaming || !testPrompt.trim()"
        @click="onRunTest"
      >
        {{ isTestStreaming ? '응답 대기 중...' : '테스트 실행' }}
      </UiButton>

      <!-- 응답 결과 (테스트 실행 후에만 노출) -->
      <div
        v-if="hasRunTest"
        class="prompt-test-result"
      >
        <label class="prompt-test-label">응답 결과</label>
        <div class="prompt-test-response-box">
          <!-- 스트리밍 로딩 (아직 텍스트 없을 때) -->
          <div
            v-if="isTestStreaming && !testResponseText"
            class="prompt-test-loading"
          >
            <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
          </div>
          <!-- 오류 -->
          <div
            v-else-if="testErrorText"
            class="prompt-test-error"
          >
            {{ testErrorText }}
          </div>
          <!-- 응답 텍스트 (스트리밍 중 + 완료 후) -->
          <template v-else>
            {{ testResponseText }}
          </template>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  promptContent: string
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const { testResponseText, isTestStreaming, testErrorText, sendTestMessage, disconnectTestSocket } = useChatStore()

const testPrompt = ref('')
const hasRunTest = ref(false)

// 모달 열릴/닫힐 때 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      testPrompt.value = ''
      hasRunTest.value = false
    } else {
      disconnectTestSocket()
    }
  },
)

const onRunTest = () => {
  if (!testPrompt.value.trim()) return
  hasRunTest.value = true
  const combinedQuery = `${props.promptContent}\n\n${testPrompt.value.trim()}`
  sendTestMessage(combinedQuery, 'auto')
}
</script>

<style lang="scss" scoped>
.prompt-test-modal-body {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: $spacing-md;
  padding: 0;
  min-height: auto;
  width: 100%;
}

.prompt-test-form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.prompt-test-label {
  @include typo($body-medium-bold);
  color: $color-text-primary;
}

.prompt-test-readonly-box {
  padding: $spacing-md;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  color: $color-text-secondary;
  font-size: $font-size-base;
  line-height: $line-height-base;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 160px;
  overflow-y: auto;
}

.prompt-test-run-btn {
  margin-top: $spacing-xs;
}

.prompt-test-result {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
}

.prompt-test-response-box {
  padding: $spacing-md;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  color: $color-text-primary;
  font-size: $font-size-base;
  line-height: $line-height-base;
  min-height: 60px;
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-test-loading {
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

.prompt-test-error {
  color: $color-error;
}
</style>
