import { ref } from 'vue'
import type { OrgTreeItem, OrgUserItem } from '~/types/org-manage'
import { useUserSelectApi } from '~/composables/com/useUserSelectApi'
import { buildOrgTree, toggleOrgNode } from '~/utils/global/orgTreeUtil'

// ── 사용자 선택 모달 전역 상태 ──
const isUserSelectModalOpen = ref(false)
const orgTree = ref<OrgTreeItem[]>([])
const orgListLoading = ref(false)
const orgListError = ref('')

const selectedOrgId = ref<string | null>(null)
const orgUserList = ref<OrgUserItem[]>([])
const orgUserListLoading = ref(false)
const orgUserListError = ref('')

/** 선택된 사용자 목록 */
const selectedUsers = ref<OrgUserItem[]>([])

export const useUserSelectStore = () => {
  const { fetchOrgList, fetchOrgUserList } = useUserSelectApi()

  /** 조직 목록 불러오기 */
  const handleFetchOrgList = async () => {
    orgListError.value = ''
    orgListLoading.value = true
    try {
      const list = await fetchOrgList()
      orgTree.value = buildOrgTree(list)
      // 첫 번째 조직 자동 선택
      if (orgTree.value.length && !selectedOrgId.value) {
        const firstId = orgTree.value[0]?.orgId ?? null
        if (firstId) await handleSelectOrg(firstId)
      }
    } catch (e) {
      orgListError.value = e instanceof Error ? e.message : '조직 목록 조회에 실패했습니다.'
    } finally {
      orgListLoading.value = false
    }
  }

  /** 조직 선택 → 해당 조직 사용자 목록 불러오기 */
  const handleSelectOrg = async (orgId: string) => {
    selectedOrgId.value = orgId
    orgUserListError.value = ''
    orgUserListLoading.value = true
    try {
      orgUserList.value = await fetchOrgUserList(orgId)
    } catch (e) {
      orgUserList.value = []
      orgUserListError.value = e instanceof Error ? e.message : '사용자 목록 조회에 실패했습니다.'
    } finally {
      orgUserListLoading.value = false
    }
  }

  /** 조직 트리 노드 펼침/접힘 토글 */
  const handleToggleOrgExpand = (orgId: string) => {
    toggleOrgNode(orgTree.value, orgId)
  }

  /** 사용자 선택 추가 (중복 방지) */
  const addSelectedUser = (user: OrgUserItem) => {
    if (!selectedUsers.value.some((u) => u.userId === user.userId)) {
      selectedUsers.value.push(user)
    }
  }

  /** 선택된 사용자 제거 */
  const removeSelectedUser = (userId: string) => {
    selectedUsers.value = selectedUsers.value.filter((u) => u.userId !== userId)
  }

  /** 전체 선택 해제 */
  const clearSelectedUsers = () => {
    selectedUsers.value = []
  }

  /** 사용자 선택 모달 열기 */
  const openUserSelectModal = async () => {
    selectedUsers.value = []
    selectedOrgId.value = null
    orgUserList.value = []
    orgTree.value = []
    isUserSelectModalOpen.value = true
    await handleFetchOrgList()
  }

  /** 사용자 선택 모달 닫기 */
  const closeUserSelectModal = () => {
    isUserSelectModalOpen.value = false
  }

  return {
    isUserSelectModalOpen,
    orgTree,
    orgListLoading,
    orgListError,
    selectedOrgId,
    orgUserList,
    orgUserListLoading,
    orgUserListError,
    selectedUsers,
    handleFetchOrgList,
    handleSelectOrg,
    handleToggleOrgExpand,
    addSelectedUser,
    removeSelectedUser,
    clearSelectedUsers,
    openUserSelectModal,
    closeUserSelectModal,
  }
}
