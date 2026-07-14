<template>
  <UiModal
    :is-open="isOpen"
    title="인사이트 분석"
    max-width="520px"
    custom-class="library-report-insight-modal modal-dialog"
    @close="emit('close')"
  >
    <div class="library-report-insight-form com-setting-form">
      <p class="library-report-insight-lead">인사이트 분석 결과를 보고서에 반영할 방식을 선택하세요.</p>

      <div
        class="library-report-insight-mode-group"
        role="radiogroup"
        aria-label="인사이트 반영 방식"
      >
        <label class="library-report-insight-mode-row">
          <input
            v-model="insightMode"
            type="radio"
            class="library-report-insight-mode-radio"
            value="add"
          />
          <span class="library-report-insight-mode-text">
            <span class="library-report-insight-mode-label">새 섹션 추가</span>
            <span class="library-report-insight-mode-desc">보고서에 인사이트 분석 섹션을 새로 추가합니다.</span>
          </span>
        </label>

        <label
          class="library-report-insight-mode-row"
          :class="{ 'is-disabled': !hasSections }"
        >
          <input
            v-model="insightMode"
            type="radio"
            class="library-report-insight-mode-radio"
            value="replace"
            :disabled="!hasSections"
          />
          <span class="library-report-insight-mode-text">
            <span class="library-report-insight-mode-label">기존 항목 내용 교체</span>
            <span class="library-report-insight-mode-desc"
              >선택한 보고서 항목의 내용을 인사이트 분석 결과로 교체합니다.</span
            >
          </span>
        </label>
      </div>

      <div
        v-if="insightMode === 'replace' && hasSections"
        class="library-report-insight-target form-row"
      >
        <label
          class="form-label"
          for="library-report-insight-target-select"
        >
          교체할 항목
        </label>
        <UiSelect
          id="library-report-insight-target-select"
          v-model="selectedValueKey"
          :options="sectionSelectOptions"
          placeholder="항목을 선택하세요"
          size="md"
        />
      </div>

      <p
        v-if="!hasSections"
        class="library-report-insight-empty-hint"
        role="status"
      >
        현재 보고서에서 편집 가능한 항목을 찾을 수 없습니다. 새 섹션 추가만 가능합니다.
      </p>
    </div>

    <template #footer>
      <div class="library-report-insight-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :disabled="!canConfirm"
          @click="onConfirm"
        >
          <template #icon-left>
            <i class="icon-chart-ai size-16" />
          </template>
          분석 요청
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiModal, UiSelect, UiButton } from '@leechanyong/ispark-ui'
import type { SelectOption } from '@leechanyong/ispark-ui'
import type {
  LibraryReportInsightMode,
  LibraryReportInsightRequest,
  LibraryReportSectionOption,
} from '~/utils/library/libraryReportEditorUtil'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    sectionOptions?: LibraryReportSectionOption[]
    currentHtml?: string
    /** 지식 카드 원본 답변 HTML */
    rContent?: string
  }>(),
  {
    sectionOptions: () => [],
    currentHtml: '',
    rContent: '',
  },
)

const emit = defineEmits<{
  close: []
  confirm: [payload: LibraryReportInsightRequest]
}>()

const insightMode = ref<LibraryReportInsightMode>('add')
const selectedValueKey = ref<string | number>('')

const hasSections = computed(() => props.sectionOptions.length > 0)

const sectionSelectOptions = computed<SelectOption[]>(() =>
  props.sectionOptions.map((item) => ({
    label: item.label,
    value: item.valueKey,
  })),
)

const canConfirm = computed(() => {
  if (insightMode.value === 'add') return true
  return !!String(selectedValueKey.value).trim()
})

const resetForm = () => {
  insightMode.value = 'add'
  selectedValueKey.value = props.sectionOptions[0]?.valueKey ?? ''
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    resetForm()
  },
)

watch(
  () => props.sectionOptions,
  () => {
    if (!props.isOpen) return
    if (insightMode.value === 'replace' && !selectedValueKey.value && props.sectionOptions.length) {
      selectedValueKey.value = props.sectionOptions[0]!.valueKey
    }
  },
  { deep: true },
)

watch(insightMode, (mode) => {
  if (mode !== 'replace') return
  if (selectedValueKey.value || !props.sectionOptions.length) return
  selectedValueKey.value = props.sectionOptions[0]!.valueKey
})

const onConfirm = () => {
  if (!canConfirm.value) return

  const payload: LibraryReportInsightRequest = {
    mode: insightMode.value,
    rContent: props.rContent,
    currentHtml: props.currentHtml,
  }

  if (insightMode.value === 'replace') {
    const target = props.sectionOptions.find((item) => item.valueKey === String(selectedValueKey.value))
    if (!target) return
    payload.labelKey = target.labelKey
    payload.valueKey = target.valueKey
  }

  emit('confirm', payload)
}
</script>

<style lang="scss" scoped>
.library-report-insight-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  min-width: 0;
}

.library-report-insight-lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.5;
}

.library-report-insight-mode-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.library-report-insight-mode-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  cursor: pointer;
  transition:
    border-color $transition-base,
    background-color $transition-base;

  &:has(.library-report-insight-mode-radio:checked) {
    border-color: rgba(var(--color-primary-rgb, 60, 105, 219), 0.45);
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.04);
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.library-report-insight-mode-radio {
  flex-shrink: 0;
  margin-top: 4px;
  accent-color: var(--color-primary);
}

.library-report-insight-mode-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.library-report-insight-mode-label {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
}

.library-report-insight-mode-desc {
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
}

.library-report-insight-target.form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .form-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  :deep(.ui-select-outer),
  :deep(.ui-select-wrap) {
    width: 100%;
    min-width: 0;
  }
}

.library-report-insight-empty-hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: $border-radius-lg;
  background: #f1f5f9;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.45;
}

.library-report-insight-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
  width: 100%;
}
</style>
