<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>

  <!-- 전역 Alert/Confirm 다이얼로그 -->
  <UiConfirmModal
    v-if="dialogType === 'alert'"
    :is-open="true"
    :title="dialogOptions.title"
    :message="dialogOptions.message"
    :confirm-text="dialogOptions.confirmText"
    @close="closeDialog()"
    @confirm="closeDialog()"
  />
  <UiDialogModal
    v-if="dialogType === 'confirm'"
    :is-open="true"
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
</template>

<script setup lang="ts">
const { initTheme } = useTheme()
const { dialogType, dialogOptions, closeDialog } = useDialogState()
const { isLoading: isGlobalLoading, loadingText: globalLoadingText } = useLoadingState()

onMounted(() => initTheme())
</script>
