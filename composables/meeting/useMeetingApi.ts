import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type {
  Meeting as ApiMeeting,
  MeetingDetail,
  MeetingUser as ApiMeetingUser,
  SpeechSegment,
} from '~/types/meeting'
import type { Meeting, MeetingSpeaker, MeetingUser } from '~/types/meeting2'

// 🔽 Mock — 백엔드 API 없는 항목만 유지 (실제 엔드포인트 완성 시 useApi 패턴으로 교체)
const MOCK_BASE = '/mock/meeting'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useMeetingApi = () => {
  const { get, post } = useApi()

  /** 참석자 선택용 사용자 목록 */
  const fetchUserList = async (): Promise<{ list: ApiMeetingUser[] }> => {
    return get<{ list: ApiMeetingUser[] }>('/ai/meeting/selectUserList.do')
  }

  /** 회의 목록 조회 */
  const fetchMeetingList = async (): Promise<{ list: ApiMeeting[] }> => {
    return get<{ list: ApiMeeting[] }>('/ai/meeting/selectMeetingList.do')
  }

  /** 회의 상세 + 회의록 + 화자 목록 조회 */
  const fetchMeetingDetail = async (meetingId: number): Promise<MeetingDetail> => {
    return get<MeetingDetail>(`/ai/meeting/selectMeetingDetail.do?meetingId=${meetingId}`)
  }

  /** 회의 저장 (신규/수정) — 백엔드 API 없음, Mock 유지 */
  const fetchSaveMeeting = async (meeting: Partial<Meeting>): Promise<{ data: Meeting }> => {
    // TODO: 백엔드 API 연동 필요 (/ai/meeting/saveMeeting.do 예정)
    return mockPost<{ data: Meeting }>(`${MOCK_BASE}/save`, meeting)
  }

  /** 회의 시작 */
  const fetchCreateMeeting = async (params: {
    meetingTitle: string
    attendees: string
    isAutoTitle: 'Y' | 'N'
  }): Promise<{ successYn: boolean; meetingId: number }> => {
    return post<{ successYn: boolean; meetingId: number }>('/ai/meeting/createMeeting.do', params)
  }

  /** 회의 종료 + 회의록 생성 + 화자 분리 */
  const fetchFinishMeeting = async (params: {
    meetingId: number
    fullText: string
    segments: SpeechSegment[]
  }): Promise<{ successYn: boolean }> => {
    return post<{ successYn: boolean }>('/ai/meeting/finishMeeting.do', {
      ...params,
      segments: JSON.stringify(params.segments),
    })
  }

  /**
   * 회의 종료 (오디오 파일 전사 버전)
   * - 오디오 Blob을 multipart/form-data로 전송
   * - 백엔드에서 gpt-4o-mini-transcribe 전사 후 회의록 생성
   */
  const fetchFinishMeetingWithAudio = async (params: {
    meetingId: number
    audioBlob: Blob
    segments: SpeechSegment[]
  }): Promise<{ successYn: boolean; returnMsg?: string }> => {
    const formData = new FormData()
    formData.append('meetingId', String(params.meetingId))
    formData.append('audioFile', params.audioBlob, 'meeting.webm')
    formData.append('segments', JSON.stringify(params.segments ?? []))

    return useApi_multipart<{ successYn: boolean; returnMsg?: string }>('/api/ai/meeting/finishMeetingWithAudio.do', {
      method: 'POST',
      body: formData,
    })
  }

  /** 화자-참석자 매핑 저장 */
  const fetchSaveSpeakerMapping = async (params: {
    speakerId: number
    speakerNm: string
    speakerUserId: string
  }): Promise<{ successYn: boolean }> => {
    return post<{ successYn: boolean }>('/ai/meeting/saveSpeakerMapping.do', params)
  }

  /** 화자 정보 저장 (단건 — 색상/별칭) — 백엔드 API 없음 */
  const fetchSaveSpeaker = async (
    meetingId: string,
    speaker: Partial<MeetingSpeaker>,
  ): Promise<{ data: MeetingSpeaker }> => {
    // TODO: 백엔드 API 연동 필요
    return mockPost<{ data: MeetingSpeaker }>(`${MOCK_BASE}/speaker/save`, { meetingId, speaker })
  }

  /** 화자 일괄 저장 — saveSpeakerMapping을 화자 수만큼 병렬 호출 */
  const fetchSaveSpeakers = async (
    speakers: Array<{ speakerId: number; speakerNm: string; speakerUserId: string }>,
  ): Promise<{ successYn: boolean }> => {
    await Promise.all(speakers.map((s) => post<{ successYn: boolean }>('/ai/meeting/saveSpeakerMapping.do', s)))
    return { successYn: true }
  }

  /** 사용자 검색 (이름/메일/부서 부분 일치) — 백엔드 API 없음 */
  const fetchSearchUsers = async (keyword: string): Promise<{ list: MeetingUser[] }> => {
    // TODO: 백엔드 API 연동 필요
    return mockPost<{ list: MeetingUser[] }>(`${MOCK_BASE}/user/search`, { keyword })
  }

  /** 회의 참석자 이름 배열 → 사용자 정보 매칭 — 백엔드 API 없음 */
  const fetchMatchUsersByNames = async (names: string[]): Promise<{ list: MeetingUser[] }> => {
    // TODO: 백엔드 API 연동 필요
    return mockPost<{ list: MeetingUser[] }>(`${MOCK_BASE}/user/match-names`, { names })
  }

  /** 회의 제목 자동 생성 */
  const fetchGenerateMeetingTitle = async (description: string): Promise<{ successYn: boolean; title: string }> => {
    return post<{ successYn: boolean; title: string }>('/ai/meeting/generateMeetingTitle.do', { description })
  }

  /** 회의 삭제 */
  const fetchDeleteMeeting = async (meetingId: number): Promise<{ successYn: boolean }> => {
    return post<{ successYn: boolean }>('/ai/meeting/deleteMeeting.do', { meetingId })
  }

  /**
   * OpenAI Realtime API 임시 토큰 발급
   * 백엔드가 OpenAI에 요청 후 ephemeral token 반환
   */
  const fetchRealtimeToken = async (): Promise<{ token: string; expiresAt: number }> => {
    return get<{ token: string; expiresAt: number }>('/meeting/realtime-token')
  }

  return {
    fetchUserList,
    fetchMeetingList,
    fetchMeetingDetail,
    fetchSaveMeeting,
    fetchCreateMeeting,
    fetchFinishMeeting,
    fetchFinishMeetingWithAudio,
    fetchSaveSpeakerMapping,
    fetchSaveSpeaker,
    fetchSaveSpeakers,
    fetchSearchUsers,
    fetchMatchUsersByNames,
    fetchGenerateMeetingTitle,
    fetchDeleteMeeting,
    fetchRealtimeToken,
  }
}
