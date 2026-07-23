<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>

  <!-- 전역 Alert/Confirm 다이얼로그 -->
  <UiConfirmModal
    v-if="dialogType === 'alert'"
    :is-open="true"
    custom-class="modal-dialog--global"
    :title="dialogOptions.title"
    :message="dialogOptions.message"
    :confirm-text="dialogOptions.confirmText"
    @close="closeDialog()"
    @confirm="closeDialog()"
  />
  <UiDialogModal
    v-if="dialogType === 'confirm'"
    :is-open="true"
    custom-class="modal-dialog--global"
    :title="dialogOptions.title"
    :message="dialogOptions.message"
    :cancel-text="dialogOptions.cancelText"
    :confirm-text="dialogOptions.confirmText"
    @close="closeDialog(false)"
    @cancel="closeDialog(false)"
    @confirm="closeDialog(true)"
  />

  <!-- 전역 Toast -->
  <UiToast />

  <!-- 전역 로딩 오버레이 -->
  <UiLoading
    v-if="isGlobalLoading"
    overlay
    :text="globalLoadingText"
  />

  <!-- 즉시번역(전역 드래그 번역) 오버레이 -->
  <InstantTranslateOverlay />

  <!-- 장애 오류 모달 (네트워크 / 시스템 / DB) — 전역 UI 최상단 -->
  <IncidentErrorModal
    v-if="incidentErrorOpen"
    :is-open="incidentErrorOpen"
    :is-retrying="incidentErrorRetrying"
    :error-type="incidentErrorType"
    :message="incidentErrorMessage"
    :status-message="incidentErrorStatusMessage"
    :status-message-type="incidentErrorStatusMessageType"
    :retry-text="incidentErrorRetryText"
    :close-text="incidentErrorCloseText"
    @close="closeIncidentError"
    @retry="retryIncidentError"
  />
</template>

<script setup lang="ts">
import { useIncidentErrorNoticeState, useNetworkErrorOfflineListener } from '~/composables/com/useIncidentErrorNotice'

const { initTheme } = useTheme()
const { dialogType, dialogOptions, closeDialog } = useDialogState()
const { isLoading: isGlobalLoading, loadingText: globalLoadingText } = useLoadingState()
const {
  isOpen: incidentErrorOpen,
  isRetrying: incidentErrorRetrying,
  errorType: incidentErrorType,
  message: incidentErrorMessage,
  statusMessage: incidentErrorStatusMessage,
  statusMessageType: incidentErrorStatusMessageType,
  retryText: incidentErrorRetryText,
  closeText: incidentErrorCloseText,
  close: closeIncidentError,
  retry: retryIncidentError,
} = useIncidentErrorNoticeState()

useNetworkErrorOfflineListener()

onMounted(() => initTheme())
</script>
