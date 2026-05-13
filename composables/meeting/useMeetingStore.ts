import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import type {
  Meeting as ApiMeeting,
  MeetingDetail,
  MeetingSpeaker as ApiMeetingSpeaker,
  MeetingUser as ApiMeetingUser,
  MeetingInfographic,
} from '~/types/meeting'
import type {
  Meeting,
  MeetingStep,
  MeetingStepKey,
  MeetingStepStatus,
  MeetingSpeaker,
  MeetingRecipient,
  MeetingUser,
  MeetingFileFormat,
} from '~/types/meeting2'

const {
  fetchUserList,
  fetchMeetingList,
  fetchMeetingDetail,
  fetchSaveMeetingMinutes,
  fetchDeleteMeeting,
  fetchCreateMeeting,
  fetchFinishMeetingWithAudio,
  fetchSaveSpeakerMapping,
  fetchSaveSpeaker,
  fetchSaveSpeakers,
  fetchSearchUsers,
  fetchMatchUsersByNames,
  fetchGenerateMeetingTitle,
  fetchDownloadFile,
  openInfographicStream,
} = useMeetingApi()

// ===== 상태 =====
const meetingList = ref<ApiMeeting[]>([])
const meetingDetail = ref<MeetingDetail>({ meeting: null, minutes: null, speakers: [] })
const currentMeeting = ref<Meeting | null>(null)
const infographicList = ref<MeetingInfographic[]>([])

const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isFinishing = ref(false)
const isGeneratingTitle = ref(false)

const userList = ref<ApiMeetingUser[]>([])
const selectedSpeaker = ref<MeetingSpeaker | null>(null)
const isSpeakerEditOpen = ref(false)

const isMailSendOpen = ref(false)
const mailInitialRecipients = ref<MeetingRecipient[]>([])

const isInfoEditOpen = ref(false)
const userSearchResults = ref<MeetingUser[]>([])
const activeTab = ref<'share' | 'infographic'>('share')

// ===== 유틸 =====
const parseJsonArray = <T = string>(jsonStr: string): T[] => {
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseAttendeesDisplay = (attendees: string): string => {
  try {
    const arr = JSON.parse(attendees)
    if (Array.isArray(arr)) return arr.map((u: { userNm: string }) => u.userNm).join(', ')
  } catch {
    // 구 형식(평문) 그대로 반환
  }
  return attendees ?? ''
}

const deriveSteps = (status: string, hasMinutes: boolean): MeetingStep[] => {
  const s = (key: MeetingStepKey, label: string, stepStatus: MeetingStepStatus): MeetingStep => ({
    key,
    label,
    status: stepStatus,
  })
  if (status === '001') {
    return [
      s('record', '녹음', 'progress'),
      s('speaker', '화자 분리', 'wait'),
      s('generate', '회의록 생성', 'wait'),
      s('edit', '회의록 편집', 'wait'),
      s('share', '공유', 'wait'),
    ]
  }
  return [
    s('record', '녹음', 'done'),
    s('speaker', '화자 분리', hasMinutes ? 'done' : 'wait'),
    s('generate', '회의록 생성', hasMinutes ? 'done' : 'wait'),
    s('edit', '회의록 편집', hasMinutes ? 'progress' : 'wait'),
    s('share', '공유', 'wait'),
  ]
}

const mapApiSpeakers = (apiSpeakers: ApiMeetingSpeaker[]): MeetingSpeaker[] =>
  apiSpeakers.map((s, i) => ({
    id: String(s.speakerId),
    name: s.speakerNm || s.speakerLabel,
    alias: s.speakerLabel,
    colorIndex: i % 8,
    speakerUserId: s.speakerUserId?.trim() || undefined,
  }))

const formatStartTime = (start?: number): string => {
  if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) return '-'
  const totalSeconds = Math.floor(start)
  const hh = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const mm = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const ss = (totalSeconds % 60).toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const buildSttListFromSpeakers = (apiSpeakers: ApiMeetingSpeaker[]) =>
  apiSpeakers
    .flatMap((speaker, speakerIndex) => {
      const speakerName = speaker.speakerNm || speaker.speakerLabel || '화자 미확정'
      const speakerId = String(speaker.speakerId ?? `speaker-${speakerIndex}`)
      const utterances = parseJsonArray<{ seq?: number; start?: number; text?: string }>(speaker.utterances ?? '[]')
      return utterances
        .filter((u) => !!u.text?.trim())
        .map((u, idx) => ({
          id: `${speakerId}-${u.seq ?? idx}`,
          speakerId,
          speakerName,
          time: formatStartTime(u.start),
          text: (u.text ?? '').trim(),
          start: typeof u.start === 'number' ? u.start : Number.POSITIVE_INFINITY,
          seq: u.seq ?? idx,
          speakerIndex,
        }))
    })
    .sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start
      if (a.seq !== b.seq) return a.seq - b.seq
      return a.speakerIndex - b.speakerIndex
    })
    .map(({ id, speakerId, speakerName, time, text }) => ({
      id,
      speakerId,
      speakerName,
      time,
      text,
    }))

const DEFAULT_MINUTES_TMPL_ID = 'TM000004'

const mapApiDetailToMeeting = (detail: MeetingDetail): Meeting | null => {
  const m = detail.meeting
  if (!m) return null
  const hasMinutes = !!detail.minutes
  return {
    id: String(m.meetingId),
    title: m.meetingTitle,
    date: m.startDt,
    location: undefined,
    participants: parseAttendeesDisplay(m.attendees)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    purpose: undefined,
    steps: deriveSteps(m.status, hasMinutes),
    speakers: mapApiSpeakers(detail.speakers ?? []),
    sttList: buildSttListFromSpeakers(detail.speakers ?? []),
    minutesContent: detail.minutes?.editedContent || detail.minutes?.generatedContent || '',
    fileFormat: 'docx' as MeetingFileFormat,
    recipients: [],
    templateId: DEFAULT_MINUTES_TMPL_ID,
    language: 'ko',
    createdAt: m.createDt ?? '',
    updatedAt: m.createDt ?? '',
    status: m.status,
  }
}

// ===== 조회 =====
const handleSelectUserList = async () => {
  try {
    const res = await fetchUserList()
    userList.value = res.list ?? []
  } catch {
    userList.value = []
  }
}

const handleSelectMeetingList = async () => {
  isLoadingList.value = true
  try {
    const res = await fetchMeetingList()
    meetingList.value = res?.list ?? []
  } catch {
    openToast({ message: '회의 목록 조회 실패', type: 'error' })
    meetingList.value = []
  } finally {
    isLoadingList.value = false
  }
}

const isMinutesEditorEmpty = (html?: string) => {
  if (!html?.trim()) return true
  const n = html.replace(/\s|&nbsp;/gi, '').toLowerCase()
  return n === '<p></p>' || n === '<p><br></p>' || n === '<p><br/></p>'
}

const handleSelectMeetingDetail = async (meetingId: number) => {
  isLoadingDetail.value = true
  try {
    const detail = await fetchMeetingDetail(meetingId)
    meetingDetail.value = detail
    infographicList.value = detail.infographicList ?? []

    const mapped = mapApiDetailToMeeting(detail)
    if (!currentMeeting.value || currentMeeting.value.id !== mapped?.id) {
      currentMeeting.value = mapped
    } else if (currentMeeting.value && mapped) {
      currentMeeting.value.steps = mapped.steps
      currentMeeting.value.speakers = mapped.speakers
      currentMeeting.value.sttList = mapped.sttList
      if (detail.minutes && mapped.minutesContent && isMinutesEditorEmpty(currentMeeting.value.minutesContent)) {
        currentMeeting.value.minutesContent = mapped.minutesContent
      }
      currentMeeting.value.status = detail.meeting?.status ?? ''
    }
  } catch {
    openToast({ message: '회의 정보를 불러오지 못했습니다.', type: 'error' })
  } finally {
    isLoadingDetail.value = false
  }
}

/**
 * 인포그래픽 생성 SSE 스트림 구독
 * - progress 이벤트: 이미지 생성 완료 시 해당 항목만 업데이트
 * - done 이벤트: 전체 완료
 * - error 이벤트: 스트림 오류
 * @returns 구독 해제 함수
 */
const handleStreamInfographic = (meetingId: number): (() => void) => {
  type InfographicStreamProgressPayload = Pick<
    MeetingInfographic,
    'infographicId' | 'sortOrd' | 'infographicStatus' | 'infographicImg'
  >

  const es = openInfographicStream(meetingId)

  es.addEventListener('progress', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as Partial<InfographicStreamProgressPayload>
      const idx = infographicList.value.findIndex((item) => item.infographicId === data.infographicId)
      if (idx !== -1) {
        const prev = infographicList.value[idx]
        infographicList.value[idx] = {
          ...prev,
          infographicId: data.infographicId ?? prev.infographicId,
          sortOrd: data.sortOrd ?? prev.sortOrd,
          infographicStatus: data.infographicStatus ?? prev.infographicStatus,
          infographicImg: data.infographicImg ?? prev.infographicImg,
        }
      }
    } catch {
      // 파싱 실패 무시
    }
  })

  es.addEventListener('done', () => {
    es.close()
  })

  es.addEventListener('error', () => {
    es.close()
  })

  return () => es.close()
}

// ===== 회의 시작/종료 =====
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

const handleFinishMeetingWithAudio = async (params: { meetingId: number; audioBlob: Blob }): Promise<boolean> => {
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

// ===== 회의록 저장/삭제 =====
const handleSaveMeeting = async (
  meeting: Partial<Meeting>,
  options: { silent?: boolean } = {},
): Promise<Meeting | null> => {
  try {
    const res = await fetchSaveMeetingMinutes(meeting)
    if (res?.data && currentMeeting.value) {
      if (options.silent) {
        currentMeeting.value.updatedAt = res.data.updatedAt
        currentMeeting.value.id = res.data.id
      } else {
        currentMeeting.value = res.data
      }
    } else if (res?.data) {
      currentMeeting.value = res.data
    }
    if (!options.silent) openToast({ message: '저장되었습니다.' })
    return res?.data ?? null
  } catch {
    openToast({ message: '회의록 저장 실패', type: 'error' })
    return null
  }
}

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

const handleResetRecord = () => {
  if (currentMeeting.value) currentMeeting.value.sttList = []
}

// ===== 화자 =====
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

const openSpeakerEditModal = (speaker?: MeetingSpeaker) => {
  selectedSpeaker.value = speaker ?? null
  isSpeakerEditOpen.value = true
}

const handleSaveSpeaker = async (speaker: Partial<MeetingSpeaker>) => {
  if (!currentMeeting.value) return
  try {
    const res = await fetchSaveSpeaker(currentMeeting.value.id, speaker)
    if (res?.data && currentMeeting.value) {
      const idx = currentMeeting.value.speakers.findIndex((s) => s.id === res.data.id)
      if (idx > -1) currentMeeting.value.speakers[idx] = res.data
      else currentMeeting.value.speakers.push(res.data)
    }
    isSpeakerEditOpen.value = false
    openToast({ message: '화자 정보가 저장되었습니다.' })
  } catch {
    openToast({ message: '화자 저장 실패', type: 'error' })
  }
}

const handleSaveSpeakers = async (speakers: Partial<MeetingSpeaker>[]) => {
  if (!currentMeeting.value) return
  try {
    // meetingDetail의 ApiMeetingSpeaker에서 기존 speakerUserId 조회 (유저 매핑 유지)
    const apiSpeakers = meetingDetail.value.speakers ?? []
    const payload = speakers
      .filter((s) => !!s.id)
      .map((s) => {
        const existing = apiSpeakers.find((a) => String(a.speakerId) === s.id)
        return {
          speakerId: Number(s.id),
          speakerNm: s.name ?? '',
          speakerUserId: s.speakerUserId?.trim() || existing?.speakerUserId || '',
        }
      })

    await fetchSaveSpeakers(payload)

    // 로컬 speakers 상태 업데이트 → MeetingSpeakerList 반영
    speakers.forEach((updated) => {
      if (!currentMeeting.value || !updated.id) return
      const idx = currentMeeting.value.speakers.findIndex((s) => s.id === updated.id)
      if (idx > -1) {
        currentMeeting.value.speakers[idx] = { ...currentMeeting.value.speakers[idx], ...updated }
      }
    })

    // sttList 화자명 갱신 → MeetingSttList 반영
    currentMeeting.value.sttList = currentMeeting.value.sttList.map((stt) => {
      const speaker = currentMeeting.value!.speakers.find((s) => s.id === stt.speakerId)
      return speaker ? { ...stt, speakerName: speaker.name } : stt
    })

    openToast({ message: '화자 정보가 저장되었습니다.' })
  } catch {
    openToast({ message: '화자 저장 실패', type: 'error' })
  }
}

// ===== 파일 다운로드 =====
const handleDownloadFile = (meetingId: number, format: MeetingFileFormat) => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  fetchDownloadFile(meetingId, format)
}

// ===== 메일 발송 =====
const handleOpenMailSend = async () => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  const names = currentMeeting.value.participants ?? []
  let initial: MeetingRecipient[] = []
  if (names.length > 0) {
    try {
      const res = await fetchMatchUsersByNames(names)
      initial = (res?.list ?? []).map((u) => ({ id: u.id, name: u.name, email: u.email }))
    } catch {
      // 매칭 실패해도 모달은 빈 목록으로 열림
    }
  }
  if (currentMeeting.value.recipients.length > 0) {
    initial = currentMeeting.value.recipients
  }
  mailInitialRecipients.value = initial
  isMailSendOpen.value = true
}

const doSendMail = (recipients: MeetingRecipient[]) => {
  if (!currentMeeting.value) return
  currentMeeting.value.recipients = recipients
  openToast({ message: `${recipients.length}명에게 회의록이 발송되었습니다.` })
  isMailSendOpen.value = false
}

const handleSearchUsers = async (keyword: string) => {
  try {
    const res = await fetchSearchUsers(keyword)
    userSearchResults.value = res?.list ?? []
  } catch {
    userSearchResults.value = []
  }
}

const openInfoEditModal = () => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  isInfoEditOpen.value = true
}

export const useMeetingStore = () => {
  return {
    meetingList,
    meetingDetail,
    currentMeeting,
    infographicList,
    userList,
    isLoadingList,
    isLoadingDetail,
    isFinishing,
    isGeneratingTitle,
    selectedSpeaker,
    isSpeakerEditOpen,
    isMailSendOpen,
    mailInitialRecipients,
    isInfoEditOpen,
    userSearchResults,
    activeTab,
    handleSelectUserList,
    handleSelectMeetingList,
    handleSelectMeetingDetail,
    handleStreamInfographic,
    handleCreateMeeting,
    handleFinishMeetingWithAudio,
    handleSaveMeeting,
    handleDeleteMeeting,
    handleResetRecord,
    handleSaveSpeakerMapping,
    openSpeakerEditModal,
    handleSaveSpeaker,
    handleSaveSpeakers,
    handleDownloadFile,
    handleOpenMailSend,
    doSendMail,
    handleSearchUsers,
    handleGenerateMeetingTitle,
    openInfoEditModal,
    parseJsonArray,
    parseAttendeesDisplay,
  }
}
