<template>
  <Teleport to="body">
    <div
      v-if="isInstantTranslateActive"
      class="instant-translate-badge"
      :style="badgeStyle"
    >
      <i class="icon-agent-translate size-16" />
      <span>즉시번역 사용 중</span>
      <button
        type="button"
        class="instant-translate-badge__close"
        aria-label="즉시번역 끄기"
        @click="onDisable"
      >
        <i class="icon-close size-12" />
      </button>

      <div class="instant-translate-badge__tooltip">
        <p class="instant-translate-badge__tooltip-title">즉시번역 옵션</p>
        <div class="instant-translate-badge__tooltip-row">
          <span class="instant-translate-badge__tooltip-label">목표 언어</span>
          <span class="instant-translate-badge__tooltip-value">{{ instantTranslateOptions.targetLangLabel }}</span>
        </div>
        <div class="instant-translate-badge__tooltip-row">
          <span class="instant-translate-badge__tooltip-label">톤</span>
          <span class="instant-translate-badge__tooltip-value">{{ instantTranslateOptions.toneLabel }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="isInstantTranslateActive && showTranslateButton"
      ref="triggerRef"
      type="button"
      class="instant-translate-trigger"
      :style="triggerStyle"
      @mousedown.prevent
      @click="onTranslateClick"
    >
      <i class="icon-agent-translate size-14" />
      번역
    </button>

    <div
      v-if="isInstantTranslateActive && showResultPopover"
      ref="popoverRef"
      class="instant-translate-popover"
      :style="popoverStyle"
    >
      <div class="instant-translate-popover__header">
        <span class="instant-translate-popover__title">번역 결과</span>
        <div class="instant-translate-popover__header-actions">
          <button
            type="button"
            class="instant-translate-popover__icon-btn"
            title="번역 결과 복사"
            aria-label="번역 결과 복사"
            :disabled="!canCopyResult"
            @click="onCopyResult"
          >
            <i class="icon-copy size-12" />
          </button>
          <button
            type="button"
            class="instant-translate-popover__icon-btn"
            aria-label="닫기"
            @click="closePopover"
          >
            <i class="icon-close size-12" />
          </button>
        </div>
      </div>
      <div class="instant-translate-popover__body">
        <p
          v-if="isTranslating"
          class="instant-translate-popover__loading"
        >
          번역 중...
        </p>
        <p
          v-else-if="errorMessage"
          class="instant-translate-popover__error"
        >
          {{ errorMessage }}
        </p>
        <p
          v-else
          class="instant-translate-popover__text"
        >
          {{ translatedText }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useInstantTranslate, requestInstantTranslate } from '~/utils/chat/translateAgentUtil'
import { copyToClipboard } from '~/utils/global/clipboardUtil'

const { isInstantTranslateActive, instantTranslateOptions, disableInstantTranslate } = useInstantTranslate()
const { isTopBtnVisible, floatingBottomAboveTopBtn } = useTopBtnState()

const badgeStyle = computed(() =>
  isTopBtnVisible.value ? { bottom: `${floatingBottomAboveTopBtn.value}px` } : undefined,
)

const showTranslateButton = ref(false)
const showResultPopover = ref(false)
const isTranslating = ref(false)
const translatedText = ref('')
const errorMessage = ref('')
const selectedText = ref('')
const triggerPos = ref({ top: 0, left: 0 })
const popoverPos = ref({ top: 0, left: 0 })
const popoverRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const triggerStyle = computed(() => ({
  top: `${triggerPos.value.top}px`,
  left: `${triggerPos.value.left}px`,
}))

const popoverStyle = computed(() => ({
  top: `${popoverPos.value.top}px`,
  left: `${popoverPos.value.left}px`,
}))

const canCopyResult = computed(() => !isTranslating.value && !errorMessage.value && !!translatedText.value.trim())

const resetPopupState = () => {
  showTranslateButton.value = false
  showResultPopover.value = false
  isTranslating.value = false
  translatedText.value = ''
  errorMessage.value = ''
  selectedText.value = ''
}

const onDisable = () => {
  disableInstantTranslate()
  resetPopupState()
}

const onSelectionChange = () => {
  if (!isInstantTranslateActive.value) return
  if (showResultPopover.value) return

  const selection = window.getSelection()
  const text = selection?.toString().trim() ?? ''

  if (!selection || selection.isCollapsed || !text) {
    showTranslateButton.value = false
    return
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    showTranslateButton.value = false
    return
  }

  selectedText.value = text
  triggerPos.value = {
    top: rect.bottom + 8,
    left: Math.max(8, rect.left),
  }
  showTranslateButton.value = true
}

const onDocumentMouseDown = (event: MouseEvent) => {
  if (!isInstantTranslateActive.value) return
  const target = event.target as Node
  if (popoverRef.value && popoverRef.value.contains(target)) return
  if (triggerRef.value && triggerRef.value.contains(target)) return
  // 새로운 클릭 시작 — 이전 팝오버/버튼은 닫고 selectionchange에서 다시 평가
  showResultPopover.value = false
  showTranslateButton.value = false
}

const onTranslateClick = async () => {
  const text = selectedText.value
  if (!text) return

  popoverPos.value = { ...triggerPos.value }
  showTranslateButton.value = false
  showResultPopover.value = true
  isTranslating.value = true
  errorMessage.value = ''
  translatedText.value = ''

  try {
    translatedText.value = await requestInstantTranslate(text, instantTranslateOptions.value)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '번역에 실패했습니다.'
  } finally {
    isTranslating.value = false
  }
}

const closePopover = () => {
  resetPopupState()
}

const onCopyResult = async () => {
  const text = translatedText.value.trim()
  if (!text) {
    openToast({ message: '복사할 내용이 없습니다.', type: 'warning' })
    return
  }

  try {
    await copyToClipboard(text)
    openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
  }
}

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onDocumentMouseDown)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onDocumentMouseDown)
})

watch(isInstantTranslateActive, (active) => {
  if (!active) resetPopupState()
})
</script>

<style lang="scss" scoped>
.instant-translate-badge {
  position: fixed;
  right: $spacing-lg;
  bottom: $spacing-lg;
  z-index: $z-toast;
  transition: bottom $transition-base;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-100;
  background: #fff;
  box-shadow: $shadow-lg;
  @include typo($body-small-bold, $color-text-heading);

  i {
    color: var(--color-primary);
  }
}

.instant-translate-badge__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  cursor: pointer;
  transition:
    color $transition-fast,
    background-color $transition-fast;

  i {
    color: var(--color-primary);
  }

  &:hover {
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.18);
    color: var(--color-primary-hover);

    i {
      color: var(--color-primary-hover);
    }
  }
}

.instant-translate-badge__tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 180px;
  padding: $spacing-sm $spacing-md;
  border: 1px solid rgba(var(--color-primary-rgb, 60, 105, 219), 0.2);
  border-radius: $border-radius-base;
  background: #fff;
  box-shadow: $shadow-lg;
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition:
    opacity $transition-fast,
    transform $transition-fast,
    visibility $transition-fast;
  pointer-events: none;
}

.instant-translate-badge__tooltip-title {
  margin: 0 0 6px;
  @include typo($body-xsmall-bold, var(--color-primary));
}

.instant-translate-badge__tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 3px 0;

  & + & {
    border-top: 1px solid $color-border;
  }
}

.instant-translate-badge__tooltip-label {
  @include typo($body-xsmall, $color-text-muted);
}

.instant-translate-badge__tooltip-value {
  @include typo($body-xsmall-bold, $color-text-heading);
  text-align: right;
}

.instant-translate-badge:hover .instant-translate-badge__tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.instant-translate-trigger {
  position: fixed;
  z-index: $z-toast;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: $border-radius-100;
  background: $color-primary;
  color: #fff;
  box-shadow: $shadow-lg;
  cursor: pointer;
  @include typo($body-small-bold, #fff);

  i {
    color: #fff;
  }
}

.instant-translate-popover {
  position: fixed;
  z-index: $z-toast;
  display: flex;
  flex-direction: column;
  width: 320px;
  max-width: calc(100vw - #{$spacing-lg} * 2);
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  box-shadow: $shadow-lg;
  overflow: hidden;
}

.instant-translate-popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $color-border;
}

.instant-translate-popover__title {
  @include typo($body-small-bold, $color-text-heading);
}

.instant-translate-popover__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.instant-translate-popover__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;
  transition:
    color $transition-fast,
    background-color $transition-fast;

  &:hover:not(:disabled) {
    background: $color-background;
    color: $color-text-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.instant-translate-popover__body {
  padding: $spacing-md;
  max-height: 240px;
  overflow-y: auto;
  @include custom-scrollbar(4px);
}

.instant-translate-popover__loading,
.instant-translate-popover__error,
.instant-translate-popover__text {
  margin: 0;
  @include typo($body-small, $color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.instant-translate-popover__error {
  color: $color-error;
}

.instant-translate-popover__loading {
  color: $color-text-muted;
}
</style>
