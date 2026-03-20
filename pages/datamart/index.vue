<template>
  <div class="card-grid-page m-center">
    <!-- 페이지 헤더 -->
    <div class="card-grid-page-header">
      <p class="card-grid-page-title">데이터마트 목록</p>
      <UiButton
        variant="primary"
        size="md"
        @click="openCreateModal"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        데이터마트 추가
      </UiButton>
    </div>

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      text="데이터마트를 불러오는 중..."
    />

    <!-- 콘텐츠 -->
    <template v-else>
      <!-- 요약 통계 -->
      <DatamartSummary :summary="summary" />

      <!-- 카드 그리드 -->
      <div class="card-grid">
        <DatamartCard
          v-for="dm in datamartList"
          :key="dm.datamartId"
          :datamart="dm"
          @toggle-active="handleToggleActiveDatamart"
          @test="onTest"
          @edit="onEdit"
          @delete="onDelete"
        />

        <!-- 빈 상태 -->
        <div
          v-if="datamartList.length === 0"
          class="card-grid-empty"
        >
          <UiEmpty
            icon="icon-database"
            title="등록된 데이터마트가 없습니다."
          >
            <UiButton
              variant="primary"
              size="sm"
              @click="openCreateModal"
            >
              데이터마트 추가
            </UiButton>
          </UiEmpty>
        </div>
      </div>
    </template>

    <!-- 생성 모달 -->
    <DatamartSaveModal
      :is-open="isSaveModalOpen"
      :edit-data="editTarget"
      @close="isSaveModalOpen = false"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import DatamartSummary from '~/components/datamart/DatamartSummary.vue'
import DatamartCard from '~/components/datamart/DatamartCard.vue'
import DatamartSaveModal from '~/components/datamart/DatamartSaveModal.vue'
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import type { Datamart, DatamartForm } from '~/types/datamart'

const {
  datamartList,
  summary,
  handleSelectAll,
  handleSaveDatamart,
  handleDeleteDatamart,
  handleToggleActiveDatamart,
  handleTestConnection,
} = useDatamartStore()

// 초기 조회
const isLoading = ref(true)

onMounted(async () => {
  await handleSelectAll()
  isLoading.value = false
})

// 생성/수정 모달
const isSaveModalOpen = ref(false)
const editTarget = ref<Datamart | null>(null)

const openCreateModal = () => {
  editTarget.value = null
  isSaveModalOpen.value = true
}

const onSave = async (data: DatamartForm) => {
  if (data.dbType !== 'MySQL') {
    openAlert({ message: '현재 DB타입은 MySQL 만 지원됩니다.' })
    return
  }

  await handleSaveDatamart({
    ...data,
    ...(editTarget.value ? { datamartId: editTarget.value.datamartId } : {}),
    port: typeof data.port === 'number' ? data.port : 3306,
  })
  isSaveModalOpen.value = false
}

// 연결 테스트
const onTest = async (datamart: Datamart) => {
  await handleTestConnection(datamart, 'saved')
}

// 수정
const onEdit = (datamart: Datamart) => {
  editTarget.value = datamart
  isSaveModalOpen.value = true
}

// 삭제
const onDelete = async (id: string) => {
  await handleDeleteDatamart(id)
}
</script>
