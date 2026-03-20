<template>
  <div class="repository-url-tab">
    <!-- 검색·필터·URL 등록 -->
    <div class="url-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="urlSearchKeyword"
        type="search"
        placeholder="문서명, 내용으로 검색..."
        class="url-search-input"
        @search="onUrlSearch"
        @enter="onUrlSearch"
      />
      <UiSelect
        v-model="urlCategoryFilter"
        :options="categoryFilterOptions"
        placeholder="전체 카테고리"
        size="md"
        class="url-filter-select"
        @update:model-value="onUrlSearch"
      />
      <UiSelect
        v-model="urlStatusFilter"
        :options="urlStatusFilterOptions"
        placeholder="전체 상태"
        size="md"
        class="url-filter-select"
        @update:model-value="onUrlSearch"
      />
      <UiButton
        variant="primary"
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

    <!-- 배치바 + 테이블 + 페이지네이션 통합 wrapper -->
    <div class="url-content-panel">
      <!-- 일괄 처리·스크래핑 정보 바 -->
      <div class="url-batch-bar flex items-center flex-wrap">
        <span class="batch-count"
          ><span class="point-color">{{ selectedUrlIds.length }}개</span> 선택됨</span
        >
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
          <span class="scraping-text"
            >마지막 실행 : <span class="scraping-date">{{ lastScrapingAt }}</span></span
          >
          <span class="scraping-text"
            >다음 예정: <span class="scraping-date">{{ nextScrapingAt }}</span></span
          >
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
      <UiTable
        :columns="urlTableColumns"
        :data="urlList"
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
          <span class="cell-last-collected">{{ value }}</span>
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
                    <i class="icon icon-add-dot size-20" />
                  </template>
                </UiButton>
              </template>
            </UiDropdownMenu>
          </div>
        </template>
      </UiTable>

      <!-- 페이지네이션 -->
      <UiPagination
        v-model="urlCurrentPage"
        :total-count="urlTotalCount"
        :page-size="urlPageSize"
        total-label="개 URL"
        class="url-pagination"
      />
    </div>

    <UrlRegisterPanel
      :is-open="isUrlRegisterOpen"
      @close="isUrlRegisterOpen = false"
      @save="onSaveUrl"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'
import UrlRegisterPanel from '~/components/repository/UrlRegisterPanel.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'

const scrapingTooltipText = '등록된 모든 활성 URL에 대해 데이터 수집(스크래핑)을 실행합니다.'

const {
  urlList,
  urlTotalCount,
  urlSearchKeyword,
  urlStatusFilter,
  urlCategoryFilter,
  urlCurrentPage,
  urlPageSize,
  handleSelectUrlList,
  handleSaveUrl,
  handleDeleteUrl,
  handleToggleUrlStatus,
} = useRepositoryStore()

// 초기 로딩
onMounted(() => handleSelectUrlList())

// 페이지 변경 시 재조회
watch(urlCurrentPage, () => handleSelectUrlList())

// 스크래핑 정보 (추후 API 연동)
const lastScrapingAt = ref('2025-02-11 08:30')
const nextScrapingAt = ref('2025-02-12 00:00')

// 카테고리 필터 (store의 urlCategoryFilter 사용)
const categoryFilterOptions = [
  { label: '전체 카테고리', value: 'all' },
  { label: '블로그', value: '블로그' },
  { label: '문서', value: '문서' },
  { label: '뉴스', value: '뉴스' },
  { label: '지원센터', value: '지원센터' },
]

const urlStatusFilterOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

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

const urlRowActionItems = [
  { label: '즉시 수집', value: 'collect', icon: 'icon-refresh' },
  { label: '수집 내역', value: 'history', icon: 'icon-view' },
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// ===== 선택 =====
const selectedUrlIds = ref<string[]>([])
const isAllUrlSelected = computed(
  () => urlList.value.length > 0 && selectedUrlIds.value.length === urlList.value.length,
)
const toggleSelectAllUrl = () => {
  if (isAllUrlSelected.value) {
    selectedUrlIds.value = []
  } else {
    selectedUrlIds.value = urlList.value.map((r) => r.id)
  }
}
const toggleSelectRowUrl = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedUrlIds.value.includes(id)) selectedUrlIds.value = [...selectedUrlIds.value, id]
  } else {
    selectedUrlIds.value = selectedUrlIds.value.filter((x) => x !== id)
  }
}

// ===== 액션 핸들러 =====
const onUrlSearch = () => {
  if (urlCurrentPage.value !== 1) {
    urlCurrentPage.value = 1
  } else {
    handleSelectUrlList()
  }
}

const onUrlStatusToggle = async (id: string, active: boolean) => {
  await handleToggleUrlStatus(id, active)
}

// URL 등록 패널
const isUrlRegisterOpen = ref(false)
const onRegisterUrl = () => {
  isUrlRegisterOpen.value = true
}
const onSaveUrl = async (data: Record<string, any>) => {
  const cycleMap: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월', manual: '수동' }
  await handleSaveUrl({
    urlName: data.urlName,
    urlAddress: data.urlAddress,
    category: data.category,
    collectionCycle: cycleMap[data.collectionCycle] || data.collectionCycle,
    active: data.active,
  })
  openToast({ message: `'${data.urlName}' URL이 등록되었습니다.` })
}

const onBatchDelete = async () => {
  if (selectedUrlIds.value.length === 0) {
    openAlert({ title: '알림', message: '삭제할 URL을 선택해주세요.' })
    return
  }
  const confirmed = await openConfirm({
    title: '일괄 삭제',
    message: `선택한 ${selectedUrlIds.value.length}개 URL을 삭제하시겠습니까?`,
  })
  if (confirmed) {
    await handleDeleteUrl(selectedUrlIds.value)
    selectedUrlIds.value = []
  }
}

const onBatchLog = () => {
  openAlert({ title: '배치 로그', message: '배치 로그 기능은 추후 구현 예정입니다.' })
}

const onBatchScraping = async () => {
  const confirmed = await openConfirm({
    title: '배치 스크래핑',
    message: '활성 상태인 모든 URL에 대해 스크래핑을 실행하시겠습니까?',
  })
  if (confirmed) {
    openAlert({ title: '배치 스크래핑', message: '스크래핑이 시작되었습니다.' })
  }
}

const onUrlRowActionSelect = async (value: string, row: Record<string, any>) => {
  if (value === 'delete') {
    const confirmed = await openConfirm({ title: 'URL 삭제', message: `'${row.urlName}'을(를) 삭제하시겠습니까?` })
    if (confirmed) {
      await handleDeleteUrl([row.id])
      selectedUrlIds.value = selectedUrlIds.value.filter((id) => id !== row.id)
    }
  } else if (value === 'collect') {
    openAlert({ title: '즉시 수집', message: `'${row.urlName}' 수집 기능은 추후 구현 예정입니다.` })
  } else if (value === 'history') {
    openAlert({ title: '수집 내역', message: '수집 내역 기능은 추후 구현 예정입니다.' })
  } else if (value === 'edit') {
    openAlert({ title: 'URL 수정', message: 'URL 수정 기능은 추후 구현 예정입니다.' })
  }
}
</script>
