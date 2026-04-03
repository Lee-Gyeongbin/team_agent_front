import { useApi } from '~/composables/com/useApi'
import type { ChangePasswordResponse, MyPageItem, MyPageLoginHistoryItem } from '~/types/my-page'

export const useMyPageApi = () => {
  const { get, post } = useApi()

  /** 마이페이지 정보 조회 (세션 기준) */
  const fetchMyPageInfo = async (): Promise<Partial<MyPageItem> | undefined> => {
    const res = await get<{ dataList?: MyPageItem[] }>('/mypage/list.do')
    return res.dataList?.[0]
  }

  /** 마이페이지 정보 수정 */
  const fetchUpdateMyPageInfo = async (payload: Partial<MyPageItem>): Promise<void> => {
    await post('/mypage/update.do', payload)
  }

  /** 마이페이지 비밀번호 변경 (세션 기준) */
  const fetchChangeMyPagePassword = async (payload: { oldPassword: string; newPassword: string }): Promise<void> => {
    const res = await post<ChangePasswordResponse>('/mypage/changePassword.do', payload)

    if (res?.successYn === false) {
      const message = res?.returnMsg ?? '비밀번호 변경에 실패했습니다.'
      throw new Error(message)
    }
  }

  /** 마이페이지 로그인 이력 조회 (세션 기준) */
  const fetchMyPageLoginHistory = async (): Promise<MyPageLoginHistoryItem[]> => {
    const res = await get<{ dataList?: MyPageLoginHistoryItem[] }>('/mypage/selectUserLoginHistory.do')
    return res.dataList ?? []
  }

  return {
    fetchMyPageInfo,
    fetchUpdateMyPageInfo,
    fetchChangeMyPagePassword,
    fetchMyPageLoginHistory,
  }
}
