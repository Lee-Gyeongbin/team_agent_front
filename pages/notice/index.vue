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
            @search="handleFetchNoticeList"
            @enter="handleFetchNoticeList"
          />
        </div>
        <UiButton
          variant="ghost"
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
        max-height="calc(100vh - 200px)"
        empty-text="조회된 공지사항이 없습니다."
      />
    </div>
    <div class="notice-pagination-wrap">
      <UiPagination
        v-model="currentPage"
        :total-count="filteredList.length"
        :page-size="pageSize"
        total-label="공지사항"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { noticeColumns } from '~/types/notice'

const { searchKeyword, isLoading, errorMessage, filteredList, handleFetchNoticeList } = useNoticeStore()
const currentPage = ref(1)
const pageSize = 10

const pagedNoticeList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(startIndex, startIndex + pageSize)
})

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
