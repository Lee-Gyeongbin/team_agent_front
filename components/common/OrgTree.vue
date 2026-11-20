<template>
  <div class="org-tree">
    <UiEmpty
      v-if="tree.length === 0"
      :title="emptyText"
    />
    <UserSelectOrgTreeNode
      v-for="node in tree"
      :key="node.orgId"
      :node="node"
      :selected-org-id="selectedOrgId"
      @select="emit('select', $event)"
      @toggle="emit('toggle', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import type { OrgTreeItem } from '~/types/org-manage'
import UserSelectOrgTreeNode from '~/components/common/UserSelectOrgTreeNode.vue'

/** 조직 트리 (공통) — 트리 데이터는 buildOrgTree(orgTreeUtil)로 만든 값을 넘긴다 */
withDefaults(
  defineProps<{
    tree: OrgTreeItem[]
    selectedOrgId?: string | null
    emptyText?: string
  }>(),
  {
    selectedOrgId: null,
    emptyText: '조직 정보가 없습니다.',
  },
)

const emit = defineEmits<{
  select: [orgId: string]
  toggle: [orgId: string]
}>()
</script>
