<template>
  <div class="notice-index wide-center">
    <!-- 헤더 -->
    <div class="notice-header flex justify-between items-center">
      <p class="notice-description">공지사항을 조회하고 관리할 수 있습니다.</p>
      <div class="right-grp flex items-center">
        <p class="total">
          총 <strong>{{ totalNoticeCount }}건</strong>
        </p>
        <div class="notice-input-grp shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="제목 또는 작성자 검색"
            @search="onSearch"
            @enter="onSearch"
          />
        </div>
        <div class="notice-select-grp shrink-0 grow-1 max-w-140">
          <UiSelect
            v-model="searchCategory"
            :options="categoryOptions"
            placeholder="카테고리 선택"
            size="md"
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
            @click="handleSelectNoticeList"
          >
            <template #icon-left>
              <i class="icon icon-refresh size-16" />
            </template>
            새로고침
          </UiButton>
        </div>
      </div>
    </div>

    <div class="notice-list-panel">
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
            @click="handleSelectNoticeList"
          >
            다시 시도
          </UiButton>
        </div>

        <!-- 테이블 -->
        <div
          v-else
          class="notice-table-stack"
        >
          <div class="notice-table-wrap">
            <UiTable
              :columns="noticeColumns"
              :data="pagedNoticeList"
              sticky-header
              empty-text="새로운 공지사항을 등록해주세요"
            >
              <template #cell-title="{ row }">
                <template v-if="(row as NoticeRow).pinYn === 'Y'">
                  <button
                    type="button"
                    class="notice-title-btn is-pinned-notice-title"
                    @click.stop="onOpenNoticeDetail(row as NoticeRow)"
                  >
                    <span class="notice-title-text">{{
                      (getNoticeTypeBracketed(row as NoticeRow) + ' ' + getDisplayNoticeTitle(row.title)).trim()
                    }}</span>
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="notice-title-btn"
                    @click.stop="onOpenNoticeDetail(row as NoticeRow)"
                  >
                    <span class="notice-title-text">{{
                      (getNoticeTypeBracketed(row as NoticeRow) + ' ' + getDisplayNoticeTitle(row.title)).trim()
                    }}</span>
                  </button>
                </template>
              </template>
              <template #cell-noticeId="{ row }">
                <template v-if="(row as NoticeRow).pinYn === 'Y'">
                  <i
                    class="icon-sidebar-pin size-16 notice-order-pin"
                    aria-label="중요 공지"
                  />
                </template>
                <template v-else>
                  {{ getNoticeOrderLabel(row as NoticeRow) }}
                </template>
              </template>
              <template #cell-modifyDt="{ row }">
                {{ getNoticeDateLabel((row as NoticeRow).modifyDt) }}
              </template>
            </UiTable>
          </div>

          <div class="notice-pagination-stack">
            <UiPagination
              v-if="noticeTotalPages > 1"
              v-model="page"
              :total-count="normalTotalCount"
              :page-size="noticeNormalPageSize"
              total-label="개 공지사항"
              class="notice-pagination"
            />
          </div>
        </div>
      </div>
    </div>

    <NoticeFormPanel
      :is-open="isNoticePanelOpen"
      :form-data="noticeForm"
      :notice-type-options="noticeTypeOptions"
      :panel-action-label="panelActionLabel"
      @update-form-data="(payload) => (noticeForm = payload)"
      @save="onSaveNoticeForm"
      @close="onCloseNoticeForm"
    />
    <NoticeDetailPanel
      v-if="selectedNotice"
      :is-open="isNoticeDetailPanelOpen"
      :notice="selectedNotice"
      :notice-title="
        `${getNoticeTypeBracketed(selectedNotice as NoticeRow)} ${(selectedNotice as NoticeRow).title}`.trim()
      "
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
  searchCategory,
  isLoading,
  errorMessage,
  currentPage,
  isNoticePanelOpen,
  isNoticeDetailPanelOpen,
  selectedNotice,
  noticeForm,
  noticeTypeOptions,
  categoryOptions,
  panelActionLabel,
  normalTotalCount,
  totalNoticeCount,
  noticeNormalPageSize,
  noticeTotalPages,
  pagedNoticeList,
  handleSelectNoticeList,
  handleSelectNoticeTypeOptions,
  getDisplayNoticeTitle,
  onRegisterNotice,
  onSaveNoticeForm,
  onCloseNoticeForm,
  onOpenNoticeDetail,
  onEditNotice,
  onDeleteNotice,
  getNoticeTypeBracketed,
  getNoticeOrderLabel,
  getNoticeDateLabel,
} = useNoticeStore()

// 페이지 변경 시 서버에 해당 페이지 데이터 재조회
const page = computed({
  get: () => currentPage.value,
  set: (value: number) => {
    currentPage.value = value
    handleSelectNoticeList()
  },
})

// 검색 버튼/엔터로 검색 수행
const onSearch = () => {
  currentPage.value = 1
  handleSelectNoticeList()
}

// 카테고리 변경 및 전체 페이지 수 변경 시 페이지/데이터 보정
watch(
  () => ({ category: searchCategory.value, totalPages: noticeTotalPages.value }),
  (next, prev) => {
    // 카테고리 변경 시 1페이지로 이동 후 재조회
    if (!prev || next.category !== prev.category) {
      currentPage.value = 1
      handleSelectNoticeList()
      return
    }

    // 전체 페이지 수가 줄어들었을 때 현재 페이지 보정
    const totalPage = next.totalPages
    if (currentPage.value > totalPage) {
      currentPage.value = Math.max(1, totalPage)
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  handleSelectNoticeTypeOptions()
  handleSelectNoticeList()
})
</script>
