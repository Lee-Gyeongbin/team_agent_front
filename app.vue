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

  <!-- 네트워크 오류 모달 -->
  <NetworkErrorModal
    :is-open="networkErrorOpen"
    :is-retrying="networkErrorRetrying"
    :message="networkErrorMessage"
    :status-message="networkErrorStatusMessage"
    :status-message-type="networkErrorStatusMessageType"
    :retry-text="networkErrorRetryText"
    :close-text="networkErrorCloseText"
    @close="closeNetworkError"
    @retry="retryNetworkError"
  />

  <!-- 즉시번역(전역 드래그 번역) 오버레이 -->
  <InstantTranslateOverlay />
</template>

<script setup lang="ts">
import { useNetworkErrorNoticeState, useNetworkErrorOfflineListener } from '~/composables/com/useNetworkErrorNotice'

const { initTheme } = useTheme()
const { dialogType, dialogOptions, closeDialog } = useDialogState()
const { isLoading: isGlobalLoading, loadingText: globalLoadingText } = useLoadingState()
const {
  isOpen: networkErrorOpen,
  isRetrying: networkErrorRetrying,
  message: networkErrorMessage,
  statusMessage: networkErrorStatusMessage,
  statusMessageType: networkErrorStatusMessageType,
  retryText: networkErrorRetryText,
  closeText: networkErrorCloseText,
  close: closeNetworkError,
  retry: retryNetworkError,
} = useNetworkErrorNoticeState()

useNetworkErrorOfflineListener()

onMounted(() => initTheme())
</script>
