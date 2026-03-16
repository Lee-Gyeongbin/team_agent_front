import { computed, type ComputedRef, type Ref } from 'vue'
import type { UserItem } from '~/types/user-manage'
import { useUserManageApi } from '~/composables/user-manage/useUserManageApi'
import { useCodesApi } from '~/composables/codes/useCodesApi'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import { formatPhone, toPhoneDigits } from '~/utils/global/numberUtil'

const ACCT_STATUS_CODE_GRP_ID = 'CG000001'
const userManageList = ref<UserItem[]>([])
const userManageSearchKeyword = ref('')
const userManageIsLoading = ref(false)
const userManageErrorMessage = ref('')
const isUserManageModalOpen = ref(false)
const editingUserManage = ref<UserItem | null>(null)
const acctStatusMap = ref<Record<string, string>>({})

export const useUserManageStore = (): {
  userManageList: Ref<UserItem[]>
  userManageSearchKeyword: Ref<string>
  userManageFilteredList: ComputedRef<UserItem[]>
  userManageIsLoading: Ref<boolean>
  userManageErrorMessage: Ref<string>
  isUserManageModalOpen: Ref<boolean>
  editingUserManage: Ref<UserItem | null>
  openUserManageEditModal: (row: UserItem) => void
  closeUserManageModal: () => void
  updateEditingUserManage: (payload: Partial<UserItem>) => void
  handleToggleUserManageStatus: (row: UserItem) => Promise<void>
  handleUpdateUserManage: (payload: Partial<UserItem>) => Promise<void>
  handleFetchUserManageList: () => Promise<void>
  handleFetchUserManageAcctStatusCodes: () => Promise<void>
  handleResetUserPassword: (user: UserItem) => Promise<void>
  getAcctStatusName: (codeId: string | undefined | null) => string
  getAcctStatusClass: (statusName: string) => string
  getOrgName: (orgId: string | undefined | null) => string
  formatPhone: (value: string | undefined | null) => string
  toPhoneDigits: (value: string | undefined | null) => string
} => {
  const { fetchUserList, fetchUpdateUser, fetchDeleteUser, fetchRestoreUser, fetchResetUserPassword } =
    useUserManageApi()
  const { orgList } = useOrgManageStore()
  const { fetchCodeList } = useCodesApi()

  const userManageFilteredList = computed(() => {
    const keyword = userManageSearchKeyword.value.trim().toLowerCase()
    if (!keyword) return userManageList.value
    return userManageList.value.filter(
      (item: UserItem) => item.userId.toLowerCase().includes(keyword) || item.userNm.toLowerCase().includes(keyword),
    )
  })

  const openUserManageEditModal = (row: UserItem): void => {
    editingUserManage.value = row
    isUserManageModalOpen.value = true
  }

  const closeUserManageModal = (): void => {
    isUserManageModalOpen.value = false
    editingUserManage.value = null
  }

  const updateEditingUserManage = (payload: Partial<UserItem>): void => {
    if (editingUserManage.value) Object.assign(editingUserManage.value, payload)
  }

  const handleToggleUserManageStatus = async (row: UserItem): Promise<void> => {
    const isInactive = getAcctStatusName(row.acctStatusCd) === '비활성'
    const actionLabel = isInactive ? '복구' : '삭제'

    const ok = await openConfirm({
      title: `${actionLabel} 확인`,
      message: `'${row.userId}' 사용자를 ${actionLabel}하시겠습니까?`,
      confirmText: actionLabel,
    })
    if (!ok) return

    try {
      if (isInactive) await fetchRestoreUser(row.userId)
      else await fetchDeleteUser(row.userId)
      await handleFetchUserManageList()
      openAlert({ message: `사용자가 ${actionLabel}되었습니다.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : `사용자 ${actionLabel} 중 오류가 발생했습니다.`
      openAlert({ message })
    }
  }

  const handleUpdateUserManage = async (payload: Partial<UserItem>): Promise<void> => {
    const userId = String(payload.userId ?? '').trim()
    if (!userId) return

    const ok = await openConfirm({
      title: '수정 확인',
      message: `'${userId}' 사용자를 수정하시겠습니까?`,
      confirmText: '저장',
    })
    if (!ok) return

    try {
      await fetchUpdateUser(payload)
      await handleFetchUserManageList()
      openAlert({ message: '사용자가 수정되었습니다.' })
      closeUserManageModal()
    } catch (error) {
      const message = error instanceof Error ? error.message : '사용자 수정 중 오류가 발생했습니다.'
      openAlert({ message })
    }
  }

  const handleFetchUserManageList = async (): Promise<void> => {
    userManageErrorMessage.value = ''
    userManageIsLoading.value = true
    try {
      const list = await fetchUserList()
      userManageList.value = list
    } catch (error) {
      const message = error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
      userManageErrorMessage.value = message
    } finally {
      userManageIsLoading.value = false
    }
  }

  /** 사용자 비밀번호 초기화 */
  const handleResetUserPassword = async (user: UserItem): Promise<void> => {
    const userId = String(user.userId ?? '').trim()
    const userNm = String(user.userNm ?? '').trim()
    if (!userId) return

    const ok = await openConfirm({
      title: '비밀번호 초기화 확인',
      message: `'${userNm}' 사용자의 비밀번호를 초기화하시겠습니까?`,
      confirmText: '초기화',
    })
    if (!ok) return

    try {
      const res = await fetchResetUserPassword(userId)

      await handleFetchUserManageList()

      const tempPassword = res?.tempPassword ?? ''
      const message = tempPassword
        ? `사용자 비밀번호가 초기화되었습니다.\n임시 비밀번호: ${tempPassword}`
        : '사용자 비밀번호가 초기화되었습니다.'

      openAlert({ message })
    } catch (error) {
      const message = error instanceof Error ? error.message : '사용자 비밀번호 초기화 중 오류가 발생했습니다.'
      openAlert({ message })
    }
  }

  /** 계정상태 코드 조회 후 codeId -> 표시명 맵 */
  const handleFetchUserManageAcctStatusCodes = async (): Promise<void> => {
    try {
      const res = await fetchCodeList(ACCT_STATUS_CODE_GRP_ID)
      const list = res?.dataList ?? []
      const map: Record<string, string> = {}
      list.forEach((item) => {
        map[item.codeId] = item.description?.trim() || item.codeNm || item.codeId
      })
      acctStatusMap.value = map
    } catch {
      acctStatusMap.value = {}
    }
  }

  /** 계정상태 코드에 해당하는 표시명 반환 */
  const getAcctStatusName = (codeId: string | undefined | null): string => {
    if (codeId == null || codeId === '') return ''
    return acctStatusMap.value[codeId] ?? codeId
  }

  /** 계정상태 표시명에 해당하는 뱃지 클래스 반환 */
  const getAcctStatusClass = (statusName: string): string => {
    if (statusName === '활성') return 'is-active'
    if (statusName === '비활성') return 'is-inactive'
    if (statusName === '잠금') return 'is-lock'
    return ''
  }

  const getOrgName = (orgId: string | undefined | null): string => {
    if (orgId == null || orgId === '') return ''
    return orgList.value.find((item) => item.orgId === orgId)?.orgNm ?? orgId
  }

  return {
    userManageList,
    userManageSearchKeyword,
    userManageFilteredList,
    userManageIsLoading,
    userManageErrorMessage,
    isUserManageModalOpen,
    editingUserManage,
    openUserManageEditModal,
    closeUserManageModal,
    updateEditingUserManage,
    handleToggleUserManageStatus,
    handleUpdateUserManage,
    handleFetchUserManageList,
    handleFetchUserManageAcctStatusCodes,
    handleResetUserPassword,
    getAcctStatusName,
    getAcctStatusClass,
    getOrgName,
    formatPhone,
    toPhoneDigits,
  }
}
