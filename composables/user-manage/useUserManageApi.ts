import { useApi } from '~/composables/com/useApi'
import type { UserItem } from '~/types/user-manage'

export const useUserManageApi = () => {
  const { get, post } = useApi()

  /** 사용자 목록 조회 */
  const fetchUserList = async (): Promise<UserItem[]> => {
    const res = await get<{ list: UserItem[] }>('/usermanage/selectUserList.do')
    return res.list
  }

  /** 사용자 수정 */
  const fetchUpdateUser = async (user: Partial<UserItem>): Promise<void> => {
    const res = await post<Record<string, unknown>>('/usermanage/updateUser.do', user)
    if (res?.successYn === false) {
      throw new Error(String(res?.returnMsg ?? '수정에 실패했습니다.'))
    }
  }

  /** 사용자 논리 삭제 */
  const fetchDeleteUser = async (userId: string): Promise<void> => {
    await post('/usermanage/deleteUser.do', { userId })
  }

  /** 사용자 복구 */
  const fetchRestoreUser = async (userId: string): Promise<void> => {
    await post('/usermanage/restoreUser.do', { userId })
  }

  return {
    fetchUserList,
    fetchUpdateUser,
    fetchDeleteUser,
    fetchRestoreUser,
  }
}
