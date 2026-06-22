<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">인사멘트 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          :disabled="isLoading"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          :disabled="isLoading"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <UiLoading
      v-if="isLoading"
      overlay
      :text="loadingText"
    />

    <UiEmpty
      v-else-if="isError"
      :title="errorTitle"
      :description="errorMessage"
    >
      <UiButton
        size="sm"
        variant="secondary"
        @click="handleLoad"
      >
        다시 시도
      </UiButton>
    </UiEmpty>

    <div
      v-else
      class="chat-guide-content"
    >
      <!-- 좌측: 설정 -->
      <div class="chat-guide-setting">
        <!-- 방문 인사 -->
        <div class="chat-guide-setting-item">
          <div class="chat-guide-setting-header">
            <div class="chat-guide-setting-info">
              <span class="chat-guide-setting-name">방문 인사</span>
              <UiToggle
                :model-value="greetingForm.enblYn === 'Y'"
                @update:model-value="(v) => (greetingForm.enblYn = toYn(v))"
              />
            </div>
            <p class="chat-guide-setting-desc">사용자가 챗봇에 진입했을 때 표시되는 기본 메시지</p>
          </div>

          <div class="chat-guide-setting-body">
            <label class="chat-guide-setting-label">메시지 내용</label>
            <UiTextarea
              v-model="greetingForm.content"
              :rows="5"
              border
              size="sm"
              auto-resize
              :max-rows="10"
              placeholder="인사 메시지를 입력하세요"
            />

            <div class="chat-guide-setting-options">
              <UiCheckbox
                :model-value="greetingPreviewAutoNameYn === 'Y'"
                label="이름 자동 삽입 ({{userName}})"
                @update:model-value="handleToggleGreetingPreviewAutoName"
              />
              <UiButton
                size="sm"
                variant="outline"
                @click="handleInsertGreetingVariable"
              >
                변수 삽입
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 미리보기 -->
      <div class="chat-guide-preview">
        <div class="chat-guide-preview-header">
          <i class="icon-view size-16" />
          <span>미리보기</span>
        </div>

        <div class="chat-guide-preview-body cgp-index-body">
          <!-- 타이틀 + 인사멘트 (실제 채팅 화면과 동일한 레이아웃) -->
          <div class="cgp-index-center">
            <h2 class="cgp-index-title">TeamAgent</h2>
            <p class="cgp-index-desc">{{ previewGreetingMessage }}</p>
          </div>

          <!-- 입력창 목업 -->
          <div class="cgp-index-input-wrap">
            <div class="cgp-index-input">
              <div class="cgp-index-input-top">
                <i class="icon-sparkle size-16" />
                <span class="cgp-index-placeholder">궁금하신 내용을 입력하세요.</span>
              </div>
              <div class="cgp-index-input-bottom">
                <i class="icon-attach-file size-16" />
                <div class="cgp-index-input-right">
                  <span class="cgp-index-model">GPT-5.3-Chat</span>
                  <i class="icon-chevron-down size-12" />
                  <span class="cgp-index-send-btn">
                    <i class="icon-send size-14" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  greetingForm,
  greetingPreviewAutoNameYn,
  previewGreetingMessage,
  handleSelectGreeting,
  handleSaveGreeting,
  handleToggleGreetingPreviewAutoName,
  handleInsertGreetingVariable,
} = useChatGuideStore()

const { isLoading, loadingText } = useLoadingState()
const isError = ref(false)
const errorMessage = ref('')
const errorTitle = ref('불러오기 실패')

const handleLoad = async () => {
  openLoading({ text: '인사멘트를 불러오는 중...' })
  isError.value = false
  errorMessage.value = ''
  try {
    await handleSelectGreeting()
  } catch (err) {
    isError.value = true
    errorMessage.value =
      err instanceof Error && err.message
        ? `인사멘트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
        : '인사멘트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    closeLoading()
  }
}

const onSave = async () => {
  const confirmed = await openConfirm({
    title: '인사멘트 저장',
    message: '변경된 인사멘트 내용을 저장하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleSaveGreeting()
    openToast({ message: '저장되었습니다.', type: 'success' })
  } catch (err) {
    openToast({
      message:
        err instanceof Error && err.message
          ? `인사멘트 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
          : '인사멘트 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      type: 'error',
    })
  }
}

const onReset = async () => {
  const confirmed = await openConfirm({
    title: '인사멘트 초기화',
    message: '초기화 시 변경된 인사멘트 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleLoad()
    openToast({ message: '인사멘트 설정이 초기화되었습니다.', type: 'info' })
  } catch {
    // handleLoad에서 UI로 에러 처리
  }
}

onMounted(() => {
  handleLoad()
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

// 미리보기 바디: 실제 채팅 인덱스 페이지와 동일한 구조
.cgp-index-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: $spacing-md;
  padding: $spacing-lg $spacing-md $spacing-md;
  background: #fff;
}

// 타이틀 + 인사멘트 영역
.cgp-index-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  flex: 1;
  justify-content: center;
  padding: 0 $spacing-sm;
  min-height: 300px;
}

.cgp-index-title {
  font-size: 18px;
  font-weight: 700;
  color: $color-text-heading;
  letter-spacing: -0.02em;
}

.cgp-index-desc {
  font-size: 12px;
  line-height: 1.6;
  color: $color-text-secondary;
  white-space: pre-line;
  word-break: keep-all;
}

// 입력창 목업
.cgp-index-input-wrap {
  width: 100%;
  padding: 0 0 $spacing-sm;
}

.cgp-index-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
  border: 1px solid $color-border;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.cgp-index-input-top {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $color-text-disabled;

  .icon-sparkle {
    flex-shrink: 0;
    color: $color-text-disabled;
  }
}

.cgp-index-placeholder {
  font-size: 11px;
  color: $color-text-disabled;
}

.cgp-index-input-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $color-text-muted;
}

.cgp-index-input-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cgp-index-model {
  font-size: 10px;
  color: $color-text-secondary;
  font-weight: 500;
}

.cgp-index-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--color-primary);
  color: #fff;
  margin-left: 2px;
}
</style>
