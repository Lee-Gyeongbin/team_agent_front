<template>
  <div class="us-org-node">
    <!-- 노드 행 -->
    <div
      class="us-org-node-row"
      :class="{ 'is-selected': node.orgId === selectedOrgId }"
      :style="{ paddingLeft: `${depth * 14 + 6}px` }"
      @click="emit('select', node.orgId)"
    >
      <!-- 펼침/접힘 토글 -->
      <button
        v-if="node.children && node.children.length > 0"
        class="btn-org-toggle"
        @click.stop="emit('toggle', node.orgId)"
      >
        <i
          class="icon icon-chevron-right-sm size-12"
          :class="{ 'is-expanded': node.expanded !== false }"
        />
      </button>
      <span
        v-else
        class="org-toggle-placeholder"
      />
      <span class="org-node-label">{{ node.orgNm }}</span>
    </div>

    <!-- 자식 노드 (재귀) -->
    <template v-if="node.expanded !== false && node.children && node.children.length > 0">
      <UserSelectOrgTreeNode
        v-for="child in node.children"
        :key="child.orgId"
        :node="child"
        :selected-org-id="selectedOrgId"
        :depth="depth + 1"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { OrgTreeItem } from '~/types/org-manage'

withDefaults(
  defineProps<{
    node: OrgTreeItem
    selectedOrgId?: string | null
    depth?: number
  }>(),
  {
    selectedOrgId: null,
    depth: 0,
  },
)

const emit = defineEmits<{
  select: [orgId: string]
  toggle: [orgId: string]
}>()
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.us-org-node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding-right: 8px;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $color-background;
  }

  &.is-selected {
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.08);

    .org-node-label {
      color: var(--color-primary, $color-primary);
      font-weight: $font-weight-semibold;
    }

    .org-node-icon {
      background-color: var(--color-primary, $color-primary);
    }
  }
}

.btn-org-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: $border-radius-sm;

  .icon {
    background-color: $color-text-disabled;
    transition: transform $transition-fast;

    &.is-expanded {
      transform: rotate(90deg);
    }

    &:not(.is-expanded) {
      transform: rotate(0deg);
    }
  }
}

.org-toggle-placeholder {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.org-node-icon {
  flex-shrink: 0;
  background-color: $color-text-secondary;
}

.org-node-label {
  flex: 1;
  min-width: 0;
  color: $color-text-primary;
  font-size: $font-size-sm;
  @include ellipsis(1);
}
</style>
