import { useApi } from '~/composables/com/useApi'
import type {
  ChangePasswordResponse,
  MyPageHistoryParams,
  MyPageHistoryResponse,
  MyPageItem,
  MyPageProfileImageUpdateResponse,
  MyPageProfileImageViewResponse,
  MyPageProfileUploadPrepareResponse,
} from '~/types/my-page'

export const useMyPageApi = () => {
  const { get, post } = useApi()

  /** 마이페이지 정보 조회 (세션 기준) */
  const fetchInfo = async () => {
    const res = await get<{ dataList?: MyPageItem[] }>('/mypage/list.do')
    return res.dataList?.[0]
  }

  /** 마이페이지 정보 수정 */
  const fetchUpdateInfo = async (payload: Partial<MyPageItem>) => {
    await post('/mypage/update.do', payload)
  }

  /** 마이페이지 비밀번호 변경 (세션 기준) */
  const fetchChangePassword = async (payload: { oldPassword: string; newPassword: string }) => {
    const res = await post<ChangePasswordResponse>('/mypage/changePassword.do', payload)

    if (res?.successYn === false) {
      const message = res?.returnMsg ?? '비밀번호 변경에 실패했습니다.'
      throw new Error(message)
    }
    return res?.returnMsg ?? '비밀번호가 변경되었습니다.'
  }

  /** 마이페이지 로그인 이력 조회 */
  const fetchLoginHistory = async (body: MyPageHistoryParams) => {
    return post<MyPageHistoryResponse>('/mypage/selectUserLoginHistory.do', body)
  }

  /** 프로필 사진 업로드 URL 발급 */
  const fetchPrepareProfileImageUpload = async (payload: { profileImgNm: string }) => {
    const res = await post<MyPageProfileUploadPrepareResponse>('/mypage/prepareProfileImageUpload.do', payload)
    if (res?.successYn === false) {
      throw new Error(res?.returnMsg ?? '프로필 이미지 업로드 URL 발급에 실패했습니다.')
    }
    return {
      uploadUrl: String(res?.uploadUrl ?? ''),
      filePath: String(res?.filePath ?? ''),
      returnMsg: String(res?.returnMsg ?? ''),
    }
  }

  /** 업로드 완료 파일 경로 DB 저장 */
  const fetchUpdateUserProfileImg = async (payload: { profileImgNm: string; profileImgPath: string }) => {
    const res = await post<MyPageProfileImageUpdateResponse>('/mypage/updateUserProfileImg.do', payload)
    if (res?.successYn === false) {
      throw new Error(res?.returnMsg ?? '프로필 이미지 경로 저장에 실패했습니다.')
    }
  }

  /** 프로필 사진 보기 URL 조회 */
  const fetchViewUserProfileImg = async () => {
    return post<MyPageProfileImageViewResponse>('/mypage/viewUserProfileImg.do', {})
  }

  return {
    fetchInfo,
    fetchUpdateInfo,
    fetchChangePassword,
    fetchLoginHistory,
    fetchPrepareProfileImageUpload,
    fetchUpdateUserProfileImg,
    fetchViewUserProfileImg,
  }
}
