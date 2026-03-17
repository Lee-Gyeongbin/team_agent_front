<template>
  <div class="prompt-saved-card">
    <div class="prompt-saved-card-info">
      <div class="prompt-saved-card-name">{{ prompt.promptName }}</div>
      <div class="prompt-saved-card-meta">
        <span class="prompt-saved-card-meta-item">
          <i class="icon-edit size-12" /> 최종 수정 <strong>{{ prompt.modifyDt }}</strong>
        </span>
        <span class="prompt-saved-card-meta-item">
          ▷ 활성 여부
          <strong>{{ prompt.useYn === 'Y' ? '활성화 중' : '비활성' }}</strong>
        </span>
      </div>
    </div>
    <div class="prompt-saved-card-actions">
      <UiToggle
        class="prompt-saved-card-toggle"
        :model-value="prompt.useYn === 'Y'"
        @update:model-value="$emit('toggle', prompt)"
      />
      <button
        class="prompt-saved-card-btn"
        title="수정"
        @click="$emit('edit', prompt)"
      >
        <i class="icon-edit size-16" />
      </button>
      <button
        class="prompt-saved-card-btn"
        title="프롬프트 복사"
        @click="$emit('copy', prompt)"
      >
        <i class="icon-copy-gray size-16" />
      </button>
      <button
        class="prompt-saved-card-btn"
        title="삭제"
        @click="$emit('delete', prompt)"
      >
        <i class="icon-trashcan size-16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemPrompt } from '~/types/prompt'

interface Props {
  prompt: SystemPrompt
}

defineProps<Props>()
defineEmits<{
  edit: [prompt: SystemPrompt]
  copy: [prompt: SystemPrompt]
  toggle: [prompt: SystemPrompt]
  delete: [prompt: SystemPrompt]
}>()
</script>
