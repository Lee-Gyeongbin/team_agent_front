import { useApi } from '~/composables/com/useApi'
import type { MyPageItem, ChangePasswordResponse } from '~/types/my-page'

export const useMyPageApi = () => {
  const { post } = useApi()

  /** 마이페이지 정보 조회 */
  const fetchMyPageInfo = async (userId: string): Promise<Partial<MyPageItem>> => {
    const res = await post<{ dataList?: MyPageItem[] }>('/mypage/list.do', { userId })
    return res.dataList?.[0] ?? {}
  }

  /** 마이페이지 정보 수정 */
  const saveMyPageInfo = async (payload: Partial<MyPageItem>): Promise<void> => {
    await post('/mypage/update.do', payload)
  }

  /** 마이페이지 비밀번호 변경 */
  const changeMyPagePassword = async (payload: {
    userId: string
    oldPassword: string
    newPassword: string
  }): Promise<void> => {
    const res = await post<ChangePasswordResponse>('/mypage/changePassword.do', payload)

    if (res?.successYn === false) {
      const message = res.returnMsg && res.returnMsg.trim().length > 0 ? res.returnMsg : '비밀번호 변경에 실패했습니다.'
      throw new Error(message)
    }
  }

  return {
    fetchMyPageInfo,
    saveMyPageInfo,
    changeMyPagePassword,
  }
}
