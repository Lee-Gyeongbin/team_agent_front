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
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
])

const activeCount = computed(() => agentList.value.filter((a) => a.isActive).length)

const openAddAgent = () => {
  navigateTo('/agents/new')
}

const onClickSetting = (agent: Agent) => {
  navigateTo(`/agents/${agent.id}`)
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
