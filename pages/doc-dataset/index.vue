<template>
  <div class="card-grid-page m-center">
    <!-- 페이지 헤더 -->
    <div class="card-grid-page-header">
      <p class="card-grid-page-title">문서데이터셋 목록</p>
      <UiButton
        variant="primary"
        size="md"
        @click="openCreateModal"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        새 데이터셋 생성
      </UiButton>
    </div>

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      text="데이터셋을 불러오는 중..."
    />

    <!-- 요약 통계 -->
    <template v-else>
      <DocDatasetSummary :summary="summary" />

      <!-- 카드 그리드 -->
      <div class="card-grid">
        <DocDatasetCard
          v-for="dataset in datasetList"
          :key="dataset.datasetId"
          :dataset="dataset"
          @toggle-active="handleToggleActiveDocDataset(dataset.datasetId, dataset.useYn)"
          @test="onTest(dataset.datasetId)"
          @history="onHistory(dataset.datasetId)"
          @edit="onEdit"
          @delete="onDelete"
          @stop-build="onStopBuild"
        />

        <!-- 빈 상태 -->
        <div
          v-if="datasetList.length === 0"
          class="card-grid-empty"
        >
          <UiEmpty
            icon="icon-database"
            title="등록된 데이터셋이 없습니다."
            description="새 데이터셋을 생성하여 RAG 검색을 시작하세요."
          >
            <UiButton
              variant="primary"
              size="sm"
              @click="openCreateModal"
            >
              새 데이터셋 생성
            </UiButton>
          </UiEmpty>
        </div>
      </div>
    </template>

    <!-- 생성 모달 -->
    <DocDatasetCreateModal
      :is-open="isCreateModalOpen"
      :mode="modalMode"
      :initial-form-data="editFormData"
      @close="isCreateModalOpen = false"
      @save="onSaveCreate"
    />
    <!-- 테스트 모달 -->
    <DocDatasetTestModal
      :dataset-id="testDatasetId"
      @close="isTestModalOpen = false"
    />
    <!-- 변경 이력 모달 -->
    <DocDatasetHistoryModal
      :is-open="isHistoryModalOpen"
      :dataset-id="historyDatasetId"
      @close="isHistoryModalOpen = false"
    />
    <!-- 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isDeleteModalOpen"
      title="데이터셋 삭제"
      :message="'이 데이터셋을 삭제하시겠습니까?\n벡터 인덱스가 함께 삭제됩니다.'"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import DocDatasetSummary from '~/components/doc-dataset/DocDatasetSummary.vue'
import DocDatasetCard from '~/components/doc-dataset/DocDatasetCard.vue'
import DocDatasetCreateModal from '~/components/doc-dataset/DocDatasetCreateModal.vue'
import { useDocDatasetStore } from '~/composables/doc-dataset/useDocDatasetStore'
import type { DocDatasetForm } from '~/types/doc-dataset'
const {
  isLoading,
  isDeleteModalOpen,
  isTestModalOpen,
  isHistoryModalOpen,
  testDatasetId,
  historyDatasetId,
  openCreateModal,
  isCreateModalOpen,
  modalMode,
  editFormData,
  datasetList,
  summary,
  handleSelectAll,
  onSaveCreate,
  onDelete,
  doDelete,
  handleToggleActiveDocDataset,
  onEdit,
  onHistory,
  onTest,
} = useDocDatasetStore()

onMounted(async () => {
  await handleSelectAll()
  isLoading.value = false
})

// 구축 중지
const onStopBuild = (id: string) => {
  console.warn('[TODO] 구축 중지:', id)
}
</script>
