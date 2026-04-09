<template>
  <UiModal
    :is-open="isOpen"
    title="아이콘 선택"
    max-width="420px"
    custom-class="agent-icon-select-modal"
    @close="$emit('close')"
  >
    <div class="icon-grid">
      <button
        v-for="icon in icons"
        :key="icon.iconId"
        class="icon-option-btn"
        :class="{ 'is-active': selectedIconId === icon.iconId }"
        :title="icon.iconNm"
        @click="$emit('select', icon.iconId)"
      >
        <i
          :class="[icon.iconClassNm, 'size-20']"
          :style="{ color: selectedColorHex }"
        />
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { IconItem } from '~/types/agent'

interface Props {
  isOpen: boolean
  icons: IconItem[]
  selectedIconId: string
  selectedColorHex: string
}

defineProps<Props>()

defineEmits<{
  close: []
  select: [iconId: string]
}>()
</script>

<style lang="scss" scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(34px, 34px));
  width: 100%;
  gap: 8px;
  justify-content: flex-start;
  align-content: flex-start;
  max-height: 420px;
  overflow-y: auto;
}

.icon-option-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #fff;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &.is-active {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.08);
  }

  &:hover {
    border-color: #c3ced6;
  }
}

:deep(.agent-icon-select-modal .modal-dialog-content) {
  max-width: 420px;
}

:deep(.agent-icon-select-modal .modal-dialog-body) {
  display: block;
  min-height: 0;
  padding: 12px 0 0;
}
</style>
