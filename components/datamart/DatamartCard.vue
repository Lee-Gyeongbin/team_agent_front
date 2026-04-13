<template>
  <div
    class="card-grid-card"
    :class="{ 'is-inactive': datamart.useYn === 'N' }"
  >
    <!-- 헤더: 이름 + DB뱃지 + 토글 -->
    <div class="card-grid-card-header">
      <div class="card-grid-card-title">
        <div class="datamart-card-name-row">
          <span class="card-grid-card-name">{{ datamart.dmNm }}</span>
          <span
            class="datamart-card-db-badge"
            :class="dbBadgeClass"
          >
            • {{ datamart.dbType }} {{ datamart.dbVersion }}
          </span>
        </div>
      </div>
      <div class="card-grid-card-actions">
        <UiToggle
          :model-value="datamart.useYn === 'Y'"
          @update:model-value="handleToggleActiveDatamart"
        />
      </div>
    </div>

    <!-- 정보: HOST + SCHEMA / TABLES (가로 2칸) -->
    <div class="datamart-card-info">
      <div class="datamart-card-info-box">
        <div class="datamart-card-info-header">
          <div class="datamart-card-info-icon">
            <i class="icon-server size-12" />
          </div>
          <span class="datamart-card-info-label">HOST</span>
        </div>
        <span class="datamart-card-info-value">{{ datamart.host }}</span>
      </div>
      <div class="datamart-card-info-box">
        <div class="datamart-card-info-header">
          <div class="datamart-card-info-icon">
            <i class="icon-schema size-12" />
          </div>
          <span class="datamart-card-info-label">SCHEMA / TABLES</span>
        </div>
        <span class="datamart-card-info-value">{{ datamart.schNm }} / 테이블 {{ datamart.tblCnt }}개</span>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="card-grid-card-footer">
      <UiButton
        variant="primary-line"
        size="sm"
        @click="emit('test', { ...datamart, testType: 'saved' })"
      >
        <template #icon-left>
          <i class="icon-ai-stars size-12" />
        </template>
        연결 테스트
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="emit('meta-manage', datamart)"
      >
        <template #icon-left>
          <i class="icon-settings size-12" />
        </template>
        메타 관리
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="emit('edit', datamart)"
      >
        <template #icon-left>
          <i class="icon-edit size-12" />
        </template>
        수정
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="emit('delete', datamart.datamartId)"
      >
        <template #icon-left>
          <i class="icon-trashcan size-12" />
        </template>
        삭제
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Datamart } from '~/types/datamart'

const props = defineProps<{
  datamart: Datamart
}>()

const emit = defineEmits<{
  'toggle-active': [datamart: Datamart]
  test: [datamart: Datamart]
  history: [datamart: Datamart]
  edit: [datamart: Datamart]
  'meta-manage': [datamart: Datamart]
  delete: [id: string]
}>()

const handleToggleActiveDatamart = () => {
  emit('toggle-active', props.datamart)
}

const dbBadgeClass = computed(() => {
  const type = props.datamart.dbType.toLowerCase()
  if (type.includes('mysql')) return 'is-mysql'
  if (type.includes('postgres')) return 'is-postgresql'
  if (type.includes('oracle')) return 'is-oracle'
  return 'is-default'
})
</script>
