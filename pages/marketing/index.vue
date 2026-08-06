<template>
  <div class="marketing-page wide-center">
    <!-- 로딩 -->
    <div
      v-if="isPageLoading"
      class="marketing-page-body"
    >
      <div class="marketing-page-skeleton">
        <UiSkeleton
          height="48px"
          width="60%"
          style="margin-bottom: 16px"
        />
        <UiSkeleton
          height="320px"
          width="100%"
        />
      </div>
    </div>

    <!-- 설정/에이전트 없음 -->
    <div
      v-else-if="!config || !selectedAgent"
      class="marketing-page-body"
    >
      <UiEmpty
        icon="icon-edit"
        title="마케팅 에이전트를 찾을 수 없습니다."
        description="에이전트 관리에서 마케팅 콘텐츠 작성 에이전트를 등록·활성화해 주세요."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="navigateTo('/chat')"
        >
          채팅으로 이동
        </UiButton>
      </UiEmpty>
    </div>

    <!-- 제작 내역 목록 -->
    <div
      v-else-if="pagePhase === 'list'"
      class="marketing-page-body marketing-page-body--list"
    >
      <header class="marketing-history-header">
        <div>
          <h2 class="marketing-history-title">마케팅 콘텐츠</h2>
          <p class="marketing-history-desc">제작한 콘텐츠·이미지 내역을 확인하고 이어서 작업할 수 있어요.</p>
        </div>
        <div class="marketing-history-header__actions">
          <UiInput
            v-model="historySearchKeyword"
            type="search"
            size="sm"
            class="marketing-history-search"
            placeholder="제작 내역 검색"
          />
          <UiButton
            variant="primary"
            size="md"
            @click="onStartNew"
          >
            <template #icon-left>
              <i class="icon-plus size-16" />
            </template>
            새로 만들기
          </UiButton>
        </div>
      </header>

      <div
        v-if="allHistoryItems.length"
        class="marketing-history-filter-bar"
      >
        <div class="marketing-history-filter-chips">
          <button
            v-for="chip in CONTENT_TYPE_FILTER_CHIPS"
            :key="chip.value"
            type="button"
            class="marketing-history-filter-chip"
            :class="{ 'is-active': historyContentTypeFilter === chip.value }"
            @click="historyContentTypeFilter = chip.value"
          >
            {{ chip.label }}
          </button>
        </div>
        <span class="marketing-history-filter-divider" />
        <div class="marketing-history-filter-chips">
          <button
            v-for="chip in MODE_FILTER_CHIPS"
            :key="chip.value"
            type="button"
            class="marketing-history-filter-chip"
            :class="{ 'is-active': historyModeFilter === chip.value }"
            @click="historyModeFilter = chip.value"
          >
            {{ chip.label }}
          </button>
        </div>
        <span class="marketing-history-filter-divider" />
        <select
          v-model="historySort"
          class="marketing-history-filter-select"
        >
          <option
            v-for="opt in HISTORY_SORT_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <select
          v-model="historyPeriodFilter"
          class="marketing-history-filter-select"
        >
          <option
            v-for="opt in HISTORY_PERIOD_OPTIONS"
            :key="opt.value || 'all'"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <p
        v-if="allHistoryItems.length"
        class="marketing-history-count"
      >
        총 {{ filteredHistoryItems.length }}건
      </p>

      <UiEmpty
        v-if="!allHistoryItems.length"
        icon="icon-edit"
        title="제작 내역이 없습니다."
        description="새 콘텐츠를 만들어 보세요."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="onStartNew"
        >
          새로 만들기
        </UiButton>
      </UiEmpty>

      <UiEmpty
        v-else-if="!filteredHistoryItems.length"
        icon="icon-search"
        title="검색 결과가 없습니다."
        description="검색어나 필터 조건을 변경해 보세요."
      />

      <div
        v-else
        class="marketing-history-list"
      >
        <button
          v-for="item in filteredHistoryItems"
          :key="item.roomId"
          type="button"
          class="marketing-history-row"
          :class="{ 'is-editing': isEditingHistory(item.roomId) }"
          @click="onHistoryRowClick(item.roomId)"
        >
          <span
            class="marketing-history-row__mode-badge"
            :class="{
              'is-image': item.mode === 'IMAGE',
              'is-text': item.mode === 'TEXT',
              'is-both': item.mode === 'BOTH',
            }"
          >
            {{ item.mode === 'BOTH' ? '통합' : item.mode === 'IMAGE' ? '이미지' : '문구' }}
          </span>
          <div class="marketing-history-row__copy">
            <UiInput
              v-if="isEditingHistory(item.roomId)"
              ref="historyTitleInputRef"
              v-model="editingTitle"
              class="marketing-history-row__title-input"
              placeholder="제작 내역 이름"
              @click.stop
              @keydown.enter.prevent="onSaveHistoryTitle(item.roomId)"
              @keydown.esc.prevent="onCancelHistoryTitle"
            />
            <strong
              v-else
              class="marketing-history-row__title"
            >
              {{ item.displayTitle }}
            </strong>
            <div
              v-if="item.metaBadges.length && !isEditingHistory(item.roomId)"
              class="marketing-history-row__meta-badges"
            >
              <span
                v-for="(badge, badgeIndex) in item.metaBadges"
                :key="`${item.roomId}-meta-${badgeIndex}`"
                class="marketing-history-row__meta-badge"
                :class="{
                  'is-image': item.mode === 'IMAGE',
                  'is-text': item.mode === 'TEXT' || item.mode === 'BOTH',
                }"
              >
                {{ badge }}
              </span>
            </div>
            <span class="marketing-history-row__date">{{ item.createDt }}</span>
          </div>
          <span
            class="marketing-history-row__actions"
            @click.stop
          >
            <UiButton
              variant="ghost"
              size="sm"
              icon-only
              :title="isEditingHistory(item.roomId) ? '수정 완료' : '이름 수정'"
              @click="onToggleHistoryTitleEdit(item)"
            >
              <template #icon-left>
                <i :class="isEditingHistory(item.roomId) ? 'icon-check size-16' : 'icon-edit size-16'" />
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              icon-only
              title="내역 삭제"
              :disabled="!!editingRoomId"
              @click="onDeleteHistory(item.roomId)"
            >
              <template #icon-left>
                <i class="icon-trashcan size-16" />
              </template>
            </UiButton>
          </span>
        </button>
      </div>
    </div>

    <!-- 작성 폼 -->
    <div
      v-else-if="pagePhase === 'form'"
      class="marketing-page-body"
    >
      <div class="marketing-page-form-bar">
        <button
          type="button"
          class="marketing-page-back"
          @click="onBackToList"
        >
          <i class="icon-arrow-right size-16 marketing-page-back__arrow" />
          제작 내역
        </button>
      </div>
      <ChatMarketingAuthoringCard
        class="marketing-page-authoring-card"
        :config="config"
        :theme-color-hex="themeColorHex"
        @close="onBackToList"
        @submit="onSubmit"
      />
    </div>

    <!-- 생성 결과 -->
    <div
      v-else
      class="marketing-page-body marketing-page-body--result"
    >
      <div class="marketing-page-form-bar">
        <button
          type="button"
          class="marketing-page-back"
          @click="onBackToList"
        >
          <i class="icon-arrow-right size-16 marketing-page-back__arrow" />
          제작 내역
        </button>
      </div>
      <ChatMarketingResult
        v-if="displayResult"
        class="marketing-page-result-card"
        :result="displayResult"
        :is-loading="isResultLoading"
        :theme-color-hex="themeColorHex"
        :show-side-panel="true"
        @edit-with-agent="onEditWithAgent"
      />
      <MarketingPreparingStatus
        v-else-if="isGenerating"
        :mode="generatingMode"
        :phase="generatingPhase"
        :active="isGenerating"
        bordered
      />
      <UiEmpty
        v-else
        icon="icon-edit"
        title="생성 결과가 없습니다."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="onReopen"
        >
          다시 작성하기
        </UiButton>
      </UiEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const {
  CONTENT_TYPE_FILTER_CHIPS,
  MODE_FILTER_CHIPS,
  HISTORY_SORT_OPTIONS,
  HISTORY_PERIOD_OPTIONS,
  pagePhase,
  isPageLoading,
  selectedAgent,
  config,
  themeColorHex,
  historySearchKeyword,
  historyContentTypeFilter,
  historyModeFilter,
  historySort,
  historyPeriodFilter,
  filteredHistoryItems,
  allHistoryItems,
  editingRoomId,
  editingTitle,
  historyTitleInputRef,
  displayResult,
  isResultLoading,
  isGenerating,
  generatingMode,
  generatingPhase,
  onBackToList,
  onStartNew,
  onDeleteHistory,
  onSubmit,
  onReopen,
  onEditWithAgent,
  onHistoryRowClick,
  isEditingHistory,
  onToggleHistoryTitleEdit,
  onSaveHistoryTitle,
  onCancelHistoryTitle,
} = useMarketingPage()
</script>
