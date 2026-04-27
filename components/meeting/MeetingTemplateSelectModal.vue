<template>
  <UiModal
    :is-open="isTemplateSelectOpen"
    title="회의록 템플릿 선택"
    max-width="480px"
    @close="onClose"
  >
    <!-- 🔽 더미 — 실제 템플릿은 후속 (관리자 페이지에서 등록) -->
    <div class="meeting2-template-list">
      <button
        v-for="tmpl in templates"
        :key="tmpl.id"
        type="button"
        class="meeting2-template-card"
        :class="{ 'is-active': currentMeeting?.templateId === tmpl.id }"
        @click="onSelect(tmpl.id)"
      >
        <strong class="meeting2-template-card-name">{{ tmpl.name }}</strong>
        <span class="meeting2-template-card-desc">{{ tmpl.description }}</span>
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const { isTemplateSelectOpen, currentMeeting, handleSelectTemplate } = useMeeting2Store()

// 🔽 더미 — 실제 템플릿은 후속 (관리자 페이지에서 등록 예정)
const templates = [{ id: 'default', name: '기본 템플릿', description: '회의 개요 / 논의 내용 / 실행 계획 / 다음 회의' }]

const onClose = () => {
  isTemplateSelectOpen.value = false
}

const onSelect = (id: string) => {
  handleSelectTemplate(id)
}
</script>
