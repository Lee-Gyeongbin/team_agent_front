<template>
  <div class="agent-setting-dataset">
    <!-- 헤더 -->
    <div class="agent-setting-dataset-header">
      <div class="agent-setting-dataset-header-title">
        <span class="com-setting-section-title is-inline">RAG 데이터셋 연결</span>
        <span class="agent-setting-dataset-sub">Agent가 참조할 데이터셋(벡터DB)을 선택합니다.</span>
      </div>
      <UiButton
        variant="primary"
        size="sm"
        @click="$emit('add')"
      >
        + 데이터셋 추가
      </UiButton>
    </div>

    <!-- 필터 -->
    <div class="agent-setting-dataset-filter">
      <UiInput
        v-model="searchKeyword"
        type="search"
        placeholder="검색어를 입력하세요"
        size="sm"
      />
      <UiSelect
        v-model="statusFilter"
        :options="statusOptions"
        size="sm"
        placeholder="전체 상태"
      />
    </div>

    <!-- 데이터셋 목록 -->
    <div class="agent-setting-dataset-list">
      <AgentSettingDatasetCard
        v-for="item in filteredDatasets"
        :key="item.id"
        :dataset="item"
        @setting="$emit('datasetSetting', $event)"
        @sync="$emit('datasetSync', $event)"
        @toggle="onToggleDataset"
      />
    </div>

    <!-- 요약 -->
    <div class="agent-setting-dataset-summary">
      전체 데이터셋 <strong>{{ datasets.length }}</strong> · 연결된 데이터셋
      <strong>{{ connectedCount }}</strong> · 총 문서
      <strong>{{ totalDocuments.toLocaleString() }}</strong> · 총 청크
      <strong>{{ totalChunks.toLocaleString() }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentDataset } from '~/types/agent'

interface Props {
  datasets: AgentDataset[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  add: []
  datasetSetting: [dataset: AgentDataset]
  datasetSync: [dataset: AgentDataset]
  'update:datasets': [datasets: AgentDataset[]]
}>()

// 필터
const searchKeyword = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '연결됨', value: 'connected' },
  { label: '미연결', value: 'disconnected' },
]

const filteredDatasets = computed(() => {
  let list = props.datasets

  // 검색어 필터
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter((d) => d.name.toLowerCase().includes(keyword) || d.description.toLowerCase().includes(keyword))
  }

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

// 토글
const onToggleDataset = (dataset: AgentDataset) => {
  const updated = props.datasets.map((d) => (d.id === dataset.id ? { ...d, isConnected: !d.isConnected } : d))
  emit('update:datasets', updated)
}
</script>
