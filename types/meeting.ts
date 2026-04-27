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
}

export interface MeetingMinutes {
  minutesId: number
  meetingId: number
  fullText: string
  summary: string
  decisions: string // JSON 배열 문자열
  todoList: string // JSON 배열 문자열 [{due_date, content, collaborators}]
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
}

export interface TodoItem {
  due_date: string
  content: string
  collaborators: string
}

export interface MeetingInfographic {
  infographicId: number
  meetingId: number
  topicNm: string
  topicSummary: string
  treeText: string
  infographicImg: string
  sortOrd: number
}

export interface SpeechSegment {
  seq: number
  text: string
  speaker?: string
}

// ─── Realtime 전사 관련 ───────────────────────────────────────────

/** 자막 블록 상태 */
export type TranscriptStatus = 'interim' | 'waiting' | 'confirmed'

/**
 * 실시간 자막 블록
 * - interim: WebSocket delta 스트리밍 중 (회색, 이탤릭, 흐릿)
 * - waiting: completed 이후 diarize 대기 중 (회색, 이탤릭)
 * - confirmed: diarize 완료, 화자 레이블 확정 (검정, 정상)
 */
export interface TranscriptBlock {
  id: string
  status: TranscriptStatus
  text: string
  speaker?: string // confirmed 블록에만 존재 (A, B, C ...)
}

/** diarize API 응답의 segment 단위 */
export interface DiarizedSegment {
  speaker?: string
  text: string
  start: number
  end: number
}
