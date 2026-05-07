import { useMeetingApi } from '~/composables/meeting/useMeetingApi'
import type {
  Meeting as ApiMeeting,
  MeetingDetail,
  MeetingInfographic,
  MeetingMinutes,
  MeetingSpeaker as ApiMeetingSpeaker,
  MeetingUser as ApiMeetingUser,
  SpeechSegment,
} from '~/types/meeting'
import { useTmplApi } from '~/composables/tmpl/useTmplApi'
import type { TmplBaseInfo, TmplField } from '~/types/tmpl'
import { escapeHTML } from '~/utils/global/htmlUtil'
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
  fetchSaveMeeting,
  fetchDeleteMeeting,
  fetchCreateMeeting,
  fetchFinishMeetingWithAudio,
  fetchSaveSpeakerMapping,
  fetchSaveSpeaker,
  fetchSaveSpeakers,
  fetchSearchUsers,
  fetchMatchUsersByNames,
  fetchGenerateMeetingTitle,
} = useMeetingApi()

const { fetchTmplDetail } = useTmplApi()

// ===== 상태 =====
const meetingList = ref<ApiMeeting[]>([])
const meetingDetail = ref<MeetingDetail>({ meeting: null, minutes: null, speakers: [] })
const currentMeeting = ref<Meeting | null>(null)

const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isFinishing = ref(false)
const isGeneratingTitle = ref(false)

// 회의록 템플릿(필드 정의 포함) — tm000004 등
const minutesTmpl = ref<TmplBaseInfo | null>(null)

const userList = ref<ApiMeetingUser[]>([])
const selectedSpeaker = ref<MeetingSpeaker | null>(null)
const isSpeakerEditOpen = ref(false)

const isMailSendOpen = ref(false)
const mailInitialRecipients = ref<MeetingRecipient[]>([])

const isInfoEditOpen = ref(false)
const userSearchResults = ref<MeetingUser[]>([])

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
    minutesContent: buildMinutesHtml(detail.minutes, { infographics: detail.infographicList, tmpl: minutesTmpl.value }),
    fileFormat: 'docx' as MeetingFileFormat,
    recipients: [],
    templateId: DEFAULT_MINUTES_TMPL_ID,
    language: 'ko',
    createdAt: m.createDt ?? '',
    updatedAt: m.createDt ?? '',
    status: m.status,
  }
}

const nlToBr = (escaped: string) => escaped.replace(/\n/g, '<br>')

const parseFlatData = (flatData: string | undefined) => {
  if (!flatData?.trim()) return {}
  try {
    const parsed = JSON.parse(flatData)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const normalizeFlatText = (value: unknown): string => {
  if (value == null) return ''
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? '').trim())
      .filter(Boolean)
      .join(', ')
  }
  return String(value).trim()
}

const parseStringArrayField = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '').trim()).filter(Boolean)
  }
  if (typeof value !== 'string') return []
  const raw = value.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? '').trim()).filter(Boolean)
  } catch {
    // JSON 배열이 아니면 일반 텍스트로 처리
  }
  return []
}

const renderFlatValueHtml = (value: unknown, options?: { orderedList?: boolean }): string => {
  const arr = parseStringArrayField(value)
  if (arr.length > 0) {
    const tag = options?.orderedList ? 'ol' : 'ul'
    return `<${tag}>${arr.map((item) => `<li>${nlToBr(escapeHTML(item))}</li>`).join('')}</${tag}>`
  }
  const text = normalizeFlatText(value)
  return text ? `<p>${nlToBr(escapeHTML(text))}</p>` : '<p></p>'
}

const normalizeFields = (fields: TmplField[] | undefined): TmplField[] => {
  const safe = Array.isArray(fields) ? fields : []
  return safe
    .filter((f) => f && f.useYn === 'Y' && !!f.jsonKey?.trim())
    .slice()
    .sort((a, b) => (a.sortOrd ?? 0) - (b.sortOrd ?? 0))
}

const buildMinutesHtml = (
  minutes: MeetingMinutes | null,
  options?: { infographics?: MeetingInfographic[]; tmpl?: TmplBaseInfo | null },
): string => {
  if (!minutes) return ''

  const flat = parseFlatData(minutes.flatData)
  const tmplHtml = options?.tmpl?.tmplHtml ?? ''
  const fields = normalizeFields(options?.tmpl?.fields)

  // 템플릿 필드가 있으면 field 정의 기반으로 표 구성 (DB 변경 대응)
  // 없으면 flatData 키를 그대로 표 구성(최소 fallback)
  const rowsSource =
    fields.length > 0
      ? fields.map((f) => ({ label: f.fieldNm, key: f.jsonKey, multilineYn: f.multilineYn }))
      : Object.keys(flat).map((k) => ({ label: k, key: k, multilineYn: 'Y' }))

  const rows = rowsSource
    .map((r) => {
      const value = (flat as Record<string, unknown>)[r.key]
      // 참석자처럼 JSON 배열 문자열인 케이스는 자동 목록/문단 렌더링 로직이 처리
      const valueHtml =
        r.multilineYn === 'N'
          ? renderFlatValueHtml(normalizeFlatText(value))
          : renderFlatValueHtml(value, { orderedList: true })
      if (valueHtml === '<p></p>') return ''
      return `<tr><th>${escapeHTML(r.label)}</th><td>${valueHtml}</td></tr>`
    })
    .filter(Boolean)
    .join('')
  const reportTable = rows ? `<table><tbody>${rows}</tbody></table><p></p>` : ''

  // 인포그래픽 (기존 유지)
  const sortedInfo = [...(options?.infographics ?? [])].sort((a, b) => a.sortOrd - b.sortOrd)
  const infographicBlock =
    sortedInfo.length > 0
      ? `<h2>인포그래픽</h2>${sortedInfo
          .map((info) => {
            const title = escapeHTML(info.topicNm ?? '')
            const sum = info.topicSummary ? `<p>${nlToBr(escapeHTML(info.topicSummary))}</p>` : ''
            const tree = info.treeText ? `<p style="white-space:pre-wrap">${escapeHTML(info.treeText)}</p>` : ''
            return `<h3>${title}</h3>${sum}${tree}`
          })
          .join('')}`
      : ''

  return `${tmplHtml}${reportTable}${infographicBlock}`
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

    // 회의록 템플릿 상세(필드 포함) 캐시 — 템플릿 기반 표 구성
    if (!minutesTmpl.value?.tmplId) {
      try {
        const res = await fetchTmplDetail(DEFAULT_MINUTES_TMPL_ID)
        minutesTmpl.value = res.data ?? null
      } catch {
        minutesTmpl.value = null
      }
    }

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
    const res = await fetchSaveMeeting(meeting)
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
const handleDownloadFile = (format: MeetingFileFormat) => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }

  const html = currentMeeting.value.minutesContent ?? ''
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeTitle = currentMeeting.value.title.replace(/[\\/:*?"<>|]/g, '').trim() || '회의록'
  const fileName = `${safeTitle}_${today}.${format}`

  let content = ''
  let mimeType = 'text/plain;charset=utf-8'

  if (format === 'txt') {
    const div = document.createElement('div')
    div.innerHTML = html
    content = div.innerText
  } else if (format === 'md') {
    content = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    mimeType = 'text/markdown;charset=utf-8'
  } else {
    content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${html}</body></html>`
    mimeType = 'text/html;charset=utf-8'
    openToast({
      message: `${format.toUpperCase()} 변환은 백엔드 연동 후 정식 지원됩니다. 임시로 HTML로 다운로드합니다.`,
      type: 'info',
    })
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  if (format === 'txt' || format === 'md') {
    openToast({ message: `${fileName} 파일이 다운로드되었습니다.` })
  }

  if (currentMeeting.value) currentMeeting.value.fileFormat = format
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
    minutesTmpl,
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
    handleSelectUserList,
    handleSelectMeetingList,
    handleSelectMeetingDetail,
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
