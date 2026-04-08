<template>
  <UiModal
    :is-open="isOpen"
    title="문서 만들기"
    :max-width="'min(800px, calc(100vw - 48px))'"
    custom-class="doc-dataset-create-modal library-create-doc-modal library-create-doc-report-modal"
    show-fullscreen
    @close="emit('close')"
  >
    <div class="library-create-doc-report doc-dataset-create-form com-setting-form">
      <div class="library-create-doc-report-lead-row">
        <p class="doc-dataset-subsection-desc library-create-doc-lead">
          지식창고 내용을 기반으로 문서를 자동 생성합니다
        </p>
        <UiBadge
          variant="success"
          size="sm"
        >
          <template #icon-left>
            <i class="icon icon-check size-14"></i>
          </template>
          AI 생성 완료
        </UiBadge>
      </div>
      <!-- 액션 행 -->
      <div class="library-create-doc-report-toolbar">
        <UiButton
          variant="primary"
          size="md"
          icon-only
          title="내 문서보관함 저장"
          @click="emit('save-to-my-docs')"
        >
          <template #icon-left>
            <i class="icon icon-archive size-16" />
          </template>
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          icon-only
          title="PDF 다운로드"
          @click="onPrintReport"
        >
          <template #icon-left>
            <i class="icon icon-download size-16" />
          </template>
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          icon-only
          title="공유 링크"
          @click="emit('share-link')"
        >
          <template #icon-left>
            <i class="icon icon-sidebar-share size-16" />
          </template>
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('select-other-type')"
        >
          <template #icon-left>
            <i class="icon icon-refresh size-16" />
          </template>
          다른 유형 선택
        </UiButton>
      </div>

      <!-- 본문 -->
      <div
        class="library-create-doc-report-sheet"
        :class="{ 'is-refine-completed': isRefineCompletedFx }"
      >
        <div class="library-create-doc-report-sheet-head">
          <div class="library-create-doc-report-sheet-head-left">
            <i class="icon icon-document size-18" />
            <span class="library-create-doc-report-sheet-title">{{ props.tmplNm || '보고서' }}</span>
          </div>
          <p class="library-create-doc-report-sheet-hint">
            항목명·본문을 수정할 수 있으며, 항목명 옆 핸들을 드래그하면 순서를 바꿀 수 있습니다
          </p>
        </div>

        <div class="library-create-doc-report-table-wrap">
          <p
            v-if="orderedRows.length === 0"
            class="library-create-doc-report-empty"
          >
            보고서 내용이 없습니다.
          </p>
          <table
            v-else
            class="library-create-doc-report-table"
            role="presentation"
          >
            <colgroup>
              <col class="library-create-doc-report-col-label" />
              <col class="library-create-doc-report-col-value" />
            </colgroup>
            <draggable
              v-model="orderedRows"
              tag="tbody"
              item-key="valueKey"
              handle=".library-create-doc-report-row-drag"
              class="library-create-doc-report-tbody"
              :animation="200"
              @end="onReportRowsDragEnd"
            >
              <template #item="{ element: row }">
                <tr class="library-create-doc-report-tr is-tall">
                  <th
                    scope="row"
                    class="library-create-doc-report-label"
                  >
                    <div class="library-create-doc-report-label-row">
                      <button
                        type="button"
                        class="library-create-doc-report-row-drag"
                        title="순서 변경"
                        aria-label="순서 변경"
                      >
                        <i class="icon-move-handle size-16" />
                      </button>
                      <div class="library-create-doc-report-label-field">
                        <UiTextarea
                          v-model="report[row.labelKey]"
                          size="sm"
                          :rows="1"
                          :max-rows="9999"
                          :placeholder="row.labelKey"
                          :spellcheck="false"
                          border
                        />
                      </div>
                    </div>
                  </th>
                  <td class="library-create-doc-report-cell">
                    <UiTextarea
                      v-model="report[row.valueKey]"
                      size="sm"
                      :rows="1"
                      :max-rows="9999"
                      :placeholder="String(report[row.labelKey] ?? '')"
                      :spellcheck="false"
                      border
                    />
                  </td>
                </tr>
              </template>
            </draggable>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="library-create-doc-report-footer-chat">
        <div class="library-create-doc-report-footer-head">
          <span class="library-create-doc-report-footer-title">AI와 대화하여 내용 보완</span>
          <p class="library-create-doc-report-footer-lead">LLM과 대화하여 문서 내용을 보완할 수 있습니다</p>
        </div>
        <div
          class="library-create-doc-report-last-refine"
          role="status"
          aria-live="polite"
        >
          <span class="library-create-doc-report-last-refine-label">마지막 보완 요청</span>
          <p
            class="library-create-doc-report-last-refine-text"
            :class="{ 'is-placeholder': !lastRefineMessage.trim() }"
          >
            {{ lastRefineMessage.trim() || '...' }}
          </p>
        </div>
        <div
          class="library-create-doc-chat-bar"
          :class="{ 'is-active': !!refineDraft.trim() }"
        >
          <i
            v-show="!refineDraft.trim()"
            class="icon-sparkle size-20"
          />
          <UiInput
            v-model="refineDraft"
            size="md"
            class="library-create-doc-chat-bar-field"
            :spellcheck="false"
            placeholder="예: 결론 부분을 좀 더 구체적으로 보완해주세요"
            @enter="onSendRefine"
          />
          <UiButton
            variant="primary"
            size="md"
            icon-only
            class="btn-chat-send library-create-doc-chat-send"
            :disabled="!refineDraft.trim()"
            aria-label="전송"
            @click="onSendRefine"
          >
            <template #icon-left>
              <i class="icon-send size-20" />
            </template>
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { openToast } from '~/composables/useToast'
import type { LibraryGeneratedReportValues } from '~/types/library'
import { getLibraryReportRows, printLibraryReport, type LibraryReportRow } from '~/utils/library/libraryReportPrintUtil'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    tmplNm?: string
    refineCompletedAt?: number
  }>(),
  {
    tmplNm: '',
    refineCompletedAt: 0,
  },
)

const report = defineModel<LibraryGeneratedReportValues>('report', { required: true })

const emit = defineEmits<{
  close: []
  'save-to-my-docs': []
  'share-link': []
  'select-other-type': []
  'send-refine': [message: string]
}>()

const refineDraft = ref('')
/** 화면에 표시할 직전 전송 보완 요청 문구 */
const lastRefineMessage = ref('')
/** AI 보완 완료 시 문서 영역에 짧은 강조 효과 */
const isRefineCompletedFx = ref(false)
let refineCompletedFxTimer: ReturnType<typeof setTimeout> | null = null

/** 표시·드래그 순서 (행 순서 변경 시 `report` 키 순서와 동기화) */
const orderedRows = ref<LibraryReportRow[]>([])

const rowsOrderSignature = (rows: LibraryReportRow[]) => rows.map((r) => `${r.valueKey}:${r.labelKey}`).join('|')

const syncOrderedRowsFromReport = () => {
  const v = report.value
  if (!v || typeof v !== 'object') {
    orderedRows.value = []
    return
  }
  orderedRows.value = getLibraryReportRows(v).map((r) => ({ ...r }))
}

/** 드래그 후 JSON 객체 삽입 순서를 행 순서에 맞춤(인쇄·재파싱 순서 유지) */
const onReportRowsDragEnd = () => {
  const v = report.value
  if (!v || typeof v !== 'object' || orderedRows.value.length === 0) return

  const next: LibraryGeneratedReportValues = {}
  const rowKeySet = new Set<string>()
  for (const row of orderedRows.value) {
    rowKeySet.add(row.valueKey)
    rowKeySet.add(row.labelKey)
  }
  for (const row of orderedRows.value) {
    next[row.valueKey] = v[row.valueKey] ?? ''
    next[row.labelKey] = v[row.labelKey] ?? ''
  }
  for (const k of Object.keys(v)) {
    if (!rowKeySet.has(k)) next[k] = v[k] ?? ''
  }
  report.value = next
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      if (refineCompletedFxTimer) {
        clearTimeout(refineCompletedFxTimer)
        refineCompletedFxTimer = null
      }
      isRefineCompletedFx.value = false
      refineDraft.value = ''
      lastRefineMessage.value = ''
      orderedRows.value = []
      return
    }
    syncOrderedRowsFromReport()
  },
)

watch(
  () => report.value,
  () => {
    if (!props.isOpen) return
    const v = report.value
    if (!v || typeof v !== 'object') {
      orderedRows.value = []
      return
    }
    const fromObj = getLibraryReportRows(v)
    if (rowsOrderSignature(fromObj) !== rowsOrderSignature(orderedRows.value)) {
      orderedRows.value = fromObj.map((r) => ({ ...r }))
    }
  },
  { deep: true },
)

watch(
  () => props.refineCompletedAt,
  (next, prev) => {
    if (!props.isOpen || !next || next === prev) return
    isRefineCompletedFx.value = false
    requestAnimationFrame(() => {
      isRefineCompletedFx.value = true
      if (refineCompletedFxTimer) clearTimeout(refineCompletedFxTimer)
      refineCompletedFxTimer = setTimeout(() => {
        isRefineCompletedFx.value = false
        refineCompletedFxTimer = null
      }, 1400)
    })
  },
)

onBeforeUnmount(() => {
  if (!refineCompletedFxTimer) return
  clearTimeout(refineCompletedFxTimer)
  refineCompletedFxTimer = null
})

const onSendRefine = () => {
  const msg = refineDraft.value.trim()
  if (!msg) return
  lastRefineMessage.value = msg
  emit('send-refine', msg)
  refineDraft.value = ''
}

const onPrintReport = () => {
  const ok = printLibraryReport(report.value || {}, props.tmplNm || '보고서')
  if (!ok) {
    openToast({
      message: '인쇄할 보고서 항목이 없습니다.',
      type: 'warning',
      duration: 2500,
    })
  }
}
</script>

<style lang="scss" scoped>
.library-create-doc-report {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  min-width: 0;
}

.library-create-doc-report-lead-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;
  min-width: 0;

  .library-create-doc-lead {
    margin: 0;
    flex: 1 1 auto;
    min-width: 0;
  }

  :deep(.ui-badge) {
    flex-shrink: 0;
  }
}

.library-create-doc-report-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
}

// 시트 박스로 테이블을 감싸 가로 폭을 꽉 채우고 바깥선을 또렷이
.library-create-doc-report-sheet {
  position: relative;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  padding: 0;
  // 세로는 표·textarea 높이를 자르지 않음 (가로만 넘침 숨김)
  overflow-x: hidden;
  overflow-y: visible;
  box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
}

.library-create-doc-report-sheet.is-refine-completed {
  animation: report-refine-glow 3.3s ease-out forwards;
}

.library-create-doc-report-sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-130%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(186, 230, 253, 0.12) 36%,
    rgba(255, 255, 255, 0.52) 50%,
    rgba(187, 247, 208, 0.16) 64%,
    rgba(255, 255, 255, 0) 100%
  );
  filter: saturate(105%);
  will-change: transform, opacity;
}

.library-create-doc-report-sheet.is-refine-completed::before {
  animation: report-refine-sweep 4.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

@keyframes report-refine-glow {
  0% {
    border-color: #c6d2db;
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 0 rgba(59, 130, 246, 0),
      0 0 0 0 rgba(34, 197, 94, 0);
  }
  22% {
    border-color: rgba(59, 130, 246, 0.56);
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 2px rgba(59, 130, 246, 0.22),
      0 0 14px 3px rgba(34, 197, 94, 0.12);
  }
  70% {
    border-color: rgba(59, 130, 246, 0.36);
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 1px rgba(59, 130, 246, 0.14),
      0 0 8px 2px rgba(34, 197, 94, 0.08);
  }
  100% {
    border-color: #c6d2db;
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 0 rgba(59, 130, 246, 0),
      0 0 0 0 rgba(34, 197, 94, 0);
  }
}

@keyframes report-refine-sweep {
  0% {
    opacity: 0;
    transform: translateX(-130%);
  }
  15% {
    opacity: 0.68;
  }
  60% {
    opacity: 0.52;
  }
  100% {
    opacity: 0;
    transform: translateX(130%);
  }
}

.library-create-doc-report-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  margin-bottom: 0;
  flex-wrap: wrap;
  padding: $spacing-md;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.library-create-doc-report-sheet-head-left {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  min-width: 0;
  color: $color-text-heading;

  .icon {
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

.library-create-doc-report-sheet-title {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
}

.library-create-doc-report-sheet-hint {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
}

// 시트 가로 전체 사용 — 헤더 바와 동일 너비로 붕 뜨는 느낌 제거
.library-create-doc-report-table-wrap {
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: #fff;
  overflow: visible;
}

.library-create-doc-report-tr {
  overflow: visible;
}

.library-create-doc-report-empty {
  margin: 0;
  padding: $spacing-lg $spacing-md;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.5;
  text-align: center;
}

.library-create-doc-report-empty-code {
  padding: 0 4px;
  font-size: $font-size-xs;
  border-radius: 4px;
  background: #f1f5f9;
}

// 표 레이아웃 — 다행(th)이 본문 높이만큼 세로로 이어지도록 table 사용
.library-create-doc-report-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: none;
  background: #fff;
}

.library-create-doc-report-col-label {
  width: 32%;
}

.library-create-doc-report-col-value {
  width: 68%;
}

.library-create-doc-report-tbody {
  display: table-row-group;
}

.library-create-doc-report-tbody :deep(tr.sortable-ghost) {
  opacity: 0.45;
}

.library-create-doc-report-row-drag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  // 라벨 textarea 첫 줄(패딩 + 반줄높이)과 28px 핸들의 세로 중앙을 맞춤 — flex center만 쓰면 글리프 박스와 어긋남
  margin: max(0px, calc(#{$spacing-xs} + 0.775em - 14px)) 0 0;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  color: $color-text-muted;
  cursor: grab;

  &:hover {
    background: #e2e8f0;
    color: $color-text-secondary;
  }

  &:active {
    cursor: grabbing;
  }
}

// tr 에 border 주면 일부 브라우저에서 우측 끝까지 선이 안 맞을 수 있어 th/td 에만 구분선 부여
.library-create-doc-report-label {
  box-sizing: border-box;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  text-align: left;
  min-width: 0;
  transition:
    background-color $transition-base,
    box-shadow $transition-base;

  &:hover:not(:focus-within) {
    background: #f1f5f9;
  }

  &:focus-within {
    background: #e8eef4;
  }
}

.library-create-doc-report-label-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  min-width: 0;
  font-size: $font-size-sm;
  line-height: 1.55;
}

.library-create-doc-report-label-field {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.library-create-doc-report-cell {
  box-sizing: border-box;
  padding: 0;
  vertical-align: middle;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  overflow: visible;
  transition:
    background-color $transition-base,
    box-shadow $transition-base;

  &:hover:not(:focus-within) {
    background: #f1f5f9;
  }

  &:focus-within {
    // 클릭·편집 중 — 호버보다 살짝 진한 회색으로 선택 영역 구분
    background: #e8eef4;
    box-shadow: none;
  }
}

.library-create-doc-report-tr.is-tall .library-create-doc-report-cell {
  vertical-align: top;
}

.library-create-doc-report-tr:last-child .library-create-doc-report-label,
.library-create-doc-report-tr:last-child .library-create-doc-report-cell {
  border-bottom: none;
}

// 입력은 테두리 없음 — 겹침 방지 (편집 강조는 td:focus-within 배경)
.library-create-doc-report-cell :deep(.ui-input-outer) {
  display: block;
  width: 100%;
}

.library-create-doc-report-cell :deep(.ui-input-wrap) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  border-radius: 0 !important;
}

.library-create-doc-report-cell :deep(.ui-input-wrap.is-focused),
.library-create-doc-report-cell :deep(.ui-input-wrap:hover) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.library-create-doc-report-cell :deep(.inp.ui-textarea),
.library-create-doc-report-cell :deep(.inp.ui-textarea.has-border),
.library-create-doc-report-label-field :deep(.inp.ui-textarea),
.library-create-doc-report-label-field :deep(.inp.ui-textarea.has-border) {
  width: 100%;
  box-sizing: border-box;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  // 표 라벨($font-size-sm)·본문 폼과 동일한 본문 크기 (UiTextarea 기본 lg 대비)
  font-size: $font-size-sm;
  line-height: 1.55;
  // 라벨은 굵게, 본문 셀은 일반 굵기
  font-weight: $font-weight-normal;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  // autoResize 시 내용 높이만큼만 쓰도록 (UiTextarea 기본 min-height 84px 무시)
  min-height: 0 !important;
  padding: $spacing-sm $spacing-md !important;
}

// 본문 셀: overflow:auto는 스크롤 컨테이너가 되어 높이와 미세하게 어긋난 느낌 → hidden + UiTextarea 높이 여유로 잘림만 방지
.library-create-doc-report-cell :deep(.inp.ui-textarea),
.library-create-doc-report-cell :deep(.inp.ui-textarea.has-border) {
  overflow-x: hidden;
  overflow-y: hidden;
}

.library-create-doc-report-label-field :deep(.inp.ui-textarea),
.library-create-doc-report-label-field :deep(.inp.ui-textarea.has-border) {
  overflow-x: hidden;
  overflow-y: hidden;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  padding: $spacing-xs $spacing-sm !important;
}

.library-create-doc-report-cell :deep(.inp.ui-textarea:hover),
.library-create-doc-report-cell :deep(.inp.ui-textarea:focus),
.library-create-doc-report-label-field :deep(.inp.ui-textarea:hover),
.library-create-doc-report-label-field :deep(.inp.ui-textarea:focus) {
  border: none !important;
  box-shadow: none !important;
}

.library-create-doc-report-footer-chat {
  width: 100%;
  margin-top: $spacing-md;
  padding: $spacing-md 0 0;
  border-top: 1px solid $color-border;
}

// 아이콘 열 / 텍스트 열 분리 — 부제가 제목과 같은 열에서 시작해 왼쪽이 정확히 맞음
.library-create-doc-report-footer-head {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 6px;
  align-items: start;
  margin-bottom: $spacing-md;
  min-width: 0;
}

.library-create-doc-report-footer-icon {
  grid-row: 1;
  grid-column: 1;
  color: var(--color-primary);
}

.library-create-doc-report-footer-title {
  grid-row: 1;
  grid-column: 2;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
  min-width: 0;
}

.library-create-doc-report-footer-lead {
  grid-row: 2;
  grid-column: 2;
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
  min-width: 0;
}

// 마지막 보완 요청 — 이 영역만 박스, 라벨 왼쪽 / 본문 오른쪽
.library-create-doc-report-last-refine {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  margin: 0 0 $spacing-sm;
  padding: 8px 10px;
  box-sizing: border-box;
  min-width: 0;
  text-align: left;
  border-radius: 10px;
  border: 1px solid #dfe3e8;
  background: #ecf0f3;
}

.library-create-doc-report-last-refine-label {
  align-self: flex-start;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  line-height: 1.25;
  max-width: 100%;
  text-align: left;
}

.library-create-doc-report-last-refine-text {
  margin: 0;
  width: 100%;
  max-width: 100%;
  font-size: $font-size-sm;
  font-weight: $font-weight-normal;
  color: #2d3139;
  line-height: 1.4;
  text-align: right;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-placeholder {
    color: $color-text-muted;
    font-weight: $font-weight-normal;
  }
}

// ChatInput-inner 와 유사: 한 줄 바 + 포커스 시 보더
.library-create-doc-chat-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 20px;
  border: 1px solid #c6d2db;
  background: #fff;
  transition:
    border-color $transition-base,
    box-shadow $transition-base;

  &.is-active {
    border: 2px solid var(--color-primary);
    padding: 7px 11px;
    box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb, 60, 105, 219), 0.12);
  }

  .icon-sparkle {
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

.library-create-doc-chat-bar-field {
  flex: 1 1 auto;
  min-width: 0;
}

.library-create-doc-chat-bar :deep(.ui-input-outer) {
  width: 100%;
}

.library-create-doc-chat-bar :deep(.ui-input-wrap) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.library-create-doc-chat-send.btn-chat-send.ui-button {
  width: 32px;
  height: 32px;
  min-height: 32px;
}
</style>
