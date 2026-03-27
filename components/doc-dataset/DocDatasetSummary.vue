<template>
  <div class="card-grid-summary">
    <div class="card-grid-summary-item">
      <div class="card-grid-summary-icon is-blue">
        <i class="icon-dataset size-24" />
      </div>
      <div class="card-grid-summary-info">
        <span class="card-grid-summary-label">전체 데이터셋</span>
        <span class="card-grid-summary-value">{{ summary.totalDatasetCount }}</span>
        <span class="card-grid-summary-sub"
          >활성: <strong>{{ summary.activeDatasetCount }}</strong
          >개, 비활성: <strong>{{ summary.inactiveDatasetCount }}</strong
          >개</span
        >
      </div>
    </div>

    <div class="card-grid-summary-item">
      <div class="card-grid-summary-icon is-purple">
        <i class="icon-vector size-24" />
      </div>
      <div class="card-grid-summary-info">
        <span class="card-grid-summary-label">벡터 인덱스</span>
        <span class="card-grid-summary-value">{{ summary.totalVectorCount }}</span>
        <span class="card-grid-summary-sub">총 벡터 수</span>
      </div>
    </div>

    <div class="card-grid-summary-item">
      <div class="card-grid-summary-icon is-green">
        <i class="icon-search-quality size-24" />
      </div>
      <div class="card-grid-summary-info">
        <span class="card-grid-summary-label">평균 검색 품질</span>
        <span class="card-grid-summary-value">{{ summary.avgSearchQuality }}%</span>
        <span class="card-grid-summary-sub">Recall@10 기준</span>
      </div>
    </div>

    <div class="card-grid-summary-item">
      <div class="card-grid-summary-icon is-orange">
        <i class="icon-datasource size-24" />
      </div>
      <div class="card-grid-summary-info">
        <span class="card-grid-summary-label">데이터 소스</span>
        <span class="card-grid-summary-value">{{ summary.totalSourceCount }}</span>
        <span class="card-grid-summary-sub"
          >문서 <strong>{{ summary.totalDocCount }}</strong
          >개, URL <strong>{{ summary.totalUrlCount }}</strong
          >개</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocDatasetSummary } from '~/types/doc-dataset'

defineProps<{
  summary: DocDatasetSummary
}>()
</script>
