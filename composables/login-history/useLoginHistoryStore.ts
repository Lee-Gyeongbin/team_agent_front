import type { LoginHistoryItem } from '~/types/login-history'
import { useLoginHistoryApi } from '~/composables/login-history/useLoginHistoryApi'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const createDummyList = (): LoginHistoryItem[] => [
  // {
  //   logId: 'LOG001',
  //   userId: 'user001',
  //   loginTp: '일반',
  //   accessTp: '웹',
  //   ipAddr: '192.168.0.101',
  //   userAgent: 'Chrome / Windows 11',
  //   result: '성공',
  //   failRson: null,
  //   failCnt: 0,
  //   token: 'xxx',
  //   otpStatus: 'N',
  //   ipStatus: 'Y',
  //   createDt: '2026.03.10 14:32:15',
  // },
  // {
  //   logId: 'LOG002',
  //   userId: 'user002',
  //   loginTp: '일반',
  //   accessTp: '웹',
  //   ipAddr: '192.168.0.102',
  //   userAgent: 'Safari / macOS',
  //   result: '성공',
  //   failRson: null,
  //   failCnt: 0,
  //   token: null,
  //   otpStatus: null,
  //   ipStatus: null,
  //   createDt: '2026.03.10 13:20:42',
  // },
  // {
  //   logId: 'LOG003',
  //   userId: 'user003',
  //   loginTp: '일반',
  //   accessTp: '웹',
  //   ipAddr: '10.0.0.55',
  //   userAgent: 'Edge / Windows 10',
  //   result: '실패',
  //   failRson: 'PASSWORD_MISMATCH',
  //   failCnt: 1,
  //   token: null,
  //   otpStatus: null,
  //   ipStatus: null,
  //   createDt: '2026.03.10 11:05:33',
  // },
  // {
  //   logId: 'LOG004',
  //   userId: 'user004',
  //   loginTp: 'OTP',
  //   accessTp: '웹',
  //   ipAddr: '192.168.0.103',
  //   userAgent: 'Chrome / Android',
  //   result: '성공',
  //   failRson: null,
  //   failCnt: 0,
  //   token: null,
  //   otpStatus: null,
  //   ipStatus: null,
  //   createDt: '2026.03.09 18:45:22',
  // },
  // {
  //   logId: 'LOG005',
  //   userId: 'user005',
  //   loginTp: '일반',
  //   accessTp: '웹',
  //   ipAddr: '172.16.1.20',
  //   userAgent: 'Firefox / Windows 11',
  //   result: '성공',
  //   failRson: null,
  //   failCnt: 0,
  //   token: 'xxx',
  //   otpStatus: 'N',
  //   ipStatus: 'Y',
  //   createDt: '2026.03.09 09:12:08',
  // },
]

export const useLoginHistoryStore = () => {
  const { fetchLoginHistoryList } = useLoginHistoryApi()
  const loginHistoryList = ref<LoginHistoryItem[]>(createDummyList())
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
      loginHistoryList.value = res.list
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
