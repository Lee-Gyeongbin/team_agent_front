<template>
  <div class="com-card-page m-center">
    <!-- 헤더 -->
    <LlmListHeader
      :active-count="activeCount"
      :total-count="llmList.length"
      @add="openAddLlm"
    />

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      overlay
      text="모델 목록을 불러오는 중..."
    />

    <!-- LLM 모델 목록 (드래그 정렬) -->
    <div
      v-else
      class="com-card-list-wrap"
    >
      <draggable
        v-model="llmList"
        class="com-card-list"
        handle=".com-card-drag"
        item-key="modelId"
        animation="200"
        @start="onLlmDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <LlmCard
            :model="element"
            @setting="onClickSetting"
            @test="onClickTest"
            @delete="onDeleteLlm"
            @toggle="onToggleActive"
          />
        </template>
      </draggable>
    </div>

    <!-- 설정 슬라이드 모달 -->
    <LlmSettingModal
      :is-open="isSettingOpen"
      :model="selectedModel"
      @close="isSettingOpen = false"
      @save="onSaveSetting"
    />

    <!-- 모델 테스트 모달 -->
    <LlmTestModal
      :is-open="isTestOpen"
      :model="selectedModelForTest"
      @close="isTestOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useLlmStore } from '~/composables/llm/useLlmStore'
import type { LlmModel } from '~/types/llm'

const {
  llmList,
  isSettingOpen,
  handleSelectLlmList,
  handleSaveLlm,
  handleDeleteLlm,
  handleUpdateLlmOrder,
  handleToggleActive,
  onLlmDragStart,
} = useLlmStore()

const isLoading = ref(true)

onMounted(async () => {
  await handleSelectLlmList()
  isLoading.value = false
})

const activeCount = computed(() => llmList.value.filter((m) => m.useYn === 'Y').length)

const selectedModel = ref<LlmModel | null>(null)
const isTestOpen = ref(false)
const selectedModelForTest = ref<LlmModel | null>(null)

const openAddLlm = () => {
  selectedModel.value = null
  isSettingOpen.value = true
}

const onClickSetting = (model: LlmModel) => {
  selectedModel.value = model
  isSettingOpen.value = true
}

const onClickTest = (model: LlmModel) => {
  selectedModelForTest.value = model
  isTestOpen.value = true
}

const onSaveSetting = async (form: Partial<LlmModel>) => {
  const model = selectedModel.value
  const sortOrder = model?.sortOrder ?? Math.max(0, ...llmList.value.map((m) => m.sortOrder ?? 0)) + 1
  await handleSaveLlm({ ...form, sortOrder }, model?.modelId)
}

const onDeleteLlm = async (model: LlmModel) => {
  await handleDeleteLlm(model.modelId)
}

const onToggleActive = async (model: LlmModel) => {
  await handleToggleActive({ ...model, useYn: model.useYn === 'Y' ? 'N' : 'Y' })
}

const onDragEnd = async () => {
  const orderData = llmList.value.map((item, index) => ({ modelId: item.modelId, sortOrder: index + 1 }))
  await handleUpdateLlmOrder(orderData)
}
</script>

<style lang="scss" scoped>
.com-card-list-wrap {
  padding-bottom: $spacing-xl;
}
</style>
