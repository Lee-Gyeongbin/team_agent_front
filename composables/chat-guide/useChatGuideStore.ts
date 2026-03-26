import { computed, ref } from 'vue'
import type {
  ChatGuideErrorData,
  ChatGuideGreetingForm,
  ChatGuideMaintenanceItem,
  ChatGuideNoticeForm,
  ChatGuideNoticeItem,
} from '~/types/chat-guide'
import {
  CHAT_GUIDE_NOTICE_CONDITION_OPTIONS,
  CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS,
  cloneChatGuideMaintenanceList,
  cloneChatGuideNoticeForm,
  getChatGuideErrorDefaults,
  getEmptyChatGuideGreetingForm,
  getEmptyChatGuideMaintenanceList,
  getEmptyChatGuideNoticeForm,
} from '~/types/chat-guide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

/** 챗가이드 상태·서비스 — API 호출 조합·토스트·UI 토글 */
const greetingForm = ref<ChatGuideGreetingForm>(getEmptyChatGuideGreetingForm())
const greetingPreviewAutoNameYn = ref<'Y' | 'N'>('Y')
const noticeForm = ref<ChatGuideNoticeForm | null>(null)
const maintenanceList = ref<ChatGuideMaintenanceItem[]>(getEmptyChatGuideMaintenanceList())
const errorMessageData = ref<ChatGuideErrorData>(getChatGuideErrorDefaults())
const localNoticeForm = ref<ChatGuideNoticeForm>(getEmptyChatGuideNoticeForm())
const localMaintenanceList = ref<ChatGuideMaintenanceItem[]>(getEmptyChatGuideMaintenanceList())

export const toYn = (value: boolean): 'Y' | 'N' => (value ? 'Y' : 'N')

const normalizeChatGuideErrorData = (apiData: ChatGuideErrorData | null): ChatGuideErrorData => {
  const base = getChatGuideErrorDefaults()
  if (!apiData) return base

  const mergeRows = (
    baseRows: ChatGuideErrorData[keyof ChatGuideErrorData],
    apiRows: ChatGuideErrorData[keyof ChatGuideErrorData] | undefined,
  ) => {
    if (!apiRows || apiRows.length === 0) return baseRows
    return apiRows
  }

  return {
    responseErrors: mergeRows(base.responseErrors, apiData.responseErrors),
    inputErrors: mergeRows(base.inputErrors, apiData.inputErrors),
    apiErrors: mergeRows(base.apiErrors, apiData.apiErrors),
  }
}

const previewGreetingMessage = computed(() => {
  let msg = greetingForm.value.content
  if (greetingPreviewAutoNameYn.value === 'Y') {
    msg = msg.replace(/\{\{userName\}\}/g, '홍길동')
  }
  return msg
})

const buildNoticeFormFromRows = (items: ChatGuideNoticeItem[]): ChatGuideNoticeForm => {
  const base = getEmptyChatGuideNoticeForm()
  const byGuideKey = new Map(items.map((item) => [item.guideKey, item]))

  return {
    feature: byGuideKey.get(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.feature) ?? base.feature,
    guide: byGuideKey.get(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.guide) ?? base.guide,
    privacy: byGuideKey.get(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.privacy) ?? base.privacy,
    limitation: byGuideKey.get(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.limitation) ?? base.limitation,
  }
}

const syncLocalNoticeForm = () => {
  localNoticeForm.value = noticeForm.value ? cloneChatGuideNoticeForm(noticeForm.value) : getEmptyChatGuideNoticeForm()
}

const syncLocalMaintenanceList = () => {
  localMaintenanceList.value = cloneChatGuideMaintenanceList(maintenanceList.value)
}

export const useChatGuideStore = () => {
  const {
    fetchChatGuideGreeting,
    fetchSaveChatGuideGreeting,
    fetchChatGuideNoticeList,
    fetchSaveChatGuideNotice,
    fetchChatGuideErrorMessage,
    fetchSaveChatGuideErrorMessage,
    fetchChatGuideMaintenanceList,
    fetchSaveChatGuideMaintenance,
  } = useChatGuideApi()

  const handleSelectGreeting = async (): Promise<void> => {
    const empty = getEmptyChatGuideGreetingForm()
    try {
      const res = await fetchChatGuideGreeting()
      greetingForm.value = res ?? empty
    } catch (err) {
      greetingForm.value = empty
      throw err
    }
  }

  const handleSaveGreeting = async () => {
    await fetchSaveChatGuideGreeting(greetingForm.value)
  }

  const handleInsertGreetingVariable = () => {
    greetingForm.value.content += '{{userName}}'
  }

  const handleSelectNotice = async (): Promise<void> => {
    try {
      const dataList = await fetchChatGuideNoticeList()
      noticeForm.value = buildNoticeFormFromRows(dataList ?? [])
      syncLocalNoticeForm()
    } catch (err) {
      noticeForm.value = null
      syncLocalNoticeForm()
      throw err
    }
  }

  const handleSaveNotice = async (payload: ChatGuideNoticeForm) => {
    await fetchSaveChatGuideNotice(payload)
    noticeForm.value = cloneChatGuideNoticeForm(payload)
    syncLocalNoticeForm()
  }

  const handleSelectErrorMessageData = async (): Promise<void> => {
    try {
      const dataList = await fetchChatGuideErrorMessage()
      errorMessageData.value = normalizeChatGuideErrorData(dataList)
    } catch (err) {
      errorMessageData.value = getChatGuideErrorDefaults()
      throw err
    }
  }

  const handleSaveErrorMessage = async (data: ChatGuideErrorData) => {
    await fetchSaveChatGuideErrorMessage(data)
    await handleSelectErrorMessageData()
  }

  const handleSelectMaintenance = async (): Promise<void> => {
    try {
      const res = await fetchChatGuideMaintenanceList()
      maintenanceList.value = res.length === 0 ? getEmptyChatGuideMaintenanceList() : cloneChatGuideMaintenanceList(res)
      syncLocalMaintenanceList()
    } catch (err) {
      maintenanceList.value = getEmptyChatGuideMaintenanceList()
      syncLocalMaintenanceList()
      throw err
    }
  }

  const handleSaveMaintenance = async (payload: ChatGuideMaintenanceItem[]) => {
    await fetchSaveChatGuideMaintenance(payload)
    maintenanceList.value = cloneChatGuideMaintenanceList(payload)
    syncLocalMaintenanceList()
  }

  /** 인사멘트 — 미리보기 이름 자동 치환 토글 */
  const handleToggleGreetingPreviewAutoName = (v: boolean) => {
    greetingPreviewAutoNameYn.value = toYn(v)
  }

  return {
    greetingForm,
    greetingPreviewAutoNameYn,
    localNoticeForm,
    localMaintenanceList,
    errorMessageData,
    chatGuideNoticeConditionOptions: CHAT_GUIDE_NOTICE_CONDITION_OPTIONS,
    previewGreetingMessage,
    handleSelectGreeting,
    handleInsertGreetingVariable,
    handleSaveGreeting,
    handleToggleGreetingPreviewAutoName,
    handleSelectNotice,
    handleSaveNotice,
    handleSelectMaintenance,
    handleSelectErrorMessageData,
    handleSaveErrorMessage,
    handleSaveMaintenance,
  }
}
