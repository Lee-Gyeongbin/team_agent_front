<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">안내멘트 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          @click="handleConfirmSaveNotice"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="handleConfirmResetNotice"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="chat-guide-notice-list">
      <!-- 사용 가능 기능 안내 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">사용 가능 기능 안내</span>
            <UiToggle
              :model-value="localNoticeForm.feature.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.feature.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">챗봇이 제공하는 주요 기능 설명</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.feature.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="기능 안내 메시지를 입력하세요"
          />
        </div>

        <div class="chat-guide-notice-condition">
          <span class="chat-guide-notice-condition-label">표시 조건:</span>
          <UiSelect
            v-model="localNoticeForm.feature.dsplCond"
            :options="chatGuideNoticeConditionOptions"
            size="sm"
          />
        </div>
      </div>

      <!-- 입력 방법 가이드 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">입력 방법 가이드</span>
            <UiToggle
              :model-value="localNoticeForm.guide.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.guide.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">사용자가 효과적으로 질문하는 방법 안내</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">가이드 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.guide.content"
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
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">개인정보 보호 안내</span>
            <UiToggle
              :model-value="localNoticeForm.privacy.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.privacy.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">민감 정보 입력 주의 안내</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.privacy.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="개인정보 보호 안내 메시지를 입력하세요"
          />
        </div>

        <UiCheckbox
          :model-value="localNoticeForm.privacy.autoDetectYn === 'Y'"
          label="민감정보 패턴 감지 시 자동 표시"
          @update:model-value="(v) => (localNoticeForm.privacy.autoDetectYn = toYn(v))"
        />
      </div>

      <!-- 서비스 제한 안내 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">서비스 제한 안내</span>
            <UiToggle
              :model-value="localNoticeForm.limitation.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.limitation.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">AI의 한계 및 제한사항 설명</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.limitation.content"
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
import { onMounted } from 'vue'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  localNoticeForm,
  chatGuideNoticeConditionOptions,
  handleSelectNotice,
  handleConfirmSaveNotice,
  handleConfirmResetNotice,
} = useChatGuideStore()

onMounted(async () => {
  await handleSelectNotice()
})
</script>
