<template>
  <div
    class="doc-dataset-card"
    :class="{ 'is-inactive': !dataset.isActive }"
  >
    <!-- 헤더: 이름 + 토글 + kebab -->
    <div class="doc-dataset-card-header">
      <div class="doc-dataset-card-title">
        <span class="doc-dataset-card-name">{{ dataset.name }}</span>
        <span class="doc-dataset-card-version">{{ dataset.version }} • {{ dataset.updatedAt }} 업데이트</span>
      </div>
      <div class="doc-dataset-card-actions">
        <!-- 구축중: 뱃지 / 완료: 토글 -->
        <span
          v-if="dataset.isBuilding"
          class="doc-dataset-card-badge-building"
        >
          구축중
        </span>
        <UiToggle
          v-else
          :model-value="dataset.isActive"
          @update:model-value="emit('toggle-active', dataset.id)"
        />
        <UiDropdownMenu
          :items="menuItems"
          @select="onMenuSelect"
        >
          <template #trigger>
            <button class="doc-dataset-card-kebab">
              <i class="icon-more-vertical size-20" />
            </button>
          </template>
        </UiDropdownMenu>
      </div>
    </div>

    <!-- 구축중: 프로그레스바 -->
    <div
      v-if="dataset.isBuilding"
      class="doc-dataset-card-build"
    >
      <div class="doc-dataset-card-build-header">
        <span class="doc-dataset-card-build-label">벡터 생성 진행</span>
        <span class="doc-dataset-card-build-percent">{{ dataset.buildProgress }}%</span>
      </div>
      <div class="doc-dataset-card-progress">
        <div
          class="doc-dataset-card-progress-bar"
          :style="{ width: `${dataset.buildProgress}%` }"
        />
      </div>
      <span class="doc-dataset-card-build-detail">
        {{ dataset.buildCompleted?.toLocaleString() }} / {{ dataset.buildTotal?.toLocaleString() }} 청크 완료
      </span>
    </div>

    <!-- 완료: 통계 3칸 -->
    <div
      v-else
      class="doc-dataset-card-stats"
    >
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">청크 수</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.chunkCount.toLocaleString() }}</span>
      </div>
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">문서/URL</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.documentCount }} / {{ dataset.urlCount }}</span>
      </div>
      <div class="doc-dataset-card-stat">
        <span class="doc-dataset-card-stat-label">검색 품질</span>
        <span class="doc-dataset-card-stat-value">{{ dataset.searchQuality }}%</span>
      </div>
    </div>

    <!-- 메타 정보 -->
    <div class="doc-dataset-card-meta">
      <div class="doc-dataset-card-meta-row">
        <span class="doc-dataset-card-meta-item">
          임베딩 <strong>{{ dataset.embeddingModel }}</strong>
        </span>
        <span class="doc-dataset-card-meta-item">
          벡터DB <strong>{{ dataset.vectorDb }}</strong>
        </span>
      </div>
      <div class="doc-dataset-card-meta-row">
        <span class="doc-dataset-card-meta-item">
          청킹 <strong>{{ dataset.chunkSize }} 토큰 / {{ dataset.chunkOverlap }} 오버랩</strong>
        </span>
        <span class="doc-dataset-card-meta-item"><strong>{{ dataset.chunkStrategy }}</strong></span>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="doc-dataset-card-footer">
      <template v-if="dataset.isBuilding">
        <UiButton
          variant="line-secondary"
          size="sm"
          class="doc-dataset-card-btn-fixed doc-dataset-card-btn-stop"
          @click="emit('stop-build', dataset.id)"
        >
          구축 중지
        </UiButton>
      </template>
      <template v-else>
        <UiButton
          variant="primary-line"
          size="sm"
          class="doc-dataset-card-btn-fixed"
          @click="emit('test', dataset.id)"
        >
          테스트
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="sm"
          class="doc-dataset-card-btn-fixed"
          @click="emit('edit', dataset)"
        >
          수정
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="sm"
          class="doc-dataset-card-btn-fixed"
          @click="emit('delete', dataset.id)"
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
  'test': [id: string]
  'edit': [dataset: DocDataset]
  'delete': [id: string]
  'stop-build': [id: string]
}>()

const menuItems = [
  { key: 'edit', label: '수정', icon: 'icon-edit' },
  { key: 'delete', label: '삭제', icon: 'icon-trashcan', danger: true },
]

const onMenuSelect = (key: string) => {
  if (key === 'edit') emit('edit', props.dataset)
  if (key === 'delete') emit('delete', props.dataset.id)
}
</script>
