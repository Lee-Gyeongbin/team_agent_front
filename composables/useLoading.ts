/** 전역 로딩 오버레이 옵션 */
export interface LoadingOptions {
  text?: string
}

// 모듈 레벨 singleton 상태
const isLoading = ref(false)
const loadingText = ref('불러오는 중...')

/**
 * 전역 로딩 오버레이 표시
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openLoading() 호출
 *
 * @example
 * openLoading()
 * openLoading({ text: '저장 중...' })
 */
export function openLoading(options?: LoadingOptions): void {
  loadingText.value = options?.text ?? '불러오는 중...'
  isLoading.value = true
}

/** 전역 로딩 오버레이 닫기 */
export function closeLoading(): void {
  isLoading.value = false
}

/** app.vue 로딩 렌더용 — 내부 전용 */
export function useLoadingState() {
  return { isLoading, loadingText }
}
