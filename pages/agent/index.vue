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
      item-key="id"
      animation="200"
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

const { agentList, handleSelectAgentList, handleSaveAgent, handleDeleteAgent, handleUpdateAgentOrder } = useAgentStore()

const isLoading = ref(true)

onMounted(async () => {
  await handleSelectAgentList()
  isLoading.value = false
})

const activeCount = computed(() => agentList.value.filter((a) => a.isActive).length)

const openAddAgent = () => {
  selectedAgent.value = null
  isSettingOpen.value = true
}

// 설정 모달
const isSettingOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

const onClickSetting = (agent: Agent) => {
  selectedAgent.value = agent
  isSettingOpen.value = true
}

// 설정 저장
const onSaveSetting = async (form: {
  type: string
  name: string // 제목
  description: string // 설명
  similarityThreshold: number // 유사도 임계값
  maxSearchResults: number // 최대 검색 결과 수
}) => {
  await handleSaveAgent({
    id: selectedAgent.value?.id,
    ...form,
  })
  // 모달 닫기
  isSettingOpen.value = false
}

const doDeleteAgent = async (agent: Agent) => {
  const confirmed = await openConfirm({
    title: '에이전트 삭제',
    message: `"${agent.name}" 에이전트를 삭제하시겠습니까?`,
  })
  if (!confirmed) return
  await handleDeleteAgent(agent.id)
}

const onToggleActive = async (agent: Agent) => {
  await handleSaveAgent({ id: agent.id, isActive: !agent.isActive })
}

// 🔽 드래그 정렬 — 백엔드 연결 시 API 호출로 교체
const onDragEnd = async () => {
  const orderData = agentList.value.map((item, index) => ({ id: item.id, order: index }))
  await handleUpdateAgentOrder(orderData)
}
</script>
