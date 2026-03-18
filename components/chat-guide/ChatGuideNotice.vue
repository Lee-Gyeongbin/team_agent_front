<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">안내멘트 설정</h3>
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

    <div class="chat-comment-notice-list">
      <!-- 사용 가능 기능 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">사용 가능 기능 안내</span>
            <UiToggle v-model="noticeForm.feature.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">챗봇이 제공하는 주요 기능 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.feature.message"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="기능 안내 메시지를 입력하세요"
          />
        </div>

        <div class="chat-comment-notice-condition">
          <span class="chat-comment-notice-condition-label">표시 조건:</span>
          <UiSelect
            v-model="noticeForm.feature.condition"
            :options="conditionOptions"
            size="sm"
          />
        </div>
      </div>

      <!-- 입력 방법 가이드 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">입력 방법 가이드</span>
            <UiToggle v-model="noticeForm.guide.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">사용자가 효과적으로 질문하는 방법 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">가이드 메시지</label>
          <UiTextarea
            v-model="noticeForm.guide.message"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="가이드 메시지를 입력하세요"
          />
        </div>
      </div>

      <!-- 개인정보 보호 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">개인정보 보호 안내</span>
            <UiToggle v-model="noticeForm.privacy.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">민감 정보 입력 주의 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.privacy.message"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="개인정보 보호 안내 메시지를 입력하세요"
          />
        </div>

        <UiCheckbox
          v-model="noticeForm.privacy.isAutoDetect"
          label="민감정보 패턴 감지 시 자동 표시"
        />
      </div>

      <!-- 서비스 제한 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">서비스 제한 안내</span>
            <UiToggle v-model="noticeForm.limitation.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">AI의 한계 및 제한사항 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.limitation.message"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="서비스 제한 안내 메시지를 입력하세요"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { noticeForm, conditionOptions, handleSaveNotice: onSave, handleResetNotice: onReset } = useChatGuideStore()
</script>
