<template>
  <div class="notice-index wide-center">
    <!-- 헤더 -->
    <div class="notice-header flex justify-between items-center">
      <p class="notice-description">공지사항을 조회하고 관리할 수 있습니다.</p>
      <div class="right-grp flex items-center">
        <p class="total">
          총 <strong>{{ filteredList.length }}건</strong>
        </p>
        <div class="notice-input-grp shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="제목 또는 작성자 검색"
          />
        </div>
        <div class="notice-btn-grp flex items-center shrink-0 gap-2">
          <UiButton
            variant="primary"
            size="md"
            @click="onRegisterNotice"
          >
            <template #icon-left>
              <i class="icon icon-plus size-16" />
            </template>
            등록
          </UiButton>
          <UiButton
            variant="outline"
            size="md"
            @click="handleFetchNoticeList"
          >
            <template #icon-left>
              <i class="icon icon-refresh size-16" />
            </template>
            새로고침
          </UiButton>
        </div>
      </div>
    </div>

    <div
      class="notice-list-panel"
      :class="{ 'is-short-page': isShortNoticePage }"
    >
      <div class="notice-content">
        <!-- 로딩 -->
        <UiLoading
          v-if="isLoading"
          overlay
          text="공지사항을 불러오는 중..."
        />

        <!-- 에러 -->
        <div
          v-else-if="errorMessage"
          class="notice-error"
        >
          <p class="notice-error__message">{{ errorMessage }}</p>
          <UiButton
            variant="outline"
            size="md"
            @click="handleFetchNoticeList"
          >
            다시 시도
          </UiButton>
        </div>

        <!-- 테이블 -->
        <div
          v-else
          class="notice-table-wrap"
        >
          <UiTable
            :columns="noticeColumns"
            :data="pagedNoticeList"
            sticky-header
            empty-text="새로운 공지사항을 등록해주세요"
          >
            <template #cell-title="{ row }">
              <button
                type="button"
                class="notice-title-btn"
                :class="{ 'is-pinned-notice-title': isPinnedNotice(row as NoticeRow) }"
                @click.stop="onOpenNoticeDetail(row as NoticeRow)"
              >
                <span class="notice-title-text">{{ getDisplayNoticeTitle(row.title) }}</span>
              </button>
            </template>
            <template #cell-noticeId="{ row }">
              <i
                v-if="isPinnedNotice(row as NoticeRow)"
                class="icon-sidebar-pin size-16 notice-order-pin"
                aria-label="중요 공지"
              />
              <template v-else>
                {{ getNoticeOrderLabel(row as NoticeRow) }}
              </template>
            </template>
            <template #cell-modifyDt="{ row }">
              {{ getNoticeDateLabel((row as NoticeRow).modifyDt) }}
            </template>
          </UiTable>
        </div>
      </div>

      <div class="notice-pagination-wrap">
        <UiPagination
          v-if="filteredList.length > 0"
          v-model="currentPage"
          :total-count="filteredList.length"
          :page-size="pageSize"
          total-label="개 공지사항"
          class="notice-pagination"
        />
      </div>
    </div>

    <NoticeFormPanel
      :is-open="isNoticePanelOpen"
      :form-data="noticeForm"
      :panel-action-label="panelActionLabel"
      @update-form-data="(payload) => (noticeForm = payload)"
      @save="onSaveNoticeForm"
      @close="onCloseNoticeForm"
    />
    <NoticeDetailPanel
      :is-open="isNoticeDetailPanelOpen"
      :notice="selectedNotice"
      @edit="onEditNotice"
      @delete="onDeleteNotice"
      @close="isNoticeDetailPanelOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { NoticeRow } from '~/types/notice'
import { noticeColumns } from '~/types/notice'

const {
  searchKeyword,
  isLoading,
  errorMessage,
  currentPage,
  pageSize,
  isNoticePanelOpen,
  isNoticeDetailPanelOpen,
  selectedNotice,
  noticeForm,
  panelActionLabel,
  filteredList,
  pagedNoticeList,
  handleFetchNoticeList,
  getDisplayNoticeTitle,
  onRegisterNotice,
  onSaveNoticeForm,
  onCloseNoticeForm,
  onOpenNoticeDetail,
  onEditNotice,
  onDeleteNotice,
  isPinnedNotice,
  getNoticeOrderLabel,
  getNoticeDateLabel,
} = useNoticeStore()

const isShortNoticePage = computed(() => pagedNoticeList.value.length < pageSize)

watch(searchKeyword, () => {
  currentPage.value = 1
})

watch(filteredList, () => {
  const totalPage = Math.max(1, Math.ceil(filteredList.value.length / pageSize))
  if (currentPage.value > totalPage) {
    currentPage.value = totalPage
  }
})

onMounted(() => {
  handleFetchNoticeList()
})
</script>
