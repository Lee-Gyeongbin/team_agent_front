import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import type { Meeting, MeetingDetail, MeetingUser, SpeechSegment } from '~/types/meeting'

const {
  fetchUserList,
  fetchMeetingList,
  fetchMeetingDetail,
  fetchCreateMeeting,
  fetchFinishMeeting,
  fetchFinishMeetingWithAudio,
  fetchSaveSpeakerMapping,
  fetchGenerateMeetingTitle,
  fetchDeleteMeeting,
} = useMeetingApi()

const meetingList = ref<Meeting[]>([])
const meetingDetail = ref<MeetingDetail>({ meeting: null, minutes: null, speakers: [] })
const userList = ref<MeetingUser[]>([])
const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isFinishing = ref(false)
const isGeneratingTitle = ref(false)

/** 참석자 선택용 사용자 목록 조회 */
const handleSelectUserList = async () => {
  try {
    const res = await fetchUserList()
    userList.value = res.list ?? []
  } catch {
    userList.value = []
  }
}

/** 회의 목록 조회 */
const handleSelectMeetingList = async () => {
  isLoadingList.value = true
  try {
    const res = await fetchMeetingList()
    meetingList.value = res.list ?? []
  } catch {
    meetingList.value = []
    openToast({ message: '회의 목록을 불러오지 못했습니다.', type: 'error' })
  } finally {
    isLoadingList.value = false
  }
}

/** 회의 상세 + 회의록 + 화자 목록 조회 */
const handleSelectMeetingDetail = async (meetingId: number) => {
  isLoadingDetail.value = true
  try {
    meetingDetail.value = await fetchMeetingDetail(meetingId)
  } catch {
    openToast({ message: '회의 정보를 불러오지 못했습니다.', type: 'error' })
  } finally {
    isLoadingDetail.value = false
  }
}

/** 회의 시작 */
const handleCreateMeeting = async (params: {
  meetingTitle: string
  attendees: string
  isAutoTitle: 'Y' | 'N'
}): Promise<number | null> => {
  try {
    const res = await fetchCreateMeeting(params)
    if (!res.successYn) {
      openToast({ message: '회의를 시작하지 못했습니다.', type: 'error' })
      return null
    }
    return res.meetingId
  } catch {
    openToast({ message: '회의를 시작하지 못했습니다.', type: 'error' })
    return null
  }
}

/** 회의 종료 + 회의록 생성 + 화자 분리 */
const handleFinishMeeting = async (params: {
  meetingId: number
  fullText: string
  segments: SpeechSegment[]
}): Promise<boolean> => {
  isFinishing.value = true
  openLoading({ text: '회의록을 생성하는 중...' })
  try {
    const res = await fetchFinishMeeting(params)
    if (!res.successYn) {
      openToast({ message: '회의 종료에 실패했습니다.', type: 'error' })
      return false
    }
    return true
  } catch {
    openToast({ message: '회의 종료에 실패했습니다.', type: 'error' })
    return false
  } finally {
    isFinishing.value = false
    closeLoading()
  }
}

/**
 * 회의 종료 (오디오 파일 전사 버전)
 * - 오디오 Blob 업로드 → 백엔드 gpt-4o-mini-transcribe → 회의록 생성
 */
const handleFinishMeetingWithAudio = async (params: {
  meetingId: number
  audioBlob: Blob
  segments: SpeechSegment[]
}): Promise<boolean> => {
  isFinishing.value = true
  openLoading({ text: '음성을 전사하고 회의록을 생성하는 중...' })
  try {
    const res = await fetchFinishMeetingWithAudio(params)
    if (!res.successYn) {
      openToast({ message: res.returnMsg || '회의 종료에 실패했습니다.', type: 'error' })
      return false
    }
    return true
  } catch {
    openToast({ message: '회의 종료에 실패했습니다.', type: 'error' })
    return false
  } finally {
    isFinishing.value = false
    closeLoading()
  }
}

/** 화자-참석자 매핑 저장 */
const handleSaveSpeakerMapping = async (params: {
  speakerId: number
  speakerNm: string
  speakerUserId: string
}): Promise<boolean> => {
  try {
    const res = await fetchSaveSpeakerMapping(params)
    return !!res.successYn
  } catch {
    openToast({ message: '화자 매핑 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 회의 제목 자동 생성 */
const handleGenerateMeetingTitle = async (description: string): Promise<string | null> => {
  isGeneratingTitle.value = true
  try {
    const res = await fetchGenerateMeetingTitle(description)
    if (res.successYn && res.title) return res.title
    openToast({ message: '제목 생성에 실패했습니다.', type: 'error' })
    return null
  } catch {
    openToast({ message: '제목 생성에 실패했습니다.', type: 'error' })
    return null
  } finally {
    isGeneratingTitle.value = false
  }
}

/** 회의 삭제 */
const handleDeleteMeeting = async (meetingId: number): Promise<boolean> => {
  const confirmed = await openConfirm({
    title: '회의 삭제',
    message: '삭제하면 회의록도 함께 삭제됩니다. 삭제하시겠습니까?',
  })
  if (!confirmed) return false

  try {
    const res = await fetchDeleteMeeting(meetingId)
    if (!res.successYn) {
      openToast({ message: '삭제에 실패했습니다.', type: 'error' })
      return false
    }
    meetingList.value = meetingList.value.filter((m) => m.meetingId !== meetingId)
    openToast({ message: '삭제되었습니다.' })
    return true
  } catch {
    openToast({ message: '삭제에 실패했습니다.', type: 'error' })
    return false
  }
}

/** decisions / todoList JSON 문자열 → 배열로 파싱 */
const parseJsonArray = <T = string>(jsonStr: string): T[] => {
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** attendees JSON 문자열 → 이름 콤마 문자열 */
const parseAttendeesDisplay = (attendees: string): string => {
  try {
    const arr = JSON.parse(attendees)
    if (Array.isArray(arr)) return arr.map((u: { userNm: string }) => u.userNm).join(', ')
  } catch {
    // 구 형식(평문) 그대로 반환
  }
  return attendees ?? ''
}

export const useMeetingStore = () => ({
  meetingList,
  meetingDetail,
  userList,
  isLoadingList,
  isLoadingDetail,
  isFinishing,
  isGeneratingTitle,
  handleSelectUserList,
  handleSelectMeetingList,
  handleSelectMeetingDetail,
  handleCreateMeeting,
  handleFinishMeeting,
  handleFinishMeetingWithAudio,
  handleSaveSpeakerMapping,
  handleGenerateMeetingTitle,
  handleDeleteMeeting,
  parseJsonArray,
  parseAttendeesDisplay,
})
