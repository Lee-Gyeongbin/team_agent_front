<template>
  <UiModal
    :is-open="isOpen"
    :title="mode === 'edit' ? '조직 수정' : '조직 추가'"
    position="center"
    custom-class="org-manage-add-org-modal"
    @close="onCloseMainModal"
  >
    <div class="org-manage-add-modal">
      <div class="org-manage-add-form">
        <div class="org-manage-add-form-row">
          <label class="org-manage-add-form-label">상위 조직</label>
          <div class="org-manage-parent-picker">
            <UiButton
              variant="outline"
              size="md"
              class="org-manage-parent-picker-trigger"
              @click="openParentSelectModal"
            >
              {{ selectedParentLabel }}
            </UiButton>
          </div>
        </div>
        <div class="org-manage-add-form-row">
          <label class="org-manage-add-form-label">
            <span class="is-required">*</span>
            조직명
          </label>
          <UiInput
            v-model="orgNmModel"
            placeholder="조직명을 입력하세요."
            @enter="onSave"
          />
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="org-manage-add-error"
      >
        {{ errorMessage }}
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="md"
          @click="onCloseMainModal"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="md"
          :disabled="isSaveDisabled"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>

  <UiModal
    :is-open="isParentSelectModalOpen"
    title="상위 조직 선택"
    position="center"
    max-width="400px"
    custom-class="org-manage-parent-select-modal"
    @close="isParentSelectModalOpen = false"
  >
    <div class="org-manage-parent-picker-tree">
      <button
        type="button"
        class="org-manage-parent-root-select"
        :class="{ 'is-selected': !parentOrgIdModel }"
        @click="onSelectTopLevelOrg"
      >
        최상위 조직으로 선택하기
      </button>
      <ul
        class="org-manage-tree-root"
        role="tree"
      >
        <OrgManageTreeNode
          v-for="node in parentSelectTree"
          :key="node.orgId"
          :item="node"
          :depth="0"
          :selected-org-id="parentOrgIdModel || null"
          @select-org="onSelectParentOrg"
          @toggle-expand="onToggleParentTreeExpand"
        />
      </ul>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { OrgOption, OrgTreeItem } from '~/types/org-manage'
import OrgManageTreeNode from '~/components/org-manage/OrgManageTreeNode.vue'

const props = defineProps<{
  isOpen: boolean
  mode: 'add' | 'edit'
  orgOptions: OrgOption[]
  orgTree: OrgTreeItem[]
  errorMessage: string
  disabledParentOrgId?: string
  parentOrgId: string
  orgNm: string
}>()

const emit = defineEmits<{
  close: []
  save: []
  'update:parentOrgId': [value: string]
  'update:orgNm': [value: string]
}>()

const isParentSelectModalOpen = ref(false)
const parentSelectTree = ref<OrgTreeItem[]>([])

const parentOrgIdModel = computed({
  get: () => props.parentOrgId,
  set: (value: string) => emit('update:parentOrgId', value),
})

const orgNmModel = computed({
  get: () => props.orgNm,
  set: (value: string) => emit('update:orgNm', value),
})

const selectedParentLabel = computed(() => {
  if (!parentOrgIdModel.value) return '최상위 조직으로 선택됨'
  const selected = props.orgOptions.find((item) => item.value === parentOrgIdModel.value)
  return selected ? selected.label : '상위 조직을 선택하세요.'
})

const isSaveDisabled = computed(() => orgNmModel.value.trim().length < 2)

const onSave = (): void => {
  if (isSaveDisabled.value) return
  emit('save')
}

const cloneOrgTree = (nodes: OrgTreeItem[]): OrgTreeItem[] => {
  return nodes.map((node) => ({
    ...node,
    children: node.children?.length ? cloneOrgTree(node.children) : [],
    expanded: node.expanded ?? true,
  }))
}

const toggleNodeExpanded = (nodes: OrgTreeItem[], orgId: string): boolean => {
  for (const node of nodes) {
    if (node.orgId === orgId) {
      node.expanded = !(node.expanded ?? true)
      return true
    }
    if (node.children?.length && toggleNodeExpanded(node.children, orgId)) return true
  }
  return false
}

const openParentSelectModal = (): void => {
  parentSelectTree.value = cloneOrgTree(props.orgTree)
  isParentSelectModalOpen.value = true
}

const onToggleParentTreeExpand = (orgId: string): void => {
  toggleNodeExpanded(parentSelectTree.value, orgId)
}

const onCloseMainModal = (): void => {
  isParentSelectModalOpen.value = false
  emit('close')
}

const onSelectParentOrg = (orgId: string): void => {
  if (props.disabledParentOrgId && orgId === props.disabledParentOrgId) {
    openToast({ message: '상위 조직으로 자기 자신을 선택할 수 없습니다.', type: 'warning' })
    return
  }
  parentOrgIdModel.value = orgId
  isParentSelectModalOpen.value = false
}

const onSelectTopLevelOrg = (): void => {
  parentOrgIdModel.value = ''
  isParentSelectModalOpen.value = false
}
</script>
