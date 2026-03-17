<template>
  <div class="prompt-error-message">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">오류 메시지 설정</span>
        </div>
      </div>

      <div class="prompt-error-body">
        <!-- 응답 생성 오류 -->
        <section class="prompt-error-section">
          <h3 class="prompt-error-section-title">응답 생성 오류</h3>
          <div class="prompt-error-items">
            <div
              v-for="item in localData.responseErrors"
              :key="item.key"
              class="prompt-error-item"
              :style="{ '--error-color': item.color }"
            >
              <div class="prompt-error-item-header">
                <span class="prompt-error-item-label">{{ item.label }}</span>
                <UiToggle v-model="item.isEnabled" />
              </div>
              <UiTextarea
                v-model="item.message"
                :rows="3"
              />
            </div>
          </div>
        </section>

        <!-- 입력 오류 메시지 -->
        <section class="prompt-error-section">
          <h3 class="prompt-error-section-title">입력 오류 메시지</h3>
          <div class="prompt-error-items">
            <div
              v-for="item in localData.inputErrors"
              :key="item.key"
              class="prompt-error-item"
              :style="{ '--error-color': item.color }"
            >
              <div class="prompt-error-item-header">
                <span class="prompt-error-item-label">{{ item.label }}</span>
                <UiToggle v-model="item.isEnabled" />
              </div>
              <!-- 메시지 길이 초과: 최대 글자 수 입력 -->
              <div
                v-if="item.maxLength !== undefined"
                class="prompt-error-item-option"
              >
                <span class="prompt-error-item-option-label">최대 글자 수</span>
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
              />
            </div>
          </div>
        </section>

        <!-- API 오류 메시지 -->
        <section class="prompt-error-section">
          <h3 class="prompt-error-section-title">API 오류 메시지</h3>
          <div class="prompt-error-items">
            <div
              v-for="item in localData.apiErrors"
              :key="item.key"
              class="prompt-error-item"
              :style="{ '--error-color': item.color }"
            >
              <div class="prompt-error-item-header">
                <span class="prompt-error-item-label">{{ item.label }}</span>
                <UiToggle v-model="item.isEnabled" />
              </div>
              <UiTextarea
                v-model="item.message"
                :rows="3"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- 하단 버튼 -->
      <div class="prompt-error-footer">
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <!-- 저장 확인 모달 -->
    <UiDialogModal
      :is-open="isSaveModalOpen"
      title="오류 메시지 저장"
      message="오류 메시지 설정을 저장하시겠습니까?"
      confirm-text="저장"
      @close="isSaveModalOpen = false"
      @confirm="doSave"
    />

    <!-- 초기화 확인 모달 -->
    <UiDialogModal
      :is-open="isResetModalOpen"
      title="오류 메시지 초기화"
      message="오류 메시지를 기본값으로 초기화하시겠습니까?"
      confirm-text="초기화"
      @close="isResetModalOpen = false"
      @confirm="doReset"
    />
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
const isSaveModalOpen = ref(false)

const onSave = () => {
  isSaveModalOpen.value = true
}

const doSave = async () => {
  await handleSaveErrorMessage(localData.value)
  isSaveModalOpen.value = false
}

// 초기화
const isResetModalOpen = ref(false)

const onReset = () => {
  isResetModalOpen.value = true
}

const doReset = async () => {
  await handleSelectErrorMessageData()
  syncLocalData()
  isResetModalOpen.value = false
}
</script>
