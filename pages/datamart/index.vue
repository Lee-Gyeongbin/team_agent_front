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

    <!-- 요약 통계 -->
    <DatamartSummary :summary="summary" />

    <!-- 카드 그리드 -->
    <div class="card-grid">
      <DatamartCard
        v-for="dm in datamartList"
        :key="dm.id"
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

    <!-- 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isDeleteModalOpen"
      title="데이터마트 삭제"
      :message="'이 데이터마트를 삭제하시겠습니까?\n연결된 데이터 소스 정보가 함께 삭제됩니다.'"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import DatamartSummary from '~/components/datamart/DatamartSummary.vue'
import DatamartCard from '~/components/datamart/DatamartCard.vue'
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import type { Datamart } from '~/types/datamart'

const {
  datamartList,
  summary,
  handleSelectAll,
  handleDeleteDatamart,
  handleToggleActiveDatamart,
  handleTestConnection,
} = useDatamartStore()

// 초기 조회
onMounted(() => handleSelectAll())

// 추가 (모달은 추후 구현)
const openCreateModal = () => {
  console.warn('[TODO] 데이터마트 추가 모달')
}

// 연결 테스트
const onTest = async (id: string) => {
  const result = await handleTestConnection(id)
  console.warn('[연결 테스트]', result.message)
}

// 수정
const onEdit = (datamart: Datamart) => {
  console.warn('[TODO] 데이터마트 수정:', datamart)
}

// 삭제
const isDeleteModalOpen = ref(false)
const deleteTargetId = ref('')

const onDelete = (id: string) => {
  deleteTargetId.value = id
  isDeleteModalOpen.value = true
}

const doDelete = async () => {
  await handleDeleteDatamart(deleteTargetId.value)
  isDeleteModalOpen.value = false
}
</script>
