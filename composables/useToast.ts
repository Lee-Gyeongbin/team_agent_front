/** Toast 타입 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Toast 옵션 */
export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

const toastList = ref<ToastItem[]>([])
let toastId = 0

/** 최대 동시 표시 개수 */
const MAX_TOASTS = 5

/**
 * 화면 우측 상단 Toast 표시
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openToast() 호출
 *
 * @example
 * openToast('저장되었습니다.')
 * openToast({ message: '저장 완료', type: 'success' })
 * openToast({ message: '삭제 실패', type: 'error', duration: 3000 })
 */
export function openToast(options: ToastOptions | string): void {
  const opts = typeof options === 'string' ? { message: options } : options
  const id = ++toastId
  const duration = opts.duration ?? 2500
  const type = opts.type ?? 'info'

  // 최대 개수 초과 시 가장 오래된 토스트 제거
  if (toastList.value.length >= MAX_TOASTS) {
    toastList.value.splice(0, 1)
  }

  toastList.value.push({ id, message: opts.message, type, duration })

  setTimeout(() => {
    closeToast(id)
  }, duration)
}

/** 토스트 수동 닫기 */
export function closeToast(id: number): void {
  const index = toastList.value.findIndex((t) => t.id === id)
  if (index > -1) toastList.value.splice(index, 1)
}

/** app.vue Toast 렌더용 — 내부 전용 */
export function useToastState() {
  return { toastList }
}
