<template>
  <div class="repository-file-tab">
    <div class="document-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="fileSearchKeyword"
        type="search"
        placeholder="파일명으로 검색..."
        class="document-search-input"
        @search="onFileSearch"
        @enter="onFileSearch"
      />
      <UiButton
        variant="primary"
        size="md"
        class="btn-register-document"
        @click="onOpenFileUploadModal"
      >
        <template #icon-left>
          <i class="icon icon-plus size-16" />
        </template>
        파일 추가
      </UiButton>
    </div>

    <section class="repository-content-wrapper flex document-panel repository-file-panel">
      <div
        v-if="fileLibraryError"
        class="repository-file-error flex flex-col items-center gap-3 py-8"
      >
        <p class="text-error">{{ fileLibraryError }}</p>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="handleSelectFileLibraryList"
        >
          다시 시도
        </UiButton>
      </div>

      <template v-else>
        <UiLoading
          v-if="fileLibraryLoading"
          text="불러오는 중..."
        />
        <template v-else-if="fileLibraryList.length === 0">
          <UiEmpty description="등록된 파일이 없습니다." />
        </template>
        <template v-else>
          <div class="document-batch-bar flex items-center">
            <p class="batch-count">
              <span class="point-color">{{ selectedFileIds.length }}개</span> 선택됨
            </p>
            <UiButton
              variant="line-secondary"
              size="xxs"
              class="batch-bar-btn type-danger"
              :disabled="selectedFileIds.length === 0"
              @click="onBatchDelete"
            >
              <template #icon-left>
                <i class="icon icon-trashcan size-12" />
              </template>
              삭제
            </UiButton>
          </div>
          <div class="document-table-wrap">
            <UiTable
              :columns="fileTableColumns"
              :data="fileLibraryList"
              sticky-header
              empty-text=""
            >
              <template #header-select>
                <UiCheckbox
                  :model-value="isAllFileRowsSelected"
                  @update:model-value="toggleSelectAllFiles"
                />
              </template>
              <template #cell-fileName="{ row }">
                <div class="repository-file-name-wrap flex items-center">
                  <span class="repository-file-name">{{ row.fileName }}</span>
                  <button
                    type="button"
                    class="btn-doc-title"
                    title="미리보기"
                    @click.stop="onFileNamePreview(row)"
                  >
                    <i class="icon icon-view size-16"></i>
                  </button>
                  <button
                    type="button"
                    class="btn-doc-title"
                    title="다운로드"
                    @click.stop="onFileNameDownload(row)"
                  >
                    <i class="icon icon-download size-16"></i>
                  </button>
                </div>
              </template>
              <template #cell-fileType="{ value }">
                <span class="repository-file-type">{{ formatFileTypeLabel(String(value ?? '')) }}</span>
              </template>
              <template #cell-dsNmList="{ value }">
                <UiTooltip
                  v-if="String(value ?? '').trim()"
                  side="bottom"
                  align="start"
                  :show-arrow="false"
                >
                  <span class="repository-file-ds-nm">{{ String(value ?? '-') }}</span>
                  <template #content>
                    <span>{{ String(value ?? '-') }}</span>
                  </template>
                </UiTooltip>
                <span
                  v-else
                  class="repository-file-ds-nm"
                >
                  -
                </span>
              </template>
              <template #cell-select="{ row }">
                <div
                  class="cell-select-stop"
                  @click.stop
                >
                  <UiCheckbox
                    :model-value="selectedFileIds.includes(String(row.docFileId ?? ''))"
                    @update:model-value="(v) => toggleSelectFileRow(String(row.docFileId ?? ''), v)"
                  />
                </div>
              </template>
              <template #cell-actions="{ row }">
                <UiButton
                  variant="line-secondary"
                  size="xxs"
                  class="type-danger"
                  @click="onDeleteRow(row)"
                >
                  삭제
                </UiButton>
              </template>
            </UiTable>
          </div>
          <UiPagination
            v-if="fileTotalCount > 0"
            v-model="filePageModel"
            :total-count="fileTotalCount"
            :page-size="filePageSize"
            total-label="개 파일"
            class="document-pagination"
          />
        </template>
      </template>
    </section>

    <UiModal
      :is-open="isFileUploadModalOpen"
      title="파일 추가"
      position="center"
      :max-width="'560px'"
      custom-class="modal-repository-file-upload"
      @close="onCloseFileUploadModal"
    >
      <div class="repository-file-upload-modal-body">
        <div class="repository-file-upload-target">
          <p class="repository-file-upload-target-label">문서셋 매핑 (선택)</p>
          <UiSelect
            v-model="selectedDatasetDocId"
            :options="datasetOptions"
            placeholder="문서셋 선택 안 함"
            :disabled="isDatasetLoading"
            class="repository-file-upload-target-select"
          />
        </div>
        <UiFileUpload
          v-model="fileUploadModalFiles"
          :multiple="true"
          :max-files="FILE_UPLOAD_MAX"
          :accept="fileAccept"
          :allowed-extensions="FILE_UPLOAD_ALLOWED_EXT"
          hint="TXT, PPTX, PDF, DOCX, HWP (파일당 최대 50MB)"
        />
      </div>
      <template #footer>
        <div class="repository-file-upload-modal-footer">
          <UiButton
            variant="outline"
            size="xlg"
            class="btn-modal-dialog"
            @click="onCloseFileUploadModal"
          >
            취소
          </UiButton>
          <UiButton
            variant="primary"
            size="xlg"
            class="btn-modal-dialog"
            @click="onConfirmFileUploadModal"
          >
            등록
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { FileLibraryItem } from '~/types/repository'
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import { useFileStore } from '~/composables/com/useFileStore'
import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import type { TableColumn } from '~/types/table'

const {
  fileSearchKeyword,
  fileLibraryList,
  fileTotalCount,
  fileCurrentPage,
  filePageSize,
  fileLibraryLoading,
  fileLibraryError,
  handleSelectFileLibraryList,
  onFileSearch,
  handleSaveFileLibraryBatch,
  handleDeleteFileLibraryRow,
  handleDeleteFileLibraryBatch,
  handleOpenFileLibraryPreview,
} = useRepositoryStore()

const { fetchDocumentList } = useRepositoryApi()
const { onDownloadFile } = useFileStore()

const fileAccept = '.txt,.pptx,.pdf,.docx,.hwp'
const FILE_UPLOAD_ALLOWED_EXT: string[] = ['txt', 'pptx', 'pdf', 'docx', 'hwp']
const FILE_UPLOAD_MAX = 20

const isFileUploadModalOpen = ref(false)
const fileUploadModalFiles = ref<File[]>([])
const isDatasetLoading = ref(false)
const datasetOptions = ref<SelectOption[]>([{ label: '문서셋 선택 안 함', value: '' }])
const selectedDatasetDocId = ref<string | number>('')

/** 현재 목록에서 선택된 docFileId (문서 관리 탭 패턴과 동일) */
const selectedFileIds = ref<string[]>([])

watch(isFileUploadModalOpen, (open) => {
  if (open) {
    fileUploadModalFiles.value = []
    selectedDatasetDocId.value = ''
    void loadDatasetOptions()
  }
})

watch([fileCurrentPage, fileSearchKeyword], () => {
  selectedFileIds.value = []
})

watch(fileLibraryList, (list) => {
  const valid = new Set(list.map((r) => String((r as FileLibraryItem).docFileId ?? '').trim()).filter(Boolean))
  selectedFileIds.value = selectedFileIds.value.filter((id) => valid.has(id))
})

const isAllFileRowsSelected = computed(() => {
  const rows = fileLibraryList.value
  if (rows.length === 0) return false
  const ids = rows.map((r) => String((r as FileLibraryItem).docFileId ?? '').trim()).filter(Boolean)
  if (ids.length === 0) return false
  return ids.length === selectedFileIds.value.length && ids.every((id) => selectedFileIds.value.includes(id))
})

const toggleSelectAllFiles = () => {
  const rows = fileLibraryList.value
  const ids = rows.map((r) => String((r as FileLibraryItem).docFileId ?? '').trim()).filter(Boolean)
  if (ids.length === 0) return
  if (isAllFileRowsSelected.value) {
    selectedFileIds.value = []
  } else {
    selectedFileIds.value = [...ids]
  }
}

const toggleSelectFileRow = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedFileIds.value.includes(id)) selectedFileIds.value = [...selectedFileIds.value, id]
  } else {
    selectedFileIds.value = selectedFileIds.value.filter((x) => x !== id)
  }
}

const fileTableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'fileName', label: '파일명', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'fileSize', label: '크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'fileType', label: '형식', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'dsNmList', label: '사용 문서셋', width: '240px', align: 'left', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '관리', width: '88px', align: 'center', headerAlign: 'center' },
]

const formatFileTypeLabel = (t: string) => {
  if (t.includes('/')) return t.split('/').pop() || t
  return t
}

const filePageModel = computed({
  get: () => fileCurrentPage.value,
  set: (page: number) => {
    fileCurrentPage.value = page
    void handleSelectFileLibraryList()
  },
})

const onOpenFileUploadModal = () => {
  isFileUploadModalOpen.value = true
}

const onCloseFileUploadModal = () => {
  isFileUploadModalOpen.value = false
}

const onConfirmFileUploadModal = async () => {
  if (fileUploadModalFiles.value.length === 0) {
    openToast({ message: '업로드할 파일을 선택해 주세요.', type: 'warning' })
    return
  }
  const mappedDocId = String(selectedDatasetDocId.value ?? '').trim()
  await handleSaveFileLibraryBatch([...fileUploadModalFiles.value], mappedDocId || undefined)
  isFileUploadModalOpen.value = false
}

const loadDatasetOptions = async () => {
  isDatasetLoading.value = true
  try {
    const res = await fetchDocumentList(undefined, undefined, 'Y', 1, 200)
    const rows = (res.dataList ?? []).map((doc) => ({
      label: String(doc.docTitle ?? '').trim() || '(제목 없음)',
      value: String(doc.docId ?? '').trim(),
    }))
    datasetOptions.value = [{ label: '문서셋 선택 안 함', value: '' }, ...rows.filter((r) => r.value)]
  } catch {
    datasetOptions.value = [{ label: '문서셋 선택 안 함', value: '' }]
    openToast({ message: '문서셋 목록을 불러오지 못했습니다.', type: 'warning' })
  } finally {
    isDatasetLoading.value = false
  }
}

const onDeleteRow = (row: Record<string, unknown>) => {
  const id = String((row as unknown as FileLibraryItem).docFileId ?? '').trim()
  if (id) void handleDeleteFileLibraryRow(id)
}

const onFileNamePreview = (row: Record<string, unknown>) => {
  handleOpenFileLibraryPreview(row as unknown as FileLibraryItem)
}

const onFileNameDownload = async (row: Record<string, unknown>) => {
  const docId = String(row.docId ?? '').trim()
  const docFileId = String(row.docFileId ?? '').trim()
  if (!docId || !docFileId) {
    openToast({ message: '문서셋과 매핑된 파일만 다운로드할 수 있습니다.', type: 'warning' })
    return
  }
  await onDownloadFile(docId, docFileId)
}

const onBatchDelete = async () => {
  if (selectedFileIds.value.length === 0) return
  await handleDeleteFileLibraryBatch([...selectedFileIds.value])
  selectedFileIds.value = []
}

onMounted(async () => {
  await handleSelectFileLibraryList()
})
</script>

<style lang="scss" scoped>
.repository-file-upload-modal-body {
  padding: 0 4px 8px;
  width: 100%;
}

.repository-file-upload-target {
  margin-bottom: 12px;
}

.repository-file-upload-target-label {
  margin: 0 0 6px;
  @include typo($body-small);
  color: $color-text-secondary;
}

.repository-file-upload-target-select {
  width: 100%;
}

.repository-file-upload-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.repository-file-panel {
  min-height: 280px;
}

.repository-file-name {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.repository-file-type {
  display: block;
  width: 100%;
  min-width: 0;
  @include ellipsis(1);
}

.repository-file-ds-nm {
  display: block;
  width: 100%;
  min-width: 0;
  @include ellipsis(1);
}

// table-layout: fixed 셀에서 말줄임 동작 보장 (형식 컬럼)
:deep(.ui-table tbody td:nth-child(4)) {
  overflow: hidden;
}

.cell-select-stop {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-error {
  color: var(--color-danger, #c62828);
}

.repository-file-error {
  border: 1px dashed var(--color-border-subtle, rgba(0, 0, 0, 0.12));
  border-radius: $border-radius-base;
}
</style>
