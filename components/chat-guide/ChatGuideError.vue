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
            v-for="item in localData.responseErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--error"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ rowLabel(item.guideKey) }}</span>
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
            v-for="item in localData.inputErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--info"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ rowLabel(item.guideKey) }}</span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = v ? 'Y' : 'N')"
              />
            </div>
            <div
              v-if="item.maxChars !== undefined"
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
            v-for="item in localData.apiErrors"
            :key="item.guideKey"
            class="chat-comment-error-item chat-comment-error-item--error"
          >
            <div class="chat-comment-error-item-header">
              <span class="chat-comment-error-item-label">{{ rowLabel(item.guideKey) }}</span>
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
import { cloneChatGuideErrorData, type ChatGuideErrorData } from '~/types/chat-guide'
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { errorMessageData, handleSelectErrorMessage, handleSaveErrorMessage } = useChatGuideStore()

const localData = ref<ChatGuideErrorData>({
  responseErrors: [],
  inputErrors: [],
  apiErrors: [],
})

/** guideKey → 화면 라벨 */
const ERROR_ROW_LABELS: Record<string, string> = {
  RESP_FAIL: '답변 생성 실패',
  RESP_NO_RESULT: '검색 결과 없음',
  INPUT_EMPTY: '빈 메시지 입력',
  INPUT_LENGTH: '메시지 길이 초과',
  INPUT_UPLOAD_FAIL: '파일 업로드 실패',
  API_500: '500 Internal Server Error',
  API_429: '429 Too Many Requests',
  API_408: '408 Request Timeout',
  API_401_403: '401/403 Unauthorized',
}

const rowLabel = (guideKey: string) => ERROR_ROW_LABELS[guideKey] ?? guideKey

const syncLocalData = () => {
  localData.value = cloneChatGuideErrorData(errorMessageData.value)
}

onMounted(async () => {
  await handleSelectErrorMessage()
  syncLocalData()
})

const onSave = () => {
  openConfirm({
    title: '오류 메시지 저장',
    message: '변경된 오류 메시지 내용을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await handleSaveErrorMessage(localData.value)
        syncLocalData()
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
      syncLocalData()
      openToast({ message: '오류 메시지 설정이 초기화되었습니다.', type: 'info' })
    },
  })
}
</script>
