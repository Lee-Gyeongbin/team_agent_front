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
  cloneChatGuideErrorData,
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

const syncLocalErrorMessageData = () => {
  localErrorMessageData.value = cloneChatGuideErrorData(errorMessageData.value)
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

  const handleSelectGreeting = async () => {
    try {
      const res = await fetchChatGuideGreeting()
      greetingForm.value = res ?? getEmptyChatGuideGreetingForm()
    } catch {
      openToast({ message: '인사멘트 설정 조회 실패', type: 'error' })
      greetingForm.value = getEmptyChatGuideGreetingForm()
    }
  }

  const handleSaveGreeting = async () => {
    await fetchSaveChatGuideGreeting(greetingForm.value)
  }

  const handleInsertGreetingVariable = () => {
    greetingForm.value.content += '{{userName}}'
  }

  const handleSelectNotice = async () => {
    try {
      const dataList = await fetchChatGuideNoticeList()
      noticeForm.value = buildNoticeFormFromRows(dataList ?? [])
      syncLocalNoticeForm()
    } catch {
      openToast({ message: '안내멘트 설정 조회 실패', type: 'error' })
      noticeForm.value = null
      syncLocalNoticeForm()
    }
  }

  const handleSaveNotice = async (payload: ChatGuideNoticeForm) => {
    await fetchSaveChatGuideNotice(payload)
    noticeForm.value = cloneChatGuideNoticeForm(payload)
    syncLocalNoticeForm()
  }

  const handleSelectErrorMessage = async () => {
    try {
      const data = await fetchChatGuideErrorMessage()
      errorMessageData.value = data ? cloneChatGuideErrorData(data) : getChatGuideErrorDefaults()
      syncLocalErrorMessageData()
    } catch {
      openToast({ message: '오류 메시지 설정 조회 실패', type: 'error' })
      errorMessageData.value = getChatGuideErrorDefaults()
      syncLocalErrorMessageData()
    }
  }

  const handleSaveErrorMessage = async (payload: ChatGuideErrorData) => {
    await fetchSaveChatGuideErrorMessage(payload)
    errorMessageData.value = cloneChatGuideErrorData(payload)
    syncLocalErrorMessageData()
  }

  const handleSelectMaintenance = async () => {
    try {
      const dataList = await fetchChatGuideMaintenanceList()
      maintenanceList.value =
        dataList.length === 0 ? getEmptyChatGuideMaintenanceList() : cloneChatGuideMaintenanceList(dataList)
      syncLocalMaintenanceList()
    } catch {
      openToast({ message: '점검/장애 설정 조회 실패', type: 'error' })
      maintenanceList.value = getEmptyChatGuideMaintenanceList()
      syncLocalMaintenanceList()
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

  const handleConfirmSaveGreeting = () => {
    openConfirm({
      title: '인사멘트 저장',
      message: '변경된 인사멘트 내용을 저장하시겠습니까?',
      onConfirm: async () => {
        try {
          await handleSaveGreeting()
          openToast({ message: '저장되었습니다.', type: 'success' })
        } catch {
          openToast({ message: '인사멘트 설정 저장 실패', type: 'error' })
        }
      },
    })
  }

  const handleConfirmResetGreeting = () => {
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

  const handleConfirmSaveNotice = () => {
    openConfirm({
      title: '안내멘트 저장',
      message: '변경된 안내멘트 내용을 저장하시겠습니까?',
      onConfirm: async () => {
        try {
          await handleSaveNotice(localNoticeForm.value)
          openToast({ message: '저장되었습니다.', type: 'success' })
        } catch {
          openToast({ message: '안내멘트 설정 저장 실패', type: 'error' })
        }
      },
    })
  }

  const handleConfirmResetNotice = () => {
    openConfirm({
      title: '안내멘트 초기화',
      message:
        '초기화 시 변경된 안내멘트 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
      onConfirm: async () => {
        await handleSelectNotice()
        openToast({ message: '안내멘트 설정이 초기화되었습니다.', type: 'info' })
      },
    })
  }

  const handleConfirmSaveErrorMessage = () => {
    openConfirm({
      title: '오류 메시지 저장',
      message: '변경된 오류 메시지 내용을 저장하시겠습니까?',
      onConfirm: async () => {
        try {
          await handleSaveErrorMessage(localErrorMessageData.value)
          openToast({ message: '저장되었습니다.', type: 'success' })
        } catch {
          openToast({ message: '오류 메시지 설정 저장 실패', type: 'error' })
        }
      },
    })
  }

  const handleConfirmResetErrorMessage = () => {
    openConfirm({
      title: '오류 메시지 초기화',
      message:
        '초기화 시 변경된 오류 메시지 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
      onConfirm: async () => {
        await handleSelectErrorMessage()
        openToast({ message: '오류 메시지 설정이 초기화되었습니다.', type: 'info' })
      },
    })
  }

  const handleConfirmSaveMaintenance = () => {
    openConfirm({
      title: '점검/장애 안내 저장',
      message: '변경된 점검/장애 안내 내용을 저장하시겠습니까?',
      onConfirm: async () => {
        try {
          await handleSaveMaintenance(localMaintenanceList.value)
          openToast({ message: '저장되었습니다.', type: 'success' })
        } catch {
          openToast({ message: '점검/장애 안내 설정 저장 실패', type: 'error' })
        }
      },
    })
  }

  const handleConfirmResetMaintenance = () => {
    openConfirm({
      title: '점검/장애 안내 초기화',
      message:
        '초기화 시 변경된 점검/장애 안내 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
      onConfirm: async () => {
        await handleSelectMaintenance()
        openToast({ message: '점검/장애 안내 설정이 초기화되었습니다.', type: 'info' })
      },
    })
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
    chatGuideNoticeConditionOptions: CHAT_GUIDE_NOTICE_CONDITION_OPTIONS,
    previewGreetingMessage,
    handleSelectGreeting,
    handleSaveGreeting,
    handleInsertGreetingVariable,
    handleToggleGreetingPreviewAutoName,
    handleConfirmSaveGreeting,
    handleConfirmResetGreeting,
    handleSelectNotice,
    handleSaveNotice,
    handleConfirmSaveNotice,
    handleConfirmResetNotice,
    handleSelectMaintenance,
    handleSaveMaintenance,
    handleConfirmSaveMaintenance,
    handleConfirmResetMaintenance,
    handleSelectErrorMessage,
    handleSaveErrorMessage,
    handleConfirmSaveErrorMessage,
    handleConfirmResetErrorMessage,
    syncLocalNoticeForm,
    syncLocalMaintenanceList,
    syncLocalErrorMessageData,
  }
}
