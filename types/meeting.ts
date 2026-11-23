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
  /** 비정상 종료 여부 — 이탈 표시(Y) 또는 녹음 중 heartbeat 가 3분 넘게 끊김 */
  abnormalYn?: string // 'Y' | 'N'
  /** 녹음 일시정지 여부 — 이어서 녹음하면 N 으로 돌아감 */
  pauseYn?: string // 'Y' | 'N'
  /** 회의록 양식 코드 (TB_MEETING_TMPL) — null 이면 기본 양식으로 생성됨 */
  minutesTmplCd?: string | null
  /** 문체 — null 이면 양식 기본 문체 */
  minutesToneCd?: MeetingMinutesToneCd | null
  /** 분량 — null 이면 normal */
  minutesLengthCd?: MeetingMinutesLengthCd | null
}

/** 회의록 문체: 개조식 / 서술형 / 경어체 */
export type MeetingMinutesToneCd = 'bullet' | 'plain' | 'polite'
/** 회의록 분량: 표준 / 상세 */
export type MeetingMinutesLengthCd = 'normal' | 'long'

/** 회의록 양식 (TB_MEETING_TMPL + TB_TMPL) */
export interface MeetingMinutesTmpl {
  minutesTmplCd: string
  tmplId: string
  tmplNm: string
  tmplDescription?: string
  recommendTxt?: string
  defaultToneCd: MeetingMinutesToneCd
  defaultYn: string // 'Y' | 'N'
  sortOrd: number
  /** 양식 구성 (필드명, 정렬순) */
  fieldNmList: string[]
}

/** 회의록 양식 목록 응답 */
export interface MeetingMinutesTmplListResponse {
  successYn: boolean
  returnMsg?: string
  list: MeetingMinutesTmpl[]
}

/** 회의록 생성 시작 요청 — "회의록 생성" / "이 양식으로 다시 생성" (양식을 안 보내면 회의에 저장된 값) */
export interface MeetingStartMinutesParams {
  meetingId: number
  minutesTmplCd?: string
  minutesToneCd?: MeetingMinutesToneCd
  minutesLengthCd?: MeetingMinutesLengthCd
}

/** 회의록 생성 시작 응답 */
export interface MeetingStartMinutesResponse {
  successYn: boolean
  returnMsg?: string
  state?: MeetingMinutesState
}

/**
 * 회의록 생성 상태
 * - none: 화자 분리 전 / diarized: 생성 대기 / processing: 생성 중 / done: 완료 / error: 실패
 */
export type MeetingMinutesState = 'none' | 'diarized' | 'processing' | 'done' | 'error'

/** 회의록 생성 상태 응답 — done 이면 회의록 · 회의 정보 포함 */
export interface MeetingMinutesStatusResponse {
  successYn: boolean
  returnMsg?: string
  state: MeetingMinutesState
  step?: string
  message?: string
  minutes?: MeetingMinutes | null
  meeting?: Meeting | null
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

/** TB_MEETING_VOICE_ENROLLMENT — NCP 경로/상태. Embedding은 AI 메모리 캐시 */
export interface MeetingVoiceEnrollment {
  meetingId: number
  speakerId: number
  speakerNm: string
  speakerUserId?: string
  filePath?: string
  originalFilename?: string
  fileExt?: string
  fileSize?: number
  /** 001:대기 002:처리중 003:완료 004:실패 */
  status: string
  errorMsg?: string
}

export interface MeetingUser {
  createUserId: string // userId (SQL alias 상 createUserId로 매핑됨)
  userNm: string
}

/** 회의 시작 모달 — 조직 트리에 붙는 사용자 */
export interface MeetingAttendeeUserItem {
  userId: string
  userNm: string
}

/** 회의 시작 모달 — 부서 + 소속 사용자 트리 노드 */
export interface MeetingAttendeeOrgNode {
  orgId: string
  orgNm: string
  expanded: boolean
  children: MeetingAttendeeOrgNode[]
  users: MeetingAttendeeUserItem[]
}

export interface MeetingDetail {
  meeting: Meeting | null
  minutes: MeetingMinutes | null
  speakers: MeetingSpeaker[]
  infographicList?: MeetingInfographic[]
  userList?: User[]
  integrationSources?: MeetingIntegrationSource[]
  /** 서버에 백업된 녹음 조각 번호 (backup_N.webm 의 N, 오름차순) */
  backupIndexes?: number[]
  backupCnt?: number
  /** 이어서 녹음할 때 다음 조각 번호 (마지막 번호 + 1, 중간이 비어도 덮어쓰지 않음) */
  backupNextIndex?: number
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
  | 'idle' // 미연결
  | 'connecting' // 연결 중
  | 'connected' // 정상 연결
  | 'reconnecting' // 재연결 시도 중 (녹음은 계속됨)
  | 'failed' // 재연결 한도 초과 (녹음은 계속됨)

// ─── Meeting2 이관 타입 ───────────────────────────────────────────

/** 6단계 진행 상태 */
/** skipped: 음성 등록을 마치지 않고 건너뜀 (voiceEnroll 단계 전용) */
export type MeetingStepStatus = 'wait' | 'progress' | 'done' | 'skipped'
/** 상세 화면 5단계 — CMB 와 같이 '회의록 생성' 화면에서 편집까지 한다 */
export type MeetingStepKey = 'voiceEnroll' | 'record' | 'speaker' | 'generate' | 'share'

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
  /** 실시간 STT 에서 아직 인식 중(확정 전)인 문장 */
  isLive?: boolean
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

/** 녹음 백업 조각 (구간 번호는 0부터, 파일명 구간 번호는 1부터) */
export interface MeetingBackupSegment {
  index: number
  blob: Blob
  error?: unknown
}

/** 회의록 화면용 회의 단건 */
export interface MeetingViewModel {
  id: string
  title: string // 회의명
  date: string // 회의 일시 (YYYY.MM.DD HH:MM ~ HH:MM)
  location?: string // 회의실
  participants: string[] // 참석자 이름 배열
  purpose?: string // 회의 목적
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
  abnormalYn: string // 'Y' | 'N' — 비정상 종료 여부 (상세 조회 시점)
  pauseYn: string // 'Y' | 'N' — 녹음 일시정지 여부 (상세 조회 시점)
}
