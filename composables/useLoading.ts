/** 전역 로딩 오버레이 옵션 */
export interface LoadingOptions {
  text?: string
}

// 모듈 레벨 singleton 상태
const isLoading = ref(false)
const loadingText = ref('불러오는 중...')
let loadingCount = 0

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
  loadingText.value = options?.text ?? '불러오는 중...'
  isLoading.value = true
}

/** 전역 로딩 오버레이 닫기 — 모든 요청이 끝나야(count=0) 실제로 닫힘 */
export function closeLoading(): void {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    isLoading.value = false
  }
}

/** app.vue 로딩 렌더용 — 내부 전용 */
export function useLoadingState() {
  return { isLoading, loadingText }
}
