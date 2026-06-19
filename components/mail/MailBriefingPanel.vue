<template>
  <div class="mail-panel mail-briefing-panel">
    <div class="mail-panel-header">
      <h2 class="mail-panel-title">AI 메일 브리핑</h2>
      <div class="mail-ai-badge">
        <i class="icon-ai size-14" />
        AI 요약
      </div>
    </div>

    <div class="mail-briefing-content">
      <template v-if="isLoading">
        <div class="mail-briefing-skeleton">
          <span
            v-for="i in 5"
            :key="i"
            class="mail-skeleton mail-skeleton-line"
            :style="{ width: i % 2 === 0 ? '80%' : '100%' }"
          />
        </div>
      </template>

      <div
        v-else-if="briefing.length > 0"
        class="mail-briefing-text"
      >
        <ul class="mail-briefing-list">
          <li
            v-for="(line, idx) in briefing"
            :key="`briefing-${idx}`"
            class="mail-briefing-item"
          >
            {{ line }}
          </li>
        </ul>
      </div>

      <UiEmpty
        v-else
        title="브리핑 내용이 없습니다"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLoading: boolean
  briefing: string[]
}>()
</script>
