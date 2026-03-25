<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">오류 메시지 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          @click="handleConfirmSaveErrorMessage"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="handleConfirmResetErrorMessage"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="chat-guide-error-body">
      <!-- 응답 생성 오류 -->
      <section class="chat-guide-error-section">
        <h4 class="chat-guide-error-section-title">응답 생성 오류</h4>
        <div class="chat-guide-error-items">
          <div
            v-for="(item, idx) in localData.responseErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--error"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.responseErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = v ? 'Y' : 'N')"
              />
            </div>
            <UiTextarea
              v-model="item.content"
              :rows="3"
              border
              size="sm"
              auto-resize
              :max-rows="6"
            />
          </div>
        </div>
      </section>

      <!-- 입력 오류 메시지 -->
      <section class="chat-guide-error-section">
        <h4 class="chat-guide-error-section-title">입력 오류 메시지</h4>
        <div class="chat-guide-error-items">
          <div
            v-for="(item, idx) in localData.inputErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--info"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.inputErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = v ? 'Y' : 'N')"
              />
            </div>
            <div
              v-if="item.guideKey === 'INPUT_LENGTH'"
              class="chat-guide-error-item-option"
            >
              <span class="chat-guide-error-item-option-label">최대 글자 수</span>
              <UiInput
                v-model="item.maxChars"
                number-only
                size="sm"
                style="width: 120px"
              />
            </div>
            <UiTextarea
              v-model="item.content"
              :rows="3"
              border
              size="sm"
              auto-resize
              :max-rows="6"
            />
          </div>
        </div>
      </section>

      <!-- API 오류 메시지 -->
      <section class="chat-guide-error-section">
        <h4 class="chat-guide-error-section-title">API 오류 메시지</h4>
        <div class="chat-guide-error-items">
          <div
            v-for="(item, idx) in localData.apiErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--error"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.apiErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = v ? 'Y' : 'N')"
              />
            </div>
            <UiTextarea
              v-model="item.content"
              :rows="3"
              border
              size="sm"
              auto-resize
              :max-rows="6"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHAT_GUIDE_ERROR_CATALOG } from '~/types/chat-guide'
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  localErrorMessageData: localData,
  handleSelectErrorMessage,
  handleConfirmSaveErrorMessage,
  handleConfirmResetErrorMessage,
} = useChatGuideStore()

onMounted(async () => {
  await handleSelectErrorMessage()
})
</script>
