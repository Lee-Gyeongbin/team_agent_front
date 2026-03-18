<template>
  <div class="card-grid-summary">
    <div class="datamart-summary-inner">
      <!-- 4개 통계 항목 -->
      <div class="card-grid-summary-item">
        <div class="card-grid-summary-icon is-blue">
          <i class="icon-version size-24" />
        </div>
        <div class="card-grid-summary-info">
          <span class="card-grid-summary-label">전체</span>
          <span class="card-grid-summary-value">{{ summary.totalCount }}건</span>
        </div>
      </div>

      <div class="card-grid-summary-item">
        <div class="card-grid-summary-icon is-purple">
          <i class="icon-vector size-24" />
        </div>
        <div class="card-grid-summary-info">
          <span class="card-grid-summary-label">활성</span>
          <span class="card-grid-summary-value">{{ summary.activeCount }}건</span>
        </div>
      </div>

      <div class="card-grid-summary-item">
        <div class="card-grid-summary-icon is-green">
          <i class="icon-search size-24" />
        </div>
        <div class="card-grid-summary-info">
          <span class="card-grid-summary-label">비활성</span>
          <span class="card-grid-summary-value">{{ summary.inactiveCount }}건</span>
        </div>
      </div>

      <div class="card-grid-summary-item">
        <div class="card-grid-summary-icon is-orange">
          <i class="icon-datasource size-24" />
        </div>
        <div class="card-grid-summary-info">
          <span class="card-grid-summary-label">데이터 소스</span>
          <span class="card-grid-summary-value">{{ summary.dataSourceCount }}</span>
        </div>
      </div>

      <!-- 하단 부가정보 -->
      <div class="datamart-summary-sub-row">
        <div class="datamart-summary-sub-item">
          <i class="icon-time size-12" />
          <span>마지막 연결 검증 :</span>
          <strong>{{ summary.lastScanDate }}</strong>
        </div>
        <div class="datamart-summary-sub-item">
          <i class="icon-database size-12" />
          <span>DB 타입 :</span>
          <strong>{{ summary.connectedSystems }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatamartSummary } from '~/types/datamart'

defineProps<{
  summary: DatamartSummary
}>()
</script>
