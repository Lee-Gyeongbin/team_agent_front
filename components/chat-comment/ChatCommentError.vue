<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">오류메시지 설정</h3>
      <div class="chat-comment-setting-footer">
        <UiButton
          variant="primary"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="chat-comment-content">
      <!-- 좌측: 설정 -->
      <div class="chat-comment-setting">
        <div class="chat-comment-setting-item">
          <div class="chat-comment-setting-header">
            <div class="chat-comment-setting-info">
              <span class="chat-comment-setting-name">오류 메시지</span>
              <UiToggle v-model="errorForm.isEnabled" />
            </div>
            <p class="chat-comment-setting-desc">챗봇 응답 실패 시 사용자에게 표시할 오류 메시지를 설정합니다</p>
          </div>

          <div class="chat-comment-setting-body">
            <label class="chat-comment-setting-label">메시지 내용</label>
            <UiTextarea
              v-model="errorForm.message"
              :rows="5"
              border
              size="sm"
              auto-resize
              :max-rows="10"
              placeholder="오류 메시지를 입력하세요"
            />
          </div>
        </div>
      </div>

      <!-- 우측: 미리보기 -->
      <div class="chat-comment-preview">
        <div class="chat-comment-preview-header">
          <i class="icon-view size-16" />
          <span>미리보기</span>
        </div>

        <div class="chat-comment-preview-body">
          <div class="chat-comment-preview-bot">
            <div class="chat-comment-preview-bot-avatar">T</div>
            <div class="chat-comment-preview-bot-info">
              <span class="chat-comment-preview-bot-name">TeamAgent</span>
              <span class="chat-comment-preview-bot-status">온라인</span>
            </div>
          </div>

          <div class="chat-comment-preview-messages">
            <div class="chat-comment-preview-message is-error">
              <p>{{ errorForm.message }}</p>
            </div>
          </div>

          <div class="chat-comment-preview-input">
            <span class="chat-comment-preview-input-placeholder">메시지를 입력하세요...</span>
            <i class="icon-send size-20" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const defaultMessage = '죄송합니다. 일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.'

interface ErrorForm {
  isEnabled: boolean
  message: string
}

const errorForm = ref<ErrorForm>({
  isEnabled: true,
  message: defaultMessage,
})

const onSave = () => {
  console.warn('[TODO] 오류메시지 저장:', errorForm.value)
}

const onReset = () => {
  errorForm.value = {
    isEnabled: true,
    message: defaultMessage,
  }
}
</script>
