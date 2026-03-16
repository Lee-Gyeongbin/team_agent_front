<template>
  <div class="prompt-timeline-card">
    <!-- 버전명 + 배지 -->
    <div class="prompt-timeline-card-header">
      <strong class="prompt-timeline-card-version">버전 {{ version.version }}</strong>
      <span
        v-if="version.status === 'active'"
        class="prompt-version-badge is-active"
      >활성</span>
    </div>

    <!-- 설명 -->
    <p class="prompt-timeline-card-desc">{{ version.description }}</p>

    <!-- 변경 내용 -->
    <div
      v-if="version.changes.length"
      class="prompt-timeline-card-changes"
    >
      <p
        v-for="(change, i) in version.changes"
        :key="i"
      >
        + {{ change }}
      </p>
    </div>

    <!-- 비교 버튼 (항상) -->
    <UiButton
      class="prompt-timeline-card-btn-compare"
      variant="line-secondary"
      size="xs"
      @click="$emit('compare', version)"
    >
      비교
    </UiButton>

    <!-- 복원 버튼 (비활성만) -->
    <UiButton
      v-if="version.status !== 'active'"
      class="prompt-timeline-card-btn-restore"
      variant="line-secondary"
      size="xs"
      @click="$emit('restore', version)"
    >
      복원
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import type { PromptVersion } from '~/types/prompt'

interface Props {
  version: PromptVersion
}

defineProps<Props>()
defineEmits<{
  restore: [version: PromptVersion]
  compare: [version: PromptVersion]
}>()
</script>
