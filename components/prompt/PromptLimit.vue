<template>
  <div class="prompt-limit">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">토큰 및 응답 제한 설정</span>
          <span class="prompt-box-sub">API 비용 관리와 응답 품질을 위한 제한을 설정합니다.</span>
        </div>
        <div class="prompt-limit-header-actions">
          <UiButton
            variant="line-secondary"
            size="md"
            @click="onReset"
          >
            기본값 복원
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            @click="onSave"
          >
            저장
          </UiButton>
        </div>
      </div>

      <!-- 토큰 제한 -->
      <PromptLimitToken v-model="localData" />

      <!-- 구분선 -->
      <div class="prompt-box-divider" />

      <!-- 사용량 제한 -->
      <PromptLimitUsage v-model="localData" />

      <!-- 구분선 -->
      <div class="prompt-box-divider" />

      <!-- 응답 품질 제어 -->
      <PromptLimitQuality v-model="localData" />
    </div>

    <!-- 저장 확인 모달 -->
    <UiDialogModal
      :is-open="isSaveModalOpen"
      title="설정 저장"
      message="토큰 및 응답 제한 설정을 저장하시겠습니까?"
      confirm-text="저장"
      @close="isSaveModalOpen = false"
      @confirm="doSave"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromptLimitData } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { limitData, handleSelectLimitData, handleSaveLimit } = usePromptStore()

// 로컬 편집용 데이터
const localData = ref<PromptLimitData>({
  maxInputTokens: 0,
  maxOutputTokens: 0,
  contextWindow: 0,
  dailyRequestLimit: 0,
  monthlyOrgLimit: 0,
  rateLimit: 0,
  todayUsage: 0,
  monthUsage: 0,
  monthLimit: 0,
  minResponseLength: 0,
  responseTimeout: 0,
  retryCount: 0,
  streamingEnabled: false,
})

// 초기 조회
onMounted(async () => {
  await handleSelectLimitData()
  localData.value = { ...limitData.value }
})

// 저장
const isSaveModalOpen = ref(false)

const onSave = () => {
  isSaveModalOpen.value = true
}

const doSave = async () => {
  await handleSaveLimit(localData.value)
}

// 기본값 복원
const onReset = () => {
  localData.value = {
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    contextWindow: 8000,
    dailyRequestLimit: 100,
    monthlyOrgLimit: 50000,
    rateLimit: 20,
    todayUsage: localData.value.todayUsage,
    monthUsage: localData.value.monthUsage,
    monthLimit: 50000,
    minResponseLength: 50,
    responseTimeout: 30,
    retryCount: 3,
    streamingEnabled: true,
  }
}
</script>
