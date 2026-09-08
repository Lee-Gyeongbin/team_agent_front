<template>
  <li
    class="meeting-attendee-tree-item"
    :class="{ 'has-children': hasDescendants }"
  >
    <div
      class="meeting-attendee-tree-row is-org flex items-center"
      :style="{ paddingLeft: `${12 + depth * 12}px` }"
      @click="emit('toggle-expand', node.orgId)"
    >
      <input
        type="checkbox"
        :checked="isOrgChecked"
        :indeterminate="isOrgIndeterminate"
        :disabled="!subtreeUsers.length"
        @click.stop
        @change="emit('toggle-org', node)"
      />
      <span class="meeting-attendee-tree-icon">
        <i
          :class="[
            'icon',
            'size-16',
            hasDescendants && node.expanded ? 'icon-folder-open' : 'icon-folder-close',
          ]"
        />
      </span>
      <span class="meeting-attendee-tree-label">{{ node.orgNm }}</span>
      <button
        v-if="hasDescendants"
        type="button"
        class="meeting-attendee-tree-toggle"
        :aria-expanded="node.expanded"
        @click.stop="emit('toggle-expand', node.orgId)"
      >
        <i
          class="icon icon-arrow-down-gray size-16"
          :class="{ 'is-expanded': node.expanded }"
        />
      </button>
      <span
        v-else
        class="meeting-attendee-tree-toggle-placeholder"
      />
    </div>

    <ul
      v-if="node.expanded && hasDescendants"
      class="meeting-attendee-tree-children"
      role="group"
    >
      <MeetingAttendeeTreeNode
        v-for="child in node.children"
        :key="child.orgId"
        :node="child"
        :depth="depth + 1"
        :selected-user-ids="selectedUserIds"
        @toggle-expand="emit('toggle-expand', $event)"
        @toggle-org="emit('toggle-org', $event)"
        @toggle-user="emit('toggle-user', $event)"
      />
      <li
        v-for="user in node.users"
        :key="user.userId"
        class="meeting-attendee-tree-item"
      >
        <label
          class="meeting-attendee-tree-row is-user flex items-center"
          :class="{ 'is-selected': isUserSelected(user.userId) }"
          :style="{ paddingLeft: `${12 + (depth + 1) * 12}px` }"
        >
          <input
            type="checkbox"
            :checked="isUserSelected(user.userId)"
            @change="emit('toggle-user', user)"
          />
          <span class="meeting-attendee-tree-icon">
            <i class="icon icon-user size-16" />
          </span>
          <span class="meeting-attendee-tree-label">{{ user.userNm }}</span>
        </label>
      </li>
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { collectAttendeeUsers } from '~/composables/meeting/useMeetingAttendeeTree'
import type { MeetingAttendeeOrgNode, MeetingAttendeeUserItem } from '~/types/meeting'
import MeetingAttendeeTreeNode from '~/components/meeting/MeetingAttendeeTreeNode.vue'

const props = defineProps<{
  node: MeetingAttendeeOrgNode
  depth: number
  selectedUserIds: string[]
}>()

const emit = defineEmits<{
  'toggle-expand': [orgId: string]
  'toggle-org': [node: MeetingAttendeeOrgNode]
  'toggle-user': [user: MeetingAttendeeUserItem]
}>()

const hasDescendants = computed<boolean>(
  () => props.node.children.length > 0 || props.node.users.length > 0,
)

const subtreeUsers = computed(() => collectAttendeeUsers(props.node))

const selectedCount = computed(
  () => subtreeUsers.value.filter((user) => props.selectedUserIds.includes(user.userId)).length,
)

const isOrgChecked = computed(
  () => subtreeUsers.value.length > 0 && selectedCount.value === subtreeUsers.value.length,
)

const isOrgIndeterminate = computed(
  () => selectedCount.value > 0 && selectedCount.value < subtreeUsers.value.length,
)

const isUserSelected = (userId: string): boolean => props.selectedUserIds.includes(userId)
</script>
