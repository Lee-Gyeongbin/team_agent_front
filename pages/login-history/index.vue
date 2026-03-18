<template>
  <div class="login-history-index wide-center">
    <!-- 헤더 -->
    <div class="login-history-header flex justify-between items-center">
      <p class="login-history-description">로그인 이력을 조회하고 관리할 수 있습니다.</p>
      <div class="right-grp flex items-center">
        <p class="total">
          총 <strong>{{ filteredList.length }}건</strong>
        </p>
        <div class="login-history-input-grp shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="IP 또는 사용자 ID 검색"
            @search="handleFetchLoginHistory"
            @enter="handleFetchLoginHistory"
          />
        </div>
        <div class="login-history-select-grp shrink-0 grow-1 max-w-140">
          <UiSelect
            id="date-range"
            v-model="dateRangeOption"
            name="date-range"
            :options="loginHistoryDateRangeOptions"
            size="md"
            @change="handleFetchLoginHistory"
          />
        </div>
        <UiButton
          variant="ghost"
          size="md"
          @click="handleFetchLoginHistory"
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
      text="로그인 이력을 불러오는 중..."
    />

    <!-- 에러 -->
    <div
      v-else-if="errorMessage"
      class="login-history-error"
    >
      <p class="login-history-error__message">{{ errorMessage }}</p>
      <UiButton
        variant="outline"
        size="md"
        @click="handleFetchLoginHistory"
      >
        다시 시도
      </UiButton>
    </div>

    <!-- 테이블 -->
    <div
      v-else
      class="login-history-table-wrap"
    >
      <UiTable
        :columns="loginHistoryColumns"
        :data="filteredList"
        sticky-header
        max-height="calc(100vh - 200px)"
        empty-text="조회된 로그인 이력이 없습니다."
      >
        <template #cell-result="{ value }">
          <span
            class="login-history-status"
            :class="value === '성공' ? 'is-success' : 'is-fail'"
          >
            {{ value }}
          </span>
        </template>
      </UiTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loginHistoryColumns, loginHistoryDateRangeOptions } from '~/types/login-history'

const {
  loginHistoryList,
  searchKeyword,
  dateRangeOption,
  isLoading,
  errorMessage,
  filteredList,
  handleFetchLoginHistory,
} = useLoginHistoryStore()

onMounted(() => {
  handleFetchLoginHistory()
})
</script>
