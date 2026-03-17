<template>
  <div class="chat-comment-greeting">
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
            v-for="item in localData.responseErrors"
            :key="item.key"
            class="chat-comment-error-item"
            :style="{ '--error-color': item.color }"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ item.label }}</span>
              <UiToggle v-model="item.isEnabled" />
            </div>
            <UiTextarea
              v-model="item.message"
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
            v-for="item in localData.inputErrors"
            :key="item.key"
            class="chat-comment-error-item"
            :style="{ '--error-color': item.color }"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ item.label }}</span>
              <UiToggle v-model="item.isEnabled" />
            </div>
            <!-- 메시지 길이 초과: 최대 글자 수 입력 -->
            <div
              v-if="item.maxLength !== undefined"
              class="chat-comment-error-item-option"
            >
              <span class="chat-comment-error-item-option-label">최대 글자 수</span>
              <UiInput
                v-model="item.maxLength"
                type="number"
                size="sm"
                style="width: 120px"
              />
            </div>
            <UiTextarea
              v-model="item.message"
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
            v-for="item in localData.apiErrors"
            :key="item.key"
            class="chat-comment-error-item"
            :style="{ '--error-color': item.color }"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ item.label }}</span>
              <UiToggle v-model="item.isEnabled" />
            </div>
            <UiTextarea
              v-model="item.message"
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
import type { ErrorMessageData, ErrorMessageItem } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { errorMessageData, handleSelectErrorMessageData, handleSaveErrorMessage } = usePromptStore()

// 로컬 편집용 데이터
const localData = ref<ErrorMessageData>({
  responseErrors: [],
  inputErrors: [],
  apiErrors: [],
})

// 깊은 복사 헬퍼
const cloneItems = (items: ErrorMessageItem[]) => items.map((e) => ({ ...e }))

const syncLocalData = () => {
  localData.value = {
    responseErrors: cloneItems(errorMessageData.value.responseErrors),
    inputErrors: cloneItems(errorMessageData.value.inputErrors),
    apiErrors: cloneItems(errorMessageData.value.apiErrors),
  }
}

// 초기 조회
onMounted(async () => {
  await handleSelectErrorMessageData()
  syncLocalData()
})

// 저장
const onSave = async () => {
  await handleSaveErrorMessage(localData.value)
}

// 초기화
const onReset = async () => {
  await handleSelectErrorMessageData()
  syncLocalData()
}
</script>
