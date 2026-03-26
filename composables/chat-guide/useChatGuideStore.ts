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
  getChatGuideErrorDefaults,
  getEmptyChatGuideGreetingForm,
  getEmptyChatGuideMaintenanceList,
  getEmptyChatGuideNoticeForm,
} from '~/types/chat-guide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

// ============================================
// 챗가이드 상태 (composable store)
// ============================================

/** 챗가이드 모듈 상태 (composable store 패턴, 모듈 레벨 공유) */
const greetingForm = ref<ChatGuideGreetingForm>(getEmptyChatGuideGreetingForm())
const greetingPreviewAutoNameYn = ref<'Y' | 'N'>('Y')
const localNoticeForm = ref<ChatGuideNoticeForm>(getEmptyChatGuideNoticeForm())
const localMaintenanceList = ref<ChatGuideMaintenanceItem[]>(getEmptyChatGuideMaintenanceList())
const errorMessageData = ref<ChatGuideErrorData>(getChatGuideErrorDefaults())

export const toYn = (value: boolean): 'Y' | 'N' => (value ? 'Y' : 'N')

// API 응답과 기본 템플릿 병합 (빈 배열이면 기본값 유지)
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

// noticeList 행 배열 → 블록별 폼 (guideKey 매핑)
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
    await handleSelectGreeting()
  }

  const handleInsertGreetingVariable = () => {
    greetingForm.value.content += '{{userName}}'
  }

  const handleSelectNotice = async (): Promise<void> => {
    try {
      const dataList = await fetchChatGuideNoticeList()
      localNoticeForm.value = buildNoticeFormFromRows(dataList ?? [])
    } catch (err) {
      localNoticeForm.value = getEmptyChatGuideNoticeForm()
      throw err
    }
  }

  const handleSaveNotice = async (payload: ChatGuideNoticeForm) => {
    await fetchSaveChatGuideNotice(payload)
    await handleSelectNotice()
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
      localMaintenanceList.value =
        res.length === 0 ? getEmptyChatGuideMaintenanceList() : cloneChatGuideMaintenanceList(res)
    } catch (err) {
      localMaintenanceList.value = getEmptyChatGuideMaintenanceList()
      throw err
    }
  }

  const handleSaveMaintenance = async (payload: ChatGuideMaintenanceItem[]) => {
    await fetchSaveChatGuideMaintenance(payload)
    await handleSelectMaintenance()
  }

  /** 인사멘트 미리보기 — 이름 자동 치환 토글 */
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
