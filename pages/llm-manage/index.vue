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
      item-key="id"
      animation="200"
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

const { llmList, handleSelectLlmList, handleSaveLlm, handleDeleteLlm, handleUpdateLlmOrder } = useLlmStore()

onMounted(() => handleSelectLlmList())

const activeCount = computed(() => llmList.value.filter((m) => m.isActive).length)

// ===== 설정 모달 =====
const isSettingOpen = ref(false)
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
  await handleSaveLlm({
    id: selectedModel.value?.id,
    ...form,
  })
  isSettingOpen.value = false
}

const onDeleteLlm = async (model: LlmModel) => {
  await handleDeleteLlm(model.id)
}

const onToggleActive = async (model: LlmModel) => {
  await handleSaveLlm({ id: model.id, isActive: !model.isActive })
}

const onDragEnd = async () => {
  const orderData = llmList.value.map((item, index) => ({ id: item.id, order: index }))
  await handleUpdateLlmOrder(orderData)
}
</script>
