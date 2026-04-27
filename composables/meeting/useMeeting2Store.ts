import { useMeeting2Api } from '~/composables/meeting/useMeeting2Api'
import type {
  Meeting,
  MeetingSpeaker,
  RecordStatus,
  MeetingRecipient,
  MeetingUser,
  MeetingFileFormat,
} from '~/types/meeting2'

const {
  fetchMeetingList,
  fetchMeetingDetail,
  fetchSaveMeeting,
  fetchDeleteMeeting,
  fetchSaveSpeaker,
  fetchSaveSpeakers,
  fetchSttDummy,
  fetchSearchUsers,
  fetchMatchUsersByNames,
} = useMeeting2Api()

// ===== 상태 =====
const meetingList = ref<Meeting[]>([])
const currentMeeting = ref<Meeting | null>(null)
const recordStatus = ref<RecordStatus>('idle')
const elapsedSeconds = ref(0)
const selectedSpeaker = ref<MeetingSpeaker | null>(null)
const isSpeakerEditOpen = ref(false)
const isTemplateSelectOpen = ref(false)

// 모달 상태 (메일 발송)
const isMailSendOpen = ref(false)
const mailInitialRecipients = ref<MeetingRecipient[]>([])

// 모달 상태 (회의 정보 편집)
const isInfoEditOpen = ref(false)

// 사용자 검색 결과
const userSearchResults = ref<MeetingUser[]>([])

let recordTimer: ReturnType<typeof setInterval> | null = null
let sttDummyTimer: ReturnType<typeof setInterval> | null = null

// ===== 조회 =====
/** 회의 목록 조회 */
const handleSelectMeetingList = async () => {
  try {
    const res = await fetchMeetingList()
    meetingList.value = res?.list ?? []
  } catch {
    openToast({ message: '회의 목록 조회 실패', type: 'error' })
  }
}

/** 회의 단건 조회 */
const handleSelectMeetingDetail = async (id: string) => {
  try {
    const res = await fetchMeetingDetail(id)
    currentMeeting.value = res?.data ?? null
  } catch {
    openToast({ message: '회의 상세 조회 실패', type: 'error' })
  }
}

// ===== 녹음 =====
/** 녹음 시작 */
const handleStartRecord = () => {
  if (recordStatus.value === 'recording') return
  recordStatus.value = 'recording'
  // 시간 카운트
  recordTimer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
  // STT 더미 발화 자동 추가 (3초마다)
  if (currentMeeting.value) {
    sttDummyTimer = setInterval(async () => {
      const meetingId = currentMeeting.value?.id
      if (!meetingId) return
      const res = await fetchSttDummy(meetingId)
      if (res?.data && currentMeeting.value) {
        currentMeeting.value.sttList = [...currentMeeting.value.sttList, res.data]
      }
    }, 3000)
  }
}

/** 녹음 일시정지 */
const handlePauseRecord = () => {
  recordStatus.value = 'paused'
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
  if (sttDummyTimer) {
    clearInterval(sttDummyTimer)
    sttDummyTimer = null
  }
}

/** 녹음 중지 */
const handleStopRecord = () => {
  openConfirm({
    title: '녹음 중지',
    message: '녹음을 중지하시겠습니까?',
    onConfirm: () => {
      recordStatus.value = 'stopped'
      if (recordTimer) {
        clearInterval(recordTimer)
        recordTimer = null
      }
      if (sttDummyTimer) {
        clearInterval(sttDummyTimer)
        sttDummyTimer = null
      }
      openToast({ message: '녹음이 중지되었습니다.' })
    },
  })
}

/** 녹음 시간 초기화 */
const handleResetRecord = () => {
  recordStatus.value = 'idle'
  elapsedSeconds.value = 0
  if (recordTimer) clearInterval(recordTimer)
  if (sttDummyTimer) clearInterval(sttDummyTimer)
  recordTimer = null
  sttDummyTimer = null
}

// ===== 회의록 =====
/**
 * 회의록 저장
 * @param meeting 저장할 부분 객체 (id 없으면 신규)
 * @param options.silent true면 성공 토스트 생략 + currentMeeting을 통째로 덮지 않음(updatedAt만 동기화)
 *                       — 자동 저장 시 사용자 타이핑 중 에디터 깜빡임 방지
 * @returns 서버에서 반환한 Meeting (실패 시 null)
 */
const handleSaveMeeting = async (
  meeting: Partial<Meeting>,
  options: { silent?: boolean } = {},
): Promise<Meeting | null> => {
  try {
    const res = await fetchSaveMeeting(meeting)
    if (res?.data && currentMeeting.value) {
      if (options.silent) {
        // 자동 저장 — 사용자 진행 중인 입력 보존, 메타만 갱신
        currentMeeting.value.updatedAt = res.data.updatedAt
        currentMeeting.value.id = res.data.id
      } else {
        currentMeeting.value = res.data
      }
    } else if (res?.data) {
      // currentMeeting이 비어있는 경우(신규 생성) — 그대로 세팅
      currentMeeting.value = res.data
    }
    if (!options.silent) openToast({ message: '저장되었습니다.' })
    return res?.data ?? null
  } catch {
    openToast({ message: '회의록 저장 실패', type: 'error' })
    return null
  }
}

/** AI 요약 재생성 (더미) */
const handleRegenerateMinutes = async () => {
  openConfirm({
    title: 'AI 요약 재생성',
    message: '회의록을 다시 생성하시겠습니까?\n기존 편집 내용이 덮어써질 수 있습니다.',
    onConfirm: () => {
      // 🔽 더미 — 실제 LLM 호출로 교체
      openToast({ message: 'AI 요약이 재생성되었습니다.' })
    },
  })
}

/** 회의 삭제 */
const handleDeleteMeeting = async (id: string) => {
  openConfirm({
    message: '회의를 삭제하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchDeleteMeeting(id)
        openToast({ message: '회의가 삭제되었습니다.' })
        await handleSelectMeetingList()
      } catch {
        openToast({ message: '회의 삭제 실패', type: 'error' })
      }
    },
  })
}

// ===== 화자 =====
/** 화자 편집 모달 열기 */
const openSpeakerEditModal = (speaker?: MeetingSpeaker) => {
  selectedSpeaker.value = speaker ?? null
  isSpeakerEditOpen.value = true
}

/** 화자 정보 저장 (단건 — 모달용, 색상/별칭 변경) */
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

/** 화자 일괄 저장 (인라인 편집 — 이름 매핑) */
const handleSaveSpeakers = async (speakers: Partial<MeetingSpeaker>[]) => {
  if (!currentMeeting.value) return
  try {
    const res = await fetchSaveSpeakers(currentMeeting.value.id, speakers)
    if (res?.list && currentMeeting.value) {
      currentMeeting.value.speakers = res.list
      // STT 화자명 동기화 (화자1 → 실명 매핑이 STT 리스트에도 즉시 반영)
      currentMeeting.value.sttList = currentMeeting.value.sttList.map((stt) => {
        const speaker = res.list.find((s) => s.id === stt.speakerId)
        return speaker ? { ...stt, speakerName: speaker.name } : stt
      })
    }
    openToast({ message: '화자 정보가 저장되었습니다.' })
  } catch {
    openToast({ message: '화자 저장 실패', type: 'error' })
  }
}

// ===== 템플릿 =====
/** 템플릿 선택 모달 열기 */
const openTemplateSelectModal = () => {
  isTemplateSelectOpen.value = true
}

/** 템플릿 적용 */
const handleSelectTemplate = (templateId: string) => {
  if (currentMeeting.value) currentMeeting.value.templateId = templateId
  isTemplateSelectOpen.value = false
  openToast({ message: '템플릿이 적용되었습니다.' })
}

// ===== 파일 저장 (드롭다운에서 직접 다운로드) =====
/**
 * 파일 다운로드 — 브라우저가 OS 다운로드 다이얼로그를 띄움
 * 🔽 PDF/DOCX/HWP는 서버 변환 필요 → 현재는 HTML로 fallback (확장자만 다름)
 *    백엔드 완성 시: const blob = await fetchExportFile(meetingId, format) → 같은 방식 다운로드
 */
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
    // HTML 태그 제거 → plain text
    const div = document.createElement('div')
    div.innerHTML = html
    content = div.innerText
    mimeType = 'text/plain;charset=utf-8'
  } else if (format === 'md') {
    // 간단 변환 (h2 → ##, h3 → ###, br → \n) — 후속에 정식 마크다운 변환 라이브러리
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
    // pdf / docx / hwp — 서버 변환 필요. 현재 데모로 HTML 다운로드
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

// ===== 메일 발송 (모달) =====
/** 메일 발송 모달 열기 — 참석자 자동 매칭 */
const handleOpenMailSend = async () => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  // 회의 참석자 이름 → 사용자 정보 매칭
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
  // 기존 수신자가 있으면 우선
  if (currentMeeting.value.recipients.length > 0) {
    initial = currentMeeting.value.recipients
  }
  mailInitialRecipients.value = initial
  isMailSendOpen.value = true
}

/** 메일 발송 실행 — 더미 */
const doSendMail = (recipients: MeetingRecipient[]) => {
  if (!currentMeeting.value) return
  currentMeeting.value.recipients = recipients
  // 🔽 더미 — 실제 발송은 후속 (메일 서버 연동)
  openToast({ message: `${recipients.length}명에게 회의록이 발송되었습니다.` })
  isMailSendOpen.value = false
}

/** 사용자 검색 (디바운싱은 호출 측에서) */
const handleSearchUsers = async (keyword: string) => {
  try {
    const res = await fetchSearchUsers(keyword)
    userSearchResults.value = res?.list ?? []
  } catch {
    userSearchResults.value = []
  }
}

/** 회의록 공유 (링크 복사) — 더미 */
const handleShareMeeting = () => {
  openToast({ message: '공유 링크가 복사되었습니다.' })
}

// ===== 회의 정보 편집 (모달) =====
/** 회의 정보 편집 모달 열기 */
const openInfoEditModal = () => {
  if (!currentMeeting.value) {
    openToast({ message: '회의 정보가 없습니다.', type: 'warning' })
    return
  }
  isInfoEditOpen.value = true
}

export const useMeeting2Store = () => {
  return {
    // 상태
    meetingList,
    currentMeeting,
    recordStatus,
    elapsedSeconds,
    selectedSpeaker,
    isSpeakerEditOpen,
    isTemplateSelectOpen,
    isMailSendOpen,
    mailInitialRecipients,
    isInfoEditOpen,
    userSearchResults,
    // 조회
    handleSelectMeetingList,
    handleSelectMeetingDetail,
    // 녹음
    handleStartRecord,
    handlePauseRecord,
    handleStopRecord,
    handleResetRecord,
    // 회의록
    handleSaveMeeting,
    handleRegenerateMinutes,
    handleDeleteMeeting,
    // 화자
    openSpeakerEditModal,
    handleSaveSpeaker,
    handleSaveSpeakers,
    // 템플릿
    openTemplateSelectModal,
    handleSelectTemplate,
    // 파일 다운로드 (드롭다운에서 형식 선택 후 즉시 다운로드)
    handleDownloadFile,
    // 메일 발송 (모달)
    handleOpenMailSend,
    doSendMail,
    handleSearchUsers,
    // 공유
    handleShareMeeting,
    // 회의 정보 편집 (모달)
    openInfoEditModal,
  }
}
