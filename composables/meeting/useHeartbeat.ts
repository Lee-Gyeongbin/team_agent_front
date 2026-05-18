/**
 * 회의 Heartbeat / Cancel Beacon 관리
 *
 * - startHeartbeat: 30초마다 POST /api/meeting/{meetingId}/heartbeat 호출
 * - stopHeartbeat: clearInterval
 * - registerUnloadBeacon: beforeunload 시 sendBeacon으로 cancel 호출
 * - unregisterUnloadBeacon: beforeunload 이벤트 제거
 */

const HEARTBEAT_INTERVAL_MS = 30_000 // 30초

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let unloadHandler: (() => void) | null = null

/** 30초마다 Heartbeat 전송 시작 */
const startHeartbeat = (meetingId: string) => {
  stopHeartbeat()
  heartbeatTimer = setInterval(async () => {
    try {
      await fetch(`/api/meeting/${meetingId}/heartbeat`, { method: 'POST' })
    } catch (e) {
      console.warn('[Heartbeat] 전송 실패:', e)
    }
  }, HEARTBEAT_INTERVAL_MS)
}

/** Heartbeat 중지 */
const stopHeartbeat = () => {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/**
 * beforeunload 이벤트 등록
 * 1. onBeforeCancel 콜백 실행 (남은 오디오 청크 sendBeacon 등 추가 작업)
 * 2. navigator.sendBeacon으로 POST /api/meeting/{meetingId}/cancel 호출
 * (페이지 이탈/새로고침/탭 닫기 시 비정상종료 처리)
 */
const registerUnloadBeacon = (meetingId: string, onBeforeCancel?: () => void) => {
  unregisterUnloadBeacon()
  unloadHandler = () => {
    onBeforeCancel?.()
    navigator.sendBeacon(`/api/meeting/${meetingId}/cancel`)
  }
  window.addEventListener('beforeunload', unloadHandler)
}

/** beforeunload 이벤트 제거 */
const unregisterUnloadBeacon = () => {
  if (unloadHandler) {
    window.removeEventListener('beforeunload', unloadHandler)
    unloadHandler = null
  }
}

export const useHeartbeat = () => ({
  startHeartbeat,
  stopHeartbeat,
  registerUnloadBeacon,
  unregisterUnloadBeacon,
})
