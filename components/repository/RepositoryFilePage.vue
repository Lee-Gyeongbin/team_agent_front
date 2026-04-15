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
        @click="openRegisterModal"
      >
        <template #icon-left>
          <i class="icon icon-plus size-16" />
        </template>
        파일 추가
      </UiButton>
    </div>

    <section class="repository-content-wrapper flex">
      <aside class="category-panel">
        <div class="category-panel-header flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="category-panel-title">카테고리</span>
            <UiButton
              icon-only
              variant="ghost"
              size="xxs"
              class="btn-add-category"
              @click="openCategorySelectModal"
            >
              <template #icon-left>
                <i class="icon icon-sliders size-16" />
              </template>
            </UiButton>
          </div>
          <UiButton
            icon-only
            variant="ghost"
            size="xxs"
            class="btn-add-category"
            @click="toggleCategoryInput"
          >
            <template #icon-left>
              <i class="icon icon-plus-medium size-16" />
            </template>
          </UiButton>
        </div>
        <div
          v-if="isCategoryInputVisible"
          class="category-input-wrap"
        >
          <UiInput
            ref="categoryInputRef"
            v-model="categoryInputValue"
            :placeholder="categoryInputPlaceholder"
            size="sm"
            @enter="onCategoryInputEnter"
          />
        </div>
        <div class="category-tree-wrap">
          <ul class="category-tree">
            <CategoryTreeNode
              v-for="cat in filteredCategoryList"
              :key="cat.categoryId"
              :item="cat"
              :depth="1"
              selectable
              :max-category-depth="5"
              :selected-ids="selectedCategoryIds"
              :show-check-icon="false"
              :editing-category-id="editingCategoryId"
              :editing-name="editingName"
              :menu-items="categoryMenuItems"
              @toggle="toggleExpand"
              @select="onCategorySelect"
              @menu-select="onCategoryMenuSelect"
              @update:editing-name="editingName = $event"
              @save-rename="saveCategoryRename"
            />
          </ul>
        </div>
      </aside>

      <div class="document-panel">
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
                clickable
                empty-text=""
                @row-click="onFileTableRowClick"
              >
                <template #header-select>
                  <UiCheckbox
                    :model-value="isAllFileRowsSelected"
                    @update:model-value="toggleSelectAllFiles"
                  />
                </template>
                <template #cell-fileName="{ row }">
                  <div class="cell-document flex items-center doc-name-grp">
                    <UiTooltip
                      v-if="String(row.fileName ?? '').trim()"
                      font-size="11px"
                      side="bottom"
                      align="start"
                      :content="String(row.fileName ?? '')"
                      content-class="repository-doc-title-tooltip"
                    >
                      <span class="doc-name">{{ row.fileName }}</span>
                    </UiTooltip>
                    <span
                      v-else
                      class="doc-name"
                    >
                      {{ row.fileName }}
                    </span>
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
                <template #cell-fileSize="{ value }">
                  <span class="repository-file-size">{{ formatFileSizeToMb(value) }}</span>
                </template>
                <template #cell-categoryName="{ value }">
                  <span class="repository-file-type">{{ String(value ?? '-').trim() || '-' }}</span>
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
      </div>
    </section>

    <RepositoryFileFormModal
      v-model:form-category-id="formCategoryId"
      v-model:form-sec-lvl="formSecLvl"
      v-model:form-doc-desc="formDocDesc"
      v-model:form-keywords="formKeywords"
      v-model:form-doc-src="formDocSrc"
      v-model:file-upload-modal-files="fileUploadModalFiles"
      :is-open="isFormModalOpen"
      :editing-doc-file-id="editingDocFileId"
      :editing-file-name="editingFileName"
      :category-options="categoryOptions"
      :sec-lvl-options="secLvlOptions"
      :file-upload-allowed-ext="FILE_UPLOAD_ALLOWED_EXT"
      :file-upload-max="FILE_UPLOAD_MAX"
      :file-upload-max-size="FILE_UPLOAD_MAX_SIZE"
      :file-accept="fileAccept"
      @close="closeFormModal"
      @submit="onSubmitForm"
    />

    <FilePreviewModal
      v-model:is-open="isFilePreviewOpen"
      v-model:doc-file-id="filePreviewDocFileId"
      :title="filePreviewTitle"
      :doc-file-options="filePreviewDocFileOptions"
      @close="onCloseFilePreview"
    />

    <CategorySelectModal
      :is-open="isCategorySelectModalOpen"
      @close="isCategorySelectModalOpen = false"
      @confirm="onCategorySelectConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import FilePreviewModal from '~/components/file/FilePreviewModal.vue'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import CategoryTreeNode from '~/components/repository/CategoryTreeNode.vue'
import RepositoryFileFormModal from '~/components/repository/RepositoryFileFormModal.vue'
import { useCategoryStore } from '~/composables/repository/useCategoryStore'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import type { CategoryTreeItem, FileLibraryItem } from '~/types/repository'
import type { TableColumn } from '~/types/table'

const {
  fileSearchKeyword,
  fileSelectedCategoryId,
  fileLibraryList,
  fileTotalCount,
  fileCurrentPage,
  filePageSize,
  fileLibraryLoading,
  fileLibraryError,
  handleSelectFileLibraryList,
  onFileSearch,
  handleSaveFileLibraryBatch,
  handleUpdateFileLibrary,
  handleDeleteFileLibraryBatch,
  handleOpenFileLibraryPreview,
  handleDownloadFileLibraryRow,
  isFilePreviewOpen,
  filePreviewDocFileId,
  filePreviewTitle,
  filePreviewDocFileOptions,
  onCloseFilePreview,
} = useRepositoryStore()

const {
  isCategoryInputVisible,
  isCategorySelectModalOpen,
  categoryInputValue,
  categoryInputRef,
  editingCategoryId,
  editingName,
  categoryInputPlaceholder,
  categoryMenuItems,
  filteredCategoryList,
  selectedCategoryIds,
  onCategorySelectConfirm,
  handleSelectCategoryList,
  toggleExpand,
  onCategorySelect,
  onCategoryMenuSelect,
  saveCategoryRename,
  openCategorySelectModal,
  toggleCategoryInput,
  onCategoryInputEnter,
} = useCategoryStore()

const isFormModalOpen = ref(false)
const editingDocFileId = ref('')
const editingFileName = ref('')
const formCategoryId = ref('')
const formSecLvl = ref('001')
const formDocDesc = ref('')
const formKeywords = ref('')
const formDocSrc = ref('')
const fileUploadModalFiles = ref<File[]>([])
const selectedFileIds = ref<string[]>([])
const secLvlOptions = ref<{ label: string; value: string }[]>([{ label: '선택', value: '' }])

const FILE_UPLOAD_ALLOWED_EXT: string[] = ['txt', 'pptx', 'pdf', 'docx', 'hwp']
const FILE_UPLOAD_MAX = 30
const FILE_UPLOAD_MAX_SIZE = 100 * 1024 * 1024
const fileAccept = '.txt,.pptx,.pdf,.docx,.hwp'

const fileTableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'fileName', label: '파일명', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'dsNm', label: '데이터셋명', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'fileSize', label: '크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'fileType', label: '형식', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'categoryName', label: '카테고리', width: '220px', align: 'left', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
]

const categoryOptions = computed(() => {
  const options: { label: string; value: string }[] = [{ label: '선택', value: '' }]
  const walk = (items: CategoryTreeItem[] | undefined) => {
    if (!items?.length) return
    for (const item of items) {
      options.push({ label: item.categoryName, value: item.categoryId })
      if (item.children?.length) walk(item.children)
    }
  }
  walk(filteredCategoryList.value)
  return options
})

const filePageModel = computed({
  get: () => fileCurrentPage.value,
  set: (page: number) => {
    fileCurrentPage.value = page
    void handleSelectFileLibraryList()
  },
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
  selectedFileIds.value = isAllFileRowsSelected.value ? [] : [...ids]
}

const toggleSelectFileRow = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedFileIds.value.includes(id)) selectedFileIds.value = [...selectedFileIds.value, id]
  } else {
    selectedFileIds.value = selectedFileIds.value.filter((x) => x !== id)
  }
}

const formatFileTypeLabel = (t: string) => {
  if (t.includes('/')) return t.split('/').pop() || t
  return t
}

const formatFileSizeToMb = (value: unknown) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const loadSecLvlOptions = async () => {
  const codes = await getCodes('DC000001')
  secLvlOptions.value = [{ label: '선택', value: '' }, ...codes.map((c) => ({ label: c.codeNm, value: c.codeId }))]
}

const resetForm = () => {
  editingDocFileId.value = ''
  editingFileName.value = ''
  formCategoryId.value = fileSelectedCategoryId.value
  formSecLvl.value = '001'
  formDocDesc.value = ''
  formKeywords.value = ''
  formDocSrc.value = ''
  fileUploadModalFiles.value = []
}

const openRegisterModal = () => {
  resetForm()
  isFormModalOpen.value = true
}

const openEditModal = (row: FileLibraryItem) => {
  editingDocFileId.value = String(row.docFileId ?? '')
  editingFileName.value = String(row.fileName ?? '')
  formCategoryId.value = String(row.categoryId ?? '')
  formSecLvl.value = String(row.secLvl ?? '001')
  formDocDesc.value = String(row.docDesc ?? '')
  formKeywords.value = String(row.keywords ?? '')
  formDocSrc.value = String(row.docSrc ?? '')
  isFormModalOpen.value = true
}

const closeFormModal = () => {
  isFormModalOpen.value = false
}

const onSubmitForm = async () => {
  if (!formCategoryId.value) {
    openToast({ message: '카테고리를 선택해 주세요.', type: 'warning' })
    return
  }
  if (!formSecLvl.value) {
    openToast({ message: '보안등급을 선택해 주세요.', type: 'warning' })
    return
  }
  if (!editingDocFileId.value && fileUploadModalFiles.value.length === 0) {
    openToast({ message: '업로드할 파일을 선택해 주세요.', type: 'warning' })
    return
  }

  if (editingDocFileId.value) {
    const ok = await handleUpdateFileLibrary({
      docFileId: editingDocFileId.value,
      categoryId: formCategoryId.value,
      secLvl: formSecLvl.value,
      docDesc: formDocDesc.value,
      keywords: formKeywords.value,
      docSrc: formDocSrc.value,
    })
    if (ok) closeFormModal()
    return
  }

  await handleSaveFileLibraryBatch(fileUploadModalFiles.value, {
    categoryId: formCategoryId.value,
    secLvl: formSecLvl.value,
    docDesc: formDocDesc.value,
    keywords: formKeywords.value,
    docSrc: formDocSrc.value,
  })
  closeFormModal()
}

const onFileTableRowClick = (row: Record<string, unknown>) => {
  const item = row as unknown as FileLibraryItem
  if (!String(item.docFileId ?? '').trim()) return
  openEditModal(item)
}

const onFileNamePreview = (row: Record<string, unknown>) => {
  handleOpenFileLibraryPreview(row as unknown as FileLibraryItem)
}

const onFileNameDownload = async (row: Record<string, unknown>) => {
  await handleDownloadFileLibraryRow(row as unknown as FileLibraryItem)
}

const onBatchDelete = async () => {
  if (selectedFileIds.value.length === 0) return
  await handleDeleteFileLibraryBatch([...selectedFileIds.value])
  selectedFileIds.value = []
}

onMounted(async () => {
  await Promise.all([handleSelectCategoryList(), loadSecLvlOptions()])
})
</script>

<style lang="scss" scoped>
.repository-file-tab {
  width: 100%;
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
