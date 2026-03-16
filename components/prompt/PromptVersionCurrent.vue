<template>
  <div
    v-if="current"
    class="prompt-version-current"
  >
    <div class="prompt-version-current-info">
      <!-- 버전명 + 프롬프트명 + 활성 배지 (한 줄) -->
      <div class="prompt-version-current-title">
        <strong>버전 {{ current.version }}</strong>
        <span class="prompt-version-current-name">{{ current.promptName }}</span>
        <span class="prompt-version-badge is-active">활성</span>
      </div>
      <!-- 메타 -->
      <div class="prompt-version-current-meta">
        <span class="prompt-version-current-meta-item">
          <i class="icon-time size-12" /> 배포일
          <strong>{{ current.createdAt }}</strong>
        </span>
        <span class="prompt-version-current-meta-item">
          <i class="icon-edit-version size-12" /> 작성자
          <strong>{{ current.author }}</strong>
        </span>
      </div>
    </div>
    <!-- 상세 보기 (absolute 우상단) -->
    <UiButton
      class="prompt-version-current-btn"
      variant="line-secondary"
      size="sm"
      @click="$emit('detail', current)"
    >
      상세 보기
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import type { PromptVersion } from '~/types/prompt'

interface Props {
  current: PromptVersion | null
}

defineProps<Props>()
defineEmits<{
  detail: [version: PromptVersion]
}>()
</script>
