<template>
  <div class="prompt-version-stats">
    <div class="prompt-version-stat-item">
      <div class="prompt-version-stat-icon is-blue">
        <i class="icon-version size-24" />
      </div>
      <div class="prompt-version-stat-info">
        <span class="prompt-version-stat-label">총 버전 수</span>
        <strong class="prompt-version-stat-value">{{ stats.totalVersions }}</strong>
      </div>
    </div>
    <div class="prompt-version-stat-item">
      <div class="prompt-version-stat-icon is-orange">
        <i class="icon-refresh-version size-24" />
      </div>
      <div class="prompt-version-stat-info">
        <span class="prompt-version-stat-label">이번달 업데이트</span>
        <strong class="prompt-version-stat-value">{{ stats.monthlyUpdates }}</strong>
      </div>
    </div>
    <div class="prompt-version-stat-item">
      <div class="prompt-version-stat-icon is-green">
        <i class="icon-calendar size-24" />
      </div>
      <div class="prompt-version-stat-info">
        <span class="prompt-version-stat-label">마지막 변경</span>
        <strong class="prompt-version-stat-value">{{ stats.lastChangeDays }}일</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PromptVersionStats } from '~/types/prompt'

interface Props {
  stats: PromptVersionStats
}

defineProps<Props>()
</script>
