<template>
  <section
    class="chat-translate-card"
    :class="{
      'is-readonly': props.readonly,
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="themeStyle"
  >
    <Transition name="agent-intro">
      <div
        v-if="isIntroPlaying"
        class="chat-translate-card__intro"
        aria-live="polite"
      >
        <div class="chat-translate-card__intro-inner">
          <div class="chat-translate-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-agent-translate', 'size-24']" />
          </div>
          <p class="chat-translate-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`intro-title-${index}`"
              class="chat-translate-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
          <p class="chat-translate-card__intro-subtitle">
            <span
              v-for="(char, index) in introSubtitleChars"
              :key="`intro-subtitle-${index}`"
              class="chat-translate-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
        </div>
      </div>
    </Transition>

    <div
      v-if="isContentVisible"
      class="chat-translate-card__header"
    >
      <div class="chat-translate-card__header-info">
        <div class="chat-translate-card__avatar">
          <i :class="[themeIconClassNm || 'icon-agent-translate', 'size-24']" />
        </div>
        <div>
          <p class="chat-translate-card__title">{{ translateConfig.ui.introTitle }}</p>
          <p class="chat-translate-card__subtitle">{{ translateConfig.ui.introSubtitle }}</p>
        </div>
      </div>
    </div>

    <!-- 제출 완료 후 — 요청 내용 요약 -->
    <div
      v-if="isContentVisible && props.readonly"
      class="chat-translate-card__body"
    >
      <div class="chat-translate-card__options-panel">
        <p class="chat-translate-card__options-panel-head">번역 설정</p>
        <div class="chat-translate-card__options-grid">
          <div class="chat-translate-card__option-item">
            <div class="chat-translate-card__option-body">
              <span class="chat-translate-card__option-label">목표 언어</span>
              <span class="chat-translate-card__option-value">{{ targetLangLabel }}</span>
            </div>
          </div>
          <div class="chat-translate-card__option-item">
            <div class="chat-translate-card__option-body">
              <span class="chat-translate-card__option-label">톤</span>
              <span class="chat-translate-card__option-value">{{ toneLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-translate-card__content-slot">
        <div class="chat-translate-card__content-panel">
          <p class="chat-translate-card__label">
            {{ form.fileName ? '번역 요청 파일' : '번역 요청 내용' }}
          </p>
          <div class="chat-translate-card__source-area">
            <button
              v-if="!form.fileName"
              type="button"
              class="chat-translate-card__copy-btn"
              title="전체 내용 복사"
              aria-label="전체 내용 복사"
              @click="onCopyReadonlyContent"
            >
              <i class="icon-copy size-16" />
            </button>
            <div
              v-if="form.fileName"
              class="chat-translate-card__source-box chat-translate-card__source-file"
            >
              <div class="chat-translate-card__source-file-inner">
                <div class="chat-translate-card__source-file-icon">
                  <i class="icon-attach-file size-32" />
                </div>
                <span
                  v-if="readonlyFileExt"
                  class="chat-translate-card__source-file-ext"
                  >{{ readonlyFileExt }}</span
                >
                <span class="chat-translate-card__source-file-name">{{ form.fileName }}</span>
                <span class="chat-translate-card__source-file-desc">번역 요청으로 제출된 파일</span>
              </div>
            </div>
            <div
              v-else
              class="chat-translate-card__source-box chat-translate-card__source-text"
            >
              {{ form.sourceText }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 입력 폼 -->
    <div
      v-if="isContentVisible && !props.readonly"
      class="chat-translate-card__body"
    >
      <div
        v-if="translateConfig.file.enabled"
        class="chat-translate-card__mode-toggle"
        role="tablist"
        aria-label="입력 방식"
      >
        <button
          type="button"
          role="tab"
          class="chat-translate-card__mode-btn"
          :class="{ 'is-active': inputMode === 'text' }"
          :aria-selected="inputMode === 'text'"
          @click="inputMode = 'text'"
        >
          <i class="icon-document-search size-16" />
          텍스트 입력
        </button>
        <button
          type="button"
          role="tab"
          class="chat-translate-card__mode-btn"
          :class="{ 'is-active': inputMode === 'file' }"
          :aria-selected="inputMode === 'file'"
          @click="onFileModeClick"
        >
          <i class="icon-attach-file size-16" />
          파일 업로드
        </button>
      </div>

      <div class="chat-translate-card__options-panel">
        <p class="chat-translate-card__options-panel-head">번역 설정</p>
        <div class="chat-translate-card__field-row">
          <div class="chat-translate-card__field">
            <p class="chat-translate-card__label">목표 언어</p>
            <UiSelect
              :model-value="form.targetLang"
              :options="languageOptions"
              @update:model-value="form.targetLang = String($event)"
            />
          </div>
          <div class="chat-translate-card__field">
            <p class="chat-translate-card__label">톤</p>
            <UiSelect
              :model-value="form.tone"
              :options="toneOptions"
              @update:model-value="form.tone = String($event)"
            />
          </div>
        </div>
      </div>

      <div class="chat-translate-card__content-slot">
        <div
          v-if="inputMode === 'text'"
          ref="sourceTextFieldRef"
          class="chat-translate-card__content-panel"
        >
          <p class="chat-translate-card__label">번역할 내용</p>
          <div class="chat-translate-card__textarea-wrap">
            <UiTextarea
              v-model="form.sourceText"
              :placeholder="translateConfig.ui.textPlaceholder"
              :rows="8"
              :auto-resize="false"
              border
            />
          </div>
        </div>

        <div
          v-else
          ref="fileFieldRef"
          class="chat-translate-card__content-panel"
        >
          <p class="chat-translate-card__label">번역할 파일</p>
          <input
            ref="fileInputRef"
            type="file"
            class="chat-translate-card__file-input"
            :accept="acceptAttr"
            @change="onFileInputChange"
          />
          <div
            class="chat-translate-card__file-zone"
            :class="{ 'is-dragging': isFileDragging, 'has-file': !!selectedFile }"
            @click="onFileZoneClick"
            @dragover.prevent="isFileDragging = true"
            @dragleave.prevent="isFileDragging = false"
            @drop.prevent="onFileDrop"
          >
            <div
              v-if="!selectedFile"
              class="chat-translate-card__file-drop"
            >
              <div class="chat-translate-card__file-drop-icon">
                <i class="icon-arrow-down-gray size-24" />
              </div>
              <p class="chat-translate-card__file-drop-text">
                <span class="chat-translate-card__file-drop-highlight">파일 선택</span>
                또는 여기에 드래그
              </p>
              <p class="chat-translate-card__file-hint">
                {{ translateConfig.file.acceptExt.join(', ') }} 파일을 업로드할 수 있습니다.
              </p>
            </div>
            <div
              v-else
              class="chat-translate-card__file-selected"
            >
              <div class="chat-translate-card__file-selected-icon">
                <i class="icon-attach-file size-24" />
              </div>
              <div class="chat-translate-card__file-selected-info">
                <span class="chat-translate-card__file-name">{{ selectedFile.name }}</span>
                <span class="chat-translate-card__file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
              <button
                type="button"
                class="chat-translate-card__file-remove"
                aria-label="파일 제거"
                @click.stop="removeSelectedFile"
              >
                <i class="icon-close size-16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isContentVisible"
      class="chat-translate-card__footer"
    >
      <template v-if="props.readonly">
        <span class="chat-translate-card__submitted-badge">
          <i class="icon-check size-16" />
          제출 완료
        </span>
      </template>
      <template v-else>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="emit('close')"
          >닫기</UiButton
        >
        <UiButton
          variant="dark"
          size="sm"
          @click="onSubmitClick"
        >
          {{ translateConfig.ui.submitLabel }}
          <template #icon-right>
            <i class="icon-arrow-right size-16" />
          </template>
        </UiButton>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TranslateAgentConfig } from '~/types/agent'
import type { TranslateFormPayload } from '~/types/chat'
import { createEmptyTranslateFormPayload } from '~/utils/chat/translateAgentUtil'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import { openToast } from '~/composables/useToast'

interface Props {
  translateConfig: TranslateAgentConfig
  readonly?: boolean
  initialPayload?: TranslateFormPayload
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialPayload: undefined,
  themeIconClassNm: '',
  themeColorHex: '',
})

const emit = defineEmits<{
  submit: [payload: TranslateFormPayload]
  close: []
}>()

// ━━━ 폼 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const form = reactive<TranslateFormPayload>(createEmptyTranslateFormPayload(props.translateConfig))

watch(
  () => props.initialPayload,
  (payload) => {
    if (!payload) return
    form.sourceText = payload.sourceText
    form.targetLang = payload.targetLang
    form.tone = payload.tone
    form.fileName = payload.fileName
  },
  { immediate: true },
)

const languageOptions = computed(() => props.translateConfig.languages.map((l) => ({ label: l.label, value: l.value })))
const toneOptions = computed(() => props.translateConfig.tones.map((t) => ({ label: t.label, value: t.value })))

const getFileExt = (fileName: string) => {
  const dotIdx = fileName.lastIndexOf('.')
  return dotIdx >= 0 ? fileName.slice(dotIdx).toLowerCase() : ''
}

const targetLangLabel = computed(
  () => props.translateConfig.languages.find((l) => l.value === form.targetLang)?.label ?? form.targetLang,
)
const toneLabel = computed(() => props.translateConfig.tones.find((t) => t.value === form.tone)?.label ?? form.tone)

const readonlyFileExt = computed(() => {
  const ext = getFileExt(form.fileName ?? '')
  return ext ? ext.replace('.', '').toUpperCase() : ''
})

const readonlyCopyText = computed(() => (form.fileName || form.sourceText).trim())

const onCopyReadonlyContent = async () => {
  if (!readonlyCopyText.value) {
    openToast({ message: '복사할 내용이 없습니다.', type: 'warning' })
    return
  }

  try {
    await copyToClipboard(readonlyCopyText.value)
    openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
  }
}

// ━━━ 입력 모드 (Phase 2: 파일 업로드) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const inputMode = ref<'text' | 'file'>('text')
const selectedFile = ref<File | null>(null)
const isFileDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileFieldRef = ref<HTMLElement | null>(null)

const acceptAttr = computed(() => props.translateConfig.file.acceptExt.join(','))

const onFileModeClick = () => {
  inputMode.value = 'file'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const applySelectedFile = (file: File) => {
  const ext = getFileExt(file.name)
  if (!props.translateConfig.file.acceptExt.some((accept) => accept.toLowerCase() === ext)) {
    openToast({
      message: `${props.translateConfig.file.acceptExt.join(', ')} 파일만 업로드할 수 있습니다.`,
      type: 'warning',
    })
    return false
  }

  selectedFile.value = file
  return true
}

const onFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) return

  applySelectedFile(file)
  input.value = ''
}

const onFileZoneClick = () => {
  if (selectedFile.value) return
  fileInputRef.value?.click()
}

const onFileDrop = (event: DragEvent) => {
  isFileDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  applySelectedFile(file)
}

const removeSelectedFile = () => {
  selectedFile.value = null
}

// ━━━ 인트로 애니메이션 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const introTitleChars = computed(() => (props.translateConfig?.ui.introTitle ?? '').split(''))
const introSubtitleChars = computed(() => (props.translateConfig?.ui.introSubtitle ?? '').split(''))

const TRANSLATE_INTRO_CONTENT_REVEAL_MS = 1400
const TRANSLATE_INTRO_END_MS = 2400

const getShouldPlayIntro = () => !props.readonly && !props.initialPayload

const isIntroPlaying = ref(getShouldPlayIntro())
const isContentVisible = ref(!getShouldPlayIntro())

let introStartTimer: ReturnType<typeof setTimeout> | null = null
let introEndTimer: ReturnType<typeof setTimeout> | null = null

const clearIntroTimers = () => {
  if (introStartTimer) clearTimeout(introStartTimer)
  if (introEndTimer) clearTimeout(introEndTimer)
  introStartTimer = null
  introEndTimer = null
}

onMounted(() => {
  if (!getShouldPlayIntro()) {
    isIntroPlaying.value = false
    isContentVisible.value = true
    return
  }
  isIntroPlaying.value = true
  isContentVisible.value = false
  introStartTimer = setTimeout(() => {
    isContentVisible.value = true
  }, TRANSLATE_INTRO_CONTENT_REVEAL_MS)
  introEndTimer = setTimeout(() => {
    isIntroPlaying.value = false
  }, TRANSLATE_INTRO_END_MS)
})

onUnmounted(() => {
  clearIntroTimers()
})

// ━━━ 테마 스타일 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_THEME_HEX = '#3c69db'
const hexToRgb = (hex: string) => {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '60, 105, 219'
  return `${parseInt(cleaned.slice(0, 2), 16)}, ${parseInt(cleaned.slice(2, 4), 16)}, ${parseInt(cleaned.slice(4, 6), 16)}`
}

const themeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_THEME_HEX
  return {
    '--translate-theme-color': colorHex,
    '--translate-theme-rgb': hexToRgb(colorHex),
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

// ━━━ 필드 ref ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sourceTextFieldRef = ref<HTMLElement | null>(null)

const focusField = (fieldEl: HTMLElement | null) => {
  if (!fieldEl) return
  fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  fieldEl.querySelector<HTMLElement>('textarea,input,[tabindex]:not([tabindex="-1"])')?.focus()
}

// ━━━ 제출 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const onSubmitClick = () => {
  if (inputMode.value === 'file') {
    if (!selectedFile.value) {
      openToast({ message: '번역할 파일을 선택해주세요.', type: 'warning' })
      focusField(fileFieldRef.value)
      return
    }
    emit('submit', { ...form, file: selectedFile.value, fileName: selectedFile.value.name })
    return
  }

  if (!form.sourceText.trim()) {
    openToast({ message: '번역할 내용을 입력해주세요.', type: 'warning' })
    focusField(sourceTextFieldRef.value)
    return
  }
  emit('submit', { ...form })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/utils/agent-intro' as *;

@mixin translate-theme-avatar($size) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $size;
  height: $size;
  border-radius: 50%;
  background: var(--translate-theme-color);
  color: #fff;
}

.chat-translate-card {
  --translate-card-content-height: 220px;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;

  &.is-content-visible {
    min-height: 460px;
  }

  &__intro {
    min-height: 220px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: $spacing-lg;
    border-bottom: 1px solid $color-border;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__avatar {
    @include translate-theme-avatar(36px);
    flex-shrink: 0;
  }

  &__title {
    @include typo($body-medium-bold, $color-text-heading);
  }

  &__subtitle {
    @include typo($body-small, $color-text-muted);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 0;
    padding: $spacing-lg;
  }

  &__options-panel {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md;
    border: 1px solid rgba(var(--translate-theme-rgb), 0.18);
    border-radius: $border-radius-lg;
    background: rgba(var(--translate-theme-rgb), 0.03);
    flex-shrink: 0;
  }

  &__options-panel-head {
    @include typo($body-small-bold, $color-text-heading);
  }

  &__options-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-sm;

    @include mobile {
      grid-template-columns: 1fr;
    }
  }

  &__option-item {
    display: flex;
    align-items: center;
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: #fff;
  }

  &__option-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__option-label {
    @include typo($body-xsmall, $color-text-muted);
  }

  &__option-value {
    @include typo($body-small-bold, $color-text-primary);
    word-break: break-word;
  }

  &__mode-toggle {
    display: inline-flex;
    align-self: flex-start;
    padding: 3px;
    gap: 2px;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: $color-background;
  }

  &__mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: calc(#{$border-radius-base} - 2px);
    background: transparent;
    cursor: pointer;
    transition:
      background-color $transition-fast,
      color $transition-fast,
      box-shadow $transition-fast;
    @include typo($body-small, $color-text-secondary);

    i {
      color: $color-text-muted;
      transition: color $transition-fast;
    }

    &:hover:not(.is-active) {
      background: rgba(var(--translate-theme-rgb), 0.06);
      color: $color-text-primary;
    }

    &.is-active {
      background: #fff;
      box-shadow: $shadow-sm;
      @include typo($body-small-bold, var(--translate-theme-color));

      i {
        color: var(--translate-theme-color);
      }
    }
  }

  &__field-row {
    display: flex;
    gap: $spacing-md;
    min-width: 0;

    .chat-translate-card__field {
      flex: 1;
      min-width: 0;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label {
    @include typo($body-small-bold, $color-text-heading);
  }

  &__content-slot {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: var(--translate-card-content-height);
  }

  &__content-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    min-height: var(--translate-card-content-height);
  }

  &__textarea-wrap {
    flex: 1;
    display: flex;
    min-height: 0;

    :deep(.ui-textarea) {
      flex: 1;
      min-height: var(--translate-card-content-height);
      height: 100%;
      padding: $spacing-sm $spacing-md;
      resize: none;
    }
  }

  &__source-area {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: var(--translate-card-content-height);
  }

  &__copy-btn {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: #fff;
    box-shadow: $shadow-sm;
    color: $color-text-secondary;
    cursor: pointer;
    transition:
      color $transition-fast,
      border-color $transition-fast,
      background-color $transition-fast;

    &:hover {
      color: var(--translate-theme-color);
      border-color: rgba(var(--translate-theme-rgb), 0.35);
      background: rgba(var(--translate-theme-rgb), 0.04);
    }
  }

  &__source-box {
    flex: 1;
    height: var(--translate-card-content-height);
    min-height: var(--translate-card-content-height);
    max-height: var(--translate-card-content-height);
    overflow-y: auto;
    @include custom-scrollbar;
  }

  &__source-text {
    @include typo($body-small, $color-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    box-sizing: border-box;
    padding: $spacing-md;
    padding-top: calc(#{$spacing-md} + 32px + #{$spacing-xs});
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: $color-surface;
  }

  &__source-file {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-lg;
    border: 1px solid rgba(var(--translate-theme-rgb), 0.35);
    border-radius: $border-radius-lg;
    background: rgba(var(--translate-theme-rgb), 0.04);
    overflow: hidden;
  }

  &__source-file-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    width: 100%;
    max-width: 360px;
    padding: $spacing-md $spacing-lg;
    border: 1px solid rgba(var(--translate-theme-rgb), 0.2);
    border-radius: $border-radius-lg;
    background: #fff;
    box-shadow: $shadow-sm;
    text-align: center;
  }

  &__source-file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    margin-bottom: $spacing-xs;
    border-radius: 50%;
    background: rgba(var(--translate-theme-rgb), 0.08);
    color: var(--translate-theme-color);
  }

  &__source-file-ext {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    padding: 2px 10px;
    border-radius: $border-radius-100;
    background: rgba(var(--translate-theme-rgb), 0.12);
    @include typo($body-xsmall-bold, var(--translate-theme-color));
    letter-spacing: 0.04em;
  }

  &__source-file-name {
    @include typo($body-medium-bold, $color-text-primary);
    word-break: break-all;
  }

  &__source-file-desc {
    @include typo($body-xsmall, $color-text-muted);
  }

  &__file-input {
    display: none;
  }

  &__file-zone {
    flex: 1;
    display: flex;
    min-height: var(--translate-card-content-height);
    border: 2px dashed $color-border;
    border-radius: $border-radius-lg;
    background: $color-surface;
    cursor: pointer;
    transition:
      border-color $transition-fast,
      background-color $transition-fast;

    &:hover:not(.has-file),
    &.is-dragging:not(.has-file) {
      border-color: var(--translate-theme-color);
      background: rgba(var(--translate-theme-rgb), 0.04);
    }

    &.has-file {
      border-style: solid;
      border-color: rgba(var(--translate-theme-rgb), 0.35);
      background: rgba(var(--translate-theme-rgb), 0.04);
      cursor: default;
    }
  }

  &__file-drop {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-lg;
    text-align: center;
  }

  &__file-drop-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: $spacing-xs;
    border-radius: 50%;
    background: #fff;
    box-shadow: $shadow-sm;

    i {
      transform: rotate(180deg);
      color: var(--translate-theme-color);
    }
  }

  &__file-drop-text {
    @include typo($body-small, $color-text-secondary);
  }

  &__file-drop-highlight {
    font-weight: $font-weight-bold;
    color: var(--translate-theme-color);
  }

  &__file-hint {
    @include typo($body-xsmall, $color-text-muted);
    max-width: 320px;
  }

  &__file-selected {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    padding: $spacing-lg;
  }

  &__file-selected-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: $border-radius-base;
    background: #fff;
    color: var(--translate-theme-color);
    box-shadow: $shadow-sm;
  }

  &__file-selected-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__file-name {
    @include typo($body-small-bold, $color-text-primary);
    word-break: break-all;
  }

  &__file-size {
    @include typo($body-xsmall, $color-text-muted);
  }

  &__file-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(var(--translate-theme-rgb), 0.1);
    color: $color-text-secondary;
    cursor: pointer;
    transition:
      background-color $transition-fast,
      color $transition-fast;

    &:hover {
      background: rgba(var(--translate-theme-rgb), 0.18);
      color: var(--translate-theme-color);
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $color-border;
    margin-top: auto;
  }

  &__submitted-badge {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    @include typo($body-small, $color-text-muted);

    i {
      color: var(--translate-theme-color);
    }
  }
}

@include agent-card-intro('chat-translate-card', 'intro', '--translate-theme-color', '--translate-theme-rgb');
@include agent-card-intro-keyframes;
@include agent-intro-transition;
</style>
