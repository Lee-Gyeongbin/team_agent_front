import type { MyPageItem, MyPageLoginHistoryItem } from '~/types/my-page'
import { useMyPageApi } from '~/composables/my-page/useMyPageApi'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import { checkEmail, checkPhone, isEmpty } from '~/utils/global/validationUtil'

const isLoading = ref(false)
const errorMessage = ref('')
const hasData = ref(true)
const form = ref<Partial<MyPageItem>>({})
const isEditMode = ref(false)
const isPasswordModalOpen = ref(false)
const loginHistoryList = ref<MyPageLoginHistoryItem[]>([])
const loginHistoryLoading = ref(false)
const loginHistoryError = ref('')

/** 프로필 사진 미리보기(blob URL). 새로고침 시 초기화 — 서버 업로드 API 연동 시 교체 */
const avatarFileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreviewUrl = ref<string | null>(null)

export const useMyPageStore = () => {
  const { fetchMyPageInfo, fetchUpdateMyPageInfo, fetchChangeMyPagePassword, fetchMyPageLoginHistory } = useMyPageApi()
  const { orgOptions } = useOrgManageStore()
  const { user, logout } = useAuth()

  const currentOrgLabel = computed(() => {
    if (!form.value.orgId) return ''
    const found = orgOptions.value?.find((opt) => opt.value === form.value.orgId)
    return found?.label ?? ''
  })

  const handleLoadMyPage = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      if (!user.value) {
        errorMessage.value = '로그인 정보가 없습니다.'
        hasData.value = false
        return
      }
      const data = await fetchMyPageInfo()
      form.value = data ?? {}
      hasData.value = Boolean(data && String(data.userId ?? '').trim())
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '내 정보를 불러오는 중 오류가 발생했습니다.'
      hasData.value = false
    } finally {
      isLoading.value = false
    }
  }

  const handleLoadLoginHistory = async () => {
    loginHistoryLoading.value = true
    loginHistoryError.value = ''
    try {
      if (!user.value) {
        loginHistoryError.value = '로그인 정보가 없습니다.'
        loginHistoryList.value = []
        return
      }
      loginHistoryList.value = await fetchMyPageLoginHistory()
    } catch (error) {
      loginHistoryError.value =
        error instanceof Error ? error.message : '로그인 이력을 불러오는 중 오류가 발생했습니다.'
      loginHistoryList.value = []
    } finally {
      loginHistoryLoading.value = false
    }
  }

  /** 프로필 사진: 파일 선택 트리거 */
  const onClickChangePhoto = () => {
    avatarFileInputRef.value?.click()
  }

  /** 프로필 사진: 로컬 미리보기 (업로드 API 연동 전) */
  const onAvatarFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      openToast({
        message: '이미지 파일만 선택할 수 있습니다.',
        type: 'warning',
      })
      input.value = ''
      return
    }

    if (avatarPreviewUrl.value) {
      URL.revokeObjectURL(avatarPreviewUrl.value)
    }
    avatarPreviewUrl.value = URL.createObjectURL(file)

    openToast({
      message: '저장이 완료되었습니다.',
      type: 'success',
    })
    openToast({
      message: 'TODO : 개발 진행 예정입니다.',
      type: 'info',
    })

    input.value = ''
  }

  /** blob URL 해제 — 페이지 이탈 시 호출 */
  const cleanupAvatarPreview = () => {
    if (avatarPreviewUrl.value) {
      URL.revokeObjectURL(avatarPreviewUrl.value)
      avatarPreviewUrl.value = null
    }
  }

  const handleReloadMyPage = () => {
    void handleLoadMyPage()
  }

  const handleInitializeMyPage = async () => {
    const { orgOptions, handleFetchOrgList } = useOrgManageStore()
    if (!orgOptions.value.length) {
      await handleFetchOrgList()
    }
    await handleLoadMyPage()
  }

  /** 사용자명, 이메일, 전화번호가 모두 있고, 값이 모두 유효할 때만 저장 가능 (아이디는 수정 불가) */
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

  const handleStartEdit = () => {
    isEditMode.value = true
  }

  const handleCancelEdit = () => {
    isEditMode.value = false
  }

  const openPasswordModal = () => {
    isPasswordModalOpen.value = true
  }

  const closePasswordModal = () => {
    isPasswordModalOpen.value = false
  }

  const handleSaveMyPage = async (): Promise<boolean> => {
    const confirmed = await openConfirm({
      title: '계정 정보 저장',
      message: '계정 정보를 저장하시겠습니까?',
    })
    if (!confirmed) return false

    try {
      await fetchUpdateMyPageInfo(form.value)
      openAlert({
        message: '계정 정보가 저장되었습니다.',
      })
      isEditMode.value = false
      return true
    } catch {
      openToast({
        message: '계정 정보를 저장하는 중 오류가 발생했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const handleSubmitPasswordChange = async (payload: { oldPassword: string; newPassword: string }) => {
    try {
      await fetchChangeMyPagePassword(payload)
      isPasswordModalOpen.value = false
      await openAlert({
        message: '비밀번호가 변경되었습니다.\n보안을 위해 다시 로그인해 주세요.',
      })
      await logout()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : '기존 비밀번호가 일치하지 않습니다.'
      openToast({
        message,
        type: 'error',
      })
    }
  }

  return {
    isLoading,
    errorMessage,
    hasData,
    form,
    currentOrgLabel,
    isEditMode,
    isPasswordModalOpen,
    loginHistoryList,
    loginHistoryLoading,
    loginHistoryError,
    avatarFileInputRef,
    avatarPreviewUrl,
    checkSave,
    handleLoadMyPage,
    handleLoadLoginHistory,
    handleStartEdit,
    handleCancelEdit,
    openPasswordModal,
    closePasswordModal,
    handleSaveMyPage,
    handleSubmitPasswordChange,
    onClickChangePhoto,
    onAvatarFileChange,
    cleanupAvatarPreview,
    handleReloadMyPage,
    handleInitializeMyPage,
  }
}
