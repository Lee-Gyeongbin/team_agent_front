<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="agent ? 'Agent 설정' : 'Agent 추가'"
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

    <!-- 데이터셋 추가/수정 모달 -->
    <AgentSettingDatasetModal
      :is-open="isDatasetModalOpen"
      :dataset="editingDataset"
      @close="isDatasetModalOpen = false"
      @save="onSaveDataset"
    />

    <!-- 푸터 -->
    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
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

// 모달 열릴 때 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    if (props.agent) {
      form.value.type = props.agent.type
      basicForm.value = {
        name: props.agent.name,
        description: props.agent.description,
        similarityThreshold: props.agent.similarityThreshold ?? 0.7,
        maxSearchResults: props.agent.maxSearchResults ?? 5,
      }
    } else {
      // 추가 모드: 폼 초기화
      form.value.type = ''
      basicForm.value = {
        name: '',
        description: '',
        similarityThreshold: 0.7,
        maxSearchResults: 5,
      }
    }
  },
)

const onSave = () => {
  emit('save', {
    type: form.value.type,
    ...basicForm.value,
  })
}

// 데이터셋 모달
const isDatasetModalOpen = ref(false)
const editingDataset = ref<AgentDataset | null>(null)

const onAddDataset = () => {
  editingDataset.value = null
  isDatasetModalOpen.value = true
}

const onDatasetSetting = (dataset: AgentDataset) => {
  editingDataset.value = dataset
  isDatasetModalOpen.value = true
}

// 🔽 백엔드 연결 시 API 호출로 교체
const onSaveDataset = (dataset: AgentDataset) => {
  const index = datasetList.value.findIndex((d) => d.id === dataset.id)
  if (index > -1) {
    // 수정
    datasetList.value[index] = dataset
  } else {
    // 추가
    datasetList.value.push(dataset)
  }
}

const onDatasetSync = (dataset: AgentDataset) => {
  console.warn('[TODO] 데이터셋 동기화:', dataset.id)
}
</script>
