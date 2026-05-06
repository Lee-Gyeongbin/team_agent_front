<template>
  <li
    class="org-manage-tree-item"
    :class="{ 'has-children': item.children?.length }"
    :data-org-id="item.orgId"
  >
    <div
      class="org-manage-tree-row flex items-center"
      :class="{ 'is-selected': selectedOrgId === item.orgId }"
      :style="{ paddingLeft: `${12 + depth * 12}px` }"
      role="treeitem"
      :aria-selected="selectedOrgId === item.orgId"
      @click="onRowClick"
    >
      <span
        v-if="!dragDisabled"
        class="org-manage-tree-drag-handle"
        aria-hidden="true"
        @click.stop
        @mousedown.stop
      >
        <i class="icon icon-move-handle size-16" />
      </span>
      <span class="org-manage-tree-icon">
        <i
          :class="[
            'icon',
            'size-16',
            item.children?.length && item.expanded ? 'icon-folder-open' : 'icon-folder-close',
          ]"
        />
      </span>
      <span class="org-manage-tree-label">{{ item.orgNm }}</span>

      <UiButton
        v-if="item.children?.length"
        icon-only
        variant="ghost"
        size="xs"
        class="org-manage-tree-toggle"
        :aria-expanded="item.expanded"
        @click.stop="emit('toggle-expand', item.orgId)"
      >
        <template #icon-left>
          <i
            class="icon icon-arrow-down-gray size-20"
            :class="{ 'is-expanded': item.expanded }"
          />
        </template>
      </UiButton>
      <span
        v-else
        class="org-manage-tree-toggle-placeholder"
      />
    </div>

    <draggable
      v-if="!dragDisabled"
      tag="ul"
      class="org-manage-tree-children"
      role="group"
      :list="item.children"
      handle=".org-manage-tree-drag-handle"
      item-key="orgId"
      animation="200"
      @update="onTreeUpdate"
    >
      <template #item="{ element }">
        <OrgManageTreeNode
          v-show="item.expanded"
          :item="element"
          :depth="depth + 1"
          :selected-org-id="selectedOrgId"
          :drag-disabled="dragDisabled"
          @select-org="emit('select-org', $event)"
          @toggle-expand="emit('toggle-expand', $event)"
          @update-order="emit('update-order', $event)"
        />
      </template>
    </draggable>
    <ul
      v-else-if="item.expanded"
      class="org-manage-tree-children"
      role="group"
    >
      <OrgManageTreeNode
        v-for="child in item.children"
        :key="child.orgId"
        :item="child"
        :depth="depth + 1"
        :selected-org-id="selectedOrgId"
        :drag-disabled="dragDisabled"
        @select-org="emit('select-org', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
        @update-order="emit('update-order', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { OrgTreeItem } from '~/types/org-manage'
import OrgManageTreeNode from '~/components/org-manage/OrgManageTreeNode.vue'

const props = withDefaults(
  defineProps<{
    item: OrgTreeItem
    depth: number
    selectedOrgId: string | null
    dragDisabled?: boolean
  }>(),
  { dragDisabled: false },
)

const emit = defineEmits<{
  'select-org': [orgId: string]
  'toggle-expand': [orgId: string]
  'update-order': [{ orgId: string; sortOrder: number; parentOrgId: string }]
}>()

interface DragListEvent {
  item?: { dataset?: { orgId?: string } }
  newIndex?: number
}

const onTreeUpdate = (event: DragListEvent): void => {
  const newIndex = event.newIndex
  if (typeof newIndex !== 'number') return
  const orgId = String(event.item?.dataset?.orgId ?? props.item.children?.[newIndex]?.orgId ?? '').trim()
  if (!orgId) return
  emit('update-order', { orgId, sortOrder: newIndex + 1, parentOrgId: props.item.orgId })
}

const onRowClick = (): void => {
  emit('select-org', props.item.orgId)
}
</script>
