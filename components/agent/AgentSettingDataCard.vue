<template>
  <div
    class="agent-data-card"
    :class="{ 'is-connected': item.connYn === 'Y' }"
  >
    <!-- 드래그 핸들 (001: 데이터셋만 정렬 가능) -->
    <div
      v-if="agentTypeCd === '001'"
      class="agent-data-card-drag"
    >
      <i class="icon-move-handle size-20" />
    </div>

    <div class="agent-data-card-info">
      <div class="agent-data-card-title">{{ itemId }}</div>
    </div>

    <!-- 연결 토글 -->
    <div class="agent-data-card-actions">
      <UiToggle
        :model-value="item.connYn === 'Y'"
        @update:model-value="$emit('toggle', item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgtDs, AgtDm } from '~/types/agent'

interface Props {
  agentTypeCd: string
  item: AgtDs | AgtDm
}

const props = defineProps<Props>()

defineEmits<{
  toggle: [item: AgtDs | AgtDm]
}>()

const itemId = computed(() =>
  props.agentTypeCd === '001'
    ? (props.item as AgtDs).datasetId
    : (props.item as AgtDm).datamartId,
)
</script>
