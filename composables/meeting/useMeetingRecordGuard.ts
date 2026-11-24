/**
 * 회의 녹음 보호 — 10분 백업 조각 업로드 / heartbeat / 로그인 끊김 감지 / 이탈 처리 / 화면 꺼짐 방지
 *
 * ── 방식 (CMB 회의록 에이전트와 동일) ────────────────────────────────
 * - 10분마다 MediaRecorder 를 교체하고 이전 구간을 S3 backup/backup_N.webm 으로 올린다
 * - 로그인 끊김·업로드 실패 중에는 교체하지 않고 녹음을 이어간다
 *   → 마지막 백업 이후가 하나의 연속된 webm 으로 남아, 끝내 못 올리면 회의 종료 때 파일 1개로 내려받는다
 *   (webm 조각은 각자 헤더가 있어 브라우저에서 이어 붙일 수 없으므로 처음부터 끊지 않는 방식)
 * - 녹음 중 요청은 useApi 를 쓰지 않는다 — 401 이면 /login 으로 이동해 녹음이 사라지기 때문.
 *   로그인 끊김은 표시만 하고, 다른 탭에서 다시 로그인하면 이어서 올린다
 * - 30초 heartbeat 가 3분 넘게 끊기면 서버가 비정상 종료로 판정한다
 *
 * ── 누락 구간 파일명 ─────────────────────────────────────────────────
 * {회의제목}_누락구간_{구간번호}_mt{회의ID}.webm (구간번호는 1부터)
 */

import type { MeetingBackupSegment } from '~/types/meeting'

const HEARTBEAT_INTERVAL_MS = 30_000 // 30초

/** 로그인 끊김 오류 — 401 / 세션 만료 응답 / 로그인 화면(HTML) 응답 */
export class MeetingSessionLostError extends Error {
  readonly isSessionLost = true
  constructor(message = '로그인이 끊겼습니다.') {
    super(message)
    this.name = 'MeetingSessionLostError'
  }
}

export const isMeetingSessionLost = (error: unknown): boolean =>
  !!error && typeof error === 'object' && (error as { isSessionLost?: boolean }).isSessionLost === true

// ─── module-scope 상태 (녹음 패널·컨트롤 간 공유) ──────────────────────
/** 녹음 중 로그인 끊김 여부 */
const isSessionLost = ref(false)
/** 서버에 올리지 못해 보관 중인 백업 조각 수 (로그인 끊김이 아닌 업로드 실패 안내용) */
const failedBackupCount = ref(0)
/** Screen Wake Lock 지원 여부 */
const isWakeLockSupported = ref(false)

let guardMeetingId: number | null = null
/** 다음 백업 조각 번호 */
let backupIndex = 0
/** 진행 중인 백업 업로드 — 회의 종료 때 모두 기다림 */
let backupUploads: Promise<void>[] = []
/** 업로드에 실패해 보관한 조각 */
let failedBackups: MeetingBackupSegment[] = []

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let wakeLock: WakeLockSentinel | null = null
let pageHideHandler: (() => void) | null = null
let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null
let visibilityHandler: (() => void) | null = null
/** pagehide 때 보낼 현재 구간 Blob 공급자 (녹음 모듈이 등록) */
let currentSegmentProvider: (() => Blob | null) | null = null

const setFailedBackups = (list: MeetingBackupSegment[]) => {
  failedBackups = list
  failedBackupCount.value = list.length
}

// ─── 백그라운드 요청 (로그인 화면으로 이동하지 않음) ─────────────────

/**
 * 녹음 중 서버 요청 — 실패해도 페이지를 옮기지 않는다
 * - 401 / errorType=sessionExpired / HTML(로그인 화면) 응답 → MeetingSessionLostError
 * - successYn=false → Error(returnMsg)
 */
const backgroundRequest = async <T extends { successYn?: boolean; returnMsg?: string }>(
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, { credentials: 'include', ...init })
  const isHtml = response.headers.get('content-type')?.includes('text/html') === true
  if (response.status === 401 || isHtml || response.redirected) {
    throw new MeetingSessionLostError()
  }
  const data = (await response.json().catch(() => ({}))) as T & { errorType?: string; message?: string }
  if (data.errorType === 'sessionExpired') throw new MeetingSessionLostError()
  if (!response.ok) throw new Error(data.message || data.returnMsg || `요청에 실패했습니다. (${response.status})`)
  if (data.successYn === false) throw new Error(data.returnMsg || '요청에 실패했습니다.')
  return data
}

/** heartbeat — LAST_HEARTBEAT_DT 갱신 (로그인 상태 확인 겸용) */
const postHeartbeat = (meetingId: number) =>
  backgroundRequest(`/api/meeting/${meetingId}/heartbeat`, { method: 'POST' })

/**
 * 백업 조각 업로드 — backup_{index}.webm
 * @param attach 누락 구간 첨부 여부 (녹음 중이 아니므로 heartbeat 를 갱신하지 않음)
 */
const uploadBackupSegment = (meetingId: number, index: number, blob: Blob, attach = false) => {
  const formData = new FormData()
  formData.append('fileIndex', String(index))
  if (attach) formData.append('attachYn', 'Y')
  formData.append('audioFile', blob, `backup_${index}.webm`)
  return backgroundRequest(`/api/meeting/${meetingId}/backup-audio`, { method: 'POST', body: formData })
}

/** 실시간 자막 임시 토큰 — 녹음 중 재연결에도 쓰이므로 로그인 끊김 시 화면을 옮기지 않음 */
const fetchRealtimeTokenSafe = (meetingId?: number | null) =>
  backgroundRequest<{ successYn?: boolean; returnMsg?: string; token: string; expiresAt: number }>(
    // meetingId 가 있으면 서버가 회의 제목 · 참석자를 전사 문맥 힌트로 넣음
    meetingId ? `/api/meeting/realtime-token?meetingId=${meetingId}` : '/api/meeting/realtime-token',
  )

/** 회의 종료 오디오 업로드 (10분 미만 녹음 — 백업 조각 없음) */
const uploadFinishAudio = (meetingId: number, blob: Blob) => {
  const formData = new FormData()
  formData.append('meetingId', String(meetingId))
  formData.append('audioFile', blob, 'meeting.webm')
  return backgroundRequest('/api/ai/meeting/finishMeetingWithAudio.do', { method: 'POST', body: formData })
}

/** 서버에 일시정지 표시 — heartbeat 해제 + PAUSE_YN=Y (마지막 구간 백업 조각을 올린 뒤 호출) */
const pauseOnServer = (meetingId: number) => backgroundRequest(`/api/meeting/${meetingId}/pause`, { method: 'POST' })

/** 서버에 비정상 종료 표시 (녹음 중인 회의만 반영 — 로그인이 끊겼으면 실패, 3분 뒤 heartbeat 판정으로 표시됨) */
const markAbnormalOnServer = async (meetingId: number) => {
  try {
    await backgroundRequest(`/api/meeting/${meetingId}/cancel`, { method: 'POST' })
  } catch (e) {
    console.warn('[RecordGuard] 비정상 종료 표시 실패:', e)
  }
}

// ─── 로그인 끊김 ─────────────────────────────────────────────────────

const onSessionLost = () => {
  if (isSessionLost.value) return
  isSessionLost.value = true
  openToast({
    message: '로그인이 끊겼습니다. 녹음은 계속됩니다. 다른 탭에서 다시 로그인하면 이어서 저장됩니다.',
    type: 'warning',
  })
}

/** 업로드 실패 처리 — 로그인 끊김이면 표시, 아니면 다음 주기에 재시도 */
const handleUploadError = (segment: MeetingBackupSegment, error: unknown) => {
  console.warn(`[RecordGuard] 녹음 백업 실패 (backup_${segment.index}):`, error)
  setFailedBackups([...failedBackups, { index: segment.index, blob: segment.blob }])
  if (isMeetingSessionLost(error)) onSessionLost()
}

/** 보관한 실패 조각을 다시 올림 (회의 종료 때도 기다리도록 backupUploads 에 등록) */
const retryFailedBackups = () => {
  if (guardMeetingId === null) return
  const meetingId = guardMeetingId
  const items = failedBackups.slice()
  setFailedBackups([])
  items.forEach((item) => {
    backupUploads.push(
      uploadBackupSegment(meetingId, item.index, item.blob)
        .then(() => undefined)
        .catch((error) => handleUploadError(item, error)),
    )
  })
}

/** 다시 로그인했는지 확인 — 로그인돼 있으면 보관한 조각을 다시 올림 */
const tryReconnect = async (): Promise<boolean> => {
  if (guardMeetingId === null) return false
  try {
    await postHeartbeat(guardMeetingId)
  } catch {
    return false
  }
  if (isSessionLost.value) {
    isSessionLost.value = false
    retryFailedBackups()
    openToast({ message: '로그인이 다시 연결되었습니다. 녹음 백업을 이어서 진행합니다.' })
  }
  return true
}

const sendHeartbeat = async () => {
  if (guardMeetingId === null) return
  // 로그인이 끊긴 동안은 heartbeat 대신 다시 로그인했는지 확인
  if (isSessionLost.value) {
    await tryReconnect()
    return
  }
  try {
    await postHeartbeat(guardMeetingId)
  } catch (e) {
    if (isMeetingSessionLost(e)) {
      onSessionLost()
      return
    }
    // 일시적인 오류는 다음 주기에 다시 보냄 (3분 넘게 끊기면 비정상 종료로 표시)
    console.warn('[RecordGuard] heartbeat 실패:', e)
  }
}

// ─── 10분 구간 교체 ──────────────────────────────────────────────────

/**
 * 구간을 끊어도 되는지 확인 (10분 주기 직전)
 * - 로그인 끊김 중 → 끊지 않음
 * - 실패 조각이 있으면 먼저 다시 올려 보고 이번 주기는 끊지 않음
 * - 끊김을 아직 감지하지 못한 채 끊으면 못 올린 파일이 2개로 나뉘므로 직전에 로그인 확인
 *   (일시적인 네트워크 오류면 이번 주기는 끊지 않고 이어서 녹음 → 다음 주기에 다시 확인)
 */
const canRotateSegment = async (): Promise<boolean> => {
  if (guardMeetingId === null || isSessionLost.value) return false
  if (failedBackups.length > 0) {
    retryFailedBackups()
    return false
  }
  try {
    await postHeartbeat(guardMeetingId)
    return true
  } catch (e) {
    if (isMeetingSessionLost(e)) onSessionLost()
    else console.warn('[RecordGuard] 구간 교체 전 로그인 확인 실패 — 이번 주기는 이어서 녹음:', e)
    return false
  }
}

/** 다음 조각 번호 할당 */
const takeNextIndex = () => backupIndex++

/** 현재 조각 번호 (아직 할당 전 — 마지막 구간용) */
const peekNextIndex = () => backupIndex

/**
 * 끊은 구간 업로드 등록 — blob 이 준비되면(onstop) 올림
 * 구간이 끝나기 전에 회의를 종료해도 이 업로드를 기다리도록 바로 등록한다
 */
const registerSegmentUpload = (index: number, blobPromise: Promise<Blob>) => {
  if (guardMeetingId === null) return
  const meetingId = guardMeetingId
  backupUploads.push(
    blobPromise.then(async (blob) => {
      if (blob.size === 0) return
      try {
        await uploadBackupSegment(meetingId, index, blob)
      } catch (error) {
        handleUploadError({ index, blob }, error)
      }
    }),
  )
}

/**
 * 진행 중이던 업로드를 기다린 뒤, 실패한 조각과 마지막 구간을 올리고 끝내 못 올린 조각 목록을 돌려줌
 */
const flushBackups = async (lastItem?: MeetingBackupSegment | null): Promise<MeetingBackupSegment[]> => {
  await Promise.all(backupUploads)
  backupUploads = []
  if (guardMeetingId === null) return []
  const meetingId = guardMeetingId
  const pending: MeetingBackupSegment[] = failedBackups.slice()
  if (lastItem && lastItem.blob && lastItem.blob.size > 0) pending.push(lastItem)
  setFailedBackups([])

  const done = new Set<number>()
  // 하나가 실패해도 나머지 업로드가 끝날 때까지 기다림
  await Promise.all(
    pending.map((item) =>
      uploadBackupSegment(meetingId, item.index, item.blob)
        .then(() => {
          done.add(item.index)
        })
        .catch((error) => {
          item.error = error
        }),
    ),
  )
  return pending.filter((item) => !done.has(item.index)).sort((a, b) => a.index - b.index)
}

// ─── 누락 구간 파일 ──────────────────────────────────────────────────

/** 파일명에 쓸 수 없는 문자 치환 */
const toSafeFileTitle = (title: string) => (title || '회의').replace(/[\\/:*?"<>|]/g, '_')

/**
 * 서버에 올리지 못한 구간 내려받기 — 비정상 종료 화면의 [누락 구간 첨부]로 다시 올릴 수 있도록
 * 파일명에 회의 ID·구간 번호를 넣어 첨부할 때 다른 회의 파일을 막고 순서를 맞춘다
 * @returns 내려받은 파일명 목록
 */
const downloadUnsentSegments = (meetingId: number, title: string, items: MeetingBackupSegment[]): string[] => {
  const safeTitle = toSafeFileTitle(title)
  const names: string[] = []
  items.forEach((item, i) => {
    const fileName = `${safeTitle}_누락구간_${item.index + 1}_mt${meetingId}.webm`
    names.push(fileName)
    // 크롬은 연속 다운로드를 막을 수 있어 간격을 둠 (보통은 파일 1개)
    setTimeout(() => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(item.blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
    }, i * 800)
  })
  return names
}

// ─── 이탈 / 화면 꺼짐 방지 ───────────────────────────────────────────

/**
 * 탭 닫기·새로고침 (pagehide) — 비정상 종료 표시 + 마지막 구간 전송 시도
 * sendBeacon 은 브라우저 한도(약 64KB)를 넘으면 보내지 않으므로 마지막 백업 이후 구간은 대부분 유실된다
 */
const sendLeaveBeacon = () => {
  if (guardMeetingId === null || !navigator.sendBeacon) return
  navigator.sendBeacon(`/api/meeting/${guardMeetingId}/cancel`)
  const blob = currentSegmentProvider?.()
  if (blob && blob.size > 0) {
    const formData = new FormData()
    formData.append('fileIndex', String(backupIndex))
    formData.append('audioFile', blob, `backup_${backupIndex}.webm`)
    navigator.sendBeacon(`/api/meeting/${guardMeetingId}/backup-audio`, formData)
  }
}

/**
 * Screen Wake Lock — 녹음 중 사용자 입력이 없어도 화면이 꺼지거나 잠기지 않게 함 (HTTPS·탭이 보일 때만 가능)
 * 덮개 닫기·전원 버튼·Win+L·회사 보안정책의 강제 잠금은 막지 못함
 */
const requestWakeLock = async () => {
  if (!isWakeLockSupported.value || guardMeetingId === null) return
  if (document.visibilityState !== 'visible') return
  if (wakeLock && !wakeLock.released) return
  try {
    const lock = await navigator.wakeLock.request('screen')
    // 요청 사이에 녹음이 끝났으면 바로 해제
    if (guardMeetingId === null) {
      lock.release().catch(() => {})
      return
    }
    wakeLock = lock
  } catch (e) {
    // 배터리 절약 모드 등으로 거부될 수 있음 — 녹음은 그대로 진행
    console.warn('[RecordGuard] 화면 꺼짐 방지(wake lock) 요청 실패:', e)
  }
}

const releaseWakeLock = () => {
  const lock = wakeLock
  wakeLock = null
  if (lock && !lock.released) lock.release().catch(() => {})
}

/** 브라우저 지원 여부 확인 — onMounted 에서 호출 */
const checkWakeLockSupport = () => {
  isWakeLockSupported.value = typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

// ─── 시작 / 종료 ─────────────────────────────────────────────────────

/**
 * 녹음 시작 시 — heartbeat, 탭 닫기·새로고침 감지, 화면 꺼짐 방지
 * @param startIndex 첫 백업 조각 번호 (이어서 녹음이면 서버의 마지막 번호 + 1)
 * @param segmentProvider pagehide 때 보낼 현재 구간 Blob 공급자
 */
const startRecordGuard = (meetingId: number, startIndex: number, segmentProvider: () => Blob | null) => {
  stopRecordGuard()
  guardMeetingId = meetingId
  backupIndex = startIndex
  backupUploads = []
  setFailedBackups([])
  isSessionLost.value = false
  currentSegmentProvider = segmentProvider

  sendHeartbeat()
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

  pageHideHandler = () => sendLeaveBeacon()
  beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    // 녹음 중 새로고침·탭 닫기 시 브라우저 확인창 표시
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('pagehide', pageHideHandler)
  window.addEventListener('beforeunload', beforeUnloadHandler)

  // 화면 꺼짐·자동 잠금·자동 절전 방지 — 탭이 가려지면 브라우저가 자동 해제하므로 다시 보일 때 재요청
  checkWakeLockSupport()
  requestWakeLock()
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') requestWakeLock()
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

/** 타이머·이벤트 해제 (백업 상태는 flushBackups 가 끝날 때까지 유지) */
const stopRecordGuard = () => {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (pageHideHandler) window.removeEventListener('pagehide', pageHideHandler)
  if (beforeUnloadHandler) window.removeEventListener('beforeunload', beforeUnloadHandler)
  if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
  pageHideHandler = null
  beforeUnloadHandler = null
  visibilityHandler = null
  currentSegmentProvider = null
  releaseWakeLock()
}

/** 녹음 보호 상태 초기화 (회의 종료·이탈 처리가 모두 끝난 뒤) */
const resetRecordGuard = () => {
  stopRecordGuard()
  guardMeetingId = null
  backupIndex = 0
  backupUploads = []
  setFailedBackups([])
  isSessionLost.value = false
}

export const useMeetingRecordGuard = () => ({
  isSessionLost,
  failedBackupCount,
  isWakeLockSupported,
  checkWakeLockSupport,
  startRecordGuard,
  stopRecordGuard,
  resetRecordGuard,
  tryReconnect,
  canRotateSegment,
  takeNextIndex,
  peekNextIndex,
  registerSegmentUpload,
  flushBackups,
  downloadUnsentSegments,
  markAbnormalOnServer,
  pauseOnServer,
  uploadBackupSegment,
  uploadFinishAudio,
  fetchRealtimeTokenSafe,
  toSafeFileTitle,
})
