/** 전역 다이얼로그 옵션 (alert/confirm 공통) */
export interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

type DialogType = 'alert' | 'confirm' | null
type ResolveFn = (value?: boolean) => void

// 모듈 레벨 singleton 상태
const dialogType = ref<DialogType>(null)
const dialogOptions = ref<DialogOptions>({ message: '' })
const resolveRef = ref<ResolveFn | null>(null)

/** 다이얼로그 닫기 (내부용) — confirm: true/false, alert: 호출만 하면 됨 */
function closeDialog(value = false) {
  if (resolveRef.value) {
    resolveRef.value(value)
    resolveRef.value = null
  }
  dialogType.value = null
}

/**
 * Alert 다이얼로그 (확인만)
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openAlert() 호출
 */
export function openAlert(options: DialogOptions): Promise<void> {
  dialogType.value = 'alert'
  dialogOptions.value = {
    title: options.title ?? '확인',
    message: options.message,
    confirmText: options.confirmText ?? '확인',
  }
  return new Promise<void>((resolve) => {
    resolveRef.value = () => resolve(undefined)
  })
}

/**
 * Confirm 다이얼로그 (취소/확인)
 * Nuxt auto-import로 전역 사용 가능 — import 없이 openConfirm() 호출
 * @returns 확인=true, 취소/닫기=false
 */
export function openConfirm(options: DialogOptions): Promise<boolean> {
  dialogType.value = 'confirm'
  dialogOptions.value = {
    title: options.title ?? '확인',
    message: options.message,
    cancelText: options.cancelText ?? '취소',
    confirmText: options.confirmText ?? '확인',
  }
  return new Promise<boolean>((resolve) => {
    resolveRef.value = (v) => resolve(v ?? false)
  })
}

/** app.vue 모달 렌더용 — 내부 전용 */
export function useDialogState() {
  return {
    dialogType,
    dialogOptions,
    closeDialog,
  }
}
