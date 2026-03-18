<template>
  <div class="repository-url-tab">
    <!-- 검색·필터·URL 등록 (URL 관리 탭용) -->
    <div class="url-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="urlSearchKeyword"
        type="search"
        placeholder="문서명, 내용으로 검색..."
        class="url-search-input"
        @search="onUrlSearch"
        @enter="onUrlSearch"
      />
      <UiButton
        variant="line-secondary"
        size="md"
        class="ui-button-outline-muted url-filter-select"
        @click="openCategorySelectModal"
      >
        전체 카테고리
      </UiButton>
      <UiSelect
        v-model="urlStatusFilter"
        :options="urlStatusFilterOptions"
        placeholder="전체 상태"
        size="md"
        class="url-filter-select"
      />
      <UiButton
        variant="primary"
        size="md"
        @click="onUrlSearch"
      >
        검색
      </UiButton>
      <UiButton
        variant="outline"
        size="md"
        class="btn-register-url"
        @click="onRegisterUrl"
      >
        <template #icon-left>
          <i class="icon icon-plus size-16" />
        </template>
        URL 등록
      </UiButton>
    </div>

    <!-- 일괄 처리·스크래핑 정보 바 -->
    <div class="url-batch-bar flex items-center flex-wrap">
      <span class="batch-count">{{ selectedUrlIds.length }}개 선택됨</span>
      <UiButton
        variant="line-secondary"
        size="xxs"
        class="batch-bar-btn"
        @click="onBatchDelete"
      >
        <template #icon-left>
          <i class="icon icon-trashcan size-12" />
        </template>
        일괄 삭제
      </UiButton>
      <div class="url-scraping-info flex items-center">
        <span class="scraping-text">마지막 실행 : {{ lastScrapingAt }}</span>
        <span class="scraping-text">다음 예정: {{ nextScrapingAt }}</span>
        <div
          class="scraping-tooltip-trigger"
          :title="scrapingTooltipText"
        >
          <i class="icon icon-info size-16" />
        </div>
      </div>
      <UiButton
        variant="line-secondary"
        size="xxs"
        class="batch-bar-btn"
        @click="onBatchLog"
      >
        <template #icon-left>
          <i class="icon icon-mini-time size-12" />
        </template>
        배치 로그
      </UiButton>
      <UiButton
        variant="line-secondary"
        size="xxs"
        class="batch-bar-btn"
        @click="onBatchScraping"
      >
        <template #icon-left>
          <i class="icon icon-version size-12" />
        </template>
        배치 스크래핑
      </UiButton>
    </div>

    <!-- URL 테이블 -->
    <div class="url-table-wrap">
      <UiTable
        :columns="urlTableColumns"
        :data="sortedUrlList"
        sticky-header
        max-height="calc(100vh - 380px)"
        empty-text="등록된 URL이 없습니다."
      >
        <template #header-select>
          <UiCheckbox
            :model-value="isAllUrlSelected"
            @update:model-value="toggleSelectAllUrl"
          />
        </template>
        <template #cell-select="{ row }">
          <UiCheckbox
            :model-value="selectedUrlIds.includes(row.id)"
            @update:model-value="(v) => toggleSelectRowUrl(row.id, v)"
          />
        </template>
        <template #cell-category="{ value }">
          {{ value }}
        </template>
        <template #cell-urlAddress="{ value }">
          <span class="cell-url-address">{{ value }}</span>
        </template>
        <template #cell-urlName="{ value }">
          {{ value }}
        </template>
        <template #cell-collectionCycle="{ value }">
          {{ value }}
        </template>
        <template #cell-lastCollectedAt="{ value }">
          {{ value }}
        </template>
        <template #cell-status="{ row }">
          <UiToggle
            :model-value="row.active"
            @update:model-value="(v) => onUrlStatusToggle(row.id, v)"
          />
        </template>
        <template #cell-actions="{ row }">
          <div
            class="cell-actions"
            @click.stop
          >
            <UiDropdownMenu
              :items="urlRowActionItems"
              align="end"
              @select="(value) => onUrlRowActionSelect(value, row)"
            >
              <template #trigger>
                <UiButton
                  icon-only
                  variant="ghost"
                  size="xs"
                  class="btn-row-more"
                >
                  <template #icon-left>
                    <i class="icon icon-add-dot size-16" />
                  </template>
                </UiButton>
              </template>
            </UiDropdownMenu>
          </div>
        </template>
      </UiTable>
    </div>

    <!-- 페이지네이션 -->
    <div class="url-pagination flex items-center justify-between">
      <span class="pagination-total">총 {{ urlTotalCount }}개 URL</span>
      <div class="pagination-controls flex items-center">
        <button
          type="button"
          class="pagination-btn"
          :disabled="urlCurrentPage <= 1"
          @click="urlCurrentPage = Math.max(1, urlCurrentPage - 1)"
        >
          이전
        </button>
        <div class="pagination-pages flex items-center">
          <button
            v-for="p in urlVisiblePages"
            :key="p"
            type="button"
            class="pagination-page"
            :class="{ 'is-active': p === urlCurrentPage }"
            @click="urlCurrentPage = p"
          >
            {{ p }}
          </button>
        </div>
        <button
          type="button"
          class="pagination-btn"
          :disabled="urlCurrentPage >= urlTotalPages"
          @click="urlCurrentPage = Math.min(urlTotalPages, urlCurrentPage + 1)"
        >
          다음
        </button>
      </div>
      <span class="pagination-range">{{ urlPageStart }}-{{ urlPageEnd }}/{{ urlTotalCount }}</span>
    </div>

    <CategorySelectModal
      :is-open="isCategorySelectModalOpen"
      @close="isCategorySelectModalOpen = false"
      @confirm="onCategorySelectConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'

const scrapingTooltipText = '등록된 모든 활성 URL에 대해 데이터 수집(스크래핑)을 실행합니다.'

// URL 검색·필터
const urlSearchKeyword = ref('')
const urlStatusFilter = ref('all')

// 카테고리 선택 모달 (퍼블 연결)
const isCategorySelectModalOpen = ref(false)
const openCategorySelectModal = () => {
  isCategorySelectModalOpen.value = true
}
const onCategorySelectConfirm = () => {}
const urlStatusFilterOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

// 🔽 퍼블용 더미 데이터 — 백엔드 연결 시 API로 교체
const lastScrapingAt = ref('2025-02-11 08:30')
const nextScrapingAt = ref('2025-02-12 00:00')

const urlTableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'category', label: '카테고리', width: '100px', align: 'left', headerAlign: 'left' },
  { key: 'urlAddress', label: 'URL 주소', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'urlName', label: 'URL 이름', width: '120px', align: 'left', headerAlign: 'left' },
  { key: 'collectionCycle', label: '수집 주기', width: '90px', align: 'center', headerAlign: 'center' },
  { key: 'lastCollectedAt', label: '마지막 수집일', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'status', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 🔽 퍼블용 더미 데이터 — 백엔드 연결 시 API로 교체
const urlList = ref([
  {
    id: '1',
    category: '블로그',
    urlAddress: 'https://blog.example.com',
    urlName: '공식블로그',
    collectionCycle: '매일',
    lastCollectedAt: '2025-02-11 00:15',
    active: true,
  },
  {
    id: '2',
    category: '문서',
    urlAddress: 'https://docs.example.com/',
    urlName: '기술 문서',
    collectionCycle: '매일',
    lastCollectedAt: '2025-02-11 00:15',
    active: true,
  },
  {
    id: '3',
    category: '지원센터',
    urlAddress: 'https://support.example.com/',
    urlName: '지원센터',
    collectionCycle: '매일',
    lastCollectedAt: '2025-02-11 00:15',
    active: false,
  },
])

const sortedUrlList = computed(() => [...urlList.value])

const urlRowActionItems = [
  { label: '즉시 수집', value: 'collect', icon: 'icon-refresh' },
  { label: '수집 내역', value: 'history', icon: 'icon-view' },
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 선택 — 퍼블용: 현재 보이는 목록(전체 urlList) 기준 전체 선택/해제. 실제 연동 시 페이지네이션 적용 시 '현재 페이지' vs '전체' 정책 결정 필요
const selectedUrlIds = ref<string[]>([])
const isAllUrlSelected = computed(
  () => urlList.value.length > 0 && selectedUrlIds.value.length === urlList.value.length,
)
const toggleSelectAllUrl = () => {
  if (isAllUrlSelected.value) {
    selectedUrlIds.value = []
  } else {
    selectedUrlIds.value = urlList.value.map((r: { id: string }) => r.id)
  }
}
const toggleSelectRowUrl = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedUrlIds.value.includes(id)) selectedUrlIds.value = [...selectedUrlIds.value, id]
  } else {
    selectedUrlIds.value = selectedUrlIds.value.filter((x: string) => x !== id)
  }
}

// 페이지네이션 (🔽 퍼블용 — API 연동 시 urlTotalCount/urlCurrentPage는 서버 기준으로 교체)
const urlTotalCount = ref(24)
const urlCurrentPage = ref(1)
const urlPageSize = 10
const urlTotalPages = computed(() => Math.max(1, Math.ceil(urlTotalCount.value / urlPageSize)))
const urlPageStart = computed(() => (urlCurrentPage.value - 1) * urlPageSize + 1)
const urlPageEnd = computed(() => Math.min(urlCurrentPage.value * urlPageSize, urlTotalCount.value))
const urlVisiblePages = computed(() => {
  const total = urlTotalPages.value
  const cur = urlCurrentPage.value
  const pages: number[] = []
  let start = Math.max(1, cur - 2)
  let end = Math.min(total, cur + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, 5)
    else end = Math.min(total, start + 4)
    start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// 상태 토글 — 퍼블용: 더미 데이터에서 active 즉시 반영. 추후 API 연동 시 서버 요청 후 반영
const onUrlStatusToggle = (id: string, active: boolean) => {
  const row = urlList.value.find((r: { id: string; active?: boolean }) => r.id === id)
  if (row) row.active = active
}
// 액션 핸들러 — 퍼블용 placeholder. 추후 API 연동
const onUrlSearch = () => {}
const onRegisterUrl = () => {}
const onBatchDelete = () => {}
const onBatchLog = () => {}
const onBatchScraping = () => {}
const onUrlRowActionSelect = (_value: string, _row: Record<string, unknown>) => {}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.url-toolbar {
  gap: $spacing-sm;
  padding-bottom: 16px;

  .url-search-input {
    min-width: 200px;
    max-width: 280px;
  }

  .btn-register-url {
    margin-left: auto;
  }
}

.url-batch-bar {
  gap: $spacing-sm;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #dce4e9;
  background: #fff;

  .batch-count {
    @include typo($body-medium);
    color: $color-text-primary;
    margin-right: $spacing-sm;
  }

  .url-scraping-info {
    gap: $spacing-sm;
    margin-left: $spacing-md;

    .scraping-text {
      @include typo($body-small);
      color: $color-text-secondary;
    }

    .scraping-tooltip-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      cursor: help;
      color: #5c6677;
    }
  }
}

.url-table-wrap {
  padding: 0 16px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.cell-url-address {
  max-width: 240px;
  @include ellipsis(1);
}

.cell-actions {
  display: inline-flex;
}

.btn-row-more {
  padding: 2px;
}

.url-pagination {
  padding: $spacing-sm 16px;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
</style>
