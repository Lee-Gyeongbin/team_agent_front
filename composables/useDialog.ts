/** 전역 다이얼로그 옵션 (alert/confirm 공통) */
export interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

/** Confirm 전용 옵션 (onConfirm / onCancel 콜백) */
export interface ConfirmOptions extends DialogOptions {
  /** 확인 클릭 시 실행할 콜백 (async 지원) */
  onConfirm?: () => void | Promise<void>
  /** 취소/닫기 클릭 시 실행할 콜백 (async 지원) */
  onCancel?: () => void | Promise<void>
}

type DialogType = 'alert' | 'confirm' | null
type ResolveFn = (value?: boolean) => void

// 모듈 레벨 singleton 상태
const dialogType = ref<DialogType>(null)
const dialogOptions = ref<
  DialogOptions & { onConfirm?: () => void | Promise<void>; onCancel?: () => void | Promise<void> }
>({ message: '' })
const resolveRef = ref<ResolveFn | null>(null)

/** 다이얼로그 닫기 (내부용) — confirm: true/false, alert: 호출만 하면 됨 */
async function closeDialog(value = false) {
  const opts = dialogOptions.value
  const resolve = resolveRef.value

  if (resolve) {
    resolveRef.value = null
    try {
      if (value && opts.onConfirm) {
        await opts.onConfirm()
      } else if (!value && opts.onCancel) {
        await opts.onCancel()
      }
    } catch (err) {
      openAlert({ message: err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.' })
      resolve(false)
      return
    }
    resolve(value)
    // onConfirm 내부에서 openAlert 등 새 다이얼로그를 연 경우 닫지 않음
    if (!resolveRef.value) {
      dialogType.value = null
    }
  } else {
    dialogType.value = null
  }
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
 * @param options.onConfirm 확인 클릭 시 실행할 콜백 (선택)
 * @returns 확인=true, 취소/닫기=false
 */
export function openConfirm(options: ConfirmOptions): Promise<boolean> {
  dialogType.value = 'confirm'
  dialogOptions.value = {
    title: options.title ?? '확인',
    message: options.message,
    cancelText: options.cancelText ?? '취소',
    confirmText: options.confirmText ?? '확인',
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
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
