<template>
  <div
    class="marketing-detail-page"
    :class="{ 'is-authoring': pagePhase === 'form' || pagePhase === 'result' }"
  >
    <div
      v-if="!config || !selectedAgent"
      class="marketing-page-body"
    >
      <button
        class="marketing-back-btn"
        type="button"
        @click="handleBackToProjects"
      >
        <i class="icon-arrow-right size-16 marketing-back-btn__arrow" />
        마케팅 프로젝트
      </button>
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

    <template v-else>
      <!-- 제작 내역 목록 -->
      <div
        v-if="pagePhase === 'list'"
        class="marketing-page-body marketing-page-body--list"
      >
        <div class="marketing-detail-head">
          <button
            class="marketing-back-btn"
            type="button"
            @click="handleBackToProjects"
          >
            <i class="icon-arrow-right size-16 marketing-back-btn__arrow" />
            마케팅 프로젝트
          </button>

          <div class="marketing-detail-head__row">
            <div
              v-if="currentProject"
              class="marketing-detail-info"
            >
              <div class="marketing-detail-title">{{ currentProject.projectNm }}</div>
              <div class="marketing-detail-meta">
                <span v-if="currentProject.orgNm">{{ currentProject.orgNm }}</span>
                <span
                  v-if="currentProject.orgNm"
                  class="marketing-detail-meta__dot"
                >
                  ·
                </span>
                <span>제작 내역</span>
                <span
                  v-if="allHistoryItems.length || hasActiveHistoryFilter"
                  class="marketing-detail-meta__count"
                >
                  총 {{ allHistoryItems.length }}건
                </span>
              </div>
            </div>

            <div class="marketing-detail-head__actions">
              <UiInput
                v-model="historySearchKeyword"
                type="search"
                size="sm"
                class="marketing-history-search"
                placeholder="내역 검색"
              />
              <UiButton
                variant="outline"
                size="md"
                @click="isFilePanelOpen = true"
              >
                <template #icon-left>
                  <i class="icon-folder-close size-16" />
                </template>
                참고 파일
                <span
                  v-if="projectFiles.length"
                  class="marketing-file-count"
                >
                  {{ projectFiles.length }}
                </span>
              </UiButton>
              <UiButton
                variant="primary"
                size="md"
                @click="handleStartNew"
              >
                <template #icon-left>
                  <i class="icon-plus size-16" />
                </template>
                새로 만들기
              </UiButton>
            </div>
          </div>
        </div>

        <div
          v-if="allHistoryItems.length || hasActiveHistoryFilter"
          class="marketing-history-filter-bar"
        >
          <div class="marketing-filter-chips">
            <button
              v-for="chip in MODE_FILTER_CHIPS"
              :key="chip.value || 'all-mode'"
              type="button"
              :class="['marketing-filter-chip', { 'is-active': historyModeFilter === chip.value }]"
              @click="historyModeFilter = chip.value"
            >
              {{ chip.label }}
            </button>
          </div>

          <UiSelect
            :model-value="historyContentTypeFilter"
            class="marketing-filter-select marketing-filter-select--type"
            :options="contentTypeSelectOptions"
            placeholder="콘텐츠 유형"
            size="sm"
            @update:model-value="onSelectHistoryContentType"
          />

          <UiSelect
            :model-value="historyPeriodFilter"
            class="marketing-filter-select"
            :options="periodSelectOptions"
            placeholder="전체 기간"
            size="sm"
            @update:model-value="onSelectHistoryPeriod"
          />
        </div>

        <UiEmpty
          v-if="!allHistoryItems.length && hasActiveHistoryFilter"
          icon="icon-search"
          title="검색 결과가 없습니다."
          description="검색어나 필터 조건을 변경해 보세요."
        />

        <UiEmpty
          v-else-if="!allHistoryItems.length"
          icon="icon-edit"
          title="제작 내역이 없습니다."
          description="새 콘텐츠를 만들어 보세요."
        >
          <UiButton
            variant="primary"
            size="md"
            @click="handleStartNew"
          >
            새로 만들기
          </UiButton>
        </UiEmpty>

        <div
          v-else
          class="marketing-history-list"
        >
          <button
            v-for="item in allHistoryItems"
            :key="item.contentId"
            type="button"
            class="marketing-history-row"
            :class="{ 'is-editing': isEditingHistory(item.contentId) }"
            @click="handleHistoryRowClick(item.contentId)"
          >
            <span
              class="marketing-history-row__mode-badge"
              :class="{
                'is-image': item.mode === 'IMAGE',
                'is-text': item.mode === 'TEXT',
                'is-both': item.mode === 'BOTH',
              }"
            >
              {{ resolveMarketingOutputModeLabel(item.mode) }}
            </span>
            <div class="marketing-history-row__copy">
              <UiInput
                v-if="isEditingHistory(item.contentId)"
                ref="historyTitleInputRef"
                v-model="editingTitle"
                class="marketing-history-row__title-input"
                placeholder="제작 내역 이름"
                @click.stop
                @keydown.enter.prevent="handleSaveHistoryTitle(item.contentId)"
                @keydown.esc.prevent="handleCancelHistoryTitle"
              />
              <strong
                v-else
                class="marketing-history-row__title"
              >
                {{ item.displayTitle }}
              </strong>
              <div
                v-if="item.metaBadges.length"
                class="marketing-history-row__meta-badges"
              >
                <span
                  v-for="(badge, badgeIndex) in item.metaBadges"
                  :key="`${item.contentId}-meta-${badgeIndex}`"
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
                :title="isEditingHistory(item.contentId) ? '수정 완료' : '이름 수정'"
                @click="handleToggleHistoryTitleEdit(item)"
              >
                <template #icon-left>
                  <i :class="isEditingHistory(item.contentId) ? 'icon-check size-16' : 'icon-edit size-16'" />
                </template>
              </UiButton>
              <UiButton
                variant="ghost"
                size="sm"
                icon-only
                title="내역 삭제"
                :disabled="!!editingContentId"
                @click="handleDeleteHistory(item.contentId)"
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
            @click="handleBackToList"
          >
            <i class="icon-arrow-right size-16 marketing-page-back__arrow" />
            제작 내역
          </button>
        </div>
        <section class="chat-marketing-authoring-card marketing-page-authoring-card">
          <div class="chat-marketing-authoring-card__content">
            <MarketingUnifiedWizard
              :config="config"
              :theme-color-hex="themeColorHex"
              :project-files="projectFiles"
              @close="handleBackToList"
              @submit="handleSubmit"
            />
          </div>
        </section>
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
            @click="handleBackToList"
          >
            <i class="icon-arrow-right size-16 marketing-page-back__arrow" />
            제작 내역
          </button>
        </div>
        <UiLoading
          v-if="isLoadingContent"
          text="제작 내역을 불러오는 중..."
        />
        <ChatMarketingResult
          v-else-if="hasDisplayResult && displayAuthoringResult"
          class="marketing-page-result-card"
          :result="displayAuthoringResult"
          :content-title="displayTitle"
          :request="displayRequest"
          :config="config"
          :is-loading="isSubmitting && !refiningType"
          :refining-type="refiningType"
          :refining-variant-id="refiningVariantId"
          :refine-completed-at="refineCompletedAt"
          :generating-step="generatingStep"
          :theme-color-hex="themeColorHex"
          :show-side-panel="true"
          :save-variant="handleSaveVariantText"
          @edit-with-agent="handleEditWithAgent"
        />
        <UiEmpty
          v-else
          icon="icon-edit"
          title="생성 결과가 없습니다."
          description="시안 생성에 실패했거나 결과가 저장되지 않았습니다."
        >
          <UiButton
            variant="primary"
            size="md"
            @click="handleStartNew"
          >
            다시 작성하기
          </UiButton>
        </UiEmpty>
      </div>
    </template>

    <MarketingFileSidePanel
      :is-open="isFilePanelOpen"
      :files="projectFiles"
      :is-uploading="isUploadingFiles"
      :on-rename-file="handleRenameProjectFile"
      @close="isFilePanelOpen = false"
      @upload="onUploadProjectFiles"
      @remove="handleRemoveProjectFile"
    />
  </div>
</template>

<script setup lang="ts">
import { enrichMarketingResultForDisplay } from '~/utils/marketing/marketingUtil'

definePageMeta({ layout: 'default' })

const {
  CONTENT_TYPE_FILTER_CHIPS,
  MODE_FILTER_CHIPS,
  HISTORY_PERIOD_OPTIONS,
  resolveMarketingOutputModeLabel,
  pagePhase,
  selectedAgent,
  config,
  themeColorHex,
  currentProject,
  projectFiles,
  historySearchKeyword,
  historyContentTypeFilter,
  historyModeFilter,
  historyPeriodFilter,
  allHistoryItems,
  hasActiveHistoryFilter,
  editingContentId,
  editingTitle,
  historyTitleInputRef,
  displayResult,
  displayTitle,
  displayRequest,
  isSubmitting,
  isLoadingContent,
  refiningType,
  refiningVariantId,
  refineCompletedAt,
  generatingStep,
  handleBootstrap,
  cleanupMarketingSession,
  handleBackToList,
  handleBackToProjects,
  handleUploadProjectFiles,
  handleRemoveProjectFile,
  handleRenameProjectFile,
  handleStartNew,
  handleDeleteHistory,
  handleSubmit,
  handleEditWithAgent,
  handleSaveVariantText,
  handleHistoryRowClick,
  isEditingHistory,
  handleToggleHistoryTitleEdit,
  handleSaveHistoryTitle,
  handleCancelHistoryTitle,
} = useMarketingStore()

const isFilePanelOpen = ref(false)
const isUploadingFiles = ref(false)

/** 콘텐츠 유형 필터 — 단일 선택 */
const contentTypeSelectOptions = computed(() =>
  CONTENT_TYPE_FILTER_CHIPS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
)

/** 기간 필터 — 단일 선택 */
const periodSelectOptions = computed(() =>
  HISTORY_PERIOD_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
)

const onSelectHistoryContentType = (value: string | number) => {
  historyContentTypeFilter.value = String(value)
}

const onSelectHistoryPeriod = (value: string | number) => {
  historyPeriodFilter.value = String(value) as typeof historyPeriodFilter.value
}

const hasDisplayResult = computed(() => {
  const result = displayResult.value
  if (!result) return false
  return isSubmitting.value || result.variants.length > 0 || result.images.length > 0
})

const displayAuthoringResult = computed(() => {
  if (!displayResult.value) return null
  return enrichMarketingResultForDisplay(displayResult.value, displayRequest.value)
})

const onUploadProjectFiles = async (files: File[]) => {
  if (!files.length) return
  isUploadingFiles.value = true
  try {
    await handleUploadProjectFiles(files)
  } finally {
    isUploadingFiles.value = false
  }
}

onMounted(() => void handleBootstrap())
onBeforeUnmount(cleanupMarketingSession)
</script>
