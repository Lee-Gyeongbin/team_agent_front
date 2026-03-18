// 인사말 설정 폼 (챗봇 첫 진입 시 안내 문구)
export interface ChatGreetingForm {
  isEnabled: boolean
  message: string
  isAutoName: boolean
}

// 공통 안내 문구 아이템 (공지/가이드/제한 등 기본 구조)
export interface ChatNoticeItem {
  isEnabled: boolean
  message: string
}

// 기능 안내 문구 아이템 (특정 기능 사용 조건 포함)
export interface ChatNoticeFeatureItem extends ChatNoticeItem {
  condition: string
}

// 개인정보 안내 문구 아이템 (자동 탐지 옵션 포함)
export interface ChatNoticePrivacyItem extends ChatNoticeItem {
  isAutoDetect: boolean
}

// 챗봇 안내/주의사항 전체 폼
export interface ChatNoticeForm {
  feature: ChatNoticeFeatureItem
  guide: ChatNoticeItem
  privacy: ChatNoticePrivacyItem
  limitation: ChatNoticeItem
}

// 장애 유형 정의
export interface ChatMaintenanceIncidentType {
  key: string
  icon: string
  label: string
  message: string
}

// 점검/장애 안내 설정 폼
export interface ChatMaintenanceForm {
  emergency: {
    isEnabled: boolean
    title: string
    message: string
    startDate: unknown
    endDate: unknown
  }
  scheduled: {
    isEnabled: boolean
    startDate: unknown
    endDate: unknown
    message: string
    advanceNotice: string
  }
  incident: {
    isEnabled: boolean
    types: ChatMaintenanceIncidentType[]
  }
  recovery: {
    isEnabled: boolean
    message: string
    autoDisplay: boolean
  }
}

// 오류 메시지 설정 (ChatGuide 전용)
export interface ChatGuideErrorMessageItem {
  key: string
  label: string
  message: string
  isEnabled: boolean
  color: string
  maxLength?: number
}

export interface ChatGuideErrorMessageData {
  responseErrors: ChatGuideErrorMessageItem[]
  inputErrors: ChatGuideErrorMessageItem[]
  apiErrors: ChatGuideErrorMessageItem[]
}
