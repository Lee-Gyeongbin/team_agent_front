import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type {
  Meeting,
  MeetingDetail,
  MeetingSpeaker,
  MeetingUser,
  SpeechSegment,
  DiarizedSegment,
} from '~/types/meeting'

export const useMeetingApi = () => {
  const { get, post } = useApi()

  /** 참석자 선택용 사용자 목록 */
  const fetchUserList = async (): Promise<{ list: MeetingUser[] }> => {
    return get<{ list: MeetingUser[] }>('/ai/meeting/selectUserList.do')
  }

  /** 회의 목록 조회 */
  const fetchMeetingList = async (): Promise<{ list: Meeting[] }> => {
    return get<{ list: Meeting[] }>('/ai/meeting/selectMeetingList.do')
  }

  /** 회의 상세 + 회의록 + 화자 목록 조회 */
  const fetchMeetingDetail = async (meetingId: number): Promise<MeetingDetail> => {
    return get<MeetingDetail>(`/ai/meeting/selectMeetingDetail.do?meetingId=${meetingId}`)
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

  /**
   * 오디오 청크 화자 분리 전사
   * - POST /api/meeting/transcribe-chunk
   * - 백엔드: gpt-4o-transcribe-diarize → segments 반환
   */
  const fetchTranscribeChunk = async (audioChunk: Blob): Promise<{ segments: DiarizedSegment[] }> => {
    const formData = new FormData()
    formData.append('audioChunk', audioChunk, 'chunk.webm')
    return useApi_multipart<{ segments: DiarizedSegment[] }>('/api/meeting/transcribe-chunk', {
      method: 'POST',
      body: formData,
    })
  }

  return {
    fetchUserList,
    fetchMeetingList,
    fetchMeetingDetail,
    fetchCreateMeeting,
    fetchFinishMeeting,
    fetchFinishMeetingWithAudio,
    fetchSaveSpeakerMapping,
    fetchGenerateMeetingTitle,
    fetchDeleteMeeting,
    fetchRealtimeToken,
    fetchTranscribeChunk,
  }
}
