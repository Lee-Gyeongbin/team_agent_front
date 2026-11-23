import { useMeetingApi, type MeetingListFilter } from '~/composables/meeting/useMeetingApi'
import { buildMeetingPrintCss, MEETING_DOCX_CSS } from '~/composables/meeting/meetingExportStyles'
import { useFileStore } from '~/composables/com/useFileStore'
import { useMeetingRecordGuard, isMeetingSessionLost } from '~/composables/meeting/useMeetingRecordGuard'
import type {
  Meeting as ApiMeeting,
  MeetingDetail,
  MeetingSpeaker as ApiMeetingSpeaker,
  MeetingVoiceEnrollment,
  MeetingUser as ApiMeetingUser,
  MeetingInfographic,
  MeetingViewModel as Meeting,
  MeetingStep,
  MeetingStepKey,
  MeetingStepStatus,
  MeetingViewSpeaker as MeetingSpeaker,
  MeetingRecipient,
  MeetingViewUser as MeetingUser,
  MeetingFileFormat,
  MergeGroup,
  MeetingMinutesTmpl,
  MeetingStartMinutesParams,
  MeetingMinutesState,
  MeetingMinutesStatusResponse,
} from '~/types/meeting'

const {
  fetchUserList,
  fetchMeetingList,
  fetchMeetingDetail,
  fetchSaveMeetingMinutes,
  fetchMeetingTmplList,
  fetchStartMeetingMinutes,
  fetchMeetingMinutesStatus,
  fetchRetryDiarize,
  fetchCheckMeetingIntegration,
  fetchDeleteMeeting,
  fetchCreateMeeting,
  fetchFinishMeetingWithAudio,
  fetchVoiceEnroll,
  fetchVoiceEnrollmentList,
  fetchSaveSpeakerMapping,
  fetchSaveSpeakers,
  fetchSaveSpeakersMerge,
  fetchSearchUsers,
  fetchMatchUsersByNames,
  fetchGenerateMeetingTitle,
  fetchDownloadFile,
  fetchDownloadAudioFileUrl,
  openMeetingProcessingStream,
  openInfographicStream,
  fetchRecoverMeeting,
  fetchIntegrateMeeting,
} = useMeetingApi()
const { handleDownloadByUrl } = useFileStore()
const { uploadBackupSegment, toSafeFileTitle } = useMeetingRecordGuard()

// ===== 상태 =====
const meetingList = ref<ApiMeeting[]>([])
const meetingDetail = ref<MeetingDetail>({ meeting: null, minutes: null, speakers: [] })
const currentMeeting = ref<Meeting | null>(null)
const infographicList = ref<MeetingInfographic[]>([])

const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isFinishing = ref(false)
const isGeneratingTitle = ref(false)

// 회의록 양식 (null = 아직 조회 안 함, [] = 조회했고 0건)
const minutesTmplList = ref<MeetingMinutesTmpl[] | null>(null)
const isLoadingMinutesTmpl = ref(false)
const minutesTmplErrorMessage = ref('')
/** 회의록 생성 상태 — 서버 상태(selectMeetingMinutesStatus)를 그대로 따름 */
const minutesState = ref<MeetingMinutesState>('none')
/** 생성 실패 사유 (state = error) */
const minutesStatusMessage = ref('')
/** 실패 단계 — transcribe: 화자 분리 중단 · 실패 (녹음 화면에서 다시 시도) / minutes · save: 회의록 생성 실패 */
const minutesStatusStep = ref('')

const userList = ref<ApiMeetingUser[]>([])
const isMailSendOpen = ref(false)
const mailInitialRecipients = ref<MeetingRecipient[]>([])

const isInfoEditOpen = ref(false)
const userSearchResults = ref<MeetingUser[]>([])
const activeTab = ref<'share' | 'infographic'>('share')

// ── 화자 STT 내비게이션 ────────────────────────────────────────────────
/** 현재 내비게이션 중인 화자 ID */
const speakerNavSpeakerId = ref<string | null>(null)
/** 현재 하이라이트된 STT 아이템 ID */
const focusedSttItemId = ref<string | null>(null)

// ── STT 검색 ─────────────────────────────────────────────────────────
const isSearchOpen = ref(false)
const searchType = ref<'화자' | '내용'>('내용')
const searchKeyword = ref('')

/** 검색 조건에 맞게 필터링된 STT 목록 */
const filteredSttList = computed(() => {
  const list = currentMeeting.value?.sttList ?? []
  const kw = searchKeyword.value.trim()
  if (!isSearchOpen.value || !kw) return list
  if (searchType.value === '화자') {
    return list.filter((item) => item.speakerName.includes(kw))
  }
  return list.filter((item) => item.text.includes(kw))
})

/** 검색창 토글 — 닫을 때 검색 조건 초기화 */
const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value
  if (!isSearchOpen.value) {
    searchKeyword.value = ''
    searchType.value = '내용'
  }
}

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

/** 음성등록 완료 여부 (전체 참석자 등록 완료 or 참석자 없음) */
const voiceEnrollDone = ref(true)
// ── 상세 화면 단계 (CMB 와 같이 단계별 화면) ─────────────────────────
const STEP_DEFS: Array<{ key: MeetingStepKey; label: string }> = [
  { key: 'voiceEnroll', label: '음성 등록' },
  { key: 'record', label: '녹음' },
  { key: 'speaker', label: '화자 분리' },
  { key: 'generate', label: '회의록 생성' },
  { key: 'share', label: '공유' },
]
const STEP_KEYS = STEP_DEFS.map((d) => d.key)

/** 지금 보고 있는 단계 화면 */
const currentStepKey = ref<MeetingStepKey>('record')

/**
 * 처리 상태 기준으로 갈 수 있는 마지막 단계
 * - 회의록 있음 → 공유 / 화자 분리 완료(회의록 생성 대기·생성 중) → 회의록 생성 / 그 외 → 녹음
 * - CMB 와 같이 화자 분리 후 화자 이름을 정리하고 "회의록 생성" 단계에서 생성한다
 */
const reachedStepIdx = computed(() => {
  const detail = meetingDetail.value
  if (detail.minutes) return STEP_KEYS.indexOf('share')
  // 발화가 저장된 화자가 있어야 화자 분리 완료 (참석자로 미리 등록된 화자 행만 있으면 아직 아님 — 중단된 경우 포함)
  if (detail.meeting?.status === '002' && (detail.speakers ?? []).some((sp) => Boolean(sp.utterances)))
    return STEP_KEYS.indexOf('generate')
  return STEP_KEYS.indexOf('record')
})

const isIntegratedMeeting = computed(() => meetingDetail.value.meeting?.integrateYn === 'Y')

/** 진행바 표시용 단계 — 통합 회의록은 회의록 생성·공유만 */
const detailSteps = computed<MeetingStep[]>(() => {
  const curIdx = STEP_KEYS.indexOf(currentStepKey.value)
  const passedIdx = Math.max(curIdx, reachedStepIdx.value)
  const steps = STEP_DEFS.map((def, idx): MeetingStep => {
    let status: MeetingStepStatus = 'wait'
    if (idx === curIdx) status = 'progress'
    else if (def.key === 'voiceEnroll') {
      // 참석자 음성을 다 등록하지 않고 지나쳤으면 건너뜀
      if (voiceEnrollDone.value) status = 'done'
      else if (passedIdx > 0) status = 'skipped'
    } else if (idx < passedIdx) status = 'done'
    return { ...def, status }
  })
  return isIntegratedMeeting.value ? steps.filter((st) => st.key === 'generate' || st.key === 'share') : steps
})

/** 회의에 들어왔을 때 첫 단계 — 처리 상태 기준 */
const initDetailStep = () => {
  const detail = meetingDetail.value
  if (isIntegratedMeeting.value || detail.minutes) currentStepKey.value = 'generate'
  // 생성 중이면 진행 상황이 보이는 회의록 생성 단계, 생성 전이면 화자 이름부터 정리
  else if (minutesState.value === 'processing') currentStepKey.value = 'generate'
  else if (reachedStepIdx.value >= STEP_KEYS.indexOf('speaker')) currentStepKey.value = 'speaker'
  // 비정상 종료 · 일시정지 회의는 이어서 녹음 버튼이 있는 녹음 화면부터
  else if (!voiceEnrollDone.value && detail.meeting?.abnormalYn !== 'Y' && detail.meeting?.pauseYn !== 'Y')
    currentStepKey.value = 'voiceEnroll'
  else currentStepKey.value = 'record'
}

/** 해당 단계로 이동할 수 없는 이유 (없으면 빈 문자열) — 문구는 CMB getStepBlockMsg 기준 */
const getStepBlockMsg = (target: MeetingStepKey, opts: { isRecording: boolean; hasAttendees: boolean }): string => {
  if (opts.isRecording) return '녹음 중에는 단계를 이동할 수 없습니다. 회의를 마치면 회의 종료 버튼을 눌러 주세요.'
  if (isFinishing.value) return '화자 분리가 진행 중입니다. 완료되면 다음 단계로 이동할 수 있습니다.'
  const targetIdx = STEP_KEYS.indexOf(target)
  if (isIntegratedMeeting.value && targetIdx < STEP_KEYS.indexOf('generate')) return ''
  if (target === 'voiceEnroll' && !opts.hasAttendees) return '음성 등록 대상 참석자가 없습니다.'
  if (targetIdx <= reachedStepIdx.value || targetIdx <= STEP_KEYS.indexOf('record')) return ''
  if (!isIntegratedMeeting.value && meetingDetail.value.meeting?.status !== '002') return '녹음을 먼저 완료해주세요.'
  return '회의록이 아직 생성되지 않았습니다.'
}

const mapApiSpeakers = (apiSpeakers: ApiMeetingSpeaker[]): MeetingSpeaker[] =>
  apiSpeakers.map((s, i) => ({
    id: String(s.speakerId),
    name: s.speakerNm || s.speakerLabel,
    alias: s.speakerLabel,
    colorIndex: i % 8,
    speakerUserId: s.speakerUserId?.trim() || undefined,
  }))

const normalizeSpeakerKey = (value?: string) => (value ?? '').replace(/\s+/g, '').trim().toLowerCase()

/**
 * STT 목록의 화자명을 현재 화자 목록 기준으로 동기화
 * - 1차: speakerId 매칭
 * - 2차: speakerName ↔ speaker.name/alias(공백 제거) 매칭
 */
const syncSttListSpeakerNames = (sttList: Meeting['sttList'], speakers: MeetingSpeaker[]) => {
  const speakerById = new Map(speakers.map((speaker) => [speaker.id, speaker]))
  const speakerByNameOrAlias = new Map<string, MeetingSpeaker>()

  speakers.forEach((speaker) => {
    const nameKey = normalizeSpeakerKey(speaker.name)
    if (nameKey) speakerByNameOrAlias.set(nameKey, speaker)
    const aliasKey = normalizeSpeakerKey(speaker.alias)
    if (aliasKey) speakerByNameOrAlias.set(aliasKey, speaker)
  })

  return sttList.map((stt) => {
    const matchedById = speakerById.get(stt.speakerId)
    if (matchedById) return { ...stt, speakerName: matchedById.name }

    const matchedByName = speakerByNameOrAlias.get(normalizeSpeakerKey(stt.speakerName))
    if (matchedByName) {
      return { ...stt, speakerId: matchedByName.id, speakerName: matchedByName.name }
    }
    return stt
  })
}

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
    integrateYn: m.integrateYn ?? 'N',
    showSpeakerYn: m.showSpeakerYn ?? 'Y',
    abnormalYn: m.abnormalYn ?? 'N',
    pauseYn: m.pauseYn || 'N',
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

const handleSelectMeetingList = async (filter?: MeetingListFilter) => {
  isLoadingList.value = true
  try {
    const res = await fetchMeetingList(filter)
    meetingList.value = res?.list ?? []
  } catch {
    openToast({ message: '회의 목록 조회 실패', type: 'error' })
    meetingList.value = []
  } finally {
    isLoadingList.value = false
  }
}

/** 다중 선택 일괄 삭제 (기존 handleDeleteMeeting과 별개의 신규 함수) */
const handleBulkDeleteMeetings = async (meetingIds: string[]): Promise<boolean> => {
  if (meetingIds.length === 0) return false
  const confirmed = await openConfirm({
    title: '일괄 삭제',
    message: `선택한 ${meetingIds.length}개의 회의를 삭제하시겠습니까?\n회의록도 함께 삭제됩니다.`,
  })
  if (!confirmed) return false

  try {
    await Promise.all(meetingIds.map((id) => fetchDeleteMeeting(Number(id))))
    meetingList.value = meetingList.value.filter((m) => !meetingIds.includes(String(m.meetingId)))
    openToast({ message: '삭제되었습니다.' })
    return true
  } catch {
    openToast({ message: '삭제에 실패했습니다.', type: 'error' })
    return false
  }
}

// ===== 일괄 PDF 내보내기 =====

/** HTML을 렌더링해 jsPDF Blob으로 변환하는 로컬 헬퍼 */
const renderHtmlToPdfBlob = async (
  html: string,
  toPng: (node: HTMLElement, opts?: object) => Promise<string>,
  JsPDF: new (opts: object) => { addImage: (...args: unknown[]) => void; output: (type: string) => Blob },
): Promise<Blob | null> => {
  const styleEl = document.createElement('style')
  styleEl.textContent = buildMeetingPrintCss('pdf-render-host')
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = 'pdf-render-host'
  host.style.cssText =
    'position:fixed;top:0;left:-9999px;width:794px;background:#fff;padding:48px;box-sizing:border-box;'
  host.innerHTML = html
  document.body.appendChild(host)

  const images = Array.from(host.querySelectorAll<HTMLImageElement>('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  )

  try {
    const dataUrl = await toPng(host, { pixelRatio: 2, skipFonts: true })
    const W = host.offsetWidth
    const H = host.offsetHeight
    const pdf = new JsPDF({
      orientation: W > H ? 'landscape' : 'portrait',
      unit: 'px',
      format: [W, H],
      hotfixes: ['px_scaling'],
    })
    pdf.addImage(dataUrl, 'PNG', 0, 0, W, H)
    return pdf.output('blob')
  } finally {
    host.remove()
    styleEl.remove()
  }
}

const handleBulkExportPdf = async (meetingIds: string[]) => {
  if (meetingIds.length === 0) return
  openLoading({ text: 'PDF를 생성하는 중...' })
  try {
    const [{ toPng }, { jsPDF: JsPDF }, { default: JSZip }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
      import('jszip'),
    ])
    const zip = new JSZip()
    for (let i = 0; i < meetingIds.length; i++) {
      const meetingId = Number(meetingIds[i])
      updateLoadingText(`PDF 생성 중... (${i + 1}/${meetingIds.length})`)
      try {
        const detail = await fetchMeetingDetail(meetingId)
        const title = detail.meeting?.meetingTitle ?? `회의록_${meetingId}`
        const html = detail.minutes?.editedContent || detail.minutes?.generatedContent || ''
        if (!html.trim()) continue
        const pdfBlob = await renderHtmlToPdfBlob(html, toPng, JsPDF as never)
        if (pdfBlob) zip.file(`${title}.pdf`, pdfBlob)
      } catch {
        continue
      }
    }
    if (Object.keys(zip.files).length === 0) {
      openToast({ message: '내보낼 회의록 내용이 없습니다.', type: 'warning' })
      return
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `회의록_${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    openToast({ message: `PDF ${Object.keys(zip.files).length}개를 ZIP으로 내보냈습니다.` })
  } catch (err) {
    console.error('[handleBulkExportPdf]', err)
    openToast({ message: 'PDF 내보내기에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
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

    // 음성등록 완료 여부 판정: 참석자가 있고 status='001'(녹음 전)이면 enrollment 조회
    const speakers = detail.speakers ?? []
    const attendeesJson = detail.meeting?.attendees
    const hasAttendees = speakers.length > 0 || (attendeesJson && attendeesJson !== '[]')
    if (detail.meeting?.status === '001' && hasAttendees) {
      try {
        const enrollments = await fetchVoiceEnrollmentList(meetingId)
        const enrollList = enrollments.list ?? []
        // 모든 speaker에 대해 003(완료) enrollment이 있는지 확인
        const doneIds = new Set(enrollList.filter((e) => e.status === '003').map((e) => e.speakerId))
        const allDone =
          speakers.length > 0
            ? speakers.every((sp) => doneIds.has(sp.speakerId))
            : enrollList.length > 0 && enrollList.every((e) => e.status === '003')
        voiceEnrollDone.value = allDone
      } catch {
        voiceEnrollDone.value = false
      }
    } else {
      voiceEnrollDone.value = true
    }

    const mapped = mapApiDetailToMeeting(detail)
    if (!currentMeeting.value || currentMeeting.value.id !== mapped?.id) {
      currentMeeting.value = mapped
    } else if (currentMeeting.value && mapped) {
      currentMeeting.value.speakers = mapped.speakers
      // 녹음 중(status='001')에는 sttList를 덮어쓰지 않음
      // DB에 화자가 없어 mapped.sttList = []이 되어 실시간 STT 블록이 지워지는 것을 방지
      if (detail.meeting?.status !== '001') {
        currentMeeting.value.sttList = mapped.sttList
      }
      if (detail.minutes && mapped.minutesContent && isMinutesEditorEmpty(currentMeeting.value.minutesContent)) {
        currentMeeting.value.minutesContent = mapped.minutesContent
      }
      currentMeeting.value.status = detail.meeting?.status ?? ''
      currentMeeting.value.abnormalYn = detail.meeting?.abnormalYn ?? 'N'
      currentMeeting.value.pauseYn = detail.meeting?.pauseYn || 'N'
    }

    // 처리 상태 — 회의록이 없으면 서버 상태 확인
    // (생성 대기 / 생성 중이면 이어서 확인 / 화자 분리 중단 → 녹음 화면에 "다시 시도" 안내, CMB getStatus 와 같음)
    if (detail.minutes) {
      if (minutesPollMeetingId !== meetingId) stopMinutesPolling()
      if (minutesState.value !== 'processing') minutesState.value = 'done'
    } else {
      await handleCheckMinutesStatus(meetingId)
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
  showSpeakerYn: 'Y' | 'N'
}): Promise<{ meetingId: number; speakers: ApiMeetingSpeaker[] } | null> => {
  try {
    const res = await fetchCreateMeeting(params)
    if (!res.successYn) {
      openToast({ message: '회의를 시작하지 못했습니다.', type: 'error' })
      return null
    }
    return { meetingId: res.meetingId, speakers: res.speakers ?? [] }
  } catch {
    openToast({ message: '회의를 시작하지 못했습니다.', type: 'error' })
    return null
  }
}

/** 참석자 Voice Enrollment — 녹음 종료 시 호출 (스토리지 업로드 + AI 프로필 생성) */
const handleVoiceEnroll = async (params: {
  meetingId: number
  speakerId: number
  speakerNm: string
  audioBlob: Blob
}): Promise<{ successYn: boolean; returnMsg?: string }> => {
  openLoading({ text: '음성을 등록하는 중...' })
  try {
    const res = await fetchVoiceEnroll(params)
    if (!res.successYn) {
      const returnMsg = res.returnMsg || '음성 등록에 실패했습니다.'
      openToast({ message: returnMsg, type: 'error' })
      return { successYn: false, returnMsg }
    }
    return { successYn: true }
  } catch {
    const returnMsg = '음성 등록에 실패했습니다.'
    openToast({ message: returnMsg, type: 'error' })
    return { successYn: false, returnMsg }
  } finally {
    closeLoading()
  }
}

/** 회의별 Voice Enrollment 현황 조회 (NCP 경로·상태. Embedding은 AI 캐시) */
const handleSelectVoiceEnrollmentList = async (meetingId: number): Promise<MeetingVoiceEnrollment[]> => {
  try {
    const res = await fetchVoiceEnrollmentList(meetingId)
    return res.list ?? []
  } catch {
    openToast({ message: '음성 등록 현황을 불러오지 못했습니다.', type: 'error' })
    return []
  }
}

/** SSE 진행 단계별 로딩 문구 */
const PROCESSING_STEP_MESSAGES: Record<string, string> = {
  transcribe: '음성 인식 및 화자 분리 중입니다.',
  minutes: '회의록 생성 중입니다.',
  save: '데이터를 저장 중입니다.',
}

/**
 * 회의 처리 SSE 구독 (전사·화자분리·회의록 생성·저장)
 * - 오디오가 이미 TB_MEETING_AUDIO(001)로 등록된 뒤 호출
 * - 로딩을 띄우고 진행 단계별 문구를 갱신, 끝나면 닫음
 */
const subscribeMeetingProcessing = (
  meetingId: number,
  options: { loadingText: string; doneToast?: string; errorToast: string },
): Promise<boolean> => {
  isFinishing.value = true
  openLoading({ text: options.loadingText })

  return new Promise<boolean>((resolve) => {
    const es = openMeetingProcessingStream(meetingId)

    es.addEventListener('progress', (e: MessageEvent) => {
      try {
        const { step } = JSON.parse(e.data) as { step: string }
        const message = PROCESSING_STEP_MESSAGES[step]
        if (message) updateLoadingText(message)
      } catch {
        // 파싱 실패 무시
      }
    })

    es.addEventListener('done', () => {
      es.close()
      isFinishing.value = false
      closeLoading()
      // 화자 분리 완료 → 화자 이름을 정리하는 화자 분리 단계로 이동 (회의록은 회의록 생성 단계에서 버튼으로 생성)
      minutesState.value = 'diarized'
      minutesStatusStep.value = ''
      minutesStatusMessage.value = ''
      currentStepKey.value = 'speaker'
      if (options.doneToast) openToast({ message: options.doneToast })
      resolve(true)
    })

    // 서버가 보낸 error 이벤트(처리 실패 · 이미 처리 중)는 message 를 담고, 연결 끊김은 data 가 없다
    es.addEventListener('error', (e: Event) => {
      es.close()
      isFinishing.value = false
      closeLoading()
      let serverMessage = ''
      try {
        serverMessage = (JSON.parse((e as MessageEvent).data ?? '{}') as { message?: string }).message ?? ''
      } catch {
        // 연결 끊김 등 data 없는 오류
      }
      openToast({ message: serverMessage || options.errorToast, type: 'error' })
      // 녹음 화면의 "화자 분리가 중단되었습니다" 안내는 서버 상태로 다시 판단
      void handleCheckMinutesStatus(meetingId)
      resolve(false)
    })
  })
}

/**
 * 오디오 파일 첨부로 회의 처리 (오디오 첨부 / 비정상 종료 화면의 [다른 오디오로 대체])
 * - 이전 오디오·회의록·백업 조각을 지우고 첨부 파일 하나로 처리
 */
const handleFinishMeetingWithAudio = async (params: { meetingId: number; audioBlob: Blob }): Promise<boolean> => {
  isFinishing.value = true
  // step 1-2: 업로드 + DB저장 (빠르게 반환)
  openLoading({ text: '오디오 파일을 업로드하는 중...' })
  try {
    const res = await fetchFinishMeetingWithAudio(params)
    closeLoading()
    if (!res.successYn) {
      openToast({ message: res.returnMsg || '회의 종료에 실패했습니다.', type: 'error' })
      isFinishing.value = false
      return false
    }
  } catch {
    openToast({ message: '회의 종료에 실패했습니다.', type: 'error' })
    closeLoading()
    isFinishing.value = false
    return false
  }

  // step 3-5: SSE 스트림 구독 — 로딩 텍스트를 실제 진행 단계로 업데이트
  return subscribeMeetingProcessing(params.meetingId, {
    loadingText: '음성 인식 및 화자 분리 중입니다.',
    errorToast: '회의 처리 중 오류가 발생했습니다.',
  })
}

/**
 * 업로드가 끝난 회의 처리 (녹음 종료 — 10분 미만 녹음을 녹음 보호 모듈이 업로드한 뒤)
 * finishMeetingWithAudio의 step 3-5(전사·화자분리·회의록생성)만 수행
 */
const handleProcessUploadedMeeting = (meetingId: number): Promise<boolean> =>
  subscribeMeetingProcessing(meetingId, {
    loadingText: '음성 인식 및 화자 분리 중입니다.',
    errorToast: '회의 처리 중 오류가 발생했습니다.',
  })

/**
 * 화자 분리 다시 시도 — "화자 분리가 중단되었습니다" 상태 (화자 분리 중 서버 재기동 · STT 오류, CMB 재시도와 같음)
 * 서버가 이전 결과를 정리하고 오디오를 대기로 되돌리면, 같은 오디오로 화자 분리를 다시 실행한다
 */
const handleRetryDiarize = async (meetingId: number): Promise<boolean> => {
  isFinishing.value = true
  try {
    const res = await fetchRetryDiarize(meetingId)
    if (!res.successYn) {
      openToast({ message: res.returnMsg || '화자 분리를 다시 시작하지 못했습니다.', type: 'error' })
      isFinishing.value = false
      return false
    }
  } catch {
    openToast({ message: '화자 분리를 다시 시작하지 못했습니다.', type: 'error' })
    isFinishing.value = false
    return false
  }
  minutesState.value = 'none'
  minutesStatusStep.value = ''
  minutesStatusMessage.value = ''
  return subscribeMeetingProcessing(meetingId, {
    loadingText: '음성 인식 및 화자 분리 중입니다.',
    doneToast: '화자 분리가 완료되었습니다. 화자 이름을 확인한 뒤 회의록을 생성하세요.',
    errorToast: '화자 분리 중 오류가 발생했습니다.',
  })
}

/**
 * 백업 조각 병합 → 회의 처리 (10분 넘는 녹음 종료 / 비정상 종료 화면의 [기존 음성으로 회의록 생성])
 * POST /meeting/{meetingId}/recover — STT 서버가 조각을 하나로 합침 (실패하면 조각은 서버에 그대로 남음)
 */
const handleRecoverMeeting = async (params: { meetingId: number }): Promise<boolean> => {
  isFinishing.value = true
  openLoading({ text: '백업된 녹음을 하나로 합치는 중...' })
  try {
    const res = await fetchRecoverMeeting(params.meetingId)
    closeLoading()
    if (!res.successYn || res.audioId == null) {
      openToast({ message: res.returnMsg ?? '복구에 실패했습니다.', type: 'error' })
      isFinishing.value = false
      return false
    }
  } catch {
    openToast({ message: '복구 처리에 실패했습니다.', type: 'error' })
    closeLoading()
    isFinishing.value = false
    return false
  }

  return subscribeMeetingProcessing(params.meetingId, {
    loadingText: '음성 인식 및 화자 분리 중입니다.',
    doneToast: '화자 분리가 완료되었습니다. 화자 이름을 확인한 뒤 회의록을 생성하세요.',
    errorToast: '복구 처리 중 오류가 발생했습니다.',
  })
}

// ===== 누락 구간 첨부 =====

/** 누락 구간 파일 검사 결과 */
interface MissingSegmentFile {
  index: number
  file: File
}

/** 파일명 목록을 불릿 문자열로 */
const toBullets = (names: string[]) => names.map((n) => `\n• ${n}`).join('')

/**
 * 누락 구간 첨부 — 회의 종료 때 내려받은 구간 파일({회의제목}_누락구간_{구간번호}_mt{회의ID}.webm)을 백업 조각으로 올림
 * - 파일명의 구간 번호로 자리를 찾으므로 여러 파일을 순서와 상관없이 한 번에 선택 가능
 * - 예전 이름 파일({회의제목}_녹음_{구간번호}.webm / {회의제목}_녹음.webm)도 받되 회의 ID 가 없어 제목만 비교해 경고
 * @returns 올린 구간 번호 목록 (취소·실패 시 null)
 */
const handleAttachMissingSegments = async (params: {
  meetingId: number
  meetingTitle: string
  files: File[]
  backupIndexes: number[]
}): Promise<number[] | null> => {
  const { meetingId, files, backupIndexes } = params
  if (files.length === 0) return null

  const title = (params.meetingTitle || '회의').trim().normalize('NFC')
  const safeTitle = toSafeFileTitle(title)
  const items: MissingSegmentFile[] = []
  const invalid: string[] = []
  const otherMeeting: string[] = []
  // 예전 방식으로 내려받은 파일 (회의 ID 가 없어 제목으로만 확인)
  const legacy: string[] = []

  files.forEach((file) => {
    // 같은 이름을 여러 번 받으면 브라우저가 " (1)" 을 붙이므로 허용, macOS 한글 파일명(NFD) 대비 정규화
    const name = file.name.normalize('NFC')
    const m = /_누락구간_(\d+)_mt(\d+)(?:\s*\(\d+\))?\.webm$/i.exec(name)
    const old = m ? null : /_녹음(?:_(\d+))?(?:\s*\(\d+\))?\.webm$/i.exec(name)
    if (m && Number(m[1]) >= 1) {
      if (m[2] !== String(meetingId)) otherMeeting.push(file.name)
      else items.push({ index: Number(m[1]) - 1, file })
    } else if (old && (old[1] === undefined || Number(old[1]) >= 1)) {
      items.push({ index: old[1] === undefined ? 0 : Number(old[1]) - 1, file })
      // 제목이 다르면(다른 회의이거나 제목을 바꾼 경우) 확인창에서 한 번 더 안내
      const prefix = name.slice(0, old.index).trim()
      if (prefix !== title && prefix !== safeTitle) legacy.push(file.name)
    } else {
      invalid.push(file.name)
    }
  })

  if (invalid.length > 0 || otherMeeting.length > 0) {
    await openAlert({
      title: '누락 구간 첨부',
      message:
        (invalid.length > 0 ? `누락 구간 파일이 아닙니다.${toBullets(invalid)}\n\n` : '') +
        (otherMeeting.length > 0 ? `다른 회의의 누락 구간 파일입니다.${toBullets(otherMeeting)}\n\n` : '') +
        '회의 종료 때 내려받은 "누락구간" 파일을 이름을 바꾸지 말고 첨부해 주세요.\n(전체 녹음을 다른 파일로 바꾸려면 [다른 오디오로 대체]를 사용하세요.)',
    })
    return null
  }
  items.sort((a, b) => a.index - b.index)
  for (let i = 1; i < items.length; i++) {
    if (items[i].index === items[i - 1].index) {
      openToast({
        message: `같은 구간(${items[i].index + 1}구간) 파일을 두 개 선택했습니다. 하나만 선택해 주세요.`,
        type: 'warning',
      })
      return null
    }
  }

  const overwrite = items.filter((item) => backupIndexes.includes(item.index)).map((item) => item.index + 1)
  // 파일 목록은 한 번만 보여주고, 제목이 다른 파일은 전부면 아래 한 줄로, 일부면 해당 줄에 표시
  const allLegacy = legacy.length === items.length
  const confirmed = await openConfirm({
    title: '누락 구간 첨부',
    message:
      `누락 구간 ${items.length}개를 서버 백업에 올립니다.` +
      toBullets(
        items.map((item) => {
          const mark = !allLegacy && legacy.includes(item.file.name) ? ' (회의 제목 다름)' : ''
          return `${item.index + 1}구간 - ${item.file.name}${mark}`
        }),
      ) +
      (overwrite.length > 0 || legacy.length > 0 ? '\n' : '') +
      (overwrite.length > 0 ? `\n※ ${overwrite.join(', ')}구간은 이미 서버에 있어 첨부한 파일로 바꿉니다.` : '') +
      (legacy.length > 0
        ? `\n※ ${allLegacy ? '파일명의 회의 제목이 지금 회의와 다릅니다.' : '회의 제목이 다른 파일이 있습니다.'} 이 회의 파일이 맞는지 확인해 주세요.`
        : '') +
      '\n\n계속하시겠습니까?',
  })
  if (!confirmed) return null

  // 한 파일씩 차례로 업로드 — 끝날 때까지 로딩 유지, 진행 중인 파일 번호 표시
  const uploaded: number[] = []
  openLoading({ text: `누락 구간을 올리고 있습니다... (0 / ${items.length})` })
  try {
    for (let i = 0; i < items.length; i++) {
      updateLoadingText(`누락 구간을 올리고 있습니다... (${i + 1} / ${items.length})`)
      await uploadBackupSegment(meetingId, items[i].index, items[i].file, true)
      uploaded.push(items[i].index)
    }
    return uploaded
  } catch (error) {
    console.error('[handleAttachMissingSegments] 누락 구간 첨부 실패:', error)
    const isLost = isMeetingSessionLost(error)
    openToast({
      message: `${isLost ? '로그인이 끊겨 ' : ''}누락 구간 업로드에 실패했습니다. ${isLost ? '다시 로그인한 뒤 ' : ''}다시 시도해 주세요. (이미 올라간 구간은 그대로 남습니다)`,
      type: 'error',
    })
    return uploaded.length > 0 ? uploaded : null
  } finally {
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
    // 서버가 실패를 successYn=false로 반환 — 자동저장(silent)이어도 실패는 알림
    if (res?.successYn === false) {
      openToast({ message: res.returnMsg || '회의록 저장 실패', type: 'error' })
      return null
    }
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
  // 통합 회의록 원본 여부 확인
  let message = '삭제하면 회의록도 함께 삭제됩니다. 삭제하시겠습니까?'
  try {
    const checkRes = await fetchCheckMeetingIntegration(meetingId)
    const parentMeetings = checkRes?.parentMeetings ?? []
    if (parentMeetings.length > 0) {
      const titles = parentMeetings.map((m) => `· ${m.meetingTitle}`).join('\n')
      message = `이 회의는 아래 통합 회의록의 원본입니다.\n${titles}\n\n삭제해도 통합 회의록 내용은 유지되지만 원본 목록에서 제거됩니다. 삭제하시겠습니까?`
    }
  } catch {
    // 확인 실패 시 기본 메시지로 진행
  }

  const confirmed = await openConfirm({ title: '회의 삭제', message })
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
      const mergedSttList = currentMeeting.value.sttList.map((stt) => {
        for (const group of mergeGroups) {
          if (group.removeSpeakerIds.includes(stt.speakerId)) {
            const keepSpeaker = currentMeeting.value!.speakers.find((s) => s.id === group.keepSpeakerId)
            return { ...stt, speakerId: group.keepSpeakerId, speakerName: keepSpeaker?.name ?? stt.speakerName }
          }
        }
        return stt
      })
      currentMeeting.value.sttList = syncSttListSpeakerNames(mergedSttList, currentMeeting.value.speakers)
    } else {
      // 일반 저장: 배치 API 호출
      await fetchSaveSpeakers(payload, Number(currentMeeting.value.id))

      // 로컬 speakers 상태 업데이트 → MeetingSpeakerList 반영
      speakers.forEach((updated) => {
        if (!currentMeeting.value || !updated.id) return
        const idx = currentMeeting.value.speakers.findIndex((s) => s.id === updated.id)
        if (idx > -1) {
          currentMeeting.value.speakers[idx] = { ...currentMeeting.value.speakers[idx], ...updated }
        }
      })

      // sttList 화자명 갱신 → MeetingSttList 반영
      currentMeeting.value.sttList = syncSttListSpeakerNames(
        currentMeeting.value.sttList,
        currentMeeting.value.speakers,
      )
    }

    // 회의록 HTML 갱신 (decisions 화자명 + attendees 업데이트 반영)
    const updatedDetail = await fetchMeetingDetail(Number(currentMeeting.value.id))
    const newContent = updatedDetail.minutes?.editedContent || updatedDetail.minutes?.generatedContent || ''
    if (newContent && currentMeeting.value) {
      currentMeeting.value.minutesContent = newContent
    }

    openToast({ message: '화자 정보가 저장되었습니다.' })
  } catch {
    openToast({ message: '화자 저장 실패', type: 'error' })
  }
}

// ===== 회의록 양식 =====
/** 회의록 양식 목록 조회 — 한 번 받은 목록은 재사용 (force 로 다시 조회) */
const handleSelectMinutesTmplList = async (force = false): Promise<void> => {
  if (minutesTmplList.value !== null && !force) return
  minutesTmplErrorMessage.value = ''
  isLoadingMinutesTmpl.value = true
  try {
    const res = await fetchMeetingTmplList()
    if (!res.successYn) {
      minutesTmplErrorMessage.value = res.returnMsg || '회의록 양식을 불러오지 못했습니다.'
      return
    }
    minutesTmplList.value = res.list ?? []
  } catch {
    minutesTmplErrorMessage.value = '회의록 양식을 불러오지 못했습니다.'
  } finally {
    isLoadingMinutesTmpl.value = false
  }
}

// ===== 회의록 생성 (CMB 와 같은 흐름: 화자 분리 → 화자 정리 → "회의록 생성" → 백그라운드 생성 + 상태 확인) =====
/** 상태 확인 간격 — 서버가 백그라운드로 생성하므로 화면은 주기적으로 상태만 본다 */
const MINUTES_POLL_INTERVAL_MS = 3000
let minutesPollTimer: ReturnType<typeof setTimeout> | null = null
let minutesPollMeetingId: number | null = null

const stopMinutesPolling = () => {
  if (minutesPollTimer) clearTimeout(minutesPollTimer)
  minutesPollTimer = null
  minutesPollMeetingId = null
}

/** 생성 완료 — 상세의 회의록 · 회의 정보와 에디터 내용, 제목(자동 제목)을 교체 */
const applyMinutesDone = (meetingId: number, res: MeetingMinutesStatusResponse) => {
  if (res.minutes) meetingDetail.value.minutes = res.minutes
  if (res.meeting) meetingDetail.value.meeting = res.meeting
  if (currentMeeting.value && currentMeeting.value.id === String(meetingId)) {
    currentMeeting.value.minutesContent = res.minutes?.editedContent || res.minutes?.generatedContent || ''
    if (res.meeting?.meetingTitle) currentMeeting.value.title = res.meeting.meetingTitle
    if (res.meeting?.status) currentMeeting.value.status = res.meeting.status
    currentMeeting.value.updatedAt = res.minutes?.modifyDt || res.minutes?.createDt || currentMeeting.value.updatedAt
  }
}

/**
 * 회의록 생성 상태 확인 — 생성 중이면 끝날 때까지 주기적으로 다시 확인
 * @param notify 완료·실패 토스트를 띄울지 (화면 진입 시 이미 끝난 상태면 false)
 */
const handleCheckMinutesStatus = async (meetingId: number, notify = false): Promise<void> => {
  if (minutesPollMeetingId !== null && minutesPollMeetingId !== meetingId) stopMinutesPolling()
  try {
    const res = await fetchMeetingMinutesStatus(meetingId)
    // 확인하는 사이 다른 회의로 이동했으면 반영하지 않음
    if (currentMeeting.value && currentMeeting.value.id !== String(meetingId)) return
    if (!res.successYn) return
    minutesState.value = res.state
    minutesStatusMessage.value = res.message || ''
    minutesStatusStep.value = res.step || ''

    if (res.state === 'processing') {
      minutesPollMeetingId = meetingId
      minutesPollTimer = setTimeout(() => handleCheckMinutesStatus(meetingId, true), MINUTES_POLL_INTERVAL_MS)
      return
    }
    stopMinutesPolling()
    if (res.state === 'done') {
      applyMinutesDone(meetingId, res)
      if (notify) openToast({ message: '회의록을 생성했습니다.' })
    } else if (res.state === 'error' && notify) {
      openToast({ message: res.message || '회의록 생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    // 일시적인 네트워크 오류는 다음 확인에서 다시 시도
    if (minutesState.value === 'processing') {
      minutesPollMeetingId = meetingId
      minutesPollTimer = setTimeout(() => handleCheckMinutesStatus(meetingId, true), MINUTES_POLL_INTERVAL_MS)
    }
  }
}

/**
 * 회의록 생성 시작 — "회의록 생성" / "이 양식으로 다시 생성"
 * - 서버는 바로 반환하고 백그라운드로 생성한다. 다시 생성이면 기존 회의록은 완료 시점에 교체됨
 * @returns 시작 여부
 */
const handleStartMinutes = async (params: MeetingStartMinutesParams): Promise<boolean> => {
  if (minutesState.value === 'processing') return false
  try {
    const res = await fetchStartMeetingMinutes(params)
    if (!res.successYn) {
      openToast({ message: res.returnMsg || '회의록 생성을 시작하지 못했습니다.', type: 'error' })
      return false
    }
    minutesState.value = 'processing'
    minutesStatusMessage.value = ''
    stopMinutesPolling()
    minutesPollMeetingId = params.meetingId
    minutesPollTimer = setTimeout(() => handleCheckMinutesStatus(params.meetingId, true), MINUTES_POLL_INTERVAL_MS)
    return true
  } catch {
    openToast({ message: '회의록 생성을 시작하지 못했습니다.', type: 'error' })
    return false
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

/** 회의 통합 */
const handleIntegrateMeeting = async (meetingIds: number[], showSpeakerYn: 'Y' | 'N' = 'Y') => {
  openLoading({ text: '회의록을 통합하는 중입니다...' })
  try {
    const res = await fetchIntegrateMeeting(meetingIds, showSpeakerYn)
    if (!res.successYn) {
      openToast({ message: '회의 통합에 실패했습니다.', type: 'error' })
      return false
    }
    // 서버가 통합 회의록을 백그라운드로 생성 — 상세 화면에서 진행 상황을 확인
    openToast({ message: '회의를 통합했습니다. 회의록을 생성하고 있습니다.' })
    const meetingId = res.meetingId
    if (meetingId) {
      navigateTo(`/meeting/${meetingId}`)
      return true
    } else {
      openToast({ message: '회의 통합에 실패했습니다.', type: 'error' })
      return false
    }
  } catch {
    openToast({ message: '회의 통합이 실패했습니다.' })
    return false
  } finally {
    closeLoading()
  }
}

const MEETING_PRINT_HOST_ID = 'meeting-minutes-print-host'
const MEETING_PRINT_STYLE_ID = 'meeting-minutes-print-style'

const downloadAsPdf = async (html: string, _fileName: string) => {
  if (!html?.trim()) {
    openToast({ message: '다운로드할 회의록 내용이 없습니다.', type: 'warning' })
    return
  }

  document.getElementById(MEETING_PRINT_STYLE_ID)?.remove()
  document.getElementById(MEETING_PRINT_HOST_ID)?.remove()

  const styleEl = document.createElement('style')
  styleEl.id = MEETING_PRINT_STYLE_ID
  styleEl.textContent = buildMeetingPrintCss(MEETING_PRINT_HOST_ID)
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
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${MEETING_DOCX_CSS}</style></head><body>${html}</body></html>`
    const blob = (await asBlob(fullHtml)) as Blob
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

/**
 * 화자 칩 클릭 → STT 목록 내비게이션
 * - 다른 화자 클릭: 해당 화자의 가장 최신(마지막) 발화로 이동
 * - 같은 화자 재클릭: 바로 위(이전) 발화로 이동, 처음이면 다시 마지막으로 순환
 */
const navigateSpeakerUtterance = (speakerId: string) => {
  if (!currentMeeting.value) return
  const items = currentMeeting.value.sttList.filter((s) => s.speakerId === speakerId)
  if (items.length === 0) return

  if (speakerId !== speakerNavSpeakerId.value) {
    speakerNavSpeakerId.value = speakerId
    focusedSttItemId.value = items[items.length - 1].id
  } else {
    const currentIdx = items.findIndex((i) => i.id === focusedSttItemId.value)
    if (currentIdx > 0) {
      focusedSttItemId.value = items[currentIdx - 1].id
    } else {
      // 처음에 도달하면 마지막으로 순환
      focusedSttItemId.value = items[items.length - 1].id
    }
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
    voiceEnrollDone,
    currentStepKey,
    detailSteps,
    initDetailStep,
    getStepBlockMsg,
    speakerNavSpeakerId,
    focusedSttItemId,
    navigateSpeakerUtterance,
    isSearchOpen,
    searchType,
    searchKeyword,
    filteredSttList,
    toggleSearch,
    handleSelectUserList,
    handleSelectMeetingList,
    handleBulkDeleteMeetings,
    handleBulkExportPdf,
    handleSelectMeetingDetail,
    handleStreamInfographic,
    handleCreateMeeting,
    handleVoiceEnroll,
    handleSelectVoiceEnrollmentList,
    handleFinishMeetingWithAudio,
    handleProcessUploadedMeeting,
    handleRecoverMeeting,
    handleRetryDiarize,
    handleAttachMissingSegments,
    handleSaveMeeting,
    minutesTmplList,
    isLoadingMinutesTmpl,
    minutesTmplErrorMessage,
    minutesState,
    minutesStatusMessage,
    minutesStatusStep,
    handleSelectMinutesTmplList,
    handleStartMinutes,
    handleCheckMinutesStatus,
    stopMinutesPolling,
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
    handleIntegrateMeeting,
  }
}
