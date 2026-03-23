import { computed, ref } from 'vue'
import type {
  ChatGreetingForm,
  ChatGuideErrorData,
  ChatMaintenanceItem,
  ChatNoticeForm,
  ChatNoticeItem,
} from '~/types/chat-guide'
import {
  cloneChatGuideErrorData,
  cloneChatGuideForm,
  cloneChatMaintenanceList,
  conditionOptions,
  getChatGuideErrorDefaults,
  getEmptyChatGreetingForm,
  getEmptyChatMaintenanceList,
  mapNoticeDataListToForm,
  mergeChatMaintenanceDataList,
} from '~/types/chat-guide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

/** 챗가이드 상태·서비스 — API 호출 조합·토스트·UI 토글 */
const greetingForm = ref<ChatGreetingForm>(getEmptyChatGreetingForm())
const noticeForm = ref<ChatNoticeForm | null>(null)
const maintenanceList = ref<ChatMaintenanceItem[]>(getEmptyChatMaintenanceList())
const errorMessageData = ref<ChatGuideErrorData>(getChatGuideErrorDefaults())

const toYn = (value: boolean): 'Y' | 'N' => (value ? 'Y' : 'N')

const handleToggleEnblYn = (target: { enblYn: 'Y' | 'N' }, value: boolean) => {
  target.enblYn = toYn(value)
}

const handleToggleAutoDetectYn = (target: ChatNoticeItem, value: boolean) => {
  target.autoDetectYn = toYn(value)
}

const previewGreetingMessage = computed(() => {
  let msg = greetingForm.value.content
  if (greetingForm.value.autoNameYn === 'Y') {
    msg = msg.replace(/\{\{userName\}\}/g, '홍길동')
  }
  return msg
})

export const useChatGuideStore = () => {
  const {
    fetchSelectGreeting,
    fetchSaveGreeting,
    fetchSelectNotice,
    fetchSaveNotice,
    fetchSelectErrorMessage,
    fetchSaveErrorMessage,
    fetchSelectMaintenance,
    fetchSaveMaintenance,
  } = useChatGuideApi()

  const handleSelectGreeting = async () => {
    try {
      const res = await fetchSelectGreeting()
      greetingForm.value = res ? { ...getEmptyChatGreetingForm(), ...res } : getEmptyChatGreetingForm()
    } catch {
      openToast({ message: '인사멘트 설정 조회 실패', type: 'error' })
      greetingForm.value = getEmptyChatGreetingForm()
    }
  }

  const handleSaveGreeting = async () => {
    await fetchSaveGreeting(greetingForm.value)
  }

  const handleResetGreeting = () => {
    openConfirm({
      title: '인사멘트 초기화',
      message:
        '초기화 시 변경된 인사멘트 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
      onConfirm: async () => {
        await handleSelectGreeting()
        openToast({ message: '인사멘트 설정이 초기화되었습니다.', type: 'info' })
      },
    })
  }

  const handleInsertGreetingVariable = () => {
    greetingForm.value.content += '{{userName}}'
  }

  const handleSelectNotice = async () => {
    try {
      const dataList = await fetchSelectNotice()
      noticeForm.value = mapNoticeDataListToForm(dataList)
    } catch {
      openToast({ message: '안내멘트 설정 조회 실패', type: 'error' })
      noticeForm.value = null
    }
  }

  const handleSaveNotice = async (payload: ChatNoticeForm) => {
    await fetchSaveNotice(payload)
    noticeForm.value = cloneChatGuideForm(payload)
  }

  const handleSelectErrorMessage = async () => {
    try {
      const data = await fetchSelectErrorMessage()
      errorMessageData.value = data ? cloneChatGuideErrorData(data) : getChatGuideErrorDefaults()
    } catch {
      openToast({ message: '오류 메시지 설정 조회 실패', type: 'error' })
      errorMessageData.value = getChatGuideErrorDefaults()
    }
  }

  const handleSaveErrorMessage = async (payload: ChatGuideErrorData) => {
    await fetchSaveErrorMessage(payload)
    errorMessageData.value = cloneChatGuideErrorData(payload)
  }

  const handleSelectMaintenance = async () => {
    try {
      const dataList = await fetchSelectMaintenance()
      maintenanceList.value = mergeChatMaintenanceDataList(dataList)
    } catch {
      openToast({ message: '점검/장애 설정 조회 실패', type: 'error' })
      maintenanceList.value = getEmptyChatMaintenanceList()
    }
  }

  const handleSaveMaintenance = async (payload: ChatMaintenanceItem[]) => {
    await fetchSaveMaintenance(payload)
    maintenanceList.value = cloneChatMaintenanceList(payload)
  }

  return {
    greetingForm,
    noticeForm,
    maintenanceList,
    errorMessageData,
    conditionOptions,
    previewGreetingMessage,
    handleSelectGreeting,
    handleSaveGreeting,
    handleResetGreeting,
    handleInsertGreetingVariable,
    handleSelectNotice,
    handleSaveNotice,
    handleSelectMaintenance,
    handleSaveMaintenance,
    handleSelectErrorMessage,
    handleSaveErrorMessage,
    handleToggleEnblYn,
    handleToggleAutoDetectYn,
  }
}
