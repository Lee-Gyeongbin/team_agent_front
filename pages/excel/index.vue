<template>
  <div class="excel-view-page">
    <div class="excel-view-page__header">
      <h1 class="excel-view-page__title">엑셀 뷰어</h1>
      <button
        v-if="fileName"
        class="excel-view-page__reset-btn"
        @click="onReset"
      >
        다른 파일 열기
      </button>
    </div>

    <!-- 파일 업로드 영역 -->
    <div
      v-if="!fileName && !isLoading"
      class="excel-upload"
      :class="{ 'excel-upload--drag-over': isDragOver }"
      @click="onClickUpload"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="excel-upload__icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 32V16M24 16L18 22M24 16L30 22"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 32V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V32"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="excel-upload__text">엑셀 파일을 드래그하거나 클릭하여 업로드하세요</p>
      <p class="excel-upload__hint">.xlsx, .xls 파일 지원</p>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      class="excel-upload-hidden-input"
      @change="onFileChange"
    />

    <!-- 로딩 -->
    <div
      v-if="isLoading"
      class="excel-loading"
    >
      <div class="excel-loading__spinner" />
      <p class="excel-loading__text">파일 분석 중...</p>
    </div>

    <!-- 에러 -->
    <div
      v-if="errorMessage && !isLoading"
      class="excel-error"
    >
      <p class="excel-error__message">{{ errorMessage }}</p>
      <button
        class="excel-error__retry-btn"
        @click="onReset"
      >
        다시 시도
      </button>
    </div>

    <!-- 엑셀 뷰어 -->
    <template v-if="activeSheet && !isLoading && !errorMessage">
      <!-- 파일 정보 -->
      <p class="excel-view-page__file-name">{{ fileName }}</p>

      <!-- 테이블 영역 -->
      <div class="excel-table-wrapper">
        <div
          ref="tableContainerRef"
          class="excel-table-container"
        >
          <table class="excel-table">
            <colgroup>
              <col class="excel-table__row-header-col" />
              <col
                v-for="(w, ci) in activeSheet.colWidths"
                :key="ci"
                :style="{ width: w + 'px' }"
              />
            </colgroup>
            <thead>
              <tr>
                <th class="excel-table__corner" />
                <th
                  v-for="(_, ci) in activeSheet.colWidths"
                  :key="ci"
                  class="excel-table__col-header"
                >
                  {{ getColumnLabel(ci) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in activeSheet.data"
                :key="ri"
                :style="{ height: activeSheet.rowHeights[ri] + 'px' }"
              >
                <td class="excel-table__row-header">{{ ri + 1 }}</td>
                <template
                  v-for="(cell, ci) in row"
                  :key="ci"
                >
                  <td
                    v-if="!cell.isMergedSlave"
                    class="excel-table__cell"
                    :colspan="cell.colspan"
                    :rowspan="cell.rowspan"
                    :style="cellStyle(cell)"
                  >
                    {{ cell.value ?? '' }}
                  </td>
                </template>
              </tr>
            </tbody>
          </table>

          <!-- 이미지 오버레이 -->
          <div
            v-for="(img, idx) in activeSheet.images"
            :key="'img-' + idx"
            class="excel-image-overlay"
            :style="imagePosition(img)"
          >
            <img
              :src="img.src"
              :style="{ width: '100%', height: '100%', objectFit: 'contain' }"
            />
          </div>
        </div>
      </div>

      <!-- 시트 탭 (테이블 하단) -->
      <div
        v-if="sheets.length > 1"
        class="excel-tabs"
      >
        <button
          v-for="(sheet, idx) in sheets"
          :key="sheet.name"
          class="excel-tabs__tab"
          :class="{ 'excel-tabs__tab--active': idx === activeSheetIndex }"
          @click="onSelectSheet(idx)"
        >
          {{ sheet.name }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ExcelCell, ExcelImage } from '~/types/excel'

const {
  sheets,
  activeSheetIndex,
  activeSheet,
  isLoading,
  errorMessage,
  fileName,
  onFileUpload,
  onSelectSheet,
  onReset,
} = useExcelViewer()

const fileInputRef = ref<HTMLInputElement | null>(null)
const tableContainerRef = ref<HTMLElement | null>(null)
const isDragOver = ref(false)

const onClickUpload = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) onFileUpload(file)
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) onFileUpload(file)
}

function getColumnLabel(index: number): string {
  let label = ''
  let n = index
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label
    n = Math.floor(n / 26) - 1
  }
  return label
}

function cellStyle(cell: ExcelCell): Record<string, string> {
  const s: Record<string, string> = {}
  const cs = cell.style
  if (cs.backgroundColor) s.backgroundColor = cs.backgroundColor
  if (cs.color) s.color = cs.color
  if (cs.fontFamily) s.fontFamily = cs.fontFamily
  if (cs.fontSize) s.fontSize = cs.fontSize
  if (cs.fontWeight) s.fontWeight = cs.fontWeight
  if (cs.fontStyle) s.fontStyle = cs.fontStyle
  if (cs.textDecoration) s.textDecoration = cs.textDecoration
  if (cs.textAlign) s.textAlign = cs.textAlign
  if (cs.verticalAlign) s.verticalAlign = cs.verticalAlign
  if (cs.whiteSpace) s.whiteSpace = cs.whiteSpace
  if (cs.borderTop) s.borderTop = cs.borderTop
  if (cs.borderRight) s.borderRight = cs.borderRight
  if (cs.borderBottom) s.borderBottom = cs.borderBottom
  if (cs.borderLeft) s.borderLeft = cs.borderLeft
  return s
}

function imagePosition(img: ExcelImage): Record<string, string> {
  if (!activeSheet.value) return {}
  const { colWidths, rowHeights } = activeSheet.value

  // 행 헤더 너비 보정 (약 40px)
  const ROW_HEADER_WIDTH = 40
  // 열 헤더 높이 보정 (약 28px)
  const COL_HEADER_HEIGHT = 28

  let left = ROW_HEADER_WIDTH
  for (let c = 0; c < img.col && c < colWidths.length; c++) {
    left += colWidths[c]
  }

  let top = COL_HEADER_HEIGHT
  for (let r = 0; r < img.row && r < rowHeights.length; r++) {
    top += rowHeights[r]
  }

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${img.width}px`,
    height: `${img.height}px`,
    pointerEvents: 'none',
  }
}
</script>

<style lang="scss" scoped>
.excel-view-page {
  padding: $spacing-xl;
  max-width: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
    margin: 0;
  }

  &__reset-btn {
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius-md;
    background: $color-background;
    color: $color-text-primary;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-surface;
      border-color: $color-primary;
      color: $color-primary;
    }
  }

  &__file-name {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-sm;
  }
}

.excel-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  border: 2px dashed $color-border;
  border-radius: $border-radius-lg;
  background: $color-surface;
  cursor: pointer;
  transition: all $transition-base;
  min-height: 240px;
  position: relative;

  &:hover,
  &--drag-over {
    border-color: $color-primary;
    background: rgba($color-primary, 0.04);
  }

  &__icon {
    color: $color-text-disabled;
    margin-bottom: $spacing-md;
  }

  &__text {
    font-size: $font-size-base;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-disabled;
  }
}

.excel-upload-hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.excel-loading {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid $color-border;
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.excel-error {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;

  &__message {
    font-size: $font-size-sm;
    color: $color-error;
  }

  &__retry-btn {
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-error;
    border-radius: $border-radius-md;
    background: transparent;
    color: $color-error;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-error;
      color: #fff;
    }
  }
}

.excel-table-wrapper {
  border: 1px solid $color-border;
  border-radius: $border-radius-md $border-radius-md 0 0;
  overflow: auto;
  max-height: calc(100vh - 260px);
  @include custom-scrollbar(8px);
}

.excel-tabs {
  display: flex;
  gap: 0;
  border-top: none;
  overflow-x: auto;

  &__tab {
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-border;
    border-top: none;
    border-radius: 0 0 $border-radius-sm $border-radius-sm;
    background: $color-surface;
    color: $color-text-secondary;
    font-size: $font-size-xs;
    cursor: pointer;
    white-space: nowrap;
    transition: all $transition-fast;
    margin-right: -1px;

    &:hover {
      background: $color-background;
      color: $color-text-primary;
    }

    &--active {
      background: $color-background;
      color: $color-primary;
      font-weight: $font-weight-medium;
      border-top: 1px solid $color-background;
      position: relative;
      z-index: 1;
    }
  }
}

.excel-table-container {
  position: relative;
  display: inline-block;
  min-width: 100%;
}

.excel-table {
  border-collapse: collapse;
  table-layout: fixed;
  font-size: $font-size-xs;
  font-family: 'Calibri', $font-family-base;
  white-space: nowrap;

  &__row-header-col {
    width: 40px;
  }

  &__corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
    background: #f0f0f0;
    border: 1px solid #d0d0d0;
    min-width: 40px;
  }

  &__col-header {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f0f0f0;
    border: 1px solid #d0d0d0;
    padding: 4px 6px;
    text-align: center;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    font-size: 11px;
  }

  &__row-header {
    position: sticky;
    left: 0;
    z-index: 1;
    background: #f0f0f0;
    border: 1px solid #d0d0d0;
    padding: 2px 6px;
    text-align: center;
    font-weight: $font-weight-normal;
    color: $color-text-secondary;
    font-size: 11px;
    min-width: 40px;
  }

  &__cell {
    border: 1px solid #e0e0e0;
    padding: 2px 4px;
    vertical-align: bottom;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: text;
  }
}

.excel-image-overlay {
  z-index: 4;
  overflow: hidden;
}
</style>
