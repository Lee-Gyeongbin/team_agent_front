<template>
  <div class="com-card-page l-center">
    <!-- 헤더 -->
    <LlmListHeader
      :active-count="activeCount"
      :total-count="llmList.length"
      @add="openAddLlm"
    />

    <!-- LLM 모델 목록 (드래그 정렬) -->
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
          @delete="onDeleteLlm"
          @toggle="onToggleActive"
        />
      </template>
    </draggable>

    <!-- 설정 슬라이드 모달 -->
    <LlmSettingModal
      :is-open="isSettingOpen"
      :model="selectedModel"
      @close="isSettingOpen = false"
      @save="onSaveSetting"
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

onMounted(() => handleSelectLlmList())

const activeCount = computed(() => llmList.value.filter((m) => m.useYn === 'Y').length)

const selectedModel = ref<LlmModel | null>(null)

const openAddLlm = () => {
  selectedModel.value = null
  isSettingOpen.value = true
}

const onClickSetting = (model: LlmModel) => {
  selectedModel.value = model
  isSettingOpen.value = true
}

const onSaveSetting = async (form: Partial<LlmModel>) => {
  const model = selectedModel.value
  const sortOrder = model?.sortOrder ?? Math.max(0, ...llmList.value.map((m) => m.sortOrder ?? 0)) + 1
  await handleSaveLlm({
    ...form,
    sortOrder,
  })
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
