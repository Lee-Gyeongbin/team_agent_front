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
import type { Agent } from '~/types/agent'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const agentList = ref<Agent[]>([
  {
    id: '1',
    name: '지식검색 (매뉴얼AI)',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'active',
    isActive: true,
    priority: 1,
    type: 'RAG',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '2',
    name: '데이터분석(SQL)',
    description: '사용자의 자연어 질문을 SQL 쿼리로 변환하여 데이터베이스에서 정보를 조회하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'active',
    isActive: true,
    priority: 2,
    type: 'TextToSQL',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '3',
    name: '번역 Agent',
    description: '다국어 번역 및 언어 감지 Agent',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'draft',
    isActive: false,
    priority: 3,
    type: 'TextToSQL',
    connectionCount: 15,
    datasetCount: 0,
    similarityThreshold: 0.5,
    maxSearchResults: 10,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '4',
    name: '지식검색 (매뉴얼AI)',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'draft',
    isActive: false,
    priority: 4,
    type: 'RAG',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
])

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

const onSaveSetting = (form: { type: string; name: string; description: string; similarityThreshold: number; maxSearchResults: number }) => {
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
