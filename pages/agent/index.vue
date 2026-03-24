<template>
  <div class="com-card-page m-center">
    <!-- 헤더 -->
    <AgentListHeader
      :active-count="activeCount"
      :total-count="agentList.length"
      @add="openAddAgent"
    />

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      text="에이전트를 불러오는 중..."
    />

    <!-- 에이전트 목록 (드래그 정렬) -->
    <draggable
      v-else
      v-model="agentList"
      class="com-card-list"
      handle=".com-card-drag"
      item-key="agentId"
      animation="200"
      @start="onAgentDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <AgentCard
          :agent="element"
          @click="onClickSetting(element)"
          @delete="doDeleteAgent"
          @toggle="onToggleActive"
        />
      </template>
    </draggable>
    <!-- 설정 슬라이드 모달 -->
    <AgentSettingModal
      :is-open="isSettingOpen"
      :agent="selectedAgent"
      @close="isSettingOpen = false"
      @save="onSaveSetting"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useAgentStore } from '~/composables/agent/useAgentStore'
import { openConfirm } from '~/composables/useDialog'
import type { Agent } from '~/types/agent'

const {
  agentList,
  isSettingOpen,
  selectedAgent,
  handleSelectAgentList,
  handleFetchModelOptions,
  handleFetchAgentDetail,
  handleSaveAgent,
  handleDeleteAgent,
  onAgentDragStart,
  handleUpdateAgentOrder,
  handleToggleAgent,
} = useAgentStore()

const isLoading = ref(true)

onMounted(async () => {
  await handleSelectAgentList()
  await handleFetchModelOptions()
  isLoading.value = false
})

const activeCount = computed(() => agentList.value.filter((a) => a.useYn === 'Y').length)

/** 에이전트 추가 */
const openAddAgent = async () => {
  selectedAgent.value = null
  isSettingOpen.value = true
}

const onClickSetting = async (agent: Agent) => {
  await handleFetchAgentDetail(agent)
}

// 설정 저장
const onSaveSetting = async (form: Partial<Agent>) => {
  await handleSaveAgent({
    agentId: selectedAgent.value?.agentId,
    sortOrd: selectedAgent.value?.sortOrd,
    ...form,
  })
}

const doDeleteAgent = async (agent: Agent) => {
  await handleDeleteAgent(agent)
}

const onToggleActive = async (agent: Agent) => {
  await handleToggleAgent(agent.agentId, agent.useYn === 'Y' ? 'N' : 'Y')
}

const onDragEnd = async () => {
  const orderData = agentList.value.map((item, index) => ({ agentId: item.agentId, sortOrd: index + 1 }))
  await handleUpdateAgentOrder(orderData)
}
</script>
