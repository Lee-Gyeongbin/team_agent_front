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
  CHAT_NOTICE_DEFAULT_GUIDE_KEYS,
  conditionOptions,
  getChatGuideErrorDefaults,
  getEmptyChatGreetingForm,
  getEmptyChatMaintenanceList,
  getEmptyChatNoticeForm,
} from '~/types/chat-guide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

/** 챗가이드 상태·서비스 — API 호출 조합·토스트·UI 토글 */
const greetingForm = ref<ChatGreetingForm>(getEmptyChatGreetingForm())
const greetingPreviewAutoNameYn = ref<'Y' | 'N'>('N')
const noticeForm = ref<ChatNoticeForm | null>(null)
const maintenanceList = ref<ChatMaintenanceItem[]>(getEmptyChatMaintenanceList())
const errorMessageData = ref<ChatGuideErrorData>(getChatGuideErrorDefaults())
const localNoticeForm = ref<ChatNoticeForm>(getEmptyChatNoticeForm())
const localMaintenanceList = ref<ChatMaintenanceItem[]>(getEmptyChatMaintenanceList())
const localErrorMessageData = ref<ChatGuideErrorData>(getChatGuideErrorDefaults())

/** UiToggle/Checkbox `boolean` ↔ API `Y|N` — 스토어·컴포넌트 공통 */
export const toYn = (value: boolean): 'Y' | 'N' => (value ? 'Y' : 'N')

const previewGreetingMessage = computed(() => {
  let msg = greetingForm.value.content
  if (greetingPreviewAutoNameYn.value === 'Y') {
    msg = msg.replace(/\{\{userName\}\}/g, '홍길동')
  }
  return msg
})

const buildNoticeFormFromRows = (items: ChatNoticeItem[]): ChatNoticeForm => {
  const base = getEmptyChatNoticeForm()
  const byGuideKey = new Map(items.map((item) => [item.guideKey, item]))

  return {
    feature: byGuideKey.get(CHAT_NOTICE_DEFAULT_GUIDE_KEYS.feature) ?? base.feature,
    guide: byGuideKey.get(CHAT_NOTICE_DEFAULT_GUIDE_KEYS.guide) ?? base.guide,
    privacy: byGuideKey.get(CHAT_NOTICE_DEFAULT_GUIDE_KEYS.privacy) ?? base.privacy,
    limitation: byGuideKey.get(CHAT_NOTICE_DEFAULT_GUIDE_KEYS.limitation) ?? base.limitation,
  }
}

const syncLocalNoticeForm = () => {
  localNoticeForm.value = noticeForm.value ? cloneChatGuideForm(noticeForm.value) : getEmptyChatNoticeForm()
}

const syncLocalMaintenanceList = () => {
  localMaintenanceList.value = cloneChatMaintenanceList(maintenanceList.value)
}

const syncLocalErrorMessageData = () => {
  localErrorMessageData.value = cloneChatGuideErrorData(errorMessageData.value)
}

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
      greetingForm.value = res ?? getEmptyChatGreetingForm()
    } catch {
      openToast({ message: '인사멘트 설정 조회 실패', type: 'error' })
      greetingForm.value = getEmptyChatGreetingForm()
    }
  }

  const handleSaveGreeting = async () => {
    await fetchSaveGreeting(greetingForm.value)
  }

  const handleInsertGreetingVariable = () => {
    greetingForm.value.content += '{{userName}}'
  }

  const handleSelectNotice = async () => {
    try {
      const dataList = await fetchSelectNotice()
      noticeForm.value = buildNoticeFormFromRows(dataList ?? [])
      syncLocalNoticeForm()
    } catch {
      openToast({ message: '안내멘트 설정 조회 실패', type: 'error' })
      noticeForm.value = null
      syncLocalNoticeForm()
    }
  }

  const handleSaveNotice = async (payload: ChatNoticeForm) => {
    await fetchSaveNotice(payload)
    noticeForm.value = cloneChatGuideForm(payload)
    syncLocalNoticeForm()
  }

  const handleSelectErrorMessage = async () => {
    try {
      const data = await fetchSelectErrorMessage()
      errorMessageData.value = data ? cloneChatGuideErrorData(data) : getChatGuideErrorDefaults()
      syncLocalErrorMessageData()
    } catch {
      openToast({ message: '오류 메시지 설정 조회 실패', type: 'error' })
      errorMessageData.value = getChatGuideErrorDefaults()
      syncLocalErrorMessageData()
    }
  }

  const handleSaveErrorMessage = async (payload: ChatGuideErrorData) => {
    await fetchSaveErrorMessage(payload)
    errorMessageData.value = cloneChatGuideErrorData(payload)
    syncLocalErrorMessageData()
  }

  const handleSelectMaintenance = async () => {
    try {
      const dataList = await fetchSelectMaintenance()
      maintenanceList.value = dataList.length === 0 ? getEmptyChatMaintenanceList() : cloneChatMaintenanceList(dataList)
      syncLocalMaintenanceList()
    } catch {
      openToast({ message: '점검/장애 설정 조회 실패', type: 'error' })
      maintenanceList.value = getEmptyChatMaintenanceList()
      syncLocalMaintenanceList()
    }
  }

  const handleSaveMaintenance = async (payload: ChatMaintenanceItem[]) => {
    await fetchSaveMaintenance(payload)
    maintenanceList.value = cloneChatMaintenanceList(payload)
    syncLocalMaintenanceList()
  }

  return {
    greetingForm,
    greetingPreviewAutoNameYn,
    noticeForm,
    maintenanceList,
    errorMessageData,
    localNoticeForm,
    localMaintenanceList,
    localErrorMessageData,
    conditionOptions,
    previewGreetingMessage,
    handleSelectGreeting,
    handleSaveGreeting,
    handleInsertGreetingVariable,
    handleSelectNotice,
    handleSaveNotice,
    handleSelectMaintenance,
    handleSaveMaintenance,
    handleSelectErrorMessage,
    handleSaveErrorMessage,
    syncLocalNoticeForm,
    syncLocalMaintenanceList,
    syncLocalErrorMessageData,
  }
}
