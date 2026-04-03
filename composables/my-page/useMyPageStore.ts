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

export const useMyPageStore = () => {
  const { fetchMyPageInfo, fetchUpdateMyPageInfo, fetchChangeMyPagePassword, fetchMyPageLoginHistory } = useMyPageApi()
  const { orgOptions } = useOrgManageStore()
  const { user } = useAuth()

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
    currentOrgLabel,
    isEditMode,
    isPasswordModalOpen,
    loginHistoryList,
    loginHistoryLoading,
    loginHistoryError,
    checkSave,
    handleLoadMyPage,
    handleLoadLoginHistory,
    handleStartEdit,
    handleCancelEdit,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    handleSaveMyPage,
    handleSubmitPasswordChange,
  }
}
