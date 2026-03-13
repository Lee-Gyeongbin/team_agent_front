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
          @delete="onDeleteLlm"
          @toggle="onToggleActive"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useLlmStore } from '~/composables/llm/useLlmStore'
import type { LlmModel } from '~/types/llm'

const { llmList, handleSelectLlmList, handleSaveLlm, handleDeleteLlm, handleUpdateLlmOrder } = useLlmStore()

onMounted(() => handleSelectLlmList())

const activeCount = computed(() => llmList.value.filter((m) => m.isActive).length)

// 모델 추가 (TODO: 모달 연결)
const openAddLlm = () => {
  // TODO: 추가 모달 열기
}

// 모델 삭제
const onDeleteLlm = async (model: LlmModel) => {
  await handleDeleteLlm(model.id)
}

// 활성/비활성 토글
const onToggleActive = async (model: LlmModel) => {
  await handleSaveLlm({ id: model.id, isActive: !model.isActive })
}

// 드래그 정렬
const onDragEnd = async () => {
  const orderData = llmList.value.map((item, index) => ({ id: item.id, order: index }))
  await handleUpdateLlmOrder(orderData)
}
</script>
