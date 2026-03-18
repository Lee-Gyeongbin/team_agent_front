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
  </div>
</template>

<script setup lang="ts">
import type { PromptLimitData } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { limitData, handleSelectLimitData, handleSaveLimit } = usePromptStore()

// 로컬 편집용 데이터
const localData = ref<PromptLimitData>({
  limitId: '',
  maxInTokens: 0,
  maxOutTokens: 0,
  ctxtWin: 0,
  dayUserLmt: 0,
  monOrgLmt: 0,
  rateLmtRpm: 0,
  minRespLen: 0,
  respTmo: 0,
  retryCnt: 0,
  streamYn: 'N',
  modifyDt: '',
})

// 초기 조회
onMounted(async () => {
  await handleSelectLimitData()
  localData.value = { ...limitData.value }
})

// 저장
const onSave = async () => {
  await handleSaveLimit(localData.value)
}

// 기본값 복원
const onReset = () => {
  localData.value = {
    ...localData.value,
    maxInTokens: 4000,
    maxOutTokens: 2000,
    ctxtWin: 8000,
    dayUserLmt: 100,
    monOrgLmt: 50000,
    rateLmtRpm: 20,
    minRespLen: 50,
    respTmo: 30,
    retryCnt: 3,
    streamYn: 'Y',
  }
}
</script>
