<!--
  세부목차 트리 행
  - 인라인 이름 수정, 더보기 메뉴(추가/수정/삭제)
  - 저장소 CategoryTreeNode와 동일한 인터랙션
-->
<template>
  <div
    class="pt-dtree-row"
    :class="[`is-${variant}`, { 'is-menu-open': isDropdownOpen, 'is-editing': isEditing }]"
    role="treeitem"
    @click="onRowClick"
  >
    <i
      v-if="hasToggle"
      class="icon-arrow-down-gray size-16 pt-dtree-chevron"
      :class="{ 'is-open': isOpen }"
    />
    <span
      v-else
      class="pt-dtree-chevron-placeholder"
    />
    <i :class="['size-16', 'pt-dtree-icon', iconClass, { 'is-leaf': variant === 'leaf' }]" />

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
    />
    <span
      v-else
      class="pt-dtree-title"
    >
      {{ title }}
    </span>

    <span :class="['pt-toc-tag', tagClass]">{{ tagLabel }}</span>
    <span
      v-if="countLabel"
      class="pt-dtree-count"
    >
      {{ countLabel }}
    </span>

    <div
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
            class="btn-dtree-more"
            :class="{ 'is-active': isDropdownOpen }"
          >
            <template #icon-left>
              <i class="icon icon-add-dot size-20" />
            </template>
          </UiButton>
        </template>
      </UiDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

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
}>()

const inputRef = ref<{ focus: () => void } | null>(null)
const isDropdownOpen = ref(false)

const iconClass = computed(() => {
  if (props.variant === 'leaf') return 'icon-document'
  return props.isOpen ? 'icon-folder-open' : 'icon-folder-close'
})

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
