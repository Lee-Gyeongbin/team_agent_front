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

export const useMyPageStore = () => {
  const { fetchInfo, fetchUpdateInfo, fetchChangePassword, fetchLoginHistory } = useMyPageApi()
  const { orgOptions, handleFetchOrgList } = useOrgManageStore()
  const { user, logout } = useAuth()

  const cloneForm = (src: Partial<MyPageItem>): Partial<MyPageItem> =>
    structuredClone(toRaw(src) as Partial<MyPageItem>)

  const currentOrgLabel = computed(() => {
    if (!form.value.orgId) return ''
    const found = orgOptions.value?.find((opt) => opt.value === form.value.orgId)
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
      await fetchChangePassword(payload)
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

  const onClickChangePhoto = () => {
    avatarFileInputRef.value?.click()
  }

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

  return {
    // 내 정보
    isLoading,
    errorMessage,
    hasData,
    form,
    currentOrgLabel,
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
    // 초기화 · 조회
    handleInitializeMyPage,
    handleLoadMyPage,
    handleLoadHistory,
    // 편집 · 저장
    handleStartEdit,
    handleCancelEdit,
    handleSaveMyPage,
    // 비밀번호
    openPasswordModal,
    closePasswordModal,
    handleSubmitPasswordChange,
    // 프로필 사진
    onClickChangePhoto,
    onAvatarFileChange,
    cleanupAvatarPreview,
  }
}
