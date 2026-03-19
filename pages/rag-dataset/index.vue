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
        :key="dataset.id"
        :dataset="dataset"
        @toggle-active="handleToggleActiveDocDataset"
        @test="onTest"
        @history="onHistory"
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
      @close="isCreateModalOpen = false"
      @save="onSaveCreate"
    />

    <!-- 검색 테스트 모달 -->
    <DocDatasetTestModal
      :is-open="isTestModalOpen"
      :dataset-id="testTargetId"
      @close="isTestModalOpen = false"
    />

    <!-- 변경이력 모달 -->
    <DocDatasetHistoryModal
      :is-open="isHistoryModalOpen"
      :dataset-id="historyTargetId"
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
import DocDatasetHistoryModal from '~/components/doc-dataset/DocDatasetHistoryModal.vue'
import DocDatasetTestModal from '~/components/doc-dataset/DocDatasetTestModal.vue'
import { useDocDatasetStore } from '~/composables/doc-dataset/useDocDatasetStore'
import type { DocDataset, DocDatasetForm } from '~/types/doc-dataset'

const {
  datasetList,
  summary,
  handleSelectAll,
  handleSaveDocDataset,
  handleDeleteDocDataset,
  handleToggleActiveDocDataset,
} = useDocDatasetStore()

// 초기 조회
const isLoading = ref(true)

onMounted(async () => {
  await handleSelectAll()
  isLoading.value = false
})

// 생성 모달
const isCreateModalOpen = ref(false)

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const onSaveCreate = async (data: DocDatasetForm, startBuild: boolean) => {
  await handleSaveDocDataset({
    name: data.name,
    version: data.version,
    isBuilding: startBuild,
  })
  isCreateModalOpen.value = false
}

// 테스트
const isTestModalOpen = ref(false)
const testTargetId = ref('')

const onTest = (id: string) => {
  testTargetId.value = id
  isTestModalOpen.value = true
}

// 변경이력
const isHistoryModalOpen = ref(false)
const historyTargetId = ref('')

const onHistory = (id: string) => {
  historyTargetId.value = id
  isHistoryModalOpen.value = true
}

// 수정
const onEdit = (dataset: DocDataset) => {
  console.warn('[TODO] 데이터셋 수정:', dataset)
}

// 삭제
const isDeleteModalOpen = ref(false)
const deleteTargetId = ref('')

const onDelete = (id: string) => {
  deleteTargetId.value = id
  isDeleteModalOpen.value = true
}

const doDelete = async () => {
  await handleDeleteDocDataset(deleteTargetId.value)
  isDeleteModalOpen.value = false
}

// 구축 중지
const onStopBuild = (id: string) => {
  console.warn('[TODO] 구축 중지:', id)
}
</script>
