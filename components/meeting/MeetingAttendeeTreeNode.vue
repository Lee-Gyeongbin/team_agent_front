<template>
  <li
    class="meeting-attendee-tree-item"
    role="treeitem"
    :aria-expanded="hasChildren ? node.expanded : undefined"
    :aria-selected="isActive"
  >
    <div
      class="meeting-attendee-tree-row"
      :class="{ 'is-active': isActive }"
      :style="{ paddingLeft: `${8 + depth * 14}px` }"
      @click="emit('select-org', node.orgId)"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="meeting-attendee-tree-toggle"
        :aria-label="node.expanded ? '접기' : '펼치기'"
        @click.stop="emit('toggle-expand', node.orgId)"
      >
        <UiIcon
          :name="node.expanded ? 'chevron-down' : 'chevron-right'"
          size="14"
        />
      </button>
      <span
        v-else
        class="meeting-attendee-tree-leaf"
      >
        <UiIcon
          name="circle"
          size="8"
        />
      </span>
      <span class="meeting-attendee-tree-label">{{ node.orgNm }}</span>
    </div>

    <ul
      v-if="hasChildren && node.expanded"
      class="meeting-attendee-tree-children"
      role="group"
    >
      <MeetingAttendeeTreeNode
        v-for="child in node.children"
        :key="child.orgId"
        :node="child"
        :depth="depth + 1"
        :active-org-id="activeOrgId"
        @toggle-expand="emit('toggle-expand', $event)"
        @select-org="emit('select-org', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UiIcon } from '@leechanyong/ispark-ui'
import type { MeetingAttendeeOrgNode } from '~/types/meeting'
import MeetingAttendeeTreeNode from '~/components/meeting/MeetingAttendeeTreeNode.vue'

const props = defineProps<{
  node: MeetingAttendeeOrgNode
  depth: number
  /** 현재 선택된 조직 (검색 중이면 null) */
  activeOrgId: string | null
}>()

const emit = defineEmits<{
  'toggle-expand': [orgId: string]
  'select-org': [orgId: string]
}>()

/** 인사조직 트리는 조직만 표시 — 소속 사용자는 직원목록 패널에서 표시 */
const hasChildren = computed<boolean>(() => props.node.children.length > 0)

const isActive = computed<boolean>(() => props.activeOrgId === props.node.orgId)
</script>
