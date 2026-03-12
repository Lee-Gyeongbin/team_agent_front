<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    title="Agent 설정"
    @close="$emit('close')"
  >
    <div class="agent-setting-form">
      <!-- 섹션1: Agent 유형 -->
      <AgentSettingType v-model="form.type" />

      <!-- 섹션2: Agent 기본 설정 -->
      <AgentSettingBasic v-model="basicForm" />

      <!-- 섹션3: RAG 데이터셋 연결 -->
      <AgentSettingDataset
        :datasets="datasetList"
        @update:datasets="datasetList = $event"
        @add="onAddDataset"
        @dataset-setting="onDatasetSetting"
        @dataset-sync="onDatasetSync"
      />
    </div>

    <!-- 푸터 -->
    <template #footer>
      <div class="agent-setting-footer">
        <UiButton
          variant="outline"
          size="lg"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="dark"
          size="lg"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Agent, AgentDataset } from '~/types/agent'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [form: { type: string; name: string; description: string; similarityThreshold: number; maxSearchResults: number }]
}>()

// 유형
const form = ref({
  type: '',
})

// 기본 설정 폼
const basicForm = ref({
  name: '',
  description: '',
  similarityThreshold: 0.7,
  maxSearchResults: 5,
})

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const datasetList = ref<AgentDataset[]>([
  {
    id: 'ds-1',
    name: '제품 매뉴얼 DB',
    description: '전체 제품 매뉴얼과 사용자 가이드 문서',
    documentCount: 248,
    chunkCount: 12543,
    isConnected: true,
    updatedAt: '2026-02-29',
  },
  {
    id: 'ds-2',
    name: 'FAQ 데이터셋',
    description: '전체 제품 매뉴얼과 사용자 가이드 문서',
    documentCount: 248,
    chunkCount: 12543,
    isConnected: false,
    updatedAt: '2026-02-29',
  },
  {
    id: 'ds-3',
    name: 'FAQ 데이터셋',
    description: '전체 제품 매뉴얼과 사용자 가이드 문서',
    documentCount: 248,
    chunkCount: 12543,
    isConnected: false,
    updatedAt: '2026-02-29',
  },
])

// agent prop 변경 시 폼 초기화
watch(
  () => props.agent,
  (agent) => {
    if (agent) {
      form.value.type = agent.type
      basicForm.value = {
        name: agent.name,
        description: agent.description,
        similarityThreshold: agent.similarityThreshold ?? 0.7,
        maxSearchResults: agent.maxSearchResults ?? 5,
      }
    }
  },
  { immediate: true },
)

const onSave = () => {
  emit('save', {
    type: form.value.type,
    ...basicForm.value,
  })
}

// 🔽 백엔드 연결 시 API 호출로 교체
const onAddDataset = () => {
  console.warn('[TODO] 데이터셋 추가 모달 열기')
}

const onDatasetSetting = (dataset: AgentDataset) => {
  console.warn('[TODO] 데이터셋 설정:', dataset.id)
}

const onDatasetSync = (dataset: AgentDataset) => {
  console.warn('[TODO] 데이터셋 동기화:', dataset.id)
}
</script>
