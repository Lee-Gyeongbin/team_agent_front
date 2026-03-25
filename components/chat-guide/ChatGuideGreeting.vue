<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">인사멘트 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          @click="handleConfirmSaveGreeting"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="handleConfirmResetGreeting"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="chat-guide-content">
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

        <div class="chat-guide-preview-body">
          <!-- 봇 헤더 -->
          <div class="chat-guide-preview-bot">
            <div class="chat-guide-preview-bot-avatar">T</div>
            <div class="chat-guide-preview-bot-info">
              <span class="chat-guide-preview-bot-name">TeamAgent</span>
              <span class="chat-guide-preview-bot-status">온라인</span>
            </div>
          </div>

          <!-- 메시지 영역 -->
          <div class="chat-guide-preview-messages">
            <div class="chat-guide-preview-message">
              <p>{{ previewGreetingMessage }}</p>
            </div>
          </div>

          <!-- 입력 영역 -->
          <div class="chat-guide-preview-input">
            <span class="chat-guide-preview-input-placeholder">메시지를 입력하세요...</span>
            <i class="icon-send size-20" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  greetingForm,
  greetingPreviewAutoNameYn,
  previewGreetingMessage,
  handleSelectGreeting,
  handleConfirmSaveGreeting,
  handleConfirmResetGreeting,
  handleToggleGreetingPreviewAutoName,
  handleInsertGreetingVariable,
} = useChatGuideStore()

onMounted(() => {
  handleSelectGreeting()
})
</script>
