<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="false"
    :show-overlay="true"
    max-width="480px"
    custom-class="maint-notice-modal"
    @close="emit('confirm')"
  >
    <template #header>
      <div class="maint-notice-header">
        <i
          class="maint-notice-header-icon"
          :class="headerMeta.icon"
        />
        <div class="maint-notice-header-text">
          <h2 class="maint-notice-header-title">{{ headerMeta.title }}</h2>
          <p class="maint-notice-header-desc">{{ headerMeta.desc }}</p>
        </div>
      </div>
    </template>

    <div class="maint-notice-body">
      <h3
        v-if="bodyTitle"
        class="maint-notice-title"
      >
        {{ bodyTitle }}
      </h3>
      <p
        v-if="content"
        class="maint-notice-content"
      >
        {{ content }}
      </p>

      <div
        v-if="periodLabel"
        class="maint-notice-period"
      >
        <i class="icon-time size-16" />
        <span class="maint-notice-period-label">표시 기간</span>
        <span class="maint-notice-period-value">{{ periodLabel }}</span>
      </div>
    </div>

    <template #footer>
      <div class="maint-notice-footer">
        <UiCheckbox
          v-model="hideChecked"
          label="이 알림 다시 보지 않기"
        />
        <UiButton
          class="btn-modal-dialog maint-notice-confirm"
          size="xlg"
          @click="onConfirm"
        >
          확인
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { MaintNoticeKind } from '~/types/com/chatGuide'

const HEADER_META = {
  emergency: {
    title: '긴급 공지',
    desc: '즉시 확인이 필요한 안내입니다.',
    icon: 'icon-warning-triangle size-24',
  },
  scheduled: {
    title: '정기 점검',
    desc: '시스템 점검 안내입니다.',
    icon: 'icon-info size-24',
  },
} as const satisfies Record<MaintNoticeKind, { title: string; desc: string; icon: string }>

interface Props {
  isOpen: boolean
  kind?: MaintNoticeKind
  title?: string
  content?: string
  periodLabel?: string
  hideByUser?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  kind: 'emergency',
  title: '',
  content: '',
  periodLabel: '',
  hideByUser: false,
})

const emit = defineEmits<{
  confirm: []
  hide: []
}>()

const hideChecked = ref(false)

watch(
  () => props.isOpen,
  (open) => {
    if (open) hideChecked.value = props.hideByUser
  },
)

const onConfirm = () => {
  if (hideChecked.value) emit('hide')
  else emit('confirm')
}

const headerMeta = computed(() => HEADER_META[props.kind])
const bodyTitle = computed(() => String(props.title ?? '').trim())
</script>

<style lang="scss" scoped>
.maint-notice-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 14px 16px;
  margin: -4px 0 0;
  border-radius: $border-radius-base;
  background: var(--color-primary-bg);
}

.maint-notice-header-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.maint-notice-header-text {
  min-width: 0;
}

.maint-notice-header-title {
  margin: 0;
  @include typo($body-large-bold);
  color: var(--color-primary);
}

.maint-notice-header-desc {
  margin: 2px 0 0;
  @include typo($body-small, $color-text-secondary);
}

.maint-notice-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  padding-top: $spacing-md;
}

.maint-notice-title {
  margin: 0;
  @include typo($body-large-bold, $color-text-heading);
  font-size: 18px;
}

.maint-notice-content {
  margin: 0;
  @include typo($body-medium, $color-text-dark);
  white-space: pre-line;
  line-height: 1.6;
}

.maint-notice-period {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin-bottom: $spacing-sm;
  padding: 12px 14px;
  border: 1px solid $color-border-light;
  border-radius: $border-radius-base;
  background: $color-surface;
  color: $color-text-muted;

  .icon-time {
    flex-shrink: 0;
    color: $color-text-muted;
  }
}

.maint-notice-period-label {
  @include typo($body-small, $color-text-muted);
  flex-shrink: 0;
}

.maint-notice-period-value {
  @include typo($body-small, $color-text-dark);
}

.maint-notice-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}

.maint-notice-confirm {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
  }
}
</style>

<!-- Teleport(body) 모달 — scoped 미적용 -->
<style lang="scss">
.modal-dialog.maint-notice-modal {
  .modal-dialog-content {
    max-width: 480px;
  }

  .modal-dialog-body {
    display: block;
    align-items: stretch;
    min-height: 0;
    padding: 0;
  }

  .btn-modal-header-actions {
    display: none;
  }
}
</style>
