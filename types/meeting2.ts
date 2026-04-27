/** 회의록 도메인 타입 정의 */

/** 5단계 진행 상태 */
export type MeetingStepStatus = 'wait' | 'progress' | 'done'
export type MeetingStepKey = 'record' | 'speaker' | 'generate' | 'edit' | 'share'

/** 파일 형식 */
export type MeetingFileFormat = 'docx' | 'pdf' | 'hwp' | 'txt' | 'md'

/** 녹음 상태 */
export type RecordStatus = 'idle' | 'recording' | 'paused' | 'stopped'

/** 진행 단계 */
export interface MeetingStep {
  key: MeetingStepKey
  label: string
  status: MeetingStepStatus
}

/** 화자 정보 */
export interface MeetingSpeaker {
  id: string
  name: string
  alias?: string // (나) 같은 표시용 별칭
  colorIndex: number // 0~7 색상 팔레트 인덱스
}

/** 실시간 STT 발화 항목 */
export interface MeetingSttItem {
  id: string
  speakerId: string
  speakerName: string
  time: string // HH:MM:SS
  text: string
}

/** 메일 수신자 */
export interface MeetingRecipient {
  id: string
  name: string
  email?: string
}

/** 사용자 (메일 발송 대상 검색용) */
export interface MeetingUser {
  id: string
  name: string
  email: string
  dept: string
}

/** 파일 저장 폼 */
export interface MeetingFileSaveForm {
  format: MeetingFileFormat
  fileName: string
}

/** 회의 단건 */
export interface Meeting {
  id: string
  title: string // 회의명
  date: string // 회의 일시 (YYYY.MM.DD HH:MM ~ HH:MM)
  location?: string // 회의실
  participants: string[] // 참석자 이름 배열
  purpose?: string // 회의 목적
  steps: MeetingStep[] // 진행 단계
  speakers: MeetingSpeaker[] // 화자 목록
  sttList: MeetingSttItem[] // 실시간 STT 발화 리스트
  minutesContent: string // WYSIWYG 회의록 본문 (HTML)
  fileFormat: MeetingFileFormat // 선택된 파일 형식
  recipients: MeetingRecipient[] // 메일 발송 대상
  templateId: string // 회의록 템플릿 ID
  language: string // STT 언어 (ko, en, ja 등)
  createdAt: string
  updatedAt: string
}
