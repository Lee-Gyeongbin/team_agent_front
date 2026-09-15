<!--
  세부목차 트리 행
  - 인라인 이름 수정, 더보기 메뉴(추가/수정/삭제)
  - 저장소 CategoryTreeNode와 동일한 인터랙션
-->
<template>
  <div
    ref="rowRef"
    class="pt-dtree-row"
    :class="[`is-${variant}`, { 'is-editing': isEditing }]"
    @click="onRowClick"
  >
    <button
      v-if="hasToggle"
      type="button"
      class="pt-toc-toggle"
      :aria-label="`${title} ${isOpen ? '접기' : '펼치기'}`"
      :aria-expanded="isOpen"
      @click.stop="emit('toggle')"
    >
      <UiIcon
        :name="isOpen ? 'chevron-down' : 'chevron-right'"
        size="14"
      />
    </button>
    <span
      v-else
      class="pt-dtree-chevron-placeholder"
    />
    <UiIcon
      :name="variant === 'leaf' ? 'file-text' : isOpen ? 'folder-open' : 'folder'"
      size="16"
      class="pt-dtree-icon"
    />

    <UiInput
      v-if="isEditing"
      ref="inputRef"
      v-model="localEditingName"
      type="text"
      class="pt-dtree-name-input"
      :placeholder="editPlaceholder"
      size="sm"
      radius="base"
      @click.stop
      @enter="emit('save-rename')"
      @keydown.esc.stop="emit('cancel-rename')"
    />
    <button
      v-else
      type="button"
      class="pt-dtree-title"
      :disabled="disabled"
      :aria-label="`${title} 이름 수정`"
      title="클릭하여 이름 수정"
      @click.stop="emit('menu-select', 'rename')"
    >
      {{ title }}
    </button>

    <UiBadge
      v-if="variant === 'leaf'"
      size="sm"
      variant="default"
      >{{ tagLabel }}</UiBadge
    >
    <span
      v-if="countLabel"
      class="pt-dtree-count"
    >
      {{ countLabel }}
    </span>

    <template v-if="isEditing">
      <UiButton
        size="sm"
        variant="ghost"
        icon-only
        aria-label="이름 저장"
        title="저장"
        :disabled="disabled"
        @click.stop="emit('save-rename')"
        ><template #icon-left
          ><UiIcon
            name="check"
            :size="16" /></template
      ></UiButton>
      <UiButton
        size="sm"
        variant="ghost"
        :disabled="disabled"
        icon-only
        aria-label="수정 취소"
        title="취소"
        @click.stop="emit('cancel-rename')"
        ><template #icon-left
          ><UiIcon
            name="x"
            :size="16" /></template
      ></UiButton>
    </template>
    <div
      v-else
      class="pt-toc-inline-actions"
      @click.stop
    >
      <UiButton
        v-if="variant !== 'leaf'"
        variant="outline"
        size="xs"
        :disabled="disabled"
        @click="emit('menu-select', 'addChild')"
      >
        <template #icon-left
          ><UiIcon
            name="plus"
            :size="14"
        /></template>
        {{ variant === 'root' ? '소목차 추가' : '세부목차 추가' }}
      </UiButton>
      <UiButton
        icon-only
        variant="ghost"
        size="xs"
        :disabled="disabled"
        :aria-label="`${title} 수정`"
        class="pt-toc-hover-action"
        title="이름 수정"
        @click="emit('menu-select', 'rename')"
      >
        <template #icon-left
          ><UiIcon
            name="pencil"
            :size="14"
        /></template>
      </UiButton>
      <UiButton
        icon-only
        variant="ghost"
        size="xs"
        class="pt-toc-inline-delete pt-toc-hover-action"
        :disabled="disabled"
        :aria-label="`${title} 삭제`"
        title="삭제"
        @click="emit('menu-select', 'delete')"
      >
        <template #icon-left
          ><UiIcon
            name="trash-2"
            :size="14"
        /></template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiIcon, UiInput } from '@leechanyong/ispark-ui'
import type { DropdownMenuItemDef } from '@leechanyong/ispark-ui'

const props = withDefaults(
  defineProps<{
    variant: 'root' | 'section' | 'leaf'
    title: string
    disabled?: boolean
    tagLabel: string
    tagClass: string
    countLabel?: string
    isOpen?: boolean
    hasToggle?: boolean
    isEditing?: boolean
    editingName?: string
    editPlaceholder?: string
    menuItems: DropdownMenuItemDef[]
  }>(),
  {
    countLabel: '',
    disabled: false,
    isOpen: false,
    hasToggle: false,
    isEditing: false,
    editingName: '',
    editPlaceholder: '목차명 입력 (엔터)',
  },
)

const emit = defineEmits<{
  toggle: []
  'menu-select': [value: string]
  'update:editing-name': [value: string]
  'save-rename': []
  'cancel-rename': []
}>()

const inputRef = ref<{ focus: () => void } | null>(null)
const rowRef = ref<HTMLElement | null>(null)
const onOutsidePointerDown = (event: PointerEvent) => {
  if (!props.isEditing || props.disabled) return
  const target = event.target
  if (!(target instanceof Element)) return
  const editControl = target.closest('.pt-dtree-name-input, button')
  // Keep the input and its save/cancel buttons interactive; other clicks cancel.
  if (editControl && rowRef.value?.contains(editControl)) return
  emit('cancel-rename')
}

const localEditingName = computed({
  get: () => props.editingName,
  set: (value: string) => emit('update:editing-name', value),
})

const onRowClick = () => {
  if (props.isEditing || !props.hasToggle) return
  emit('toggle')
}

watch(
  () => props.isEditing,
  (editing) => {
    document.removeEventListener('pointerdown', onOutsidePointerDown, true)
    if (editing) document.addEventListener('pointerdown', onOutsidePointerDown, true)
    if (editing) nextTick(() => inputRef.value?.focus())
  },
)
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsidePointerDown, true))
</script>

<style lang="scss" scoped>
button.pt-dtree-title {
  background: transparent;
  border: 0;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: text;
}
button.pt-dtree-title:hover {
  color: var(--color-primary);
}
button.pt-dtree-title:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: 3px;
}
.pt-toc-inline-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  flex-shrink: 0;
}
.pt-toc-inline-delete {
  color: #dc4545;
}
.pt-toc-hover-action {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}
.pt-dtree-row:hover .pt-toc-hover-action,
.pt-dtree-row:focus-within .pt-toc-hover-action {
  opacity: 1;
  pointer-events: auto;
}
@media (hover: none) {
  .pt-toc-hover-action {
    opacity: 1;
    pointer-events: auto;
  }
}
.pt-dtree-name-input {
  max-width: 480px;
}
</style>
