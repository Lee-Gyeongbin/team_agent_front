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
          disabled
          title="추후 제공 예정"
        >
          <template #icon-left>
            <i class="icon icon-archive size-16" />
          </template>
          내 문서보관함 저장
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('export-pdf')"
        >
          <template #icon-left>
            <i class="icon icon-download size-16" />
          </template>
          PDF 다운로드
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('share-link')"
        >
          <template #icon-left>
            <i class="icon icon-sidebar-share size-16" />
          </template>
          공유 링크
        </UiButton>
        <div class="library-create-doc-report-toolbar-spacer" />
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

      <!-- 보고서 본문 -->
      <div class="library-create-doc-report-sheet">
        <div class="library-create-doc-report-sheet-head">
          <div class="library-create-doc-report-sheet-head-left">
            <i class="icon icon-document size-18" />
            <span class="library-create-doc-report-sheet-title">보고서</span>
          </div>
          <p class="library-create-doc-report-sheet-hint">셀을 클릭하면 직접 수정 가능합니다</p>
        </div>

        <div class="library-create-doc-report-table-wrap">
          <table
            class="library-create-doc-report-table"
            role="presentation"
          >
            <colgroup>
              <col class="library-create-doc-report-col-label" />
              <col class="library-create-doc-report-col-value" />
            </colgroup>
            <tbody>
              <tr class="library-create-doc-report-tr">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  제 목
                </th>
                <td class="library-create-doc-report-cell">
                  <UiInput
                    v-model="report.title"
                    size="md"
                    placeholder="제목"
                  />
                </td>
              </tr>
              <tr class="library-create-doc-report-tr is-tall">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  개 요
                </th>
                <td class="library-create-doc-report-cell">
                  <UiTextarea
                    v-model="report.overview"
                    :rows="3"
                    :auto-resize="false"
                    placeholder="개요"
                    border
                  />
                </td>
              </tr>
              <tr class="library-create-doc-report-tr">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  작성일자
                </th>
                <td class="library-create-doc-report-cell">
                  <UiInput
                    v-model="report.date"
                    size="md"
                    placeholder="YYYY.MM.DD"
                  />
                </td>
              </tr>
              <tr class="library-create-doc-report-tr">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  작성자
                </th>
                <td class="library-create-doc-report-cell">
                  <UiInput
                    v-model="report.author"
                    size="md"
                    placeholder="작성자 (소속부서)"
                  />
                </td>
              </tr>
              <tr class="library-create-doc-report-tr is-tall">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  본문내용
                </th>
                <td class="library-create-doc-report-cell">
                  <UiTextarea
                    v-model="report.content"
                    :rows="6"
                    :auto-resize="false"
                    placeholder="본문"
                    border
                    class="library-create-doc-report-textarea-main"
                  />
                </td>
              </tr>
              <tr class="library-create-doc-report-tr is-tall">
                <th
                  scope="row"
                  class="library-create-doc-report-label"
                >
                  결 론
                </th>
                <td class="library-create-doc-report-cell">
                  <UiTextarea
                    v-model="report.conclusion"
                    :rows="4"
                    :auto-resize="false"
                    placeholder="결론"
                    border
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="library-create-doc-report-footer-chat">
        <div class="library-create-doc-report-footer-head">
          <i class="icon icon-ai-chat size-18 library-create-doc-report-footer-icon" />
          <span class="library-create-doc-report-footer-title">AI와 대화하여 내용 보완</span>
          <p class="library-create-doc-report-footer-lead">LLM과 대화하여 문서 내용을 보완할 수 있습니다</p>
        </div>
        <!-- 한 줄 입력 — ChatInput 과 동일한 테두리·라운드 느낌만 유지 -->
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
import type { LibraryGeneratedReport } from '~/types/library'

const props = defineProps<{
  isOpen: boolean
}>()

const report = defineModel<LibraryGeneratedReport>('report', { required: true })

const emit = defineEmits<{
  close: []
  'export-pdf': []
  'share-link': []
  'select-other-type': []
  'send-refine': [message: string]
}>()

const refineDraft = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (!open) refineDraft.value = ''
  },
)

const onSendRefine = () => {
  const msg = refineDraft.value.trim()
  if (!msg) return
  emit('send-refine', msg)
  refineDraft.value = ''
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
  gap: $spacing-sm;
}

.library-create-doc-report-toolbar-spacer {
  flex: 1;
  min-width: $spacing-md;
}

// 시트 박스로 테이블을 감싸 가로 폭을 꽉 채우고 바깥선을 또렷이
.library-create-doc-report-sheet {
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
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
  width: 120px;
}

.library-create-doc-report-col-value {
  width: auto;
}

// tr 에 border 주면 일부 브라우저에서 우측 끝까지 선이 안 맞을 수 있어 th/td 에만 구분선 부여
.library-create-doc-report-label {
  box-sizing: border-box;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  text-align: left;
}

.library-create-doc-report-tr.is-tall .library-create-doc-report-label {
  vertical-align: middle;
}

// 표준 table-cell — UiInput / UiTextarea(has-border) 와 동일: 호버·포커스 시 테두리만 primary, 배경은 유지
.library-create-doc-report-cell {
  box-sizing: border-box;
  padding: 0;
  vertical-align: middle;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  transition: box-shadow $transition-base;

  &:hover:not(:focus-within) {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  &:focus-within {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }
}

.library-create-doc-report-tr.is-tall .library-create-doc-report-cell {
  vertical-align: top;
}

.library-create-doc-report-tr:last-child .library-create-doc-report-label,
.library-create-doc-report-tr:last-child .library-create-doc-report-cell {
  border-bottom: none;
}

// 입력은 테두리 없음 — 겹침 방지 (편집 강조는 td:focus-within 만 사용)
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
.library-create-doc-report-cell :deep(.inp.ui-textarea.has-border) {
  width: 100%;
  box-sizing: border-box;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.library-create-doc-report-cell :deep(.inp.ui-textarea:hover),
.library-create-doc-report-cell :deep(.inp.ui-textarea:focus) {
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
