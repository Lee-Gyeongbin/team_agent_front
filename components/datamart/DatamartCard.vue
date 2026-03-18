<template>
  <div
    class="card-grid-card"
    :class="{ 'is-inactive': !datamart.isActive }"
  >
    <!-- 헤더: 이름 + DB뱃지 + 토글 -->
    <div class="card-grid-card-header">
      <div class="card-grid-card-title">
        <div class="datamart-card-name-row">
          <span class="card-grid-card-name">{{ datamart.name }}</span>
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
          :model-value="datamart.isActive"
          @update:model-value="emit('toggle-active', datamart.id)"
        />
      </div>
    </div>

    <!-- 정보: HOST + 문서/URL (가로 2칸) -->
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
          <span class="datamart-card-info-label">문서/URL</span>
        </div>
        <span class="datamart-card-info-value">{{ datamart.analysisUrl }} / 테이블 {{ datamart.tableCount }}개</span>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="card-grid-card-footer">
      <UiButton
        variant="primary-line"
        size="sm"
        class="datamart-card-btn-test"
        @click="emit('test', datamart.id)"
      >
        연결 테스트
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="sm"
        class="card-grid-card-btn-fixed"
        @click="emit('edit', datamart)"
      >
        수정
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="sm"
        class="card-grid-card-btn-fixed"
        @click="emit('delete', datamart.id)"
      >
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
  'toggle-active': [id: string]
  'test': [id: string]
  'edit': [datamart: Datamart]
  'delete': [id: string]
}>()

const dbBadgeClass = computed(() => {
  const type = props.datamart.dbType.toLowerCase()
  if (type.includes('mysql')) return 'is-mysql'
  if (type.includes('postgres')) return 'is-postgresql'
  if (type.includes('oracle')) return 'is-oracle'
  return 'is-default'
})
</script>
