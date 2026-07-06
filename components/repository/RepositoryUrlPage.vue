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

    <section class="repository-content-wrapper flex">
      <aside class="category-panel">
        <div class="category-panel-header flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="category-panel-title">카테고리</span>
            <UiButton
              icon-only
              variant="ghost"
              size="xxs"
              class="btn-add-category"
              @click="onToggleExpandAll"
            >
              <template #icon-left>
                <i class="icon icon-sliders size-16" />
              </template>
            </UiButton>
          </div>
          <UiButton
            icon-only
            variant="ghost"
            size="xxs"
            class="btn-add-category"
            @click="toggleCategoryInput"
          >
            <template #icon-left>
              <i class="icon icon-plus-medium size-16" />
            </template>
          </UiButton>
        </div>
        <div
          v-if="isCategoryInputVisible && !categoryInputParentId"
          class="category-input-wrap"
        >
          <UiInput
            ref="categoryInputRef"
            v-model="categoryInputValue"
            :placeholder="categoryInputPlaceholder"
            size="sm"
            @enter="onCategoryInputEnter"
          />
        </div>
        <div class="category-tree-wrap">
          <ul class="category-tree">
            <CategoryTreeNode
              v-for="cat in filteredCategoryList"
              :key="cat.categoryId"
              :item="cat"
              :depth="1"
              selectable
              :max-category-depth="5"
              :selected-ids="selectedCategoryIds"
              :show-check-icon="false"
              :editing-category-id="editingCategoryId"
              :editing-name="editingName"
              :menu-items="categoryMenuItems"
              :is-category-input-visible="isCategoryInputVisible"
              :category-input-parent-id="categoryInputParentId"
              :category-input-value="categoryInputValue"
              :category-input-placeholder="categoryInputPlaceholder"
              :dragging-id="draggingCategoryId"
              @toggle="toggleExpand"
              @select="onCategorySelect"
              @menu-select="onCategoryMenuSelect"
              @update:editing-name="editingName = $event"
              @save-rename="saveCategoryRename"
              @update:category-input-value="categoryInputValue = $event"
              @add-subcategory="onCategoryInputEnter"
              @reorder="onTreeReorder"
              @drag-start="onTreeDragStart"
              @drag-end="onTreeDragEnd"
            />
          </ul>
        </div>
      </aside>

      <!-- 배치바 + 테이블 + 페이지네이션 통합 wrapper -->
      <div class="url-content-panel repository-url-panel">
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
          <div
            v-if="isScrapingInProgress"
            class="scraping-progress-wrap"
          >
            <div class="scraping-progress-header flex items-center justify-between">
              <span class="scraping-progress-label">
                수집 중 {{ scrapingProgress.current }} / {{ scrapingProgress.total }}
              </span>
              <button
                type="button"
                class="scraping-progress-stop"
                @click="stopScrapingStream"
              >
                중단
              </button>
            </div>
            <div class="scraping-progress-bar-track">
              <div
                class="scraping-progress-bar-fill"
                :style="{
                  width:
                    scrapingProgress.total > 0 ? `${(scrapingProgress.current / scrapingProgress.total) * 100}%` : '0%',
                }"
              />
            </div>
          </div>
          <div class="url-scraping-info flex items-center">
            <span class="scraping-text"
              >마지막 실행 : <span class="scraping-date">{{ lastScrapingAt }}</span></span
            >
            <span class="scraping-text"
              >다음 예정: <span class="scraping-date">{{ nextScrapingAt }}</span></span
            >
            <UiTooltip
              side="bottom"
              align="end"
              :show-arrow="false"
              content-class="scraping-batch-tooltip"
            >
              <div class="scraping-tooltip-trigger">
                <i class="icon icon-info size-16" />
              </div>
              <template #content>
                <span class="scraping-batch-tooltip__line">등록된 모든 활성 URL에 대해</span>
                <span class="scraping-batch-tooltip__line">데이터 수집(스크래핑)을 실행합니다.</span>
              </template>
            </UiTooltip>
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
            :disabled="selectedUrlIds.length === 0"
            @click="onSelectedScraping"
          >
            <template #icon-left>
              <i class="icon icon-version size-12" />
            </template>
            선택 스크래핑
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
            전체 스크래핑
          </UiButton>
        </div>

        <!-- URL 테이블 -->
        <UiTable
          :columns="urlTableColumns"
          :data="urlList"
          sticky-header
          clickable
          empty-text="등록된 URL이 없습니다."
          @row-click="onUrlTableRowClick"
        >
          <template #header-select>
            <UiCheckbox
              :model-value="isAllUrlSelected"
              @update:model-value="toggleSelectAllUrl"
            />
          </template>
          <template #cell-select="{ row }">
            <div @click.stop>
              <UiCheckbox
                :model-value="selectedUrlIds.includes(row.urlId)"
                @update:model-value="(v) => toggleSelectRowUrl(row.urlId, v)"
              />
            </div>
          </template>
          <template #cell-categoryName="{ value }">
            {{ value || '-' }}
          </template>
          <template #cell-urlAddr="{ value }">
            <span class="cell-url-address">{{ value }}</span>
          </template>
          <template #cell-urlName="{ value }">
            {{ value }}
          </template>
          <template #cell-crawlIntvl="{ value }">
            {{ { DAILY: '매일', WEEKLY: '매주', MANUAL: '수동' }[value as string] ?? value }}
          </template>
          <template #cell-urlCrawlStatusCd="{ value }">
            <span
              v-if="value === '002'"
              class="crawl-status-badge is-processing"
            >
              <i class="icon-refresh size-12 is-spinning" />
              수집 중
            </span>
            <span
              v-else-if="value === '003'"
              class="crawl-status-badge is-done"
              >완료</span
            >
            <span
              v-else-if="value === '004'"
              class="crawl-status-badge is-error"
              >오류</span
            >
            <span
              v-else
              class="crawl-status-badge"
              >-</span
            >
          </template>
          <template #cell-lastCrawlDt="{ value }">
            <span class="cell-last-collected">{{ value || '-' }}</span>
          </template>
          <template #cell-ragUse="{ row }">
            <UiTooltip
              v-if="String(row.dsNm ?? '').trim()"
              font-size="11px"
              side="bottom"
              align="center"
              :content="String(row.dsNm ?? '')"
            >
              <span class="repository-rag-use">{{ Number(row.activeDsCnt ?? 0) }}개 사용</span>
            </UiTooltip>
            <span
              v-else
              class="repository-rag-use"
            >
              {{ Number(row.activeDsCnt ?? 0) }}개 사용
            </span>
          </template>
          <template #cell-status="{ row }">
            <UiToggle
              :model-value="row.useYn === 'Y'"
              @update:model-value="(v) => onUrlStatusToggle(row.urlId, v)"
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
    </section>

    <UrlRegisterPanel
      :is-open="isUrlRegisterOpen"
      :category-options="categoryOptions"
      :initial-category-id="urlCategoryFilter !== 'all' ? urlCategoryFilter : ''"
      :editing-url="editingUrl"
      @close="isUrlRegisterOpen = false"
      @save="onSaveUrl"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'
import type { CategoryTreeItem, UrlItem } from '~/types/repository'
import CategoryTreeNode from '~/components/repository/CategoryTreeNode.vue'
import UrlRegisterPanel from '~/components/repository/UrlRegisterPanel.vue'
import { useCategoryStore } from '~/composables/repository/useCategoryStore'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'

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
  handleUpdateUrl,
  handleDeleteUrl,
  handleToggleUrlStatus,
  handleBatchScraping,
  handleSelectedScraping,
  isScrapingInProgress,
  scrapingProgress,
  stopScrapingStream,
} = useRepositoryStore()

const {
  isCategoryInputVisible,
  categoryInputValue,
  categoryInputRef,
  categoryInputParentId,
  editingCategoryId,
  editingName,
  categoryInputPlaceholder,
  categoryMenuItems,
  filteredCategoryList,
  selectedCategoryIds,
  toggleExpand,
  onCategorySelect,
  onCategoryMenuSelect,
  saveCategoryRename,
  toggleCategoryInput,
  onCategoryInputEnter,
  handleUpdateCategoryOrder,
} = useCategoryStore()

// 카테고리 트리를 평면 리스트로 변환 (UiSelect options용)
const flattenCategoryTree = (items: CategoryTreeItem[]): CategoryTreeItem[] => {
  const result: CategoryTreeItem[] = []
  for (const item of items) {
    result.push(item)
    if (item.children?.length) result.push(...flattenCategoryTree(item.children))
  }
  return result
}
const categoryOptions = computed(() => [
  { label: '전체', value: '' },
  ...flattenCategoryTree(filteredCategoryList.value).map((c) => ({
    label: c.categoryName,
    value: c.categoryId,
  })),
])

const draggingCategoryId = ref<string | null>(null)

const onTreeDragStart = (categoryId: string) => {
  draggingCategoryId.value = categoryId
}

const onTreeDragEnd = () => {
  draggingCategoryId.value = null
}

const onTreeReorder = async (payload: {
  draggedId: string
  targetId: string
  position: 'before' | 'after' | 'inside'
}) => {
  draggingCategoryId.value = null
  const ok = await handleUpdateCategoryOrder(payload)
  if (!ok) return
  openToast({ message: '카테고리 순서가 저장되었습니다.', type: 'success' })
}

const setAllExpanded = (list: CategoryTreeItem[], value: boolean) => {
  for (const item of list) {
    item.expanded = value
    if (item.children?.length) setAllExpanded(item.children, value)
  }
}

const allExpanded = ref(true)
const onToggleExpandAll = () => {
  allExpanded.value = !allExpanded.value
  setAllExpanded(filteredCategoryList.value, allExpanded.value)
}

// 초기 로딩
onMounted(() => handleSelectUrlList())

// 페이지 변경 시 재조회
watch(urlCurrentPage, () => handleSelectUrlList())

// 스크래핑 정보 (추후 API 연동)
const lastScrapingAt = ref('2025-02-11 08:30')
const nextScrapingAt = ref('2025-02-12 00:00')

const urlTableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'categoryName', label: '카테고리', width: '100px', align: 'left', headerAlign: 'left' },
  { key: 'urlAddr', label: 'URL 주소', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'urlName', label: 'URL 이름', width: '120px', align: 'left', headerAlign: 'left' },
  { key: 'crawlIntvl', label: '수집 주기', width: '90px', align: 'center', headerAlign: 'center' },
  { key: 'urlCrawlStatusCd', label: '수집 상태', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'lastCrawlDt', label: '마지막 수집일', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'ragUse', label: 'RAG사용', width: '90px', align: 'center', headerAlign: 'center' },
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
    selectedUrlIds.value = urlList.value.map((r) => r.urlId)
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

// URL 등록/수정 패널
const isUrlRegisterOpen = ref(false)
const editingUrl = ref<UrlItem | null>(null)

const onRegisterUrl = () => {
  editingUrl.value = null
  isUrlRegisterOpen.value = true
}

const onUrlTableRowClick = (row: Record<string, unknown>) => {
  editingUrl.value = row as unknown as UrlItem
  isUrlRegisterOpen.value = true
}

const onSaveUrl = async (data: Record<string, unknown>) => {
  const formData = data as {
    urlId?: string
    active: boolean
    categoryId: string
    urlName: string
    urlAddr: string
    crawlIntvl: string
    crawlDpth: string
  }
  const payload = {
    urlName: formData.urlName,
    urlAddr: formData.urlAddr,
    categoryId: formData.categoryId || null,
    crawlIntvl: formData.crawlIntvl,
    crawlDpth: Number(formData.crawlDpth),
    useYn: formData.active ? 'Y' : 'N',
  }
  if (formData.urlId) {
    const ok = await handleUpdateUrl({ ...payload, urlId: formData.urlId })
    if (!ok) return
    openToast({ message: `'${formData.urlName}' URL이 수정되었습니다.` })
  } else {
    const ok = await handleSaveUrl(payload)
    if (!ok) return
    openToast({ message: `'${formData.urlName}' URL이 등록되었습니다.` })
  }
}

const onBatchDelete = async () => {
  if (selectedUrlIds.value.length === 0) {
    openAlert({ title: '알림', message: '삭제할 URL을 선택해주세요.' })
    return
  }
  const ok = await handleDeleteUrl(selectedUrlIds.value)
  if (ok) {
    selectedUrlIds.value = []
  }
}

const onBatchLog = () => {
  openAlert({ title: '배치 로그', message: '배치 로그 기능은 추후 구현 예정입니다.' })
}

const onSelectedScraping = async () => {
  const confirmed = await openConfirm({
    title: '선택 스크래핑',
    message: `선택한 ${selectedUrlIds.value.length}개 URL에 대해 스크래핑을 실행하시겠습니까?`,
  })
  if (!confirmed) return
  handleSelectedScraping(selectedUrlIds.value)
}

const onBatchScraping = async () => {
  const confirmed = await openConfirm({
    title: '전체 스크래핑',
    message: '활성 상태인 모든 URL에 대해 스크래핑을 실행하시겠습니까?',
  })
  if (!confirmed) return
  handleBatchScraping()
}

const onUrlRowActionSelect = async (value: string, row: Record<string, unknown>) => {
  const selectedRow = row as unknown as UrlItem
  if (value === 'delete') {
    const ok = await handleDeleteUrl([selectedRow.urlId])
    if (ok) {
      selectedUrlIds.value = selectedUrlIds.value.filter((id) => id !== selectedRow.urlId)
    }
  } else if (value === 'collect') {
    const confirmed = await openConfirm({
      title: '즉시 수집',
      message: `'${selectedRow.urlName}' URL의 스크래핑을 실행하시겠습니까?`,
    })
    if (confirmed) handleSelectedScraping([selectedRow.urlId])
  } else if (value === 'history') {
    openAlert({ title: '수집 내역', message: '수집 내역 기능은 추후 구현 예정입니다.' })
  } else if (value === 'edit') {
    editingUrl.value = selectedRow
    isUrlRegisterOpen.value = true
  }
}
</script>

<style lang="scss" scoped>
.repository-url-panel {
  flex: 1 0 0;
}

.cell-url-address {
  display: block;
  width: 100%;
  @include ellipsis(1);
}

/* 수집 상태 배지 */
.crawl-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: $border-radius-base;
  @include typo($body-xsmall-bold);

  &.is-processing {
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.1);
    color: var(--color-primary);

    .icon-refresh.is-spinning {
      animation: spin 1s linear infinite;
    }
  }

  &.is-done {
    background: rgba(22, 163, 74, 0.1);
    color: #16a34a;
  }

  &.is-error {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 배치 바 — 스크래핑 프로그레스바 */
.scraping-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}

.scraping-progress-header {
  @include typo($body-xsmall, $color-text-muted);
}

.scraping-progress-stop {
  @include typo($body-xsmall-bold, $color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: $color-text-primary;
  }
}

.scraping-progress-bar-track {
  height: 4px;
  background: $color-border;
  border-radius: 999px;
  overflow: hidden;
}

.scraping-progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}
</style>
