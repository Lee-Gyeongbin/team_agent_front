<template>
  <div class="mail-panel mail-action-panel">
    <div class="mail-panel-header">
      <h2 class="mail-panel-title">오늘의 액션 아이템</h2>
    </div>

    <template v-if="isLoading">
      <div
        v-for="i in 3"
        :key="i"
        class="mail-action-skeleton"
      >
        <span class="mail-skeleton mail-skeleton-dot" />
        <div class="mail-action-skeleton-lines">
          <span class="mail-skeleton mail-skeleton-line" />
          <span class="mail-skeleton mail-skeleton-line-sm" />
        </div>
      </div>
    </template>

    <template v-else-if="actionItems.length > 0">
      <div
        v-for="(item, idx) in actionItems"
        :key="idx"
        class="mail-action-item"
      >
        <span
          class="mail-action-dot"
          :class="`priority-${item.priority}`"
        />
        <div class="mail-action-content">
          <p class="mail-action-text">{{ item.text }}</p>
          <div class="mail-action-meta">
            <span class="mail-action-from">{{ item.from }}</span>
            <span class="mail-action-time">{{ item.time }}</span>
            <span
              class="mail-action-badge"
              :class="`priority-${item.priority}`"
              >{{ priorityLabel(item.priority) }}</span
            >
          </div>
        </div>
      </div>
    </template>

    <UiEmpty
      v-else
      title="액션 아이템이 없습니다"
    />
  </div>
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import type { ActionItem } from '~/types/mail'

defineProps<{
  isLoading: boolean
  actionItems: ActionItem[]
}>()

const priorityLabel = (p: ActionItem['priority']) => {
  const map = { urgent: '긴급', this_week: '이번 주', normal: '일반' }
  return map[p] ?? p
}
</script>
