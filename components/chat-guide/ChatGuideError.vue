<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">오류 메시지 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          :disabled="isLoading"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          :disabled="isLoading"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <UiLoading
      v-if="isLoading"
      overlay
      text="오류 메시지를 불러오는 중..."
    />

    <UiEmpty
      v-else-if="isError"
      :title="errorTitle"
      :description="errorMessage"
    >
      <UiButton
        size="sm"
        variant="secondary"
        @click="load"
      >
        다시 시도
      </UiButton>
    </UiEmpty>

    <div
      v-else
      class="chat-guide-error-body"
    >
      <!-- 응답 생성 오류 -->
      <section class="chat-guide-error-section">
        <h4 class="chat-guide-error-section-title">응답 생성 오류</h4>
        <div class="chat-guide-error-items">
          <div
            v-for="(item, idx) in errorMessageData.responseErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--error"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.responseErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = toYn(v))"
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
            v-for="(item, idx) in errorMessageData.inputErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--info"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.inputErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = toYn(v))"
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
            v-for="(item, idx) in errorMessageData.apiErrors"
            :key="item.guideKey"
            class="chat-guide-error-item chat-guide-error-item--error"
          >
            <div class="chat-guide-error-item-header">
              <span class="chat-guide-error-item-label">
                {{ CHAT_GUIDE_ERROR_CATALOG.apiErrors[idx]?.label ?? item.guideKey }}
              </span>
              <UiToggle
                :model-value="item.enblYn === 'Y'"
                @update:model-value="(v) => (item.enblYn = toYn(v))"
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
import { onMounted, ref } from 'vue'
import { CHAT_GUIDE_ERROR_CATALOG } from '~/types/chat-guide'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { errorMessageData, handleSelectErrorMessageData, handleSaveErrorMessage } = useChatGuideStore()

const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const errorTitle = ref('불러오기 실패')

const load = async () => {
  isLoading.value = true
  isError.value = false
  errorMessage.value = ''
  try {
    await handleSelectErrorMessageData()
  } catch (err) {
    isError.value = true
    errorMessage.value =
      err instanceof Error && err.message
        ? `오류 메시지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
        : '오류 메시지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

const onSave = async () => {
  const confirmed = await openConfirm({
    title: '오류 메시지 저장',
    message: '변경된 오류 메시지 내용을 저장하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleSaveErrorMessage(errorMessageData.value)
    openToast({ message: '저장되었습니다.', type: 'success' })
  } catch (err) {
    openToast({
      message:
        err instanceof Error && err.message
          ? `오류 메시지 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
          : '오류 메시지 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      type: 'error',
    })
  }
}

const onReset = async () => {
  const confirmed = await openConfirm({
    title: '오류 메시지 초기화',
    message:
      '초기화 시 변경된 오류 메시지 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await load()
    openToast({ message: '오류 메시지가 초기화되었습니다.', type: 'info' })
  } catch {
    // load에서 UI로 에러 처리
  }
}

onMounted(() => {
  load()
})
</script>
