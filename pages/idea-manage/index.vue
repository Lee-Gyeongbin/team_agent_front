<template>
  <div class="notice-index idea-index idea-manage-index wide-center">
    <!-- 헤더 -->
    <div class="notice-header flex justify-between items-center">
      <p class="notice-description">아이디어를 확인하고 답변·상태를 관리할 수 있습니다.</p>
      <div class="right-grp flex items-center">
        <UiDropdownMenu
          :items="excelMenuItems"
          align="start"
          @select="onIdeaExcelSelect"
        >
          <template #trigger>
            <UiButton
              variant="ghost"
              size="md"
            >
              엑셀
              <template #icon-right>
                <UiIcon
                  name="chevron-down"
                  size="14"
                />
              </template>
            </UiButton>
          </template>
        </UiDropdownMenu>
        <p class="total">
          총 <strong>{{ totalIdeaCount }}건</strong>
        </p>
        <div class="notice-input-grp shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="searchInput"
            type="search"
            size="sm"
            placeholder="제목, 작성자, 에이전트명 검색"
            @search="onSearchIdea"
            @enter="onSearchIdea"
          />
        </div>
        <div class="notice-select-grp shrink-0 grow-1 max-w-140">
          <UiSelect
            v-model="searchTypeCd"
            :options="ideaTypeFilterOptions"
            placeholder="전체 구분"
            size="sm"
            @update:model-value="onFilterChange"
          />
        </div>
        <div class="notice-select-grp shrink-0 grow-1 max-w-140">
          <UiSelect
            v-model="searchStatusCd"
            :options="ideaStatusFilterOptions"
            placeholder="전체 진행상태"
            size="sm"
            @update:model-value="onFilterChange"
          />
        </div>
        <div class="notice-btn-grp flex items-center shrink-0 gap-2">
          <UiButton
            variant="outline"
            size="sm"
            @click="handleRefreshIdea"
          >
            <template #icon-left>
              <UiIcon
                name="refresh-cw"
                size="16"
              />
            </template>
            새로고침
          </UiButton>
        </div>
      </div>
    </div>

    <div class="notice-list-panel">
      <div class="notice-content">
        <!-- 빈 상태 -->
        <UiEmpty
          v-if="totalIdeaCount === 0"
          class="idea-empty"
          icon="icon-search"
          :title="
            searchKeyword || searchTypeCd !== 'ALL' || searchStatusCd !== 'ALL'
              ? '검색 결과가 없습니다.'
              : '등록된 아이디어가 없습니다.'
          "
        />

        <!-- 테이블 -->
        <div
          v-else
          class="notice-table-stack"
        >
          <div class="notice-table-wrap">
            <UiTable
              :columns="ideaManageColumns"
              :data="ideaList"
              sticky-header
            >
              <template #cell-title="{ row }">
                <button
                  type="button"
                  class="notice-title-btn"
                  @click.stop="onOpenIdeaManageDetail(row as IdeaListItem)"
                >
                  <span class="notice-title-text">{{ row.title }}</span>
                </button>
              </template>
              <template #cell-statusNm="{ row }">
                <UiBadge
                  :variant="getIdeaStatusVariant((row as IdeaListItem).statusCd)"
                  size="sm"
                >
                  {{ row.statusNm }}
                </UiBadge>
              </template>
              <template #cell-manage="{ row }">
                <div class="idea-manage-actions">
                  <UiButton
                    variant="danger-line"
                    size="xs"
                    class="idea-manage-btn-del"
                    @click.stop="handleDeleteIdeaManage(row as IdeaListItem)"
                  >
                    삭제
                  </UiButton>
                </div>
              </template>
            </UiTable>
          </div>

          <div class="notice-pagination-stack">
            <UiPagination
              v-if="ideaTotalPages > 1"
              v-model="currentPage"
              :total-count="totalIdeaCount"
              :page-size="ideaPageSize"
              align="center"
              class="notice-pagination"
            />
          </div>
        </div>
      </div>
    </div>

    <IdeaManageDetailPanel
      :is-open="isIdeaManageDetailOpen"
      :idea="selectedManageIdea"
      :form-data="ideaManageForm"
      :status-options="ideaStatusOptions"
      @update-form-data="(payload) => (ideaManageForm = payload)"
      @like="toggleIdeaManageLike"
      @save="handleSaveIdeaManage"
      @delete="handleDeleteIdeaManage()"
      @close="onCloseIdeaManageDetail"
    />
  </div>
</template>

<script setup lang="ts">
import {
  UiBadge,
  UiButton,
  UiDropdownMenu,
  UiEmpty,
  UiIcon,
  UiInput,
  UiPagination,
  UiSelect,
  UiTable,
} from '@leechanyong/ispark-ui'
import { useIdeaManageStore } from '~/composables/idea-manage/useIdeaManageStore'
import { getIdeaStatusVariant, ideaManageColumns } from '~/types/idea'
import type { IdeaListItem } from '~/types/idea'

const {
  ideaTypeFilterOptions,
  ideaStatusFilterOptions,
  ideaStatusOptions,
  ideaPageSize,
  searchInput,
  searchKeyword,
  searchTypeCd,
  searchStatusCd,
  currentPage,
  ideaList,
  totalIdeaCount,
  ideaTotalPages,
  excelMenuItems,
  isIdeaManageDetailOpen,
  ideaManageForm,
  selectedManageIdea,
  handleSelectIdeaCodeList,
  handleSelectIdeaList,
  onSearchIdea,
  onFilterChange,
  handleRefreshIdea,
  onOpenIdeaManageDetail,
  onCloseIdeaManageDetail,
  handleSaveIdeaManage,
  handleDeleteIdeaManage,
  toggleIdeaManageLike,
  onIdeaExcelSelect,
} = useIdeaManageStore()

onMounted(async () => {
  await handleSelectIdeaCodeList()
  await handleSelectIdeaList()
})

// 페이지 이동
watch(currentPage, () => {
  handleSelectIdeaList()
})
</script>
