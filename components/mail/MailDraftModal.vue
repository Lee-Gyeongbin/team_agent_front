<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="600px"
    @close="emit('close')"
  >
    <template #header>
      <div class="mail-draft-modal-header">
        <h2 class="mail-detail-modal-title">{{ title }}</h2>
        <button
          class="btn btn-modal-close"
          @click="emit('close')"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <div class="mail-draft-modal-body">
      <div
        v-if="isLoading"
        class="mail-draft-loading"
      >
        <div class="mail-briefing-skeleton">
          <span
            v-for="i in 6"
            :key="i"
            class="mail-skeleton mail-skeleton-line"
            :style="{ width: i % 3 === 0 ? '70%' : '100%' }"
          />
        </div>
      </div>
      <p
        v-else-if="content"
        class="mail-draft-content"
      >
        {{ content }}
      </p>
      <UiEmpty
        v-else
        title="초안을 생성할 수 없습니다"
      />
    </div>

    <template #footer>
      <div
        v-if="content && !isLoading"
        class="mail-draft-modal-footer"
      >
        <p class="mail-draft-copy-hint">
          <i class="icon-info size-14" />
          메일쓰기 클릭 시 내용이 클립보드에 자동 복사됩니다. 메일 작성창에서 Ctrl+V로 붙여넣기 해주세요.
        </p>
        <UiButton
          variant="primary"
          size="lg"
          @click="emit('open-office-mail')"
        >
          <template #icon-left>
            <i class="icon-link-agent size-16" />
          </template>
          메일쓰기
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
  isLoading: boolean
  content: string
}>()

const emit = defineEmits<{
  close: []
  'open-office-mail': []
}>()
</script>
