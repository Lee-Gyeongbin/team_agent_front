import { useApi } from '~/composables/com/useApi'
import type { LoginHistoryItem } from '~/types/login-history'

export const useLoginHistoryApi = () => {
  const { get } = useApi()

  const fetchLoginHistoryList = async (): Promise<{ list: LoginHistoryItem[] }> => {
    return get<{ list: LoginHistoryItem[] }>('/login/loginHistory/selectLoginHistoryList.do')
  }

  return { fetchLoginHistoryList }
}
