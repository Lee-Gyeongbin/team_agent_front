<template>
  <div class="chat-comment-panel">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">오류 메시지 설정</h3>
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

    <div class="chat-comment-error-body">
      <!-- 응답 생성 오류 -->
      <section class="chat-comment-error-section">
        <h4 class="chat-comment-error-section-title">응답 생성 오류</h4>
        <div class="chat-comment-error-items">
          <div
            v-for="(item, idx) in localData.responseErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--error"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">
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
      <section class="chat-comment-error-section">
        <h4 class="chat-comment-error-section-title">입력 오류 메시지</h4>
        <div class="chat-comment-error-items">
          <div
            v-for="(item, idx) in localData.inputErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--info"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.inputErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = v ? 'Y' : 'N')"
              />
            </div>
            <div
              v-if="item.guideKey === 'INPUT_LENGTH'"
              class="chat-comment-error-item-option"
            >
              <span class="chat-comment-error-item-option-label">최대 글자 수</span>
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
      <section class="chat-comment-error-section">
        <h4 class="chat-comment-error-section-title">API 오류 메시지</h4>
        <div class="chat-comment-error-items">
          <div
            v-for="(item, idx) in localData.apiErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--error"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">
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

const { localErrorMessageData: localData, handleSelectErrorMessage, handleSaveErrorMessage } = useChatGuideStore()

onMounted(async () => {
  await handleSelectErrorMessage()
})

const onSave = () => {
  openConfirm({
    title: '오류 메시지 저장',
    message: '변경된 오류 메시지 내용을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await handleSaveErrorMessage(localData.value)
        openToast({ message: '저장되었습니다.', type: 'success' })
      } catch {
        openToast({ message: '오류 메시지 설정 저장 실패', type: 'error' })
      }
    },
  })
}

const onReset = () => {
  openConfirm({
    title: '오류 메시지 초기화',
    message:
      '초기화 시 변경된 오류 메시지 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
    onConfirm: async () => {
      await handleSelectErrorMessage()
      openToast({ message: '오류 메시지 설정이 초기화되었습니다.', type: 'info' })
    },
  })
}
</script>
