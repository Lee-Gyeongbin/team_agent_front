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

          <div
            v-if="currentProject"
            class="marketing-detail-head__row"
          >
            <div class="marketing-detail-info">
              <div class="marketing-detail-title">{{ currentProject.projectNm }}</div>
              <div class="marketing-detail-meta">
                <span>목표 {{ dummyGoal }}</span>
                <span class="marketing-detail-meta__dot">·</span>
                <span>타깃 {{ dummyTarget }}</span>
                <span class="marketing-detail-meta__dot">·</span>
                <span>종료일 {{ dueDateLabel }}</span>
                <span class="marketing-detail-meta__dot">·</span>
                <span>공개 대상 {{ visibilityLabel }}</span>
              </div>
            </div>
            <span
              v-if="currentProject.statusNm"
              :class="['marketing-status-badge', `status-${currentProject.statusCd}`]"
            >
              {{ currentProject.statusNm }}
            </span>
          </div>
        </div>

        <div
          v-if="currentProject"
          class="marketing-campaign-brief"
        >
          <div class="marketing-campaign-brief__main">
            <div class="marketing-campaign-brief__thumb">
              <i class="icon-document size-24" />
            </div>
            <div class="marketing-campaign-brief__copy">
              <span class="marketing-campaign-brief__badge">캠페인 기획서</span>
              <strong>{{ currentProject.projectNm }}</strong>
              <p>핵심 메시지 {{ campaignKeyMessage }}</p>
            </div>
            <UiButton
              variant="outline"
              size="md"
              @click="onViewCampaignPlan"
            >
              캠페인 기획서 보기
            </UiButton>
          </div>
          <div class="marketing-campaign-brief__foot">
            <p class="marketing-campaign-brief__channels">
              추천 채널 {{ dummyRecommendChannels }} · 콘텐츠 제작 계획 총 {{ displayedContentRows.length }}건
            </p>
            <p class="marketing-campaign-brief__notice">
              <i class="icon-info size-14" />
              모든 채널별 콘텐츠는 이 캠페인 기획서를 기준으로만 생성됩니다.
            </p>
          </div>
        </div>

        <div
          v-if="dueSoonHistoryItems.length"
          class="marketing-schedule-banner"
        >
          <div class="marketing-schedule-banner__head">
            <i class="icon-calendar size-16" />
            오늘·지난 발행 예정 콘텐츠 {{ dueSoonHistoryItems.length }}건
          </div>
          <div class="marketing-schedule-banner__list">
            <button
              v-for="item in dueSoonHistoryItems"
              :key="`due-${item.contentId}`"
              type="button"
              class="marketing-schedule-banner__item"
              :class="{ 'is-overdue': item.scheduleStatus === 'overdue' }"
              :title="item.displayTitle"
              @click="handleHistoryRowClick(item.contentId)"
            >
              {{ item.displayTitle }} · {{ item.scheduleLabel }}
            </button>
          </div>
        </div>

        <div class="marketing-detail-layout">
          <div class="marketing-detail-main">
            <section class="marketing-content-status">
              <h2 class="marketing-content-status__title">소속 콘텐츠 진행 현황</h2>
              <div class="marketing-summary-row">
                <div
                  v-for="card in contentSummaryCards"
                  :key="card.key"
                  class="marketing-summary-card"
                >
                  <div class="marketing-summary-card__head">
                    <span>{{ card.label }}</span>
                  </div>
                  <strong class="marketing-summary-card__value">{{ card.count }}</strong>
                </div>
              </div>
            </section>

            <div class="marketing-channel-section">
              <div class="marketing-channel-section__head">
                <h2 class="marketing-channel-section__title">
                  채널별 콘텐츠
                  <span>({{ displayedContentRows.length }})</span>
                </h2>
                <div class="marketing-channel-section__actions">
                  <UiButton
                    variant="primary"
                    size="md"
                    @click="handleStartNew"
                  >
                    <template #icon-left>
                      <i class="icon-plus size-16" />
                    </template>
                    채널별 콘텐츠 생성
                  </UiButton>
                </div>
              </div>

              <div class="marketing-list-table-wrap">
                <UiTable
                  :columns="contentTableColumns"
                  :data="displayedContentRows"
                  clickable
                  empty-text="채널별 콘텐츠가 없습니다."
                  @row-click="onContentTableRowClick"
                >
                  <template #cell-channelNm="{ value }">
                    {{ formatCellText(value) }}
                  </template>
                  <template #cell-displayTitle="{ row }">
                    <div
                      v-if="renamingContentId === row.contentId"
                      class="marketing-content-rename"
                      @click.stop
                      @keydown.esc.stop.prevent="onCancelRename"
                    >
                      <UiInput
                        ref="renameInputRef"
                        v-model="renamingTitle"
                        size="sm"
                        placeholder="콘텐츠명"
                        :disabled="isSavingRename"
                        @enter="onSaveRename"
                      />
                    </div>
                    <strong
                      v-else
                      class="marketing-content-title"
                    >
                      {{ row.displayTitle }}
                    </strong>
                  </template>
                  <template #cell-progressLabel="{ row }">
                    <span :class="['marketing-status-badge', `progress-${row.progressKey}`]">
                      {{ row.progressLabel }}
                    </span>
                  </template>
                  <template #cell-scheduleLabel="{ value }">
                    {{ formatCellText(value) }}
                  </template>
                  <template #cell-actions="{ row }">
                    <div
                      v-if="renamingContentId !== row.contentId"
                      class="marketing-list-row-actions"
                      @click.stop
                    >
                      <UiDropdownMenu
                        :items="contentMenuItems"
                        align="end"
                        @select="(value) => onContentMenuSelect(row, value)"
                      >
                        <template #trigger>
                          <UiButton
                            variant="ghost"
                            size="sm"
                            icon-only
                            title="더보기"
                          >
                            <template #icon-left>
                              <i class="icon-more-vertical size-16" />
                            </template>
                          </UiButton>
                        </template>
                      </UiDropdownMenu>
                    </div>
                  </template>
                </UiTable>
              </div>
            </div>
          </div>

          <MarketingPublishCalendar
            :items="calendarItems"
            @select="onCalendarSelect"
          />
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
        <MarketingResult
          v-else-if="hasDisplayResult && displayAuthoringResult"
          class="marketing-page-result-card"
          :result="displayAuthoringResult"
          :content-id="currentContent?.contentId ?? ''"
          :content-title="displayTitle"
          :org-nm="currentProject?.orgNm ?? ''"
          :project-nm="currentProject?.projectNm ?? ''"
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
          :restore-variant="handleRestoreVariant"
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
import type { TableColumn } from '~/types/table'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import type { MarketingCalendarEvent } from '~/components/marketing/MarketingPublishCalendar.vue'

definePageMeta({ layout: 'default' })

const CONTENT_TABLE_COLUMNS: TableColumn[] = [
  { key: 'channelNm', label: '채널', width: '112px', align: 'left', headerAlign: 'left' },
  { key: 'displayTitle', label: '콘텐츠명', align: 'left', headerAlign: 'left' },
  { key: 'progressLabel', label: '진행 상태', width: '112px' },
  { key: 'scheduleLabel', label: '예약/발행 일정', width: '148px' },
  { key: 'createUserNm', label: '담당자', width: '100px' },
  { key: 'createDt', label: '최근 업데이트', width: '148px' },
  { key: 'actions', label: '', width: '56px' },
]

const CONTENT_SUMMARY_CARDS = [
  { key: 'all', label: '전체' },
  { key: 'in-progress', label: '진행 중' },
  { key: 'review', label: '검수 중' },
  { key: 'scheduled', label: '예약됨' },
  { key: 'done', label: '발행 완료' },
] as const

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const DUMMY_GOAL = '제품 출시'
const DUMMY_TARGET = '20-30대 여성'
const DUMMY_DUE_DT = '2025-08-31'
const DUMMY_VISIBILITY = '유지님 외 2명'
const DUMMY_KEY_MESSAGE = '땀·물에도 무너지지 않는 쿨링 선케어로 여름 야외 활동을 지키세요.'
const DUMMY_RECOMMEND_CHANNELS = 'Instagram · Facebook · Email'
const DUMMY_CHANNEL_NMS = ['인스타그램', '페이스북', '링크드인']
const DUMMY_OWNERS = ['김지현', '박민수', '이지현']

const {
  pagePhase,
  selectedAgent,
  config,
  themeColorHex,
  currentProject,
  currentProjectMembers,
  projectFiles,
  allHistoryItems,
  dueSoonHistoryItems,
  handleSaveHistoryEdit,
  currentContent,
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
  handleRestoreVariant,
  handleHistoryRowClick,
} = useMarketingStore()

const isFilePanelOpen = ref(false)
const isUploadingFiles = ref(false)
const contentTableColumns = CONTENT_TABLE_COLUMNS

type HistoryRow = (typeof allHistoryItems.value)[number]

const dummyGoal = DUMMY_GOAL
const dummyTarget = DUMMY_TARGET
const dummyRecommendChannels = DUMMY_RECOMMEND_CHANNELS

/** YYYY-MM-DD → YYYY.MM.DD. 값 없으면 '' */
const formatDotDate = (value: string) => {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return text
  return `${matched[1]}.${matched[2]}.${matched[3]}`
}

const formatCellText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || '-'
}

const toDummyDateTime = (dayOffset: number, hour: number) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, 0, 0, 0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hourText = String(date.getHours()).padStart(2, '0')
  return `${year}-${month}-${day} ${hourText}:00:00`
}

const formatDateTimeLabel = (raw: string) => {
  const matched = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!matched) return ''
  return `${matched[1]}.${matched[2]}.${matched[3]} ${matched[4]}:${matched[5]}`
}

type DisplayContentRow = HistoryRow & { isDummy: boolean }

const dummyContentRows = computed<DisplayContentRow[]>(() => {
  const firstDt = toDummyDateTime(2, 10)
  const secondDt = toDummyDateTime(5, 18)
  return [
    {
      contentId: 'dummy-1',
      mode: 'TEXT',
      displayTitle: '쿨링핏 선크림 인증 이벤트 피드',
      metaBadges: [],
      channelNm: '인스타그램',
      progressKey: 'review',
      progressLabel: '검수 중',
      createUserNm: '김지현',
      createDt: formatDateTimeLabel(toDummyDateTime(-1, 18)),
      publishScheduledDt: firstDt,
      publishedYn: 'N',
      scheduleStatus: 'upcoming',
      scheduleLabel: formatDateTimeLabel(firstDt),
      isDummy: true,
    },
    {
      contentId: 'dummy-2',
      mode: 'TEXT',
      displayTitle: '쿨링핏 선크림으로 물놀이 피부 고민 끝',
      metaBadges: [],
      channelNm: '페이스북',
      progressKey: 'scheduled',
      progressLabel: '예약됨',
      createUserNm: '박민수',
      createDt: formatDateTimeLabel(toDummyDateTime(-1, 11)),
      publishScheduledDt: secondDt,
      publishedYn: 'N',
      scheduleStatus: 'upcoming',
      scheduleLabel: formatDateTimeLabel(secondDt),
      isDummy: true,
    },
    {
      contentId: 'dummy-3',
      mode: 'TEXT',
      displayTitle: '새로운 기준의 선케어, 쿨링핏 런칭',
      metaBadges: [],
      channelNm: '링크드인',
      progressKey: 'in-progress',
      progressLabel: '진행 중',
      createUserNm: '이지현',
      createDt: formatDateTimeLabel(toDummyDateTime(-2, 9)),
      publishScheduledDt: '',
      publishedYn: 'N',
      scheduleStatus: 'none',
      scheduleLabel: '',
      isDummy: true,
    },
  ]
})

const fillDisplayProgress = (item: HistoryRow, index: number) => {
  if (item.progressKey === 'done' || item.progressKey === 'scheduled') {
    return { progressKey: item.progressKey, progressLabel: item.progressLabel }
  }
  if (index % 2 === 0) return { progressKey: 'in-progress', progressLabel: '진행 중' }
  return { progressKey: 'review', progressLabel: '검수 중' }
}

const displayedContentRows = computed<DisplayContentRow[]>(() => {
  const list = allHistoryItems.value
  if (!list.length) return dummyContentRows.value
  return list.map((item, index) => ({
    ...item,
    isDummy: false,
    channelNm: item.channelNm || DUMMY_CHANNEL_NMS[index % DUMMY_CHANNEL_NMS.length],
    createUserNm: item.createUserNm === '-' ? DUMMY_OWNERS[index % DUMMY_OWNERS.length] : item.createUserNm,
    ...fillDisplayProgress(item, index),
  }))
})

const dueDateLabel = computed(() => formatDotDate(currentProject.value?.dueDt ?? '') || formatDotDate(DUMMY_DUE_DT))

const visibilityLabel = computed(() => {
  const members = currentProjectMembers.value
  if (!members.length) return DUMMY_VISIBILITY
  const ownerId = currentProject.value?.createUserId
  const owner = members.find((member) => member.userId === ownerId) ?? members[0]
  const others = members.filter((member) => member.userId !== owner.userId).length
  if (others > 0) return `${owner.userNm}님 외 ${others}명`
  return `${owner.userNm}님`
})

const campaignKeyMessage = computed(
  () => String(currentProject.value?.projectOverview ?? '').trim() || DUMMY_KEY_MESSAGE,
)

const contentSummaryCards = computed(() => {
  const list = displayedContentRows.value
  return CONTENT_SUMMARY_CARDS.map((card) => ({
    ...card,
    count: card.key === 'all' ? list.length : list.filter((item) => item.progressKey === card.key).length,
  }))
})

const calendarItems = computed<MarketingCalendarEvent[]>(() =>
  displayedContentRows.value
    .filter((item) => item.publishScheduledDt)
    .map((item) => ({
      contentId: item.contentId,
      displayTitle: item.displayTitle,
      channelNm: item.channelNm,
      publishScheduledDt: item.publishScheduledDt,
      progressKey: item.progressKey,
    })),
)

const isDummyRow = (row: object) => (row as DisplayContentRow).isDummy === true

const onViewCampaignPlan = () => {
  openToast({ message: '캠페인 기획서는 아직 연결되지 않았습니다.', type: 'warning' })
}

const contentMenuItems: DropdownMenuItemDef[] = [
  { label: '이름 변경', value: 'rename' },
  { label: '콘텐츠 삭제', value: 'delete', color: 'danger' },
]

const onContentTableRowClick = (row: object) => {
  if (renamingContentId.value) return
  if (isDummyRow(row)) {
    openToast({ message: '더미 데이터입니다.', type: 'warning' })
    return
  }
  handleHistoryRowClick((row as DisplayContentRow).contentId)
}

const onCalendarSelect = (contentId: string) => {
  if (contentId.startsWith('dummy-')) {
    openToast({ message: '더미 데이터입니다.', type: 'warning' })
    return
  }
  handleHistoryRowClick(contentId)
}

const onContentMenuSelect = (row: object, value: string) => {
  if (isDummyRow(row)) {
    openToast({ message: '더미 데이터입니다.', type: 'warning' })
    return
  }
  const item = row as DisplayContentRow
  if (value === 'rename') {
    startRename(item)
    return
  }
  if (value === 'delete') void handleDeleteHistory(item.contentId)
}

// ── 콘텐츠 이름 변경 (행 안 인라인) ──────────────────────────────────
const renameInputRef = ref<{ $el?: HTMLElement } | null>(null)
const renamingContentId = ref('')
const renamingTitle = ref('')
const renamingOriginalTitle = ref('')
const isSavingRename = ref(false)

const focusRenameInput = async () => {
  await nextTick()
  const el = renameInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null
  el?.focus()
  el?.select()
}

const startRename = (item: { contentId: string; displayTitle: string }) => {
  renamingContentId.value = item.contentId
  renamingTitle.value = item.displayTitle
  renamingOriginalTitle.value = item.displayTitle
  void focusRenameInput()
}

const onCancelRename = () => {
  renamingContentId.value = ''
  renamingTitle.value = ''
  renamingOriginalTitle.value = ''
}

const onSaveRename = async () => {
  const title = renamingTitle.value.trim()
  if (!title) {
    openToast({ message: '콘텐츠 이름을 입력해 주세요.', type: 'warning' })
    await focusRenameInput()
    return
  }
  const contentId = renamingContentId.value
  if (!contentId || isSavingRename.value) return
  if (title === renamingOriginalTitle.value.trim()) {
    onCancelRename()
    return
  }
  isSavingRename.value = true
  try {
    const saved = await handleSaveHistoryEdit(contentId, {
      title,
      originalTitle: renamingOriginalTitle.value,
    })
    if (saved) onCancelRename()
  } finally {
    isSavingRename.value = false
  }
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
