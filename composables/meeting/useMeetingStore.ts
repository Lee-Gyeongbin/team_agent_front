import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import { useFileStore } from '~/composables/com/useFileStore'
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
  MergeGroup,
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
  fetchSaveSpeakers,
  fetchSaveSpeakersMerge,
  fetchSearchUsers,
  fetchMatchUsersByNames,
  fetchGenerateMeetingTitle,
  fetchDownloadFile,
  fetchDownloadAudioFileUrl,
  openInfographicStream,
} = useMeetingApi()
const { handleDownloadByUrl } = useFileStore()

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

const handleSaveSpeakers = async (speakers: Partial<MeetingSpeaker>[], mergeGroups?: MergeGroup[]) => {
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

    if (mergeGroups && mergeGroups.length > 0) {
      // 동명이인 머지: 배치 API 한 번 호출 (서버에서 utterances 합산 + 중복 행 삭제)
      await fetchSaveSpeakersMerge({
        meetingId: Number(currentMeeting.value.id),
        speakerList: payload,
        mergeSpeakerYn: 'Y',
      })

      const removedIds = mergeGroups.flatMap((g) => g.removeSpeakerIds)

      // 로컬 speakers: 제거된 화자 삭제 + 나머지 이름/userId 업데이트
      currentMeeting.value.speakers = currentMeeting.value.speakers
        .filter((s) => !removedIds.includes(s.id))
        .map((s) => {
          const updated = speakers.find((u) => u.id === s.id)
          return updated ? { ...s, ...updated } : s
        })

      // sttList: 제거된 화자의 발화 → keepSpeakerId로 재매핑
      currentMeeting.value.sttList = currentMeeting.value.sttList.map((stt) => {
        for (const group of mergeGroups) {
          if (group.removeSpeakerIds.includes(stt.speakerId)) {
            const keepSpeaker = currentMeeting.value!.speakers.find((s) => s.id === group.keepSpeakerId)
            return { ...stt, speakerId: group.keepSpeakerId, speakerName: keepSpeaker?.name ?? stt.speakerName }
          }
        }
        return stt
      })
    } else {
      // 일반 저장: 화자별 병렬 호출
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
    }

    openToast({ message: '화자 정보가 저장되었습니다.' })
  } catch {
    openToast({ message: '화자 저장 실패', type: 'error' })
  }
}

// ===== 파일 다운로드 =====
const downloadTextFile = (text: string, fileName: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const buildSttTextContent = () => {
  const list = currentMeeting.value?.sttList ?? []
  return list.map((item) => `[${item.time}] ${item.speakerName}\n${item.text}`).join('\n\n')
}

const handleDownloadSttText = () => {
  const sttText = buildSttTextContent()
  if (!sttText.trim()) {
    openToast({ message: '다운로드할 텍스트가 없습니다.', type: 'warning' })
    return false
  }

  const meetingId = Number(currentMeeting.value?.id ?? 0)
  const fileName = Number.isFinite(meetingId) && meetingId > 0 ? `회의_STT_${meetingId}.txt` : '회의_STT.txt'
  downloadTextFile(sttText, fileName)
  return true
}

const handleDownloadMeetingAudio = async () => {
  const meetingId = Number(currentMeeting.value?.id ?? 0)
  if (!Number.isFinite(meetingId) || meetingId <= 0) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return false
  }

  try {
    const res = await fetchDownloadAudioFileUrl(meetingId)
    const url = String(res?.url ?? '').trim()
    if (!url) {
      openToast({ message: '오디오 다운로드 URL을 받지 못했습니다.', type: 'error' })
      return false
    }
    const downloaded = handleDownloadByUrl(url)
    if (!downloaded) {
      openToast({ message: '오디오 다운로드에 실패했습니다.', type: 'error' })
      return false
    }
    return true
  } catch {
    openToast({ message: '오디오 다운로드에 실패했습니다.', type: 'error' })
    return false
  }
}

const buildInfographicHtml = (): string => {
  const completed = infographicList.value.filter((item) => item.infographicStatus === '003' && item.infographicImg)
  if (completed.length === 0) return ''

  const items = completed
    .map(
      (item) => `
      <div style="margin-bottom:24px;page-break-inside:avoid;">
        <h3 style="font-size:12pt;font-weight:700;margin:0 0 8px;">${item.topicNm}</h3>
        <img src="data:image/png;base64,${item.infographicImg}" alt="${item.topicNm}" style="max-width:100%;height:auto;display:block;" />
      </div>`,
    )
    .join('')

  return `
    <hr style="border:none;border-top:1px solid #cbd5e1;margin:24px 0;" />
    <h2 style="font-size:14pt;font-weight:700;margin:0 0 16px;">인포그래픽</h2>
    ${items}`
}

const handleDownloadFile = async (meetingId: number, format: MeetingFileFormat, includeInfographic = false) => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }

  let content = currentMeeting.value.minutesContent

  if (includeInfographic && (format === 'pdf' || format === 'docx')) {
    const infographicHtml = buildInfographicHtml()
    if (infographicHtml) {
      content = content + infographicHtml
    } else {
      openToast({ message: '완료된 인포그래픽이 없습니다.', type: 'warning' })
    }
  }

  if (format === 'pdf') {
    await downloadAsPdf(content, `회의록_${meetingId}`)
    return
  }

  if (format === 'docx') {
    await downloadAsDocx(content, `회의록_${meetingId}`)
    return
  }

  // txt, md → 백엔드 (이미지 포함 불가)
  fetchDownloadFile(meetingId, format)
}

const MEETING_PRINT_HOST_ID = 'meeting-minutes-print-host'
const MEETING_PRINT_STYLE_ID = 'meeting-minutes-print-style'

const buildMeetingPrintStyles = () => `
@media screen {
  #${MEETING_PRINT_HOST_ID} {
    position: fixed;
    left: -99999px;
    top: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    pointer-events: none;
  }
}
@media print {
  @page { margin: 15mm 15mm; }
  body * { visibility: hidden !important; }
  #${MEETING_PRINT_HOST_ID},
  #${MEETING_PRINT_HOST_ID} * { visibility: visible !important; }
  #${MEETING_PRINT_HOST_ID} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    clip: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    box-sizing: border-box !important;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
    font-size: 10pt !important;
    line-height: 1.5 !important;
    color: #1e293b !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #${MEETING_PRINT_HOST_ID} * { box-sizing: border-box !important; }
  #${MEETING_PRINT_HOST_ID} h1 { font-size: 18pt !important; font-weight: 700 !important; margin: 0 0 8px !important; }
  #${MEETING_PRINT_HOST_ID} h2 { font-size: 14pt !important; font-weight: 700 !important; margin: 12px 0 6px !important; }
  #${MEETING_PRINT_HOST_ID} h3 { font-size: 12pt !important; font-weight: 700 !important; margin: 10px 0 4px !important; }
  #${MEETING_PRINT_HOST_ID} h4 { font-size: 10.5pt !important; font-weight: 700 !important; margin: 8px 0 3px !important; }
  #${MEETING_PRINT_HOST_ID} p { margin: 0 0 5px !important; }
  #${MEETING_PRINT_HOST_ID} p:last-child { margin-bottom: 0 !important; }
  #${MEETING_PRINT_HOST_ID} ul, #${MEETING_PRINT_HOST_ID} ol { margin: 5px 0 !important; padding-left: 1.4em !important; }
  #${MEETING_PRINT_HOST_ID} li { margin-bottom: 2px !important; line-height: 1.5 !important; }
  #${MEETING_PRINT_HOST_ID} strong, #${MEETING_PRINT_HOST_ID} b { font-weight: 700 !important; }
  #${MEETING_PRINT_HOST_ID} em, #${MEETING_PRINT_HOST_ID} i { font-style: italic !important; }
  #${MEETING_PRINT_HOST_ID} u { text-decoration: underline !important; }
  #${MEETING_PRINT_HOST_ID} table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin: 6px 0 !important;
    font-size: 9.5pt !important;
  }
  #${MEETING_PRINT_HOST_ID} th {
    padding: 6px 8px !important;
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    text-align: left !important;
    vertical-align: top !important;
    color: #334155 !important;
  }
  #${MEETING_PRINT_HOST_ID} td {
    padding: 6px 8px !important;
    background: #fff !important;
    border: 1px solid #cbd5e1 !important;
    vertical-align: top !important;
    word-break: break-word !important;
  }
  #${MEETING_PRINT_HOST_ID} hr {
    border: none !important;
    border-top: 1px solid #cbd5e1 !important;
    margin: 8px 0 !important;
  }
  #${MEETING_PRINT_HOST_ID} blockquote {
    margin: 5px 0 !important;
    padding: 4px 10px !important;
    border-left: 3px solid #3b82f6 !important;
    background: #f8fafc !important;
  }
  #${MEETING_PRINT_HOST_ID} img { max-width: 100% !important; height: auto !important; }
}`

const downloadAsPdf = async (html: string, _fileName: string) => {
  if (!html?.trim()) {
    openToast({ message: '다운로드할 회의록 내용이 없습니다.', type: 'warning' })
    return
  }

  document.getElementById(MEETING_PRINT_STYLE_ID)?.remove()
  document.getElementById(MEETING_PRINT_HOST_ID)?.remove()

  const styleEl = document.createElement('style')
  styleEl.id = MEETING_PRINT_STYLE_ID
  styleEl.textContent = buildMeetingPrintStyles()
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = MEETING_PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = html
  document.body.appendChild(host)

  // base64 이미지가 렌더링되기 전에 print()가 호출되면 이미지가 누락됨
  // → 모든 img 로드 완료 후 print() 호출
  const images = Array.from(host.querySelectorAll('img'))
  if (images.length > 0) {
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve()
            else {
              img.onload = () => resolve()
              img.onerror = () => resolve() // 실패해도 나머지는 출력
            }
          }),
      ),
    )
  }

  const cleanup = () => {
    document.getElementById(MEETING_PRINT_STYLE_ID)?.remove()
    document.getElementById(MEETING_PRINT_HOST_ID)?.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

const downloadAsDocx = async (html: string, fileName: string) => {
  try {
    const { asBlob } = await import('html-docx-js-typescript')
    const blob = (await asBlob(html)) as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    openToast({ message: 'DOCX 다운로드에 실패했습니다.', type: 'error' })
  }
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
    handleSaveSpeakers,
    handleDownloadSttText,
    handleDownloadMeetingAudio,
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
