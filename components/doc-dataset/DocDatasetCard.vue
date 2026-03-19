<template>
  <div
    class="card-grid-card"
    :class="{ 'is-inactive': dataset.useYn !== 'Y' }"
  >
    <!-- 헤더: 이름 + 토글 + kebab -->
    <div class="card-grid-card-header">
      <div class="card-grid-card-title">
        <span class="card-grid-card-name">{{ dataset.dsNm }}</span>
        <span class="card-grid-card-sub">{{ dataset.version }} • {{ dataset.modifyDt }} 업데이트</span>
      </div>
      <div class="card-grid-card-actions">
        <!-- 구축중: 뱃지 / 완료: 토글 -->
        <span
          v-if="dataset.datasetBuildStatusCd === 'BUILDING'"
          class="doc-dataset-card-badge-building"
        >
          구축중
        </span>
        <UiToggle
          v-else
          :model-value="dataset.useYn === 'Y'"
          @update:model-value="emit('toggle-active', dataset.datasetId)"
        />
        <UiDropdownMenu
          :items="menuItems"
          @select="onMenuSelect"
        >
          <template #trigger>
            <button class="card-grid-card-kebab">
              <i class="icon-more-vertical size-20" />
            </button>
          </template>
        </UiDropdownMenu>
      </div>
    </div>

    <!-- 구축중: 프로그레스바 -->
    <div
      v-if="dataset.datasetBuildStatusCd === 'BUILDING'"
      class="doc-dataset-card-build"
    >
      <div class="doc-dataset-card-build-header">
        <span class="doc-dataset-card-build-label">벡터 생성 진행</span>
        <span class="doc-dataset-card-build-percent">진행중</span>
      </div>
      <div class="doc-dataset-card-progress">
        <div
          class="doc-dataset-card-progress-bar"
          :style="{ width: '100%' }"
        />
      </div>
      <span class="doc-dataset-card-build-detail">벡터 생성 작업이 진행 중입니다.</span>
    </div>

    <!-- 완료: 통계 3칸 -->
    <div
      v-else
      class="doc-dataset-card-stats"
    >
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">청크 수</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.chunkCnt.toLocaleString() }}</span>
      </div>
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">문서/URL</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.docCnt }} / {{ dataset.urlCnt }}</span>
      </div>
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">검색 품질</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.srchQual }}%</span>
      </div>
    </div>

    <!-- 메타 정보 -->
    <div class="card-grid-card-meta">
      <div class="card-grid-card-meta-row">
        <span class="card-grid-card-meta-item">
          임베딩 <strong>{{ dataset.embedModelNm }}</strong>
        </span>
        <span class="card-grid-card-meta-item">
          벡터DB <strong>{{ dataset.vectorDbNm }}</strong>
        </span>
      </div>
      <div class="card-grid-card-meta-row">
        <span class="card-grid-card-meta-item">
          청킹 <strong>{{ dataset.chunkSize }} 토큰 / {{ dataset.chunkOverlap }} 오버랩</strong>
        </span>
        <span class="card-grid-card-meta-item">
          <strong>{{ dataset.chunkAlgoNm }}</strong>
        </span>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="card-grid-card-footer">
      <template v-if="dataset.datasetBuildStatusCd === 'BUILDING'">
        <UiButton
          variant="line-secondary"
          size="sm"
          class="card-grid-card-btn-fixed doc-dataset-card-btn-stop"
          @click="emit('stop-build', dataset.datasetId)"
        >
          구축 중지
        </UiButton>
      </template>
      <template v-else>
        <UiButton
          variant="primary-line"
          size="sm"
          class="card-grid-card-btn-fixed"
          @click="emit('test', dataset.datasetId)"
        >
          테스트
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="sm"
          class="card-grid-card-btn-fixed"
          type="button"
          @click="emit('history', dataset.datasetId)"
        >
          변경이력
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="sm"
          class="card-grid-card-btn-fixed"
          @click="emit('edit', dataset)"
        >
          수정
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="sm"
          class="card-grid-card-btn-fixed"
          @click="emit('delete', dataset.datasetId)"
        >
          삭제
        </UiButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocDataset } from '~/types/doc-dataset'

const props = defineProps<{
  dataset: DocDataset
}>()

const emit = defineEmits<{
  'toggle-active': [id: string]
  test: [id: string]
  history: [id: string]
  edit: [dataset: DocDataset]
  delete: [id: string]
  'stop-build': [id: string]
}>()

const menuItems = [
  { value: 'edit', label: '수정', icon: 'icon-edit' },
  { value: 'delete', label: '삭제', icon: 'icon-trashcan', color: 'danger' as const },
]

const onMenuSelect = (key: string) => {
  if (key === 'edit') emit('edit', props.dataset)
  if (key === 'delete') emit('delete', props.dataset.datasetId)
}
</script>
