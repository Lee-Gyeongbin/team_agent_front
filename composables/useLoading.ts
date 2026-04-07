/** 전역 로딩 오버레이 옵션 */
export interface LoadingOptions {
  text?: string
  /** 긴 로딩에서 안내 문구를 순차 변경할지 여부 */
  isDy?: boolean
  /** 순환할 문구 (화면별 전달) */
  dyTexts?: string[]
  /** 순환 간격(ms) */
  intervalMs?: number
}

// 모듈 레벨 singleton 상태
const isLoading = ref(false)
const loadingText = ref('불러오는 중...')
let loadingCount = 0
let dynamicTextTimer: ReturnType<typeof setInterval> | null = null

const clearDynamicTextTimer = () => {
  if (dynamicTextTimer) {
    clearInterval(dynamicTextTimer)
    dynamicTextTimer = null
  }
}

/**
 * 전역 로딩 오버레이 표시 (중첩 카운터 방식)
 * 여러 API가 동시에 호출되어도 모든 요청이 끝난 뒤에만 로딩이 닫힘
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openLoading() 호출
 *
 * @example
 * openLoading()
 * openLoading({ text: '저장 중...' })
 */
export function openLoading(options?: LoadingOptions): void {
  loadingCount++
  clearDynamicTextTimer()
  loadingText.value = options?.text ?? '불러오는 중...'

  if (options?.isDy) {
    const lines = options.dyTexts?.filter((t) => !!t?.trim()) ?? []
    if (lines.length === 0) {
      isLoading.value = true
      return
    }
    const everyMs = Math.max(500, options.intervalMs ?? 1200)

    let textIndex = 0
    dynamicTextTimer = setInterval(() => {
      if (!isLoading.value) return
      textIndex = (textIndex + 1) % lines.length
      loadingText.value = lines[textIndex]
    }, everyMs)
  }

  isLoading.value = true
}

/** 전역 로딩 오버레이 닫기 — 모든 요청이 끝나야(count=0) 실제로 닫힘 */
export function closeLoading(): void {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    clearDynamicTextTimer()
    isLoading.value = false
  }
}

/** app.vue 로딩 렌더용 — 내부 전용 */
export function useLoadingState() {
  return { isLoading, loadingText }
}
