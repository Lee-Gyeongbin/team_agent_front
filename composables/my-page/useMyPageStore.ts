import type { UserItem } from '~/types/user-manage'
import { useMyPageApi } from '~/composables/my-page/useMyPageApi'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import { checkEmail, checkPhone, isEmpty } from '~/utils/global/validationUtil'

const isLoading = ref(false)
const errorMessage = ref('')
const hasData = ref(true)
const form = ref<Partial<UserItem>>({})
const isEditMode = ref(false)
const isPasswordModalOpen = ref(false)

export const useMyPageStore = () => {
  const { fetchMyPageInfo, saveMyPageInfo, changeMyPagePassword } = useMyPageApi()

  const handleLoadMyPage = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      // 🔽 더미 데이터 — 백엔드 연결 시 실제 조회 API 호출로 교체
      const data = await fetchMyPageInfo()
      form.value = data
      hasData.value = !!data
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '내 정보를 불러오는 중 오류가 발생했습니다.'
      hasData.value = false
    } finally {
      isLoading.value = false
    }
  }

  const handleReloadMyPage = async () => {
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

  const handleOpenPasswordModal = () => {
    isPasswordModalOpen.value = true
  }

  const handleClosePasswordModal = () => {
    isPasswordModalOpen.value = false
  }

  /** 계정 정보 저장 + 확인/알림 처리 (성공 시 편집 모드 종료, true 반환) */
  const handleSaveMyPage = async (): Promise<boolean> => {
    const confirmed = await openConfirm({
      title: '계정 정보 저장',
      message: '계정 정보를 저장하시겠습니까?',
    })
    if (!confirmed) return false

    try {
      // 🔽 더미 로직 — 백엔드 연결 시 실제 저장 API 호출로 교체
      await saveMyPageInfo(form.value)
      openAlert({
        message: '계정 정보가 저장되었습니다.',
      })
      isEditMode.value = false
      return true
    } catch (error) {
      openToast({
        message: '계정 정보를 저장하는 중 오류가 발생했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const handleSubmitPasswordChange = async (payload: { userId: string; oldPassword: string; newPassword: string }) => {
    // 🔽 더미 로직 — 백엔드 연결 시 실제 비밀번호 변경 API 호출로 교체
    try {
      await changeMyPagePassword(payload)
      openAlert({
        message: '비밀번호가 변경되었습니다.',
      })
      isPasswordModalOpen.value = false
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
    isEditMode,
    isPasswordModalOpen,
    checkSave,
    handleLoadMyPage,
    handleReloadMyPage,
    handleStartEdit,
    handleCancelEdit,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    handleSaveMyPage,
    handleSubmitPasswordChange,
  }
}
