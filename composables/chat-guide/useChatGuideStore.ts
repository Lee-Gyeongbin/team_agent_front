import { ref, computed } from 'vue'
import type {
  ChatGreetingForm,
  ChatNoticeForm,
  ChatMaintenanceForm,
  ChatGuideErrorMessageData,
  ChatGuideErrorMessageItem,
} from '~/types/chat-guide'
import { useChatGuideApi } from '~/composables/chat-guide/useChatGuideApi'

const defaultGreetingMessage =
  '안녕하세요! TeamAgent AI 어시스턴트입니다. 😊\n\n무엇을 도와드릴까요?\n업무 관련 질문, 문서 검색, 데이터 분석 등\n다양한 기능을 제공합니다.'

const getDefaultGreetingForm = (): ChatGreetingForm => ({
  isEnabled: false,
  message: defaultGreetingMessage,
  isAutoName: true,
})

const getDefaultNoticeForm = (): ChatNoticeForm => ({
  feature: {
    isEnabled: true,
    message:
      'TeamAgent는 다음과 같은 기능을 제공합니다:\n\n📋 일반 질의응답 · 업무 관련 질문에 답변드립니다\n📄 문서 검색(RAG) · 업로드된 문서에서 정보를 찾아드립니다\n📊 데이터 분석(SQL) · 데이터베이스 조회 및 분석을 지원합니다',
    condition: 'keyword',
  },
  guide: {
    isEnabled: true,
    message:
      '더 정확한 답변을 위한 질문 팁:\n\n✅ 구체적으로 질문해주세요\n  예: "지난주 매출은?" → "2024년 1월 15일~21일 매출 현황을 알려줘"',
  },
  privacy: {
    isEnabled: true,
    message:
      '🔒 개인정보 보호 안내\n\n주민등록번호, 신용카드 번호, 비밀번호 등 민감한 개인정보는 입력하지 말아주세요.\n모든 대화 내용은 암호화되어 저장되며, 보안 정책에 따라 관리됩니다.',
    isAutoDetect: true,
  },
  limitation: {
    isEnabled: true,
    message:
      'ℹ️ AI 어시스턴트의 한계\n\n• 2024년 1월까지의 데이터를 기반으로 답변합니다\n• 실시간 정보나 최신 뉴스는 제공하지 못할 수 있습니다\n• 복잡한 계산이나 전문적인 법률/의료 상담은 전문가와 상담하세요',
  },
})

const getDefaultMaintenanceForm = (): ChatMaintenanceForm => ({
  emergency: {
    isEnabled: false,
    title: '',
    message: '',
    startDate: undefined,
    endDate: undefined,
  },
  scheduled: {
    isEnabled: false,
    startDate: undefined,
    endDate: undefined,
    message: '🔧 정기 점검 안내\n일시: 2024년 2월 15일 (목) 02:00 - 04:00\n내용: 시스템 성능 개선 및 보안 업데이트',
    advanceNotice: '24h',
  },
  incident: {
    isEnabled: false,
    types: [
      {
        key: 'partial',
        icon: '⚡',
        label: '일부 기능 장애',
        message: '현재 일부 기능에 장애가 발생했습니다.\n불편을 드려 죄송하며, 빠른 시간 내에 복구하겠습니다.',
      },
      {
        key: 'full',
        icon: '🔥',
        label: '전체 서비스 장애',
        message:
          '현재 전체 서비스에 장애가 발생하여 이용이 제한됩니다.\n\n복구 작업이 진행 중이며, 완료 시 공지드리겠습니다.\n불편을 드려 대단히 죄송합니다.',
      },
      {
        key: 'network',
        icon: '🌐',
        label: '네트워크 장애',
        message: '네트워크 연결에 문제가 있습니다.\n인터넷 연결 상태를 확인해주세요.',
      },
    ],
  },
  recovery: {
    isEnabled: true,
    message:
      '✅ 서비스가 정상적으로 복구되었습니다!\n\n이용에 불편을 드려 죄송했습니다.\n안정적인 서비스를 위해 최선을 다하겠습니다.',
    autoDisplay: true,
  },
})

const getDefaultErrorMessageData = (): ChatGuideErrorMessageData => ({
  // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
  responseErrors: [
    {
      key: 'generate-fail',
      label: '답변 생성 실패',
      message:
        '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.\n\n• 질문을 다시 작성해보시거나\n• 더 구체적으로 질문해주시면 도움이 됩니다.',
      isEnabled: true,
      color: '#ef4444',
    },
    {
      key: 'no-search-result',
      label: '검색 결과 없음',
      message:
        '요청하신 정보를 찾을 수 없습니다. 🔍\n\n• 다른 키워드로 다시 검색해보세요\n• 관리자에게 문의하시면 도움을 받으실 수 있습니다.',
      isEnabled: true,
      color: '#ef4444',
    },
  ],
  inputErrors: [
    {
      key: 'empty-message',
      label: '빈 메시지 입력',
      message: '메시지를 입력해주세요.\n무엇을 도와드릴까요?',
      isEnabled: true,
      color: '#3b82f6',
    },
    {
      key: 'message-length',
      label: '메시지 길이 초과',
      message: '입력하신 메시지가 너무 깁니다. (최대 2,000자)\n내용을 나누어서 질문해주세요.',
      isEnabled: true,
      color: '#3b82f6',
      maxLength: 2000,
    },
    {
      key: 'file-upload-fail',
      label: '파일 업로드 실패',
      message: '파일 업로드에 실패했습니다. 🗂\n파일 형식과 크기를 확인해주세요. (지원: PDF, DOCX, TXT / 최대 10MB)',
      isEnabled: true,
      color: '#3b82f6',
    },
  ],
  apiErrors: [
    {
      key: '500',
      label: '500 Internal Server Error',
      message:
        '죄송합니다. 일시적인 서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.',
      isEnabled: true,
      color: '#ef4444',
    },
    {
      key: '429',
      label: '429 Too Many Requests',
      message: '요청이 너무 많습니다. ⏳\n잠시 후 다시 시도해주세요. (대기 시간: 약 1분)',
      isEnabled: true,
      color: '#f97316',
    },
    {
      key: '408',
      label: '408 Request Timeout',
      message: '요청 시간이 초과되었습니다.\n네트워크 상태를 확인하시고 다시 시도해주세요.',
      isEnabled: true,
      color: '#eab308',
    },
    {
      key: '401',
      label: '401/403 Unauthorized',
      message: '접근 권한이 없습니다. 🔒\n로그인 상태를 확인하거나 관리자에게 권한을 요청해주세요.',
      isEnabled: true,
      color: '#f97316',
    },
  ],
})

const greetingForm = ref<ChatGreetingForm>(getDefaultGreetingForm())
const noticeForm = ref<ChatNoticeForm>(getDefaultNoticeForm())
const maintenanceForm = ref<ChatMaintenanceForm>(getDefaultMaintenanceForm())
const errorMessageData = ref<ChatGuideErrorMessageData>(getDefaultErrorMessageData())

const conditionOptions = [
  { label: '사용자가 "기능" 또는 "도움말" 입력 시', value: 'keyword' },
  { label: '첫 방문 시 자동 표시', value: 'first_visit' },
  { label: '항상 표시', value: 'always' },
]

const advanceNoticeOptions = [
  { label: '점검 1시간 전부터', value: '1h' },
  { label: '점검 6시간 전부터', value: '6h' },
  { label: '점검 12시간 전부터', value: '12h' },
  { label: '점검 24시간 전부터', value: '24h' },
  { label: '점검 48시간 전부터', value: '48h' },
]

const previewGreetingMessage = computed(() => {
  let msg = greetingForm.value.message
  if (greetingForm.value.isAutoName) {
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
    fetchSelectMaintenance,
    fetchSaveMaintenance,
    fetchSelectErrorMessage,
    fetchSaveErrorMessage,
  } = useChatGuideApi()

  const handleSelectGreeting = async () => {
    try {
      const res = await fetchSelectGreeting()
      greetingForm.value = res
    } catch {
      openToast({ message: '인사말 설정 조회 실패', type: 'error' })
      greetingForm.value = getDefaultGreetingForm()
    }
  }

  const handleSaveGreeting = async () => {
    await fetchSaveGreeting(greetingForm.value)
  }

  const handleResetGreeting = async () => {
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
    greetingForm.value.message += '{{userName}}'
  }

  const handleSelectNotice = async () => {
    try {
      const res = await fetchSelectNotice()
      noticeForm.value = res
    } catch {
      openToast({ message: '안내멘트 설정 조회 실패', type: 'error' })
      noticeForm.value = getDefaultNoticeForm()
    }
  }

  const handleSaveNotice = async () => {
    await fetchSaveNotice(noticeForm.value)
  }

  const handleResetNotice = async () => {
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

  const handleSelectMaintenance = async () => {
    try {
      const res = await fetchSelectMaintenance()
      maintenanceForm.value = res
    } catch {
      openToast({ message: '점검/장애 안내 설정 조회 실패', type: 'error' })
      maintenanceForm.value = getDefaultMaintenanceForm()
    }
  }

  const handleSaveMaintenance = async () => {
    await fetchSaveMaintenance(maintenanceForm.value)
  }

  const handleResetMaintenance = async () => {
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

  const cloneErrorItems = (items: ChatGuideErrorMessageItem[]) => items.map((e) => ({ ...e }))

  const handleSelectErrorMessage = async () => {
    try {
      const res = await fetchSelectErrorMessage()
      errorMessageData.value = {
        responseErrors: cloneErrorItems(res.responseErrors),
        inputErrors: cloneErrorItems(res.inputErrors),
        apiErrors: cloneErrorItems(res.apiErrors),
      }
    } catch {
      openToast({ message: '오류 메시지 설정 조회 실패', type: 'error' })
      errorMessageData.value = getDefaultErrorMessageData()
    }
  }

  const handleSaveErrorMessage = async (data: ChatGuideErrorMessageData) => {
    const res = await fetchSaveErrorMessage(data)
    errorMessageData.value = {
      responseErrors: cloneErrorItems(res.responseErrors),
      inputErrors: cloneErrorItems(res.inputErrors),
      apiErrors: cloneErrorItems(res.apiErrors),
    }
  }

  const handleResetErrorMessage = async () => {
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

  return {
    greetingForm,
    noticeForm,
    maintenanceForm,
    errorMessageData,
    conditionOptions,
    advanceNoticeOptions,
    previewGreetingMessage,
    handleSelectGreeting,
    handleSaveGreeting,
    handleResetGreeting,
    handleInsertGreetingVariable,
    handleSelectNotice,
    handleSaveNotice,
    handleResetNotice,
    handleSelectMaintenance,
    handleSaveMaintenance,
    handleResetMaintenance,
    handleSelectErrorMessage,
    handleSaveErrorMessage,
    handleResetErrorMessage,
  }
}
