<!--
  세부목차 트리 행
  - 인라인 이름 수정, 더보기 메뉴(추가/수정/삭제)
  - 저장소 CategoryTreeNode와 동일한 인터랙션
-->
<template>
  <div
    class="pt-dtree-row"
    :class="[`is-${variant}`, { 'is-menu-open': isDropdownOpen, 'is-editing': isEditing }]"
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
    <span
      v-else
      class="pt-dtree-title"
    >
      {{ title }}
    </span>

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
        variant="primary-line"
        @click.stop="emit('save-rename')"
        >저장</UiButton
      >
      <UiButton
        size="sm"
        variant="ghost"
        @click.stop="emit('cancel-rename')"
        >취소</UiButton
      >
    </template>
    <div
      v-else
      class="pt-dtree-more-wrap"
      @click.stop
    >
      <UiDropdownMenu
        v-model:open="isDropdownOpen"
        :items="menuItems"
        side="bottom"
        align="end"
        :side-offset="4"
        @select="(value) => emit('menu-select', value)"
      >
        <template #trigger>
          <UiButton
            icon-only
            variant="ghost"
            size="xs"
            :aria-label="`${title} 관리`"
            class="btn-dtree-more"
            :class="{ 'is-active': isDropdownOpen }"
          >
            <template #icon-left>
              <UiIcon
                name="ellipsis"
                size="16"
              />
            </template>
          </UiButton>
        </template>
      </UiDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiDropdownMenu, UiIcon, UiInput } from '@leechanyong/ispark-ui'
import type { DropdownMenuItemDef } from '@leechanyong/ispark-ui'

const props = withDefaults(
  defineProps<{
    variant: 'root' | 'section' | 'leaf'
    title: string
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
const isDropdownOpen = ref(false)

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
    if (editing) nextTick(() => inputRef.value?.focus())
  },
)
</script>
