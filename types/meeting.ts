export interface Meeting {
  meetingId: number
  meetingTitle: string
  attendees: string // JSON 배열 [{userId, userNm}]
  status: string // '001':진행중 | '002':종료 | '003':취소
  statusNm: string
  startDt: string
  endDt: string
  createUserId: string
  createDt: string
  integrateYn?: string // 'Y' | 'N'
  showSpeakerYn?: string // 'Y' | 'N' — 결정사항 내 발언자 표시 여부
}

/** 통합 회의록의 원본 회의 항목 */
export interface MeetingIntegrationSource {
  meetingId: number
  meetingTitle: string
  startDt: string
  endDt: string
  status: string
}

export interface MeetingMinutes {
  flatData: string
  editedContent?: string
  generatedContent?: string
  minutesId: number
  meetingId: number
  fullText: string
  createDt: string
  modifyDt: string
}

export interface MeetingSpeaker {
  speakerId: number
  meetingId: number
  speakerLabel: string // 화자1, 화자2 ...
  speakerNm: string // 매핑 후 실명
  speakerUserId: string // 매핑된 userId
  utterances: string // JSON 배열 [{seq, text}]
}

export interface MeetingUser {
  createUserId: string // userId (SQL alias 상 createUserId로 매핑됨)
  userNm: string
}

export interface MeetingDetail {
  meeting: Meeting | null
  minutes: MeetingMinutes | null
  speakers: MeetingSpeaker[]
  infographicList?: MeetingInfographic[]
  userList?: User[]
  integrationSources?: MeetingIntegrationSource[]
}

export interface TodoItem {
  due_date: string
  content: string
  collaborators: string
}

export interface User {
  userId: string
  userNm: string
}

export interface MeetingInfographic {
  infographicId: number
  meetingId: number
  topicNm: string
  topicSummary: string
  treeText: string
  infographicImg: string
  sortOrd: number
  /** 001:대기 002:생성중 003:완료 004:실패 */
  infographicStatus: string
}

export interface SpeechSegment {
  seq: number
  text: string
  speaker?: string
}

/** 화자 분리 전사 세그먼트 */
export interface DiarizedSegment {
  text: string
  speaker: string
  seq?: number
  start?: number
  end?: number
}

// ─── Realtime 전사 관련 ───────────────────────────────────────────

/** 자막 블록 상태 */
export type TranscriptStatus =
  | 'interim' // WebSocket delta 스트리밍 중 (회색, 이탤릭)
  | 'confirmed' // completed 수신 완료 (검정, 정상)
  | 'waiting' // confirmed 후 화자 분리(diarize) 결과 대기 중

/**
 * 실시간 자막 블록
 * - interim  : WebSocket delta 스트리밍 중 (회색, 이탤릭, 흐릿)
 * - confirmed: completed 수신 완료 (검정, 정상)
 * - waiting  : 화자 분리 결과 대기 중 (··· 표시)
 */
export interface TranscriptBlock {
  id: string
  /** OpenAI item_id — delta/completed 이벤트 매핑에 사용 */
  itemId?: string
  status: TranscriptStatus
  text: string
  speaker?: string // 화자 분리 완료 후 채워짐 (화자1, 홍길동 등)
  /** speech_started 이벤트 기준 발화 시작 시각 (ms, 회의 시작 기준) */
  startMs?: number
  /** speech_stopped 이벤트 기준 발화 종료 시각 (ms, 회의 시작 기준) */
  endMs?: number
}

/** item_id별 VAD 타이밍 정보 */
export interface SpeechTiming {
  startMs?: number
  endMs?: number
}

/** 실시간 전사 연결 상태 */
export type TranscriptionConnectionStatus =
  | 'idle'         // 미연결
  | 'connecting'   // 연결 중
  | 'connected'    // 정상 연결
  | 'reconnecting' // 재연결 시도 중 (녹음은 계속됨)
  | 'failed'       // 재연결 한도 초과 (녹음은 계속됨)

// ─── Meeting2 이관 타입 ───────────────────────────────────────────

/** 5단계 진행 상태 */
export type MeetingStepStatus = 'wait' | 'progress' | 'done'
export type MeetingStepKey = 'record' | 'speaker' | 'generate' | 'edit' | 'share'

/** 파일 형식 */
export type MeetingFileFormat = 'docx' | 'pdf' | 'txt' | 'md'

/** 녹음 상태 */
export type RecordStatus = 'idle' | 'recording' | 'paused' | 'stopped'

/** 진행 단계 */
export interface MeetingStep {
  key: MeetingStepKey
  label: string
  status: MeetingStepStatus
}

/** 화자 머지 그룹 (동명이인 머지 시) */
export interface MergeGroup {
  keepSpeakerId: string // 발화를 흡수할 화자 ID
  removeSpeakerIds: string[] // 삭제될 화자 IDs
}

/** 회의록 화면용 화자 정보 */
export interface MeetingViewSpeaker {
  id: string
  name: string
  alias?: string // (나) 같은 표시용 별칭
  colorIndex: number // 0~7 색상 팔레트 인덱스
  /** 참석자(userList) 매핑 시 백엔드 speakerUserId */
  speakerUserId?: string
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
export interface MeetingViewUser {
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

/** 비정상종료 회의 항목 */
export interface AbnormalMeeting {
  meetingId: number
  meetingTitle: string
  startDt: string
  endDt: string
}

/** 회의록 화면용 회의 단건 */
export interface MeetingViewModel {
  id: string
  title: string // 회의명
  date: string // 회의 일시 (YYYY.MM.DD HH:MM ~ HH:MM)
  location?: string // 회의실
  participants: string[] // 참석자 이름 배열
  purpose?: string // 회의 목적
  steps: MeetingStep[] // 진행 단계
  speakers: MeetingViewSpeaker[] // 화자 목록
  sttList: MeetingSttItem[] // 실시간 STT 발화 리스트
  minutesContent: string // WYSIWYG 회의록 본문 (HTML)
  fileFormat: MeetingFileFormat // 선택된 파일 형식
  recipients: MeetingRecipient[] // 메일 발송 대상
  templateId: string // 회의록 템플릿 ID
  language: string // STT 언어 (ko, en, ja 등)
  createdAt: string
  updatedAt: string
  status: string
  integrateYn: string // 'Y' | 'N' — 통합 회의록 여부
  showSpeakerYn: string // 'Y' | 'N' — 결정사항 내 발언자 표시 여부
}
