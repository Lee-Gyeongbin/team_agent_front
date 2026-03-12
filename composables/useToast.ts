/** Toast 옵션 */
export interface ToastOptions {
  message: string
  duration?: number
}

const currentToast = ref<(ToastOptions & { id: number }) | null>(null)
let toastId = 0
let timeoutId: ReturnType<typeof setTimeout> | null = null

/**
 * 화면 하단 Toast 표시
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openToast() 호출
 */
export function openToast(options: ToastOptions | string): void {
  const opts = typeof options === 'string' ? { message: options } : options
  if (timeoutId) clearTimeout(timeoutId)
  currentToast.value = { ...opts, id: ++toastId, duration: opts.duration ?? 3000 }
  timeoutId = setTimeout(() => {
    currentToast.value = null
    timeoutId = null
  }, opts.duration ?? 3000)
}

/** app.vue Toast 렌더용 — 내부 전용 */
export function useToastState() {
  return { currentToast }
}
