<template>
  <div class="org-manage-tree-panel">
    <div class="org-manage-panel-header flex items-center">
      <p class="org-manage-panel-title">{{ title }}</p>
    </div>
    <div class="org-manage-tree-body">
      <UiLoading
        v-if="isLoading"
        overlay
        text="조직 정보를 불러오는 중..."
      />
      <div
        v-else-if="errorMessage"
        class="org-manage-panel-error"
      >
        <p class="org-manage-panel-error__message">{{ errorMessage }}</p>
        <UiButton
          variant="outline"
          size="md"
          @click="handleLoadOrgTree"
        >
          다시 시도
        </UiButton>
      </div>
      <div
        v-else-if="!orgTree.length"
        class="org-manage-panel-empty"
      >
        <UiEmpty
          icon="icon-folder-close"
          title="등록된 조직이 없습니다."
        />
      </div>
      <div
        v-else
        class="org-manage-tree-root-wrap"
      >
        <ul
          class="org-manage-tree-root"
          role="tree"
        >
          <OrgManageTreeNode
            v-for="node in orgTree"
            :key="node.orgId"
            :item="node"
            :depth="0"
            :selected-org-id="selectedOrgId"
            drag-disabled
            @select-org="emit('select', $event)"
            @toggle-expand="handleToggleExpand"
          />
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiButton, UiEmpty, UiLoading } from '@leechanyong/ispark-ui'
import OrgManageTreeNode from '~/components/org-manage/OrgManageTreeNode.vue'
import { useUserSelectApi } from '~/composables/com/useUserSelectApi'
import type { OrgTreeItem } from '~/types/org-manage'
import { buildOrgTree, toggleOrgNode } from '~/utils/global/orgTreeUtil'

/**
 * 조직도 패널 (공통) — 조직관리의 조직도 목록(selectOrgList)을 스스로 불러와 폴더형 트리로 보여준다.
 * 스타일은 조직관리 조직도 패널(_org-manage.scss)의 클래스를 그대로 쓴다. 선택한 조직은 select 로 알리고,
 * 선택 표시는 selectedOrgId 로 받는다. 크기·배치(.org-manage-tree-panel 의 flex/max-width)는 사용처 페이지 SCSS 에서 지정한다.
 */
const props = withDefaults(
  defineProps<{
    selectedOrgId?: string | null
    title?: string
    /** 조직이 선택돼 있지 않으면 로딩 직후 첫 조직을 select 로 알린다 */
    autoSelectFirst?: boolean
  }>(),
  {
    selectedOrgId: null,
    title: '인사조직',
    autoSelectFirst: true,
  },
)

const emit = defineEmits<{
  select: [orgId: string]
  loaded: [nodes: OrgTreeItem[]]
}>()

const { fetchOrgList } = useUserSelectApi()

const orgTree = ref<OrgTreeItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const handleLoadOrgTree = async (): Promise<void> => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    orgTree.value = buildOrgTree(await fetchOrgList())
    emit('loaded', orgTree.value)
    const firstOrgId = orgTree.value[0]?.orgId
    if (props.autoSelectFirst && !props.selectedOrgId && firstOrgId) emit('select', firstOrgId)
  } catch (error) {
    orgTree.value = []
    errorMessage.value = error instanceof Error ? error.message : '조직 목록 조회에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

const handleToggleExpand = (orgId: string): void => {
  toggleOrgNode(orgTree.value, orgId)
}

onMounted(handleLoadOrgTree)
</script>
