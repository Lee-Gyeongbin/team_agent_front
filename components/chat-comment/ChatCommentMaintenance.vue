<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">점검/장애 설정</h3>
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
              <span class="chat-comment-setting-name">점검/장애 안내</span>
              <UiToggle v-model="maintenanceForm.isEnabled" />
            </div>
            <p class="chat-comment-setting-desc">시스템 점검 또는 장애 발생 시 사용자에게 표시할 안내 메시지를 설정합니다</p>
          </div>

          <div class="chat-comment-setting-body">
            <label class="chat-comment-setting-label">메시지 내용</label>
            <UiTextarea
              v-model="maintenanceForm.message"
              :rows="5"
              border
              size="sm"
              auto-resize
              :max-rows="10"
              placeholder="점검/장애 메시지를 입력하세요"
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
              <span class="chat-comment-preview-bot-status is-maintenance">점검중</span>
            </div>
          </div>

          <div class="chat-comment-preview-messages">
            <div class="chat-comment-preview-message is-warning">
              <p>{{ maintenanceForm.message }}</p>
            </div>
          </div>

          <div class="chat-comment-preview-input is-disabled">
            <span class="chat-comment-preview-input-placeholder">점검 중에는 메시지를 보낼 수 없습니다</span>
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
const defaultMessage = '현재 시스템 점검 중입니다.\n점검 시간: 2024.03.15 02:00 ~ 06:00\n불편을 드려 죄송합니다.'

interface MaintenanceForm {
  isEnabled: boolean
  message: string
}

const maintenanceForm = ref<MaintenanceForm>({
  isEnabled: false,
  message: defaultMessage,
})

const onSave = () => {
  console.warn('[TODO] 점검/장애 저장:', maintenanceForm.value)
}

const onReset = () => {
  maintenanceForm.value = {
    isEnabled: false,
    message: defaultMessage,
  }
}
</script>
