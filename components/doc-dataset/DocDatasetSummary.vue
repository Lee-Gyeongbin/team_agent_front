<template>
  <div class="doc-dataset-summary">
    <div class="doc-dataset-summary-item">
      <div class="doc-dataset-summary-icon is-blue">
        <i class="icon-dataset size-24" />
      </div>
      <div class="doc-dataset-summary-info">
        <span class="doc-dataset-summary-label">전체 데이터셋</span>
        <span class="doc-dataset-summary-value">{{ summary.totalCount }}</span>
        <span class="doc-dataset-summary-sub">활성: <strong>{{ summary.activeCount }}</strong>개, 비활성: <strong>{{ summary.inactiveCount }}</strong>개</span>
      </div>
    </div>

    <div class="doc-dataset-summary-item">
      <div class="doc-dataset-summary-icon is-purple">
        <i class="icon-vector size-24" />
      </div>
      <div class="doc-dataset-summary-info">
        <span class="doc-dataset-summary-label">벡터 인덱스</span>
        <span class="doc-dataset-summary-value">{{ summary.totalVectors }}</span>
        <span class="doc-dataset-summary-sub">총 벡터 수</span>
      </div>
    </div>

    <div class="doc-dataset-summary-item">
      <div class="doc-dataset-summary-icon is-green">
        <i class="icon-search-quality size-24" />
      </div>
      <div class="doc-dataset-summary-info">
        <span class="doc-dataset-summary-label">평균 검색 품질</span>
        <span class="doc-dataset-summary-value">{{ summary.avgSearchQuality }}%</span>
        <span class="doc-dataset-summary-sub">Recall@10 기준</span>
      </div>
    </div>

    <div class="doc-dataset-summary-item">
      <div class="doc-dataset-summary-icon is-orange">
        <i class="icon-datasource size-24" />
      </div>
      <div class="doc-dataset-summary-info">
        <span class="doc-dataset-summary-label">데이터 소스</span>
        <span class="doc-dataset-summary-value">{{ summary.totalDocuments + summary.totalUrls }}</span>
        <span class="doc-dataset-summary-sub">문서 <strong>{{ summary.totalDocuments }}</strong>개, URL <strong>{{ summary.totalUrls }}</strong>개</span>
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
