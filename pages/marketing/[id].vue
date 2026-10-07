<template>
  <div
    class="marketing-detail-page"
    :class="{ 'is-authoring': isAuthoringPhase || isCampaignPlanOpen }"
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
        <UiIcon
          name="arrow-right"
          size="16"
          class="marketing-back-btn__arrow"
        />
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
      <MarketingCampaignPlan
        v-if="isCampaignPlanOpen"
        :project-nm="currentProject?.projectNm ?? ''"
        :product-nm="campaignDraft?.productNm ?? ''"
        :goal="campaignGoal"
        :target-nm="campaignTarget"
        :due-date-label="dueDateLabel"
        :visibility-label="visibilityLabel"
        :key-message="campaignKeyMessage"
        :recommend-channels="campaignRecommendChannels"
        :request-txt="campaignDraft?.requestTxt ?? ''"
        :visual-txt="campaignDraft?.visualTxt ?? ''"
        :sections="campaignDraft?.sections"
        :start-in-result="campaignPlanStartInResult"
        @close="closeCampaignPlan"
        @generated="handleSaveCampaignDraft"
        @start-content="onStartContentFromPlan"
      />

      <MarketingCampaignCalendar
        v-else-if="isCalendarOpen"
        :selected-project-nm="currentProject?.projectNm ?? ''"
        @close="isCalendarOpen = false"
      />

      <!-- 채널 선택 → 멀티채널 생성 결과 → 채널별 콘텐츠 (프로젝트 기획서 기반) -->
      <MarketingChannelSelect v-else-if="pagePhase === 'channelSelect'" />
      <MarketingChannelResults v-else-if="pagePhase === 'channelResults'" />
      <MarketingChannelContentTabs v-else-if="pagePhase === 'channelContent'" />

      <!-- AI 검수 → 사용자 승인 → 예약 및 발행 (경로 공통) -->
      <MarketingReview v-else-if="pagePhase === 'review'" />
      <MarketingApproval
        v-else-if="pagePhase === 'approval'"
        @go-calendar="isCalendarOpen = true"
        @go-list="handleBackToList"
      />
      <MarketingSchedule
        v-else-if="pagePhase === 'schedule'"
        :key="currentContent?.contentId"
        :project-nm="currentProject?.projectNm ?? ''"
        @back-to-list="handleBackToList"
      />

      <!-- 제작 내역 목록 -->
      <div
        v-else-if="pagePhase === 'list'"
        class="marketing-page-body marketing-page-body--list"
      >
        <div class="marketing-detail-head">
          <button
            class="marketing-back-btn"
            type="button"
            @click="handleBackToProjects"
          >
            <UiIcon
              name="arrow-right"
              size="16"
              class="marketing-back-btn__arrow"
            />
            마케팅 프로젝트
          </button>

          <div
            v-if="currentProject"
            class="marketing-detail-head__row"
          >
            <div class="marketing-detail-info">
              <div class="marketing-detail-title">{{ currentProject.projectNm }}</div>
              <div class="marketing-detail-meta">
                <template
                  v-for="(item, index) in detailMetaItems"
                  :key="item"
                >
                  <span
                    v-if="index > 0"
                    class="marketing-detail-meta__dot"
                  >
                    ·
                  </span>
                  <span>{{ item }}</span>
                </template>
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
              <UiIcon
                name="file-text"
                size="24"
              />
            </div>
            <div class="marketing-campaign-brief__copy">
              <span class="marketing-campaign-brief__badge">프로젝트 기획서</span>
              <strong>{{ currentProject.projectNm }}</strong>
              <p v-if="campaignKeyMessage">핵심 메시지 {{ campaignKeyMessage }}</p>
            </div>
            <UiButton
              variant="outline"
              size="md"
              @click="onViewCampaignPlan"
            >
              {{ hasCampaignPlan ? '프로젝트 기획서 보기' : '프로젝트 기획서 생성' }}
            </UiButton>
          </div>
          <div class="marketing-campaign-brief__foot">
            <p class="marketing-campaign-brief__channels">
              <template v-if="campaignRecommendChannels">추천 채널 {{ campaignRecommendChannels }} · </template>
              콘텐츠 제작 계획 총 {{ displayedContentRows.length }}건
            </p>
            <p class="marketing-campaign-brief__notice">
              <UiIcon
                name="info"
                size="14"
              />
              모든 채널별 콘텐츠는 프로젝트 기획서를 기준으로 생성됩니다.
            </p>
          </div>
        </div>

        <div
          v-if="dueSoonHistoryItems.length"
          class="marketing-schedule-banner"
        >
          <div class="marketing-schedule-banner__head">
            <UiIcon
              name="calendar"
              size="16"
            />
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
                    :disabled="!hasCampaignPlan"
                    @click="onAddChannelContent"
                  >
                    <template #icon-left>
                      <UiIcon
                        name="plus"
                        size="16"
                      />
                    </template>
                    채널별 콘텐츠 생성
                  </UiButton>
                </div>
              </div>

              <div class="marketing-list-table-wrap">
                <UiTable
                  :columns="marketingContentListColumns"
                  :data="displayedContentRows"
                  clickable
                  empty-text="채널별 콘텐츠가 없습니다."
                  @row-click="onContentTableRowClick"
                >
                  <template #cell-channelNm="{ value }">
                    {{ formatMarketingCellText(value) }}
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
                    <span :class="['marketing-status-badge', `status-${row.progressKey}`]">
                      {{ row.progressLabel }}
                    </span>
                  </template>
                  <template #cell-scheduleLabel="{ value }">
                    {{ formatMarketingCellText(value) }}
                  </template>
                  <template #cell-actions="{ row }">
                    <div
                      class="marketing-list-row-actions"
                      @click.stop
                    >
                      <UiButton
                        v-if="renamingContentId === row.contentId"
                        variant="ghost"
                        size="sm"
                        icon-only
                        title="수정완료"
                        :disabled="isSavingRename"
                        @click="onSaveRename"
                      >
                        <template #icon-left>
                          <UiIcon
                            name="check"
                            size="16"
                          />
                        </template>
                      </UiButton>
                      <UiDropdownMenu
                        v-else
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
                              <UiIcon
                                name="ellipsis-vertical"
                                size="16"
                              />
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
            @select="handleHistoryRowClick"
            @open-full="isCalendarOpen = true"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  UiButton,
  UiDropdownMenu,
  UiEmpty,
  UiIcon,
  UiInput,
  UiTable,
  type DropdownMenuItemDef,
} from '@leechanyong/ispark-ui'
import {
  marketingContentListColumns,
  marketingProjectStatuses,
  type MarketingCalendarEvent,
  type MarketingCampaignPlanDraft,
} from '~/types/marketing'
import { formatMarketingCellText, formatMarketingDotDate } from '~/utils/marketing/marketingUtil'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const {
  pagePhase,
  selectedAgent,
  config,
  currentProject,
  currentContent,
  currentProjectMembers,
  allHistoryItems,
  dueSoonHistoryItems,
  handleSaveHistoryEdit,
  handleBootstrap,
  cleanupMarketingSession,
  handleBackToList,
  handleBackToProjects,
  handleDeleteHistory,
  handleHistoryRowClick,
  handleInitChannelPicks,
  handleSaveCampaignDraft,
  campaignDraft,
  pushMarketingPhase,
} = useMarketingStore()

const isCampaignPlanOpen = ref(false)
const campaignPlanStartInResult = ref(false)
const isCalendarOpen = ref(false)

const isAuthoringPhase = computed(() => pagePhase.value !== 'list')

type HistoryRow = (typeof allHistoryItems.value)[number]

const hasCampaignPlan = computed(() => !!campaignDraft.value)
const campaignGoal = computed(() => campaignDraft.value?.goal ?? '')
const campaignTarget = computed(() => campaignDraft.value?.targetNm ?? '')
const campaignRecommendChannels = computed(() => campaignDraft.value?.recommendChannels ?? '')

const displayedContentRows = computed(() => allHistoryItems.value as (HistoryRow & Record<string, unknown>)[])

const dueDateLabel = computed(() => formatMarketingDotDate(currentProject.value?.dueDt))

const visibilityLabel = computed(() => {
  const members = currentProjectMembers.value
  if (!members.length) return ''
  const ownerId = currentProject.value?.createUserId
  const owner = members.find((member) => member.userId === ownerId) ?? members[0]
  const others = members.filter((member) => member.userId !== owner.userId).length
  if (others > 0) return `${owner.userNm}님 외 ${others}명`
  return `${owner.userNm}님`
})

const campaignKeyMessage = computed(() => String(campaignDraft.value?.keyMessage ?? '').trim())

const detailMetaItems = computed(() => {
  const items: string[] = []
  if (hasCampaignPlan.value) {
    if (campaignGoal.value) items.push(`목표 ${campaignGoal.value}`)
    if (campaignTarget.value) items.push(`타깃 ${campaignTarget.value}`)
  }
  if (dueDateLabel.value) items.push(`종료일 ${dueDateLabel.value}`)
  if (visibilityLabel.value) items.push(`공개 대상 ${visibilityLabel.value}`)
  return items
})

const contentSummaryCards = computed(() => {
  const list = displayedContentRows.value
  return [
    { key: 'all', label: '전체', count: list.length },
    ...marketingProjectStatuses.map((item) => ({
      key: item.statusCd,
      label: item.statusNm,
      count: list.filter((row) => row.progressKey === item.statusCd).length,
    })),
  ]
})

const calendarItems = computed<MarketingCalendarEvent[]>(() =>
  displayedContentRows.value.filter((item) => item.publishScheduledDt),
)

const onViewCampaignPlan = () => {
  campaignPlanStartInResult.value = !!campaignDraft.value
  isCampaignPlanOpen.value = true
}

const closeCampaignPlan = () => {
  isCampaignPlanOpen.value = false
  campaignPlanStartInResult.value = false
}

const onStartContentFromPlan = (draft: MarketingCampaignPlanDraft) => {
  isCampaignPlanOpen.value = false
  campaignPlanStartInResult.value = false
  handleInitChannelPicks(draft)
  pushMarketingPhase('channelSelect')
}

/** 프로젝트 상세에서 채널별 콘텐츠 생성 — 기획서가 있을 때만 채널 선택으로 간다 */
const onAddChannelContent = () => {
  const draft = campaignDraft.value
  if (!draft) return
  handleInitChannelPicks(draft)
  pushMarketingPhase('channelSelect')
}

const contentMenuItems: DropdownMenuItemDef[] = [
  { label: '이름 변경', value: 'rename' },
  { label: '콘텐츠 삭제', value: 'delete', color: 'danger' },
]

const onContentTableRowClick = (row: HistoryRow) => {
  if (renamingContentId.value) return
  handleHistoryRowClick(row.contentId)
}

const onContentMenuSelect = (row: HistoryRow, value: string) => {
  if (value === 'rename') {
    startRename(row)
    return
  }
  if (value === 'delete') void handleDeleteHistory(row.contentId)
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

onMounted(async () => {
  await handleBootstrap()
  if (!currentProject.value) return
  if (String(route.query.startPlan ?? '') !== '1') return
  campaignPlanStartInResult.value = false
  isCampaignPlanOpen.value = true
  const query = { ...route.query }
  delete query.startPlan
  await router.replace({ path: route.path, query })
})
onBeforeUnmount(cleanupMarketingSession)
</script>
