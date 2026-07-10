<template>
  <div
    ref="cardRootRef"
    class="dq-clarification"
    :style="cardThemeStyle"
  >
    <div class="dq-clarification__header">
      <div class="dq-clarification__header-text">
        <div class="dq-clarification__header-main">
          <h2 class="dq-clarification__title">질의 보완</h2>
          <p class="dq-clarification__subtitle">정확한 조회를 위해 확인이 필요해요</p>
        </div>
        <p
          v-if="isInteractiveMode && remainingCount > 0"
          class="dq-clarification__status-missing"
        >
          보완 {{ remainingCount }}개 남음
        </p>
        <p
          v-else-if="isInteractiveMode"
          class="dq-clarification__status-ready"
        >
          <i :class="[resolvedThemeIconClass, 'size-12']" />
          보완 완료
        </p>
        <p
          v-else
          class="dq-clarification__status-missing"
        >
          보완 필요
        </p>
      </div>
    </div>

    <div class="dq-clarification__content">
      <template v-if="isInteractiveMode">
        <section
          v-for="section in sections"
          :key="section.selectionKey"
          class="dq-clarification__section-card"
          :class="{ 'is-filled': !!selections[section.selectionKey]?.trim() }"
        >
          <div class="dq-clarification__section-head">
            <i
              :class="[resolvedThemeIconClass, 'size-20 dq-clarification__section-icon']"
              aria-hidden="true"
            />
            <p class="dq-clarification__section-title">{{ section.warning }}</p>
          </div>

          <ul
            class="dq-clarification__option-row"
            role="listbox"
            :aria-label="`${section.warning} 선택`"
          >
            <li
              v-for="option in section.options"
              :key="`${section.selectionKey}-${option.value}`"
            >
              <button
                type="button"
                role="option"
                class="dq-clarification__option-pill"
                :class="{ 'is-selected': isPresetSelected(section.selectionKey, option.value) }"
                :aria-selected="isPresetSelected(section.selectionKey, option.value)"
                @click="onSelectPresetOption(section.selectionKey, option)"
              >
                {{ option.label }}
              </button>
            </li>
            <li>
              <button
                type="button"
                class="dq-clarification__option-pill"
                :class="{ 'is-selected': isDirectInputSelected(section.selectionKey) }"
                @click="onClickDirectInput(section.selectionKey)"
              >
                직접 입력
              </button>
            </li>
          </ul>

          <div
            v-if="customInputOpenKey === section.selectionKey"
            class="dq-clarification__custom-input"
          >
            <UiInput
              :model-value="customInputDraft[section.selectionKey] ?? ''"
              placeholder="직접 입력해 주세요"
              size="sm"
              @update:model-value="onUpdateCustomDraft(section.selectionKey, $event)"
              @keydown.enter.exact.prevent="onConfirmCustomInput(section.selectionKey)"
              @blur="onConfirmCustomInput(section.selectionKey)"
            />
          </div>
        </section>

        <div class="dq-clarification__preview">
          <span class="dq-clarification__preview-label">미리보기</span>
          <p class="dq-clarification__preview-text">
            <template
              v-for="(part, index) in previewParts"
              :key="`preview-${index}`"
            >
              <span
                v-if="part.isPlaceholder"
                class="dq-clarification__preview-placeholder"
              >
                {{ part.text }}
              </span>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>
        </div>

        <div class="dq-clarification__actions">
          <UiButton
            variant="primary"
            size="md"
            :disabled="!isAllClarificationsFilled"
            @click="onSubmitQuestion"
          >
            이 질문으로 보내기
          </UiButton>
        </div>
      </template>

      <template v-else>
        <section class="dq-clarification__section-card">
          <div class="dq-clarification__section-head">
            <i
              :class="[resolvedThemeIconClass, 'size-20 dq-clarification__section-icon']"
              aria-hidden="true"
            />
            <p class="dq-clarification__section-title">보완 사항</p>
          </div>

          <ul class="dq-clarification__guidance-list">
            <li
              v-for="(item, index) in guidanceItems"
              :key="`guidance-${index}`"
            >
              {{ item }}
            </li>
          </ul>
        </section>

        <div class="dq-clarification__preview">
          <span class="dq-clarification__preview-label">보낸 질문</span>
          <p class="dq-clarification__preview-text">{{ originalQuestion }}</p>
        </div>

        <div class="dq-clarification__actions">
          <UiButton
            variant="primary"
            size="md"
            @click="onRetryQuestion"
          >
            다시 질문하기
          </UiButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClarificationOption, QuestionDiagnosis } from '~/types/dataQuestion'
import {
  buildClarificationPreviewText,
  buildClarificationSections,
  buildClarificationSelectionKey,
  buildDiagnosisGuidanceItems,
  extractPlaceholderTokens,
  hasInteractiveClarification,
  isClarificationComplete,
  splitPreviewTextParts,
} from '~/composables/chat/useDataQuestionGate'
import { buildDataQuestionThemeStyle, resolveDataQuestionThemeIconClass } from '~/utils/chat/dataQuestionRubric'

interface Props {
  diagnosis: QuestionDiagnosis
  originalQuestion: string
  selections: Record<string, string>
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeIconClassNm: 'icon-chart-ai',
  themeColorHex: '',
})

const emit = defineEmits<{
  'select-option': [selectionKey: string, option: ClarificationOption]
  'submit-question': []
  'retry-question': []
}>()

const customInputOpenKey = ref<string | null>(null)
const customInputDraft = ref<Record<string, string>>({})
const cardRootRef = ref<HTMLElement | null>(null)

const sections = computed(() => buildClarificationSections(props.diagnosis))

const isInteractiveMode = computed(() => hasInteractiveClarification(props.diagnosis))

const guidanceItems = computed(() => buildDiagnosisGuidanceItems(props.diagnosis))

const previewText = computed(() =>
  buildClarificationPreviewText(props.originalQuestion, props.diagnosis, props.selections),
)

const previewParts = computed(() => splitPreviewTextParts(previewText.value))

const isAllClarificationsFilled = computed(() =>
  isClarificationComplete(props.originalQuestion, props.diagnosis, props.selections),
)

const remainingCount = computed(() => {
  const items = props.diagnosis.clarificationQuestions ?? []
  const withoutSelection = items.filter(
    (_, index) => !props.selections[buildClarificationSelectionKey(index)]?.trim(),
  ).length
  if (withoutSelection > 0) return withoutSelection
  return extractPlaceholderTokens(previewText.value).length
})

const resolvedThemeIconClass = computed(() => resolveDataQuestionThemeIconClass(props.themeIconClassNm))

const cardThemeStyle = computed(() => buildDataQuestionThemeStyle(props.themeColorHex))

const getSectionOptions = (selectionKey: string) =>
  sections.value.find((section) => section.selectionKey === selectionKey)?.options ?? []

const isCustomSelectionValue = (selectionKey: string, value: string) =>
  !!value && !getSectionOptions(selectionKey).some((option) => option.value === value)

const isPresetSelected = (selectionKey: string, value: string) =>
  props.selections[selectionKey] === value && customInputOpenKey.value !== selectionKey

const isDirectInputSelected = (selectionKey: string) => {
  if (customInputOpenKey.value === selectionKey) return true
  const selected = props.selections[selectionKey]
  return !!selected && isCustomSelectionValue(selectionKey, selected)
}

const onSelectPresetOption = (selectionKey: string, option: ClarificationOption) => {
  customInputOpenKey.value = null
  emit('select-option', selectionKey, option)
}

const onClickDirectInput = async (selectionKey: string) => {
  customInputOpenKey.value = selectionKey
  const selected = props.selections[selectionKey] ?? ''
  customInputDraft.value = {
    ...customInputDraft.value,
    [selectionKey]: isCustomSelectionValue(selectionKey, selected) ? selected : '',
  }
  await nextTick()
  cardRootRef.value?.querySelector<HTMLElement>('.dq-clarification__custom-input input')?.focus()
}

const onUpdateCustomDraft = (selectionKey: string, value: string) => {
  customInputDraft.value = { ...customInputDraft.value, [selectionKey]: value }
}

const onConfirmCustomInput = (selectionKey: string) => {
  if (customInputOpenKey.value !== selectionKey) return
  const value = customInputDraft.value[selectionKey]?.trim()
  if (!value) {
    customInputOpenKey.value = null
    return
  }
  customInputOpenKey.value = null
  emit('select-option', selectionKey, { label: value, value })
}

const onSubmitQuestion = () => {
  if (!isAllClarificationsFilled.value) return
  emit('submit-question')
}

const onRetryQuestion = () => {
  emit('retry-question')
}
</script>

<style lang="scss" scoped>
.dq-clarification {
  width: 100%;
  background: #fff;
  border: 1px solid #c6d2db;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 20px;
    border-bottom: 1px solid $color-border-light;
    background: linear-gradient(180deg, rgba(var(--dq-theme-rgb, 46, 163, 242), 0.05) 0%, #f8fbfd 100%);
  }

  &__header-text {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  &__header-main {
    min-width: 0;
    text-align: left;
  }

  &__title {
    margin: 0;
    @include typo($body-large-bold, $color-text-heading);
    font-size: 18px;
  }

  &__subtitle {
    margin: 2px 0 0;
    @include typo($body-small, $color-text-secondary);
    font-size: 13px;
  }

  &__status-missing {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin: 0;
    padding: 4px 12px;
    border-radius: 999px;
    background: #e25555;
    color: #fff;
    font-weight: 500;
    font-size: 13px;
    line-height: 1.2;
  }

  &__status-ready {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin: 0;
    @include typo($body-caption-bold, var(--dq-theme-color, var(--color-primary, #{$color-primary})));
    font-size: 13px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 20px 20px;
  }

  &__section-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    border: 1px solid rgba(226, 85, 85, 0.18);
    border-radius: $border-radius-lg;
    background: rgba(226, 85, 85, 0.03);

    &.is-filled {
      border-color: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.25);
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.04);
    }
  }

  &__section-head {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__section-icon {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
  }

  &__section-title {
    margin: 0;
    @include typo($body-medium-bold, #e25555);
    font-size: 15px;
    line-height: 1.55;
  }

  &__section-card.is-filled &__section-title {
    color: $color-text-heading;
  }

  &__option-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__option-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-base;
    background: #fff;
    cursor: pointer;
    line-height: 1;
    font: inherit;
    @include typo($body-medium, $color-text-secondary);
    font-size: 14px;

    &.is-selected {
      border-color: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.45);
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.08);
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      font-weight: 600;
    }
  }

  &__custom-input {
    width: 100%;
  }

  &__guidance-list {
    margin: 0;
    padding: 0 0 0 18px;
    list-style: disc;

    li + li {
      margin-top: 6px;
    }

    li {
      @include typo($body-small, $color-text-primary);
      line-height: 1.5;
    }
  }

  &__preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.06);
  }

  &__preview-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-height: 28px;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.14);
    line-height: 1;
    @include typo($body-small-bold, var(--dq-theme-color, var(--color-primary, #{$color-primary})));
    font-size: 13px;
  }

  &__preview-text {
    flex: 1;
    min-width: 0;
    margin: 0;
    line-height: 1.55;
    @include typo($body-medium, $color-text-primary);
    font-size: 15px;
  }

  &__preview-placeholder {
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }

  @include mobile {
    &__header {
      padding: 16px 20px 14px;
    }

    &__content {
      padding: 14px 16px 16px;
    }

    &__header-text {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
