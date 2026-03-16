<template>
  <div class="prompt-filter">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">금지어 및 필터링 설정</span>
          <span class="prompt-box-sub">챗봇이 사용하지 말아야 할 단어나 민감한 키워드를 관리합니다.</span>
        </div>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>

      <div class="prompt-filter-body">
        <!-- 입력 금지어 -->
        <PromptFilterKeyword
          title="입력 금지어"
          :keywords="localData.inputKeywords"
          placeholder="사용자가 입력 할 수 없는 단어 (욕설, 비속어) 입력"
          @update:keywords="localData.inputKeywords = $event"
        />

        <!-- 구분선 -->
        <div class="prompt-filter-divider" />

        <!-- 출력 금지어 -->
        <PromptFilterKeyword
          title="출력 금지어"
          :keywords="localData.outputKeywords"
          placeholder="챗봇이 응답에 포함 할 수 없는 단어"
          @update:keywords="localData.outputKeywords = $event"
        />

        <!-- 구분선 -->
        <div class="prompt-filter-divider" />

        <!-- 컨텐츠 필터링 정책 -->
        <PromptFilterPolicy
          :policies="localData.policies"
          @update:policies="localData.policies = $event"
        />
      </div>
    </div>

    <!-- 저장 확인 모달 -->
    <UiDialogModal
      :is-open="isSaveModalOpen"
      title="필터링 설정 저장"
      message="금지어 및 필터링 설정을 저장하시겠습니까?"
      confirm-text="저장"
      @close="isSaveModalOpen = false"
      @confirm="doSave"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromptFilterData } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { filterData, handleSelectFilterData, handleSaveFilter } = usePromptStore()

// 로컬 편집용 데이터
const localData = ref<PromptFilterData>({
  inputKeywords: [],
  outputKeywords: [],
  policies: [],
})

// 초기 조회
onMounted(async () => {
  await handleSelectFilterData()
  localData.value = {
    inputKeywords: [...filterData.value.inputKeywords],
    outputKeywords: [...filterData.value.outputKeywords],
    policies: filterData.value.policies.map((p) => ({ ...p })),
  }
})

// 저장
const isSaveModalOpen = ref(false)

const onSave = () => {
  isSaveModalOpen.value = true
}

const doSave = async () => {
  await handleSaveFilter(localData.value)
}
</script>
