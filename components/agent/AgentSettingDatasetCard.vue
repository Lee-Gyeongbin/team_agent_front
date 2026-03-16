<template>
  <div
    class="agent-dataset-card"
    :class="{ 'is-connected': dataset.isConnected }"
  >
    <!-- 드래그 핸들 -->
    <div class="agent-dataset-card-drag">
      <i class="icon-move-handle size-20" />
    </div>

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
  toggle: [dataset: AgentDataset]
}>()
</script>
