<template>
  <div class="agent-list-header">
    <div class="agent-list-header-left">
      <h2 class="agent-list-title">Agent List</h2>
      <span class="agent-list-count">
        <span class="count-active">활성 : {{ activeCount }}</span>
        <span> / </span>
        <span>전체 : {{ totalCount }}</span>
      </span>
    </div>
    <UiButton
      variant="primary-line"
      @click="$emit('add')"
    >
      <template #icon-left>
        <i class="icon-plus size-16" />
      </template>
      Agent 추가
    </UiButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  activeCount: number
  totalCount: number
}

defineProps<Props>()
defineEmits<{
  add: []
}>()
</script>
