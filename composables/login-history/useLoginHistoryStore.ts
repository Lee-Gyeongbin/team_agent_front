import type { LoginHistoryItem } from '~/types/login-history'
import { useLoginHistoryApi } from '~/composables/login-history/useLoginHistoryApi'

export const useLoginHistoryStore = () => {
  const { fetchLoginHistoryList } = useLoginHistoryApi()
  const loginHistoryList = ref<LoginHistoryItem[]>([])
  const searchKeyword = ref('')
  const dateRangeOption = ref('7d')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const filteredList = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return loginHistoryList.value
    return loginHistoryList.value.filter(
      (item) => item.ipAddr.toLowerCase().includes(keyword) || item.userId.toLowerCase().includes(keyword),
    )
  })

  const handleFetchLoginHistory = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const res = await fetchLoginHistoryList()
      loginHistoryList.value = res.list.map((item) => ({
        ...item,
        result: item.result === 'SUCCESS' ? '성공' : '실패',
      }))
    } catch (error) {
      errorMessage.value = '로그인 이력을 불러오는데 실패했습니다.'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    loginHistoryList,
    searchKeyword,
    dateRangeOption,
    isLoading,
    errorMessage,
    filteredList,
    handleFetchLoginHistory,
  }
}
