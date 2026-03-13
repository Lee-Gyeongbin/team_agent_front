<template>
  <div class="com-list-header">
    <div class="com-list-header-left">
      <h2 class="com-list-title">Model List</h2>
      <span class="com-list-count">
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
      + 모델 추가
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
