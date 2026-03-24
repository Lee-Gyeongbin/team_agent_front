<template>
  <div class="prompt-filter">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">금지어 및 필터링 설정</span>
          <span class="prompt-box-sub">챗봇이 사용하지 말아야 할 단어나 민감한 키워드를 관리합니다.</span>
        </div>
        <div class="prompt-limit-header-actions">
          <UiButton
            variant="outline"
            size="md"
            @click="onCancel"
          >
            취소
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

      <div class="prompt-filter-body">
        <!-- 입력 금지어 -->
        <PromptFilterKeyword
          title="입력 금지어"
          :keywords="localData.inputBanWords"
          word-type="I"
          placeholder="사용자가 입력 할 수 없는 단어 (욕설, 비속어) 입력"
          @update:keywords="localData.inputBanWords = $event"
        />

        <!-- 구분선 -->
        <div class="prompt-filter-divider" />

        <!-- 출력 금지어 -->
        <PromptFilterKeyword
          title="출력 금지어"
          :keywords="localData.outputBanWords"
          word-type="O"
          placeholder="챗봇이 응답에 포함 할 수 없는 단어"
          @update:keywords="localData.outputBanWords = $event"
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
  </div>
</template>

<script setup lang="ts">
import type { PromptFilterData, banWordItem, PromptFilterPolicy } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { filterData, handleSelectFilterData, handleSaveFilter } = usePromptStore()

const cloneFilterFromStore = (): PromptFilterData => ({
  inputBanWords: (filterData.value.inputBanWords ?? []).map((w: banWordItem) => ({ ...w })),
  outputBanWords: (filterData.value.outputBanWords ?? []).map((w: banWordItem) => ({ ...w })),
  policies: (filterData.value.policies ?? []).map((p: PromptFilterPolicy) => ({ ...p })),
})

// 스토어에 이미 프리패치된 데이터가 있으면 첫 페인트부터 동일 레이아웃 (빈 상태 → 채움 덜컹 완화)
const localData = ref<PromptFilterData>(cloneFilterFromStore())

// 최신값 반영
onMounted(async () => {
  await handleSelectFilterData()
  localData.value = cloneFilterFromStore()
})

// 취소 (원래 데이터로 복원)
const onCancel = () => {
  localData.value = cloneFilterFromStore()
}

// 저장
const onSave = () => {
  handleSaveFilter(localData.value)
}
</script>
