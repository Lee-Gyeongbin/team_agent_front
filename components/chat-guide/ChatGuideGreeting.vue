<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">인사멘트 설정</h3>
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
        <!-- 방문 인사 -->
        <div class="chat-comment-setting-item">
          <div class="chat-comment-setting-header">
            <div class="chat-comment-setting-info">
              <span class="chat-comment-setting-name">방문 인사</span>
              <UiToggle v-model="greetingForm.isEnabled" />
            </div>
            <p class="chat-comment-setting-desc">사용자가 챗봇에 진입했을 때 표시되는 기본 메시지</p>
          </div>

          <div class="chat-comment-setting-body">
            <label class="chat-comment-setting-label">메시지 내용</label>
            <UiTextarea
              v-model="greetingForm.message"
              :rows="5"
              border
              size="sm"
              auto-resize
              :max-rows="10"
              placeholder="인사 메시지를 입력하세요"
            />

            <div class="chat-comment-setting-options">
              <UiCheckbox
                v-model="greetingForm.isAutoName"
                label="이름 자동 삽입 ({{userName}})"
              />
              <UiButton
                size="sm"
                variant="outline"
                @click="onInsertVariable"
              >
                변수 삽입
              </UiButton>
            </div>
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
          <!-- 봇 헤더 -->
          <div class="chat-comment-preview-bot">
            <div class="chat-comment-preview-bot-avatar">T</div>
            <div class="chat-comment-preview-bot-info">
              <span class="chat-comment-preview-bot-name">TeamAgent</span>
              <span class="chat-comment-preview-bot-status">온라인</span>
            </div>
          </div>

          <!-- 메시지 영역 -->
          <div class="chat-comment-preview-messages">
            <div class="chat-comment-preview-message">
              <p>{{ previewMessage }}</p>
            </div>
          </div>

          <!-- 입력 영역 -->
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
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  greetingForm,
  previewGreetingMessage: previewMessage,
  handleSaveGreeting: onSave,
  handleResetGreeting: onReset,
  handleInsertGreetingVariable: onInsertVariable,
} = useChatGuideStore()
</script>
