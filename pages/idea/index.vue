<template>
  <div class="notice-index idea-index wide-center">
    <!-- 헤더 -->
    <div class="notice-header flex justify-between items-center">
      <p class="notice-description">아이디어를 등록하고 처리 현황을 확인할 수 있습니다.</p>
      <div class="right-grp flex items-center">
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
        <div class="notice-btn-grp flex items-center shrink-0 gap-2">
          <UiButton
            variant="primary"
            size="sm"
            @click="onRegisterIdea"
          >
            <template #icon-left>
              <UiIcon
                name="plus"
                size="16"
              />
            </template>
            등록
          </UiButton>
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
          :title="searchKeyword || searchTypeCd !== 'ALL' ? '검색 결과가 없습니다.' : '등록된 아이디어가 없습니다.'"
        />

        <!-- 테이블 -->
        <div
          v-else
          class="notice-table-stack"
        >
          <div class="notice-table-wrap">
            <UiTable
              :columns="ideaColumns"
              :data="ideaList"
              sticky-header
            >
              <template #cell-title="{ row }">
                <button
                  type="button"
                  class="notice-title-btn"
                  @click.stop="onOpenIdeaDetail(row as IdeaListItem)"
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

    <IdeaDetailPanel
      :is-open="isIdeaDetailPanelOpen"
      :idea="selectedIdea"
      :is-mine="selectedIdea ? isMyIdea(selectedIdea) : false"
      @like="toggleIdeaLike"
      @edit="onEditIdea"
      @delete="handleDeleteIdea"
      @close="onCloseIdeaDetail"
    />
    <IdeaFormPanel
      :is-open="isIdeaFormPanelOpen"
      :form-data="ideaForm"
      :type-options="ideaTypeOptions"
      :agent-options="ideaAgentOptions"
      :is-agent-type="isAgentType"
      :panel-action-label="panelActionLabel"
      @update-form-data="(payload) => (ideaForm = payload)"
      @save="handleSaveIdea"
      @close="onCloseIdeaForm"
    />
  </div>
</template>

<script setup lang="ts">
import { UiInput, UiSelect, UiButton, UiIcon, UiTable, UiPagination, UiBadge, UiEmpty } from '@leechanyong/ispark-ui'
import { useIdeaStore } from '~/composables/idea/useIdeaStore'
import { getIdeaStatusVariant, ideaColumns } from '~/types/idea'
import type { IdeaListItem } from '~/types/idea'

const {
  ideaTypeFilterOptions,
  ideaTypeOptions,
  ideaAgentOptions,
  isAgentType,
  ideaPageSize,
  searchInput,
  searchKeyword,
  searchTypeCd,
  currentPage,
  ideaList,
  totalIdeaCount,
  ideaTotalPages,
  isIdeaDetailPanelOpen,
  isIdeaFormPanelOpen,
  ideaForm,
  selectedIdea,
  panelActionLabel,
  isMyIdea,
  handleSelectIdeaCodeList,
  handleSelectIdeaList,
  onSearchIdea,
  onFilterChange,
  handleRefreshIdea,
  onOpenIdeaDetail,
  onCloseIdeaDetail,
  onRegisterIdea,
  onEditIdea,
  onCloseIdeaForm,
  handleSaveIdea,
  handleDeleteIdea,
  toggleIdeaLike,
} = useIdeaStore()

onMounted(async () => {
  await handleSelectIdeaCodeList()
  await handleSelectIdeaList()
})

// 페이지 이동
watch(currentPage, () => {
  handleSelectIdeaList()
})
</script>
