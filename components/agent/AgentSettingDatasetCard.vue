<template>
  <div
    class="agent-dataset-card"
    :class="{ 'is-connected': dataset.isConnected }"
  >
    <div class="agent-dataset-card-info">
      <!-- 이름 -->
      <div class="agent-dataset-card-title">{{ dataset.name }}</div>
      <!-- 설명 -->
      <p class="agent-dataset-card-desc">{{ dataset.description }}</p>
      <!-- 메타 -->
      <div class="agent-dataset-card-meta">
        <span class="agent-dataset-card-meta-item">
          <i class="icon-document size-12" /> 문서 <strong>{{ dataset.documentCount }}개</strong>
        </span>
        <span class="agent-dataset-card-meta-item">
          <i class="icon-chunk size-12" /> 청크 <strong>{{ dataset.chunkCount.toLocaleString() }}개</strong>
        </span>
        <span class="agent-dataset-card-meta-item">
          최종업데이트 <strong>{{ dataset.updatedAt }}</strong>
        </span>
      </div>
    </div>

    <!-- 액션 -->
    <div class="agent-dataset-card-actions">
      <button
        class="agent-dataset-card-btn"
        title="설정"
        @click="$emit('setting', dataset)"
      >
        <i class="icon-setting-agent size-16" />
      </button>
      <button
        class="agent-dataset-card-btn"
        title="동기화"
        @click="$emit('sync', dataset)"
      >
        <i class="icon-sync size-16" />
      </button>
      <UiToggle
        :model-value="dataset.isConnected"
        @update:model-value="$emit('toggle', dataset)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentDataset } from '~/types/agent'

interface Props {
  dataset: AgentDataset
}

defineProps<Props>()
defineEmits<{
  setting: [dataset: AgentDataset]
  sync: [dataset: AgentDataset]
  toggle: [dataset: AgentDataset]
}>()
</script>
