<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="false"
    :show-overlay="true"
    custom-class="incident-error-modal"
    @close="emit('close')"
  >
    <div class="incident-error-body">
      <div
        class="incident-error-icon"
        aria-hidden="true"
      >
        <i :class="[incidentUi.icon, 'size-32', 'icon-primary']" />
      </div>
      <h2 class="incident-error-title">{{ incidentUi.title }}</h2>
      <p
        v-if="message"
        class="incident-error-message"
      >
        {{ message }}
      </p>
      <p
        v-if="statusMessage"
        class="incident-error-status-message"
        :class="{ 'is-checking': statusMessageType === 'checking', 'is-error': statusMessageType === 'error' }"
      >
        {{ statusMessage }}
      </p>
    </div>

    <template #footer>
      <div class="incident-error-footer">
        <UiButton
          v-if="errorType === 'network'"
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :loading="isRetrying"
          :disabled="isRetrying"
          @click="emit('retry')"
        >
          {{ retryText }}
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          :variant="errorType === 'network' ? 'outline' : 'primary'"
          size="xlg"
          @click="emit('close')"
        >
          {{ closeText }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { IncidentErrorType } from '~/types/com/chatGuide'

interface Props {
  isOpen?: boolean
  isRetrying?: boolean
  errorType?: IncidentErrorType
  message?: string
  statusMessage?: string
  statusMessageType?: 'checking' | 'error' | ''
  retryText?: string
  closeText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isRetrying: false,
  errorType: 'network',
  message: '',
  statusMessage: '',
  statusMessageType: '',
  retryText: '다시 시도',
  closeText: '닫기',
})

const INCIDENT_UI: Record<IncidentErrorType, { title: string; icon: string }> = {
  network: { title: '네트워크 오류', icon: 'icon-wifi-off' },
  system: { title: '시스템 오류', icon: 'icon-system' },
  db: { title: 'DB 연결 오류', icon: 'icon-database' },
}

const incidentUi = computed(() => INCIDENT_UI[props.errorType])

const emit = defineEmits<{
  close: []
  retry: []
}>()
</script>

<style lang="scss" scoped>
.incident-error-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: $spacing-md 0 $spacing-sm;
  text-align: center;
}

.incident-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: $spacing-lg;
  border-radius: 50%;
  background: var(--color-primary-bg);
}

.incident-error-title {
  margin: 0 0 $spacing-sm;
  @include typo($body-large-bold, $color-text-heading);
  font-size: 18px;
  line-height: 1.4;
}

.incident-error-message {
  margin: 0;
  max-width: 340px;
  @include typo($body-medium, $color-text-secondary);
  white-space: pre-line;
  line-height: 1.6;
}

.incident-error-status-message {
  margin: $spacing-sm 0 0;
  max-width: 340px;
  white-space: pre-line;
  line-height: 1.5;

  &.is-checking {
    @include typo($body-small, $color-text-secondary);
  }

  &.is-error {
    @include typo($body-small, $color-error);
  }
}

.incident-error-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding-top: 16px;
}
</style>

<!-- Teleport(body) 모달 — scoped 미적용 -->
<style lang="scss">
.modal-dialog.incident-error-modal {
  z-index: $z-incident-error;

  .modal-dialog-header {
    display: none;
  }

  .modal-dialog-body {
    display: block;
    align-items: stretch;
    min-height: 0;
    padding: 0;
  }

  .modal-dialog-footer {
    border-top: none;
    padding-top: 0;
    justify-content: center;
  }
}
</style>
