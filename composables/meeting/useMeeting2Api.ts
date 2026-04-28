import type { Meeting, MeetingSpeaker, MeetingUser } from '~/types/meeting2'

// 🔽 Mock API — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/meeting'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useMeeting2Api = () => {
  // ===== Meeting =====
  /** 회의 목록 조회 */
  const fetchMeetingList = async (): Promise<{ list: Meeting[] }> => {
    return mockPost<{ list: Meeting[] }>(`${MOCK_BASE}/list`)
  }

  /** 회의 단건 조회 */
  const fetchMeetingDetail = async (id: string): Promise<{ data: Meeting | null }> => {
    return mockPost<{ data: Meeting | null }>(`${MOCK_BASE}/detail`, { id })
  }

  /** 회의 저장 (신규/수정) */
  const fetchSaveMeeting = async (meeting: Partial<Meeting>): Promise<{ data: Meeting }> => {
    return mockPost<{ data: Meeting }>(`${MOCK_BASE}/save`, meeting)
  }

  /** 회의 삭제 */
  const fetchDeleteMeeting = async (id: string): Promise<{ data: { id: string } }> => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  // ===== Speaker =====
  /** 화자 정보 저장 (단건) */
  const fetchSaveSpeaker = async (
    meetingId: string,
    speaker: Partial<MeetingSpeaker>,
  ): Promise<{ data: MeetingSpeaker }> => {
    return mockPost<{ data: MeetingSpeaker }>(`${MOCK_BASE}/speaker/save`, { meetingId, speaker })
  }

  /** 화자 일괄 저장 (인라인 편집 — 이름 매핑) */
  const fetchSaveSpeakers = async (
    meetingId: string,
    speakers: Partial<MeetingSpeaker>[],
  ): Promise<{ list: MeetingSpeaker[] }> => {
    return mockPost<{ list: MeetingSpeaker[] }>(`${MOCK_BASE}/speaker/save-batch`, { meetingId, speakers })
  }

  // ===== User (메일 발송 대상 검색) =====
  /** 사용자 검색 — 이름/메일/부서 부분 일치 */
  const fetchSearchUsers = async (keyword: string): Promise<{ list: MeetingUser[] }> => {
    return mockPost<{ list: MeetingUser[] }>(`${MOCK_BASE}/user/search`, { keyword })
  }

  /** 회의 참석자 이름 배열 → 사용자 정보 매칭 */
  const fetchMatchUsersByNames = async (names: string[]): Promise<{ list: MeetingUser[] }> => {
    return mockPost<{ list: MeetingUser[] }>(`${MOCK_BASE}/user/match-names`, { names })
  }

  return {
    fetchMeetingList,
    fetchMeetingDetail,
    fetchSaveMeeting,
    fetchDeleteMeeting,
    fetchSaveSpeaker,
    fetchSaveSpeakers,
    fetchSearchUsers,
    fetchMatchUsersByNames,
  }
}
