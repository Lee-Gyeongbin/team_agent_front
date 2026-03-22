<template>
  <UiModal
    :is-open="isOpen"
    title="변경이력"
    max-width="720px"
    custom-class="doc-dataset-history-modal"
    @close="emit('close')"
  >
    <!-- 이력 추가 -->
    <div class="doc-dataset-history-add">
      <p class="doc-dataset-history-add-title">이력 추가</p>
      <div class="doc-dataset-history-add-form">
        <div class="doc-dataset-history-add-fields">
          <div class="doc-dataset-history-add-version">
            <label class="doc-dataset-history-label"><span class="is-required">*</span>버전</label>
            <UiInput
              v-model="formVersion"
              placeholder="예: v.1.0"
              size="sm"
            />
          </div>
          <div class="doc-dataset-history-add-content">
            <label class="doc-dataset-history-label"><span class="is-required">*</span>내용</label>
            <UiTextarea
              v-model="formContent"
              placeholder="데이터셋에 대한 간단한 설명을 입력하세요&#10;두줄이상이면 스크롤"
              :rows="2"
              :max-rows="3"
              border
            />
          </div>
        </div>
        <UiButton
          variant="primary"
          size="md"
          class="doc-dataset-history-add-btn"
          :disabled="!isFormValid"
          @click="onAddHistory"
        >
          이력 추가
        </UiButton>
      </div>
    </div>

    <!-- 이력 목록 -->
    <div class="doc-dataset-history-list">
      <p class="doc-dataset-history-list-title">이력 목록</p>
      <div class="doc-dataset-history-table-wrap">
        <UiTable
          :columns="tableColumns"
          :data="historyList"
          empty-text="등록된 변경이력이 없습니다."
          sticky-header
          max-height="100%"
        >
          <template #cell-version="{ row }">
            <span class="doc-dataset-history-version">{{ row.verNo }}</span>
          </template>
          <template #cell-content="{ row }">
            <div class="doc-dataset-history-content-cell">{{ row.chgContent }}</div>
          </template>
          <template #cell-updatedAt="{ row }">
            <span class="doc-dataset-history-date">{{ row.modifyDt }}</span>
          </template>
          <template #cell-delete="{ row }">
            <button
              type="button"
              class="doc-dataset-history-delete-btn"
              @click="onDeleteHistory(row.histId)"
            >
              <i class="icon-trashcan size-16" />
            </button>
          </template>
        </UiTable>
      </div>

      <!-- 페이지네이션 -->
      <UiPagination
        v-if="historyTotalCount > 0"
        v-model="currentPage"
        :total-count="historyTotalCount"
        :page-size="historyPageSize"
        class="doc-dataset-history-pagination"
      />
    </div>

    <!-- 푸터 -->
    <template #footer>
      <div class="doc-dataset-history-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="emit('close')"
        >
          닫기
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useDocDatasetStore } from '~/composables/doc-dataset/useDocDatasetStore'
import type { TableColumn } from '~/types/table'

interface Props {
  isOpen: boolean
  datasetId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const {
  historyList,
  historyTotalCount,
  historyPage,
  historyPageSize,
  handleSelectDocDatasetHistoryList,
  handleSaveDocDatasetHistory,
  onDeleteHistory,
} = useDocDatasetStore()

// 테이블 컬럼 정의 (Figma 기준)
const tableColumns: TableColumn[] = [
  { key: 'version', label: '버전', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'content', label: '내용', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'updatedAt', label: '수정일시', width: '148px', align: 'center', headerAlign: 'center' },
  { key: 'delete', label: '삭제', width: '58px', align: 'center', headerAlign: 'center' },
]

// 폼
const formVersion = ref('')
const formContent = ref('')
const isFormValid = computed(() => formVersion.value.trim() !== '' && formContent.value.trim() !== '')

// 모달 열릴 때 이력 조회
watch(
  () => props.isOpen,
  async (open) => {
    if (open && props.datasetId) {
      formVersion.value = ''
      formContent.value = ''
      await handleSelectDocDatasetHistoryList(props.datasetId, 1)
    }
  },
)

// 페이지 변경
const currentPage = computed({
  get: () => historyPage.value,
  set: (page: number) => {
    handleSelectDocDatasetHistoryList(props.datasetId, page)
  },
})

// 이력 추가
const onAddHistory = async () => {
  if (!isFormValid.value) return
  await handleSaveDocDatasetHistory({
    datasetId: props.datasetId,
    version: formVersion.value.trim(),
    content: formContent.value.trim(),
  })
  formVersion.value = ''
  formContent.value = ''
}
</script>
