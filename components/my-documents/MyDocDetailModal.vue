<template>
  <UiModal
    :is-open="isOpen"
    :title="doc?.docNm || '문서 상세'"
    :max-width="'min(1720px, calc(100vw - 32px))'"
    custom-class="doc-dataset-create-modal library-create-doc-modal library-create-doc-report-modal my-doc-detail-modal"
    show-fullscreen
    @close="emit('close')"
  >
    <div class="my-doc-detail-report doc-dataset-create-form com-setting-form">
      <div class="my-doc-detail-report-layout">
        <!-- 좌측: 저장된 보고서 에디터 -->
        <div class="my-doc-detail-report-main">
          <div
            ref="reportSheetRef"
            class="my-doc-detail-report-sheet"
          >
            <div class="my-doc-detail-report-sheet-head">
              <div class="my-doc-detail-report-sheet-head-left">
                <i class="icon icon-document size-18" />
                <span class="my-doc-detail-report-sheet-title">{{ doc?.docNm || '보고서' }}</span>
              </div>
              <p
                v-if="docDateLabel"
                class="my-doc-detail-report-sheet-date"
              >
                {{ docDateLabel }}
              </p>
            </div>

            <div
              v-if="!hasDocContent"
              class="my-doc-detail-report-empty"
            >
              <p class="my-doc-detail-report-empty-title">문서 내용이 없습니다.</p>
              <p class="my-doc-detail-report-empty-desc">저장된 보고서 HTML이 없어 표시할 수 없습니다.</p>
            </div>

            <LibraryReportEditor
              v-else
              ref="reportEditorRef"
              v-model:html="editorHtml"
            />
          </div>
        </div>

        <!-- 우측: 문서 도구 -->
        <aside
          class="my-doc-detail-report-side"
          aria-label="문서 도구"
        >
          <div class="my-doc-detail-side-panels">
            <section
              class="my-doc-detail-side-panel"
              aria-label="파일로 저장"
            >
              <div class="my-doc-detail-side-head">
                <h3 class="my-doc-detail-side-title">파일로 저장</h3>
                <p class="my-doc-detail-side-desc">문서를 원하는 형식으로 내려받을 수 있습니다.</p>
              </div>

              <div class="my-doc-detail-download-list">
                <button
                  v-for="item in downloadItems"
                  :key="item.id"
                  type="button"
                  class="my-doc-detail-download-btn"
                  :disabled="!hasDocContent"
                  @click="item.onClick"
                >
                  <span
                    class="my-doc-detail-download-btn-icon"
                    :class="item.iconTone"
                    aria-hidden="true"
                  >
                    <i :class="['icon', item.iconClass, 'size-24']" />
                  </span>
                  <span class="my-doc-detail-download-btn-text">
                    <span class="my-doc-detail-download-btn-label">{{ item.label }}</span>
                    <span class="my-doc-detail-download-btn-ext">{{ item.ext }}</span>
                  </span>
                  <i
                    class="icon icon-download size-16 my-doc-detail-download-btn-arrow"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </section>

            <section
              class="my-doc-detail-side-panel"
              aria-label="AI 생성본 복원"
            >
              <div class="my-doc-detail-side-head">
                <h3 class="my-doc-detail-side-title">AI 생성본 복원</h3>
                <p class="my-doc-detail-side-desc">수정 전 AI가 최초 생성한 보고서로 되돌립니다.</p>
              </div>

              <button
                type="button"
                class="my-doc-detail-restore-btn"
                :disabled="!canRestoreOrigin"
                @click="onRestoreOriginHtml"
              >
                <span
                  class="my-doc-detail-download-btn-icon is-restore"
                  aria-hidden="true"
                >
                  <i class="icon icon-regenerate size-24" />
                </span>
                <span class="my-doc-detail-download-btn-text">
                  <span class="my-doc-detail-download-btn-label">AI 최초 생성본으로 되돌리기</span>
                  <span class="my-doc-detail-download-btn-ext">현재 편집 내용이 초기화됩니다</span>
                </span>
              </button>
            </section>
          </div>

          <div class="my-doc-detail-side-footer">
            <UiButton
              variant="primary"
              size="lg"
              full-width
              :disabled="!canSaveDoc"
              @click="onSaveDoc"
            >
              <template #icon-left>
                <i class="icon icon-archive size-18" />
              </template>
              저장
            </UiButton>
          </div>
        </aside>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'
import type { MyDoc } from '~/types/mydoc'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import {
  downloadMyDocAsExcel,
  downloadMyDocAsPdf,
  downloadMyDocAsPng,
  downloadMyDocAsTxt,
  downloadMyDocAsWord,
} from '~/utils/myDocuments/myDocExportUtil'

const props = defineProps<{
  isOpen: boolean
  doc: MyDoc | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { handleSaveMyDoc, handleRestoreMyDocOrigin } = useMyDocStore()

const editorHtml = ref('')
const reportEditorRef = ref<{ getCurrentHtml: () => string } | null>(null)
const reportSheetRef = ref<HTMLElement | null>(null)

const hasDocContent = computed(() => !!editorHtml.value.trim())

const savedDocHtml = computed(() => props.doc?.docHtml?.trim() ?? '')

const isDocDirty = computed(() => {
  if (!hasDocContent.value) return false
  return getDownloadHtml() !== savedDocHtml.value
})

const canSaveDoc = computed(() => !!props.doc?.docId && hasDocContent.value && isDocDirty.value)

const hasOriginHtml = computed(() => !!props.doc?.originHtml?.trim())

/** 다운로드 시 TipTap 에디터 최신 HTML 우선 사용 */
const getDownloadHtml = () => reportEditorRef.value?.getCurrentHtml()?.trim() || editorHtml.value

const isSameAsOrigin = computed(() => {
  const origin = props.doc?.originHtml?.trim() ?? ''
  if (!origin) return false
  return getDownloadHtml() === origin
})

const canRestoreOrigin = computed(() => hasOriginHtml.value && hasDocContent.value && !isSameAsOrigin.value)

const docDateLabel = computed(() => {
  const dt = props.doc?.modifyDt || props.doc?.createDt
  if (!dt) return ''
  const formatted = formatDateTimeDisplay(dt)
  return formatted ? `최종 수정 ${formatted}` : ''
})

type DownloadItem = {
  id: string
  label: string
  ext: string
  iconClass: string
  iconTone: string
  onClick: () => void | Promise<void>
}

const runDownload = async (
  downloadFn: (html: string, docNm: string) => Promise<boolean>,
  successMessage: string,
  errorMessage: string,
) => {
  if (!getDownloadHtml().trim()) {
    openToast({ message: '다운로드할 문서 내용이 없습니다.', type: 'warning' })
    return
  }

  const docNm = props.doc?.docNm ?? '문서'
  const ok = await downloadFn(getDownloadHtml(), docNm)
  if (ok) {
    openToast({ message: successMessage, type: 'success' })
    return
  }
  openToast({ message: errorMessage, type: 'error' })
}

const onSaveDoc = async () => {
  const docId = props.doc?.docId
  if (!docId) return
  await handleSaveMyDoc(docId, getDownloadHtml())
}

const onRestoreOriginHtml = async () => {
  const docId = props.doc?.docId
  if (!docId || !props.doc?.originHtml?.trim()) {
    openToast({ message: 'AI 최초 생성본이 없습니다.', type: 'warning' })
    return
  }

  const ok = await openConfirm({
    title: 'AI 생성본 복원',
    message: '편집 내용이 초기화되고 AI가 최초 생성한 보고서로 되돌아갑니다. 계속하시겠습니까?',
    confirmText: '되돌리기',
  })
  if (!ok) return

  await handleRestoreMyDocOrigin(docId)
}

const onDownloadPng = async () => {
  if (!hasDocContent.value) {
    openToast({ message: '다운로드할 문서 내용이 없습니다.', type: 'warning' })
    return
  }

  const docNm = props.doc?.docNm ?? '문서'
  const ok = await downloadMyDocAsPng(reportSheetRef.value, docNm)
  if (ok) {
    openToast({ message: 'PNG 이미지를 다운로드했습니다.', type: 'success' })
    return
  }
  openToast({ message: 'PNG 이미지 생성에 실패했습니다.', type: 'error' })
}

const downloadItems: DownloadItem[] = [
  {
    id: 'word',
    label: 'Word',
    ext: '.docx',
    iconClass: 'icon-file-doc',
    iconTone: 'is-word',
    onClick: () => runDownload(downloadMyDocAsWord, 'Word 파일을 다운로드했습니다.', 'Word 파일 생성에 실패했습니다.'),
  },
  {
    id: 'pdf',
    label: 'PDF',
    ext: '.pdf',
    iconClass: 'icon-file-pdf',
    iconTone: 'is-pdf',
    onClick: () =>
      runDownload(downloadMyDocAsPdf, '인쇄 창이 열렸습니다. 「PDF로 저장」을 선택하세요.', 'PDF 생성에 실패했습니다.'),
  },
  {
    id: 'excel',
    label: 'Excel',
    ext: '.xlsx',
    iconClass: 'icon-document',
    iconTone: 'is-excel',
    onClick: () =>
      runDownload(
        downloadMyDocAsExcel,
        'Excel 파일을 다운로드했습니다.',
        '표 데이터가 없거나 Excel 파일 생성에 실패했습니다.',
      ),
  },
  {
    id: 'txt',
    label: '텍스트',
    ext: '.txt',
    iconClass: 'icon-file-txt',
    iconTone: 'is-txt',
    onClick: () =>
      runDownload(downloadMyDocAsTxt, '텍스트 파일을 다운로드했습니다.', '텍스트 파일 생성에 실패했습니다.'),
  },
  {
    id: 'png',
    label: '이미지',
    ext: '.png',
    iconClass: 'icon-view',
    iconTone: 'is-png',
    onClick: onDownloadPng,
  },
]

watch(
  () => [props.isOpen, props.doc?.docId, props.doc?.docHtml] as const,
  ([open, , docHtml]) => {
    if (!open) {
      editorHtml.value = ''
      return
    }
    editorHtml.value = docHtml?.trim() ?? ''
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.my-doc-detail-report {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  min-width: 0;
  padding-bottom: 0;
}

.my-doc-detail-report-layout {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  gap: $spacing-md;
  min-height: 0;
  width: 100%;
  min-width: 0;
}

.my-doc-detail-report-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.my-doc-detail-report-side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: clamp(300px, 26vw, 400px);
  min-width: 280px;
  max-width: 100%;
  min-height: 0;
  padding-left: $spacing-md;
  border-left: 1px solid $color-border;
  box-sizing: border-box;
}

.my-doc-detail-side-footer {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: $spacing-md;
}

.my-doc-detail-side-panels {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: $spacing-md;
  min-height: 0;
  overflow-y: auto;
}

.my-doc-detail-side-panel {
  flex-shrink: 0;
  padding: $spacing-md;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
}

.my-doc-detail-side-head {
  flex-shrink: 0;
  margin-bottom: $spacing-md;
}

.my-doc-detail-side-title {
  margin: 0 0 6px;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.my-doc-detail-side-desc {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
}

.my-doc-detail-download-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-sm;
}

.my-doc-detail-download-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 52px;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color $transition-base,
    background-color $transition-base,
    box-shadow $transition-base;

  &:hover:not(:disabled) {
    border-color: #94a3b8;
    background: #f8fafc;
    box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.my-doc-detail-download-btn-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 16px;
  border-radius: $border-radius-base;
  background: rgba(60, 105, 219, 0.08);

  &.is-word {
    background: rgba(60, 105, 219, 0.1);
  }

  &.is-pdf {
    background: rgba(219, 59, 118, 0.1);
  }

  &.is-excel {
    background: rgba(33, 115, 70, 0.12);
    color: #217346;
  }

  &.is-txt {
    background: rgba(77, 84, 98, 0.1);
    color: #4d5462;
  }

  &.is-png {
    background: rgba(15, 118, 110, 0.1);
    color: #0f766e;
  }

  &.is-restore {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
  }
}

.my-doc-detail-restore-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  min-height: 56px;
  padding: $spacing-sm $spacing-md;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color $transition-base,
    background-color $transition-base,
    box-shadow $transition-base;

  &:hover:not(:disabled) {
    border-color: #94a3b8;
    background: #f8fafc;
    box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.my-doc-detail-download-btn-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.my-doc-detail-download-btn-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
  @include ellipsis(1);
}

.my-doc-detail-download-btn-ext {
  font-size: 10px;
  color: $color-text-muted;
}

.my-doc-detail-download-btn-arrow {
  flex-shrink: 0;
  color: $color-text-muted;
}

.my-doc-detail-report-sheet {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
}

.my-doc-detail-report-sheet-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  flex-wrap: wrap;
  padding: $spacing-sm $spacing-md;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.my-doc-detail-report-sheet-head-left {
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

.my-doc-detail-report-sheet-title {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  @include ellipsis(1);
}

.my-doc-detail-report-sheet-date {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  white-space: nowrap;
}

.my-doc-detail-report-empty {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  min-height: 240px;
  padding: $spacing-xl;
  text-align: center;
}

.my-doc-detail-report-empty-title {
  margin: 0;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
}

.my-doc-detail-report-empty-desc {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
}
</style>
