<template>
  <div
    class="marketing-image-maker__confirm-card"
    :class="{ 'is-edit-mode': isEditMode }"
  >
    <div class="marketing-image-maker__confirm-card-head">
      <UiButton
        variant="ghost"
        size="xs"
        @click="emit('edit')"
      >
        <template #icon-left>
          <i :class="[isEditMode ? 'icon-close' : 'icon-edit', 'size-14']" />
        </template>
        {{ isEditMode ? '수정 취소' : '작성 내용 수정' }}
      </UiButton>
    </div>

    <div class="marketing-image-maker__confirm-grid">
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="marketing-image-maker__confirm-item"
        :class="{
          'is-full': item.fullWidth,
          'has-divider': item.hasDivider,
          'is-editable': isEditMode,
        }"
        @click="emit('jump', item.stepIndex)"
      >
        <span class="marketing-image-maker__confirm-label">{{ item.label }}</span>
        <strong class="marketing-image-maker__confirm-value">{{ item.value }}</strong>
        <i
          v-if="isEditMode"
          class="icon-edit size-14 marketing-image-maker__confirm-edit"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarketingConfirmSummaryItem } from '~/utils/chat/marketingAuthoringUtil'

defineProps<{
  items: MarketingConfirmSummaryItem[]
  isEditMode: boolean
}>()

const emit = defineEmits<{
  edit: []
  jump: [stepIndex: number]
}>()
</script>
