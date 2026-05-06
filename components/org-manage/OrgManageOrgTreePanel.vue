<template>
  <!-- 왼쪽: 조직도 전체 -->
  <div class="org-manage-tree-panel">
    <div class="org-manage-panel-header flex items-center justify-between">
      <p class="org-manage-panel-title">조직도</p>
      <div class="org-manage-header-actions flex items-center gap-8">
        <UiButton
          variant="primary"
          size="sm"
          @click="openAddOrgModal"
        >
          <template #icon-left>
            <i class="icon icon-plus size-14" />
          </template>
          조직 추가
        </UiButton>
      </div>
    </div>
    <div class="org-manage-tree-body">
      <UiLoading
        v-if="orgListLoading"
        overlay
        text="조직 정보를 불러오는 중..."
      />
      <div
        v-else-if="orgErrorMessage"
        class="org-manage-panel-error"
      >
        <p class="org-manage-panel-error__message">{{ orgErrorMessage }}</p>
        <UiButton
          variant="outline"
          size="md"
          @click="handleFetchOrgList"
        >
          다시 시도
        </UiButton>
      </div>
      <div
        v-else-if="!filteredOrgTree.length"
        class="org-manage-panel-empty"
      >
        <UiEmpty
          icon="icon-folder-close"
          :title="searchKeyword ? '검색된 조직이 없습니다.' : '등록된 조직이 없습니다.'"
        />
      </div>
      <div
        v-else
        class="org-manage-tree-root-wrap"
      >
        <draggable
          v-if="!isDragDisabled"
          tag="ul"
          class="org-manage-tree-root"
          role="tree"
          :list="orgTree"
          handle=".org-manage-tree-drag-handle"
          item-key="orgId"
          animation="200"
          @update="onRootTreeUpdate"
        >
          <template #item="{ element }">
            <OrgManageTreeNode
              :item="element"
              :depth="0"
              :selected-org-id="selectedOrgId"
              :drag-disabled="isDragDisabled"
              @select-org="handleSelectOrg"
              @toggle-expand="handleToggleOrgExpand"
              @update-order="handleUpdateOrgOrder"
            />
          </template>
        </draggable>
        <ul
          v-else
          class="org-manage-tree-root"
          role="tree"
        >
          <OrgManageTreeNode
            v-for="node in filteredOrgTree"
            :key="node.orgId"
            :item="node"
            :depth="0"
            :selected-org-id="selectedOrgId"
            :drag-disabled="isDragDisabled"
            @select-org="handleSelectOrg"
            @toggle-expand="handleToggleOrgExpand"
          />
        </ul>
      </div>
    </div>
  </div>

  <OrgManageAddModal
    :is-open="isOrgAddModalOpen"
    :mode="orgEditMode"
    :org-options="orgOptions"
    :org-tree="orgTree"
    :error-message="orgAddErrorMessage"
    :disabled-parent-org-id="orgEditMode === 'edit' ? (selectedOrgId ?? '') : ''"
    :parent-org-id="orgAddForm.parentOrgId"
    :org-nm="orgAddForm.orgNm"
    @update:parent-org-id="orgAddForm.parentOrgId = $event"
    @update:org-nm="orgAddForm.orgNm = $event"
    @close="closeAddOrgModal"
    @save="orgEditMode === 'edit' ? handleUpdateOrg() : handleCreateOrg()"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import OrgManageAddModal from '~/components/org-manage/OrgManageAddModal.vue'
import OrgManageTreeNode from '~/components/org-manage/OrgManageTreeNode.vue'
import type { OrgTreeItem, UpdateOrgSortOrderPayload } from '~/types/org-manage'

const props = withDefaults(
  defineProps<{
    searchKeyword?: string
  }>(),
  {
    searchKeyword: '',
  },
)

const {
  orgTree,
  selectedOrgId,
  orgListLoading,
  orgErrorMessage,
  isOrgAddModalOpen,
  orgEditMode,
  orgAddForm,
  orgAddErrorMessage,
  orgOptions,
  handleFetchOrgList,
  handleSelectOrg,
  openAddOrgModal,
  closeAddOrgModal,
  handleCreateOrg,
  handleUpdateOrg,
  handleUpdateOrgOrder,
  handleToggleOrgExpand,
} = useOrgManageStore()

const isDragDisabled = computed<boolean>(() => Boolean(props.searchKeyword.trim()))

interface DragListEvent {
  item?: { dataset?: { orgId?: string } }
  newIndex?: number
}

const onRootTreeUpdate = (event: DragListEvent): void => {
  const newIndex = event.newIndex
  if (typeof newIndex !== 'number') return
  const orgId = String(event.item?.dataset?.orgId ?? orgTree.value[newIndex]?.orgId ?? '').trim()
  if (!orgId) return
  const payload: UpdateOrgSortOrderPayload = {
    orgId,
    sortOrder: newIndex + 1,
    parentOrgId: '',
  }
  void handleUpdateOrgOrder(payload)
}

const filteredOrgTree = computed<OrgTreeItem[]>(() => {
  const keyword = props.searchKeyword.trim().toLowerCase()
  if (!keyword) return orgTree.value

  const filterNodes = (nodes: OrgTreeItem[]): OrgTreeItem[] => {
    return nodes.reduce<OrgTreeItem[]>((acc, node) => {
      const children = filterNodes(node.children ?? [])
      const isMatched = String(node.orgNm ?? '')
        .toLowerCase()
        .includes(keyword)
      if (!isMatched && !children.length) return acc
      acc.push({
        ...node,
        children,
        expanded: isMatched ? true : node.expanded,
      })
      return acc
    }, [])
  }

  return filterNodes(orgTree.value)
})
</script>
