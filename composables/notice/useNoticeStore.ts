import { noticeDummyData, type NoticeItem } from '~/composables/notice/dummydata'

export const useNoticeStore = () => {
  const noticeList = ref<NoticeItem[]>([])
  const searchKeyword = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const filteredList = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return noticeList.value

    return noticeList.value.filter((item) => {
      return item.title.toLowerCase().includes(keyword) || item.writer.toLowerCase().includes(keyword)
    })
  })

  const handleFetchNoticeList = async () => {
    errorMessage.value = ''
    isLoading.value = true

    try {
      noticeList.value = noticeDummyData
    } catch (error) {
      errorMessage.value = '공지사항 조회 중 오류가 발생했습니다.'
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    noticeList,
    searchKeyword,
    isLoading,
    errorMessage,
    filteredList,
    handleFetchNoticeList,
  }
}
