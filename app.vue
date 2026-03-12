<template>
  <NuxtLayout>
    <NuxtPage />
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
</template>

<script setup lang="ts">
const { initTheme } = useTheme()
const { dialogType, dialogOptions, closeDialog } = useDialogState()

onMounted(() => initTheme())
</script>
