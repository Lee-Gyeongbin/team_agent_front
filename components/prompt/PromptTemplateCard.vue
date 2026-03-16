<template>
  <div class="prompt-template-card">
    <!-- 좌측: 콘텐츠 -->
    <div class="prompt-template-card-body">
      <!-- 제목 + 카테고리 -->
      <div class="prompt-template-card-title">
        <span class="prompt-template-card-name">{{ template.name }}</span>
        <span class="prompt-template-card-category">{{ template.category }}</span>
      </div>

      <!-- 설명 -->
      <p class="prompt-template-card-desc">{{ template.description }}</p>

      <!-- 템플릿 내용 -->
      <div class="prompt-template-card-content">
        "{{ template.content }}"
      </div>

      <!-- 메타 -->
      <div class="prompt-template-card-meta">
        <span class="prompt-template-card-meta-item">
          ✓ 사용 횟수 <strong>{{ template.usageCount }}회</strong>
        </span>
        <span class="prompt-template-card-meta-item">
          📅 최종 수정 <strong>{{ template.updatedAt }}</strong>
        </span>
      </div>
    </div>

    <!-- 우측: 액션 -->
    <div class="prompt-template-card-actions">
      <button
        class="prompt-saved-card-btn"
        title="수정"
        @click="$emit('edit', template)"
      >
        <i class="icon-edit size-16" />
      </button>
      <button
        class="prompt-saved-card-btn"
        title="삭제"
        @click="$emit('delete', template)"
      >
        <i class="icon-trashcan size-16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PromptTemplate } from '~/types/prompt'

interface Props {
  template: PromptTemplate
}

defineProps<Props>()
defineEmits<{
  edit: [template: PromptTemplate]
  delete: [template: PromptTemplate]
}>()
</script>
