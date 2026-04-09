import { computed, ref, toRaw } from 'vue'
import type { MyPageHistoryParams, MyPageItem, MyPageLoginHistoryItem } from '~/types/my-page'
import { useMyPageApi } from '~/composables/my-page/useMyPageApi'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import { checkEmail, checkPhone, isEmpty } from '~/utils/global/validationUtil'

const isLoading = ref(false)
const errorMessage = ref('')
const hasData = ref(true)
const form = ref<Partial<MyPageItem>>({})
const formSnapshot = ref<Partial<MyPageItem> | null>(null)
const isEditMode = ref(false)
const isPasswordModalOpen = ref(false)
const loginHistoryList = ref<MyPageLoginHistoryItem[]>([])
const loginHistoryLoading = ref(false)
const loginHistoryError = ref('')
const avatarFileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreviewUrl = ref<string | null>(null)
const avatarUploadedFilePath = ref('')

export const useMyPageStore = () => {
  const {
    fetchInfo,
    fetchUpdateInfo,
    fetchChangePassword,
    fetchLoginHistory,
    fetchPrepareProfileImageUpload,
    fetchUpdateUserProfileImg,
    fetchViewUserProfileImg,
  } = useMyPageApi()
  const { orgOptions, handleFetchOrgList } = useOrgManageStore()
  const { user, logout } = useAuth()

  const cloneForm = (src: Partial<MyPageItem>): Partial<MyPageItem> =>
    structuredClone(toRaw(src) as Partial<MyPageItem>)

  const currentOrgLabel = computed(() => {
    if (!form.value.orgId) return ''
    const found = orgOptions.value?.find((opt) => opt.value === form.value.orgId)
    return found?.label ?? ''
  })

  /** 좌측 프로필/요약: 편집 중에는 스냅샷의 orgId 기준 조직명 */
  const sidebarOrgLabel = computed(() => {
    const orgId = formSnapshot.value !== null ? formSnapshot.value.orgId : form.value.orgId
    if (!orgId) return ''
    const found = orgOptions.value?.find((opt) => opt.value === orgId)
    return found?.label ?? ''
  })

  /** 사용자명·이메일·전화번호 입력 및 형식이 모두 유효할 때만 저장 가능 */
  const checkSave = computed(() => {
    const userNm = String(form.value.userNm ?? '')
    const email = String(form.value.email ?? '')
    const phone = String(form.value.phone ?? '')

    if (isEmpty(userNm) || isEmpty(email)) return false

    const emailTrimmed = email.trim()
    const phoneTrimmed = phone.trim()

    if (!checkEmail(emailTrimmed)) return false
    if (!checkPhone(phoneTrimmed)) return false

    return true
  })

  const revokeAvatarPreviewUrl = () => {
    if (avatarPreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl.value)
    }
  }

  const handleLoadProfileImage = async () => {
    try {
      const res = await fetchViewUserProfileImg()
      if (String(res?.viewType ?? '').toUpperCase() === 'IMAGE' && String(res?.url ?? '').trim()) {
        revokeAvatarPreviewUrl()
        avatarPreviewUrl.value = String(res?.url ?? '').trim()
        return
      }
      revokeAvatarPreviewUrl()
      avatarPreviewUrl.value = null
    } catch {
      revokeAvatarPreviewUrl()
      avatarPreviewUrl.value = null
    }
  }

  const handleLoadMyPage = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      if (!user.value) {
        errorMessage.value = '로그인 정보가 없습니다.'
        hasData.value = false
        return
      }
      const data = await fetchInfo()
      form.value = data ?? {}
      hasData.value = Boolean(data && String(data.userId ?? '').trim())
      isEditMode.value = false
      formSnapshot.value = null
      avatarUploadedFilePath.value = ''
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '내 정보를 불러오는 중 오류가 발생했습니다.'
      hasData.value = false
    } finally {
      isLoading.value = false
    }
  }

  const handleLoadHistory = async (searchParams: MyPageHistoryParams) => {
    loginHistoryLoading.value = true
    loginHistoryError.value = ''
    try {
      if (!user.value) {
        loginHistoryError.value = '로그인 정보가 없습니다.'
        loginHistoryList.value = []
        return
      }
      const res = await fetchLoginHistory(searchParams)
      loginHistoryList.value = res.dataList ?? []
    } catch (error) {
      loginHistoryError.value =
        error instanceof Error ? error.message : '로그인 이력을 불러오는 중 오류가 발생했습니다.'
      loginHistoryList.value = []
    } finally {
      loginHistoryLoading.value = false
    }
  }

  /** 조직 옵션 선로딩 후 내 정보 조회 — 페이지 진입 시 호출 */
  const handleInitializeMyPage = async () => {
    if (!orgOptions.value.length) {
      await handleFetchOrgList()
    }
    await handleLoadMyPage()
    await handleLoadProfileImage()
  }

  const handleStartEdit = () => {
    formSnapshot.value = cloneForm(form.value)
    isEditMode.value = true
  }

  const handleCancelEdit = async () => {
    const confirmed = await openConfirm({
      title: '수정 취소',
      message: '작성 중인 내용이 저장되지 않고 모두 사라집니다.\n수정을 취소하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
    })
    if (!confirmed) return

    if (formSnapshot.value !== null) {
      form.value = cloneForm(formSnapshot.value)
    }
    formSnapshot.value = null
    isEditMode.value = false
  }

  const handleResetEditOnTabLeave = () => {
    if (formSnapshot.value !== null) {
      form.value = cloneForm(formSnapshot.value)
    }
    formSnapshot.value = null
    isEditMode.value = false
  }

  /** 내 계정 정보 탭 이탈 시 확인 후 원복 */
  const handleConfirmResetEditOnTabLeave = async () => {
    const confirmed = await openConfirm({
      title: '탭 이동',
      message: '다른 탭으로 이동 시 수정 내역은 사라집니다.\n이동하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
    })
    if (!confirmed) return false

    handleResetEditOnTabLeave()
    return true
  }

  const handleSaveMyPage = async () => {
    const confirmed = await openConfirm({
      title: '계정 정보 저장',
      message: '계정 정보를 저장하시겠습니까?',
    })
    if (!confirmed) return false

    try {
      await fetchUpdateInfo(form.value)
      openAlert({
        message: '계정 정보가 저장되었습니다.',
      })
      isEditMode.value = false
      formSnapshot.value = null
      return true
    } catch {
      openToast({
        message: '계정 정보를 저장하는 중 오류가 발생했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const openPasswordModal = () => {
    isPasswordModalOpen.value = true
  }

  const closePasswordModal = () => {
    isPasswordModalOpen.value = false
  }

  const handleSubmitPasswordChange = async (payload: { oldPassword: string; newPassword: string }) => {
    try {
      isPasswordModalOpen.value = false
      await fetchChangePassword(payload)
      await openAlert({
        message: '비밀번호가 변경되었습니다.\n보안을 위해 다시 로그인해 주세요.',
      })
      await logout()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '비밀번호 수정 중 오류가 발생했습니다.\n다시 시도해주세요.'
      openToast({
        message,
        type: 'error',
      })
    }
  }

  const onClickChangePhoto = () => {
    avatarFileInputRef.value?.click()
  }

  const onAvatarFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      const prepared = await fetchPrepareProfileImageUpload({
        profileImgNm: file.name,
      })

      if (!prepared.uploadUrl || !prepared.filePath) {
        throw new Error('프로필 이미지 업로드 정보가 올바르지 않습니다.')
      }

      const uploadRes = await fetch(prepared.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!uploadRes.ok) {
        throw new Error('프로필 이미지 업로드에 실패했습니다.')
      }

      await fetchUpdateUserProfileImg({
        profileImgNm: file.name,
        profileImgPath: prepared.filePath,
      })

      avatarUploadedFilePath.value = prepared.filePath
      await handleLoadProfileImage()
      openToast({ message: '프로필 사진이 변경되었습니다.', type: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 사진 저장 중 오류가 발생했습니다.'
      openToast({ message, type: 'error' })
      return
    }
  }

  const onClickDeletePhoto = async () => {
    if (!avatarPreviewUrl.value) return

    const confirmed = await openConfirm({
      title: '프로필 사진 삭제',
      message: '프로필 사진을 삭제하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
    })
    if (!confirmed) return

    try {
      await fetchUpdateUserProfileImg({
        profileImgNm: '',
        profileImgPath: '',
      })
      revokeAvatarPreviewUrl()
      avatarPreviewUrl.value = null
      avatarUploadedFilePath.value = ''
      openToast({ message: '프로필 사진이 삭제되었습니다.', type: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 사진 삭제 중 오류가 발생했습니다.'
      openToast({ message, type: 'error' })
    }
  }

  return {
    // 내 정보
    isLoading,
    errorMessage,
    hasData,
    form,
    formSnapshot,
    orgOptions,
    currentOrgLabel,
    sidebarOrgLabel,
    isEditMode,
    checkSave,
    // 비밀번호 모달
    isPasswordModalOpen,
    // 로그인 이력
    loginHistoryList,
    loginHistoryLoading,
    loginHistoryError,
    // 프로필 사진
    avatarFileInputRef,
    avatarPreviewUrl,
    avatarUploadedFilePath,
    // 초기화 · 조회
    handleInitializeMyPage,
    handleLoadMyPage,
    handleLoadHistory,
    // 편집 · 저장
    handleStartEdit,
    handleCancelEdit,
    handleConfirmResetEditOnTabLeave,
    handleSaveMyPage,
    // 비밀번호
    openPasswordModal,
    closePasswordModal,
    handleSubmitPasswordChange,
    // 프로필 사진
    onClickChangePhoto,
    onAvatarFileChange,
    onClickDeletePhoto,
  }
}
