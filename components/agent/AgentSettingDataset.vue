<template>
  <div class="agent-setting-dataset">
    <!-- 헤더 -->
    <div class="agent-setting-dataset-header">
      <div class="agent-setting-dataset-header-title">
        <span class="com-setting-section-title is-inline">RAG 데이터셋 연결</span>
        <span class="agent-setting-dataset-sub">Agent가 참조할 데이터셋(벡터DB)을 선택합니다.</span>
      </div>
    </div>

    <!-- 요약 -->
    <div class="agent-setting-dataset-summary">
      전체 데이터셋 <strong>{{ datasets.length }}</strong> · 연결된 데이터셋
      <strong>{{ connectedCount }}</strong> · 총 문서
      <strong>{{ totalDocuments.toLocaleString() }}</strong> · 총 청크
      <strong>{{ totalChunks.toLocaleString() }}</strong>
    </div>

    <!-- 필터 -->
    <div class="agent-setting-dataset-filter">
      <UiSelect
        v-model="statusFilter"
        :options="statusOptions"
        size="sm"
        placeholder="전체 상태"
      />
    </div>

    <!-- 데이터셋 목록 -->
    <draggable
      v-model="draggableList"
      class="agent-setting-dataset-list"
      handle=".agent-dataset-card-drag"
      item-key="id"
      animation="200"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <AgentSettingDatasetCard
          :dataset="element"
          @toggle="onToggleDataset"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { AgentDataset } from '~/types/agent'
import { useAgentStore } from '~/composables/agent/useAgentStore'

interface Props {
  datasets: AgentDataset[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:datasets': [datasets: AgentDataset[]]
}>()

const { handleUpdateDatasetOrder } = useAgentStore()

// 필터
const statusFilter = ref('all')

const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '연결됨', value: 'connected' },
  { label: '미연결', value: 'disconnected' },
]

const filteredDatasets = computed(() => {
  let list = props.datasets

  // 상태 필터
  if (statusFilter.value === 'connected') {
    list = list.filter((d) => d.isConnected)
  } else if (statusFilter.value === 'disconnected') {
    list = list.filter((d) => !d.isConnected)
  }

  return list
})

// 요약 통계
const connectedCount = computed(() => props.datasets.filter((d) => d.isConnected).length)
const totalDocuments = computed(() => props.datasets.reduce((sum, d) => sum + d.documentCount, 0))
const totalChunks = computed(() => props.datasets.reduce((sum, d) => sum + d.chunkCount, 0))

// 드래그 정렬용 로컬 리스트
const draggableList = computed({
  get: () => filteredDatasets.value,
  set: (val: AgentDataset[]) => {
    emit('update:datasets', val)
  },
})

// 드래그 순서 변경
const onDragEnd = () => {
  const orderList = draggableList.value.map((item, i) => ({ id: item.id, order: i }))
  handleUpdateDatasetOrder(orderList)
}

// 토글
const onToggleDataset = (dataset: AgentDataset) => {
  const updated = props.datasets.map((d) => (d.id === dataset.id ? { ...d, isConnected: !d.isConnected } : d))
  emit('update:datasets', updated)
}
</script>
