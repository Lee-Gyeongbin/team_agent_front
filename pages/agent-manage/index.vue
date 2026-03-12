<template>
  <div class="agent-index l-center">
    <!-- 헤더 -->
    <AgentListHeader
      :active-count="activeCount"
      :total-count="agentList.length"
      @add="openAddAgent"
    />

    <!-- 에이전트 목록 (드래그 정렬) -->
    <draggable
      v-model="agentList"
      class="agent-list"
      handle=".agent-card-drag"
      item-key="id"
      animation="200"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <AgentCard
          :agent="element"
          @setting="onClickSetting"
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

const { agentList, handleSelectAgentList } = useAgentStore()

onMounted(() => handleSelectAgentList())

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

const onSaveSetting = (form: {
  type: string
  name: string
  description: string
  similarityThreshold: number
  maxSearchResults: number
}) => {
  // 🔽 백엔드 연결 시 API 호출로 교체
  if (selectedAgent.value) {
    // 수정
    selectedAgent.value.type = form.type
    selectedAgent.value.name = form.name
    selectedAgent.value.description = form.description
    selectedAgent.value.similarityThreshold = form.similarityThreshold
    selectedAgent.value.maxSearchResults = form.maxSearchResults
  } else {
    // 추가
    agentList.value.push({
      id: `agent-${Date.now()}`,
      name: form.name,
      description: form.description,
      model: 'gpt-4',
      systemPrompt: '',
      temperature: 0.7,
      status: 'draft',
      isActive: false,
      priority: agentList.value.length + 1,
      type: form.type,
      connectionCount: 0,
      datasetCount: 0,
      similarityThreshold: form.similarityThreshold,
      maxSearchResults: form.maxSearchResults,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    })
  }
  isSettingOpen.value = false
}

const onToggleActive = (agent: Agent) => {
  agent.isActive = !agent.isActive
}

// 🔽 드래그 정렬 — 백엔드 연결 시 API 호출로 교체
const onDragEnd = () => {
  const orderData = agentList.value.map((item, index) => ({ id: item.id, order: index }))
  console.warn('[TODO] Agent 순서 변경:', orderData)
}
</script>
