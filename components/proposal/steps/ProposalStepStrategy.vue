<template>
  <div :class="['pt-panel', 'pt-panel--lg', 'pt-strategy', { 'is-fullscreen': isFullscreen }]">
    <div class="pt-strategy-head">
      <h3 class="pt-panel-title">전략검토</h3>
      <p class="pt-panel-desc">문제정의와 Win Theme를 확인하고 보완하세요.</p>
      <UiButton
        variant="outline"
        size="sm"
        @click="isPromptModalOpen = true"
      >
        <template #icon-left>
          <UiIcon
            name="pencil"
            size="14"
          />
        </template>
        프롬프트
      </UiButton>

      <!-- 탭별 액션 — 요구사항 스텝과 동일하게 배지 + ⋮ 메뉴 + 전체화면 (로딩 중에는 렌더하지 않음) -->
      <div
        v-if="!isLoadingStage2"
        class="pt-strategy-head-actions"
      >
        <UiBadge
          v-if="activeTab === 'pd'"
          :variant="summary?.problemDefinitionCount ? 'success' : 'default'"
          size="sm"
        >
          {{ summary?.problemDefinitionCount ? `완료 ${summary.problemDefinitionCount}건` : '대기' }}
        </UiBadge>
        <UiBadge
          v-else
          :variant="summary?.winThemeStaleCount ? 'warning' : summary?.winThemeCount ? 'success' : 'default'"
          size="sm"
        >
          {{
            summary?.winThemeStaleCount
              ? `보완필요 ${summary.winThemeStaleCount}건`
              : summary?.winThemeCount
                ? `완료 ${summary.winThemeCount}건`
                : '대기'
          }}
        </UiBadge>

        <UiDropdownMenu
          :items="strategyMenuItems"
          @select="onStrategyMenuSelect"
        >
          <template #trigger>
            <UiButton
              variant="outline"
              size="sm"
              icon-only
              title="생성 작업 더보기"
              aria-label="생성 작업 더보기"
            >
              <template #icon-left>
                <UiIcon
                  name="ellipsis-vertical"
                  size="18"
                />
              </template>
            </UiButton>
          </template>
        </UiDropdownMenu>

        <UiButton
          variant="ghost"
          size="sm"
          icon-only
          :title="isFullscreen ? '전체화면 해제 (Esc)' : '전체화면으로 보기'"
          :aria-label="isFullscreen ? '전체화면 해제' : '전체화면으로 보기'"
          @click="toggleFullscreen"
        >
          <template #icon-left>
            <UiIcon
              :name="isFullscreen ? 'minimize-2' : 'maximize-2'"
              size="16"
            />
          </template>
        </UiButton>
      </div>
    </div>

    <!-- 최초 진입 로딩 -->
    <div
      v-if="isLoadingStage2"
      class="pt-s4-loading"
    >
      <div class="pt-s4-loading-box">
        <div class="pt-s4-loading-spinner" />
        <h3>전략 분석 중입니다</h3>
        <p>RFP 분석 결과를 바탕으로 문제정의와 Win Theme을 생성하고 있어요. 잠시만 기다려주세요.</p>
        <div class="pt-s4-loading-steps">
          <div
            v-for="(s, i) in loadingSteps"
            :key="s.key"
            class="pt-s4l-step"
            :class="{ done: i < loadingStepIdx, active: i === loadingStepIdx }"
          >
            <span class="pt-s4l-dot">{{ i < loadingStepIdx ? '✓' : '' }}</span>
            <div>
              <b>{{ s.title }}</b>
              <small>{{ i < loadingStepIdx ? s.doneMsg : i === loadingStepIdx ? s.activeMsg : s.waitMsg }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="pt-s4-wrap"
    >
      <div
        class="pt-s4-content"
        :class="{ 'pt-s4-content--pd-fill': activeTab === 'pd' }"
      >
        <div class="pt-strategy-chrome">
          <UiTab
            v-model="activeTab"
            class="pt-strategy-tabs"
            :tabs="strategyTabs"
            align="left"
          />
        </div>

        <!-- 문제정의 -->
        <div
          v-show="activeTab === 'pd'"
          class="pt-s4-tab pt-s4-tab--fill"
        >
          <div :class="['pt-pd-wrap', { 'is-chat-collapsed': !isPdChatOpen }]">
            <div class="pt-pd-list">
              <!-- 목록이 길어지면 '어디까지 봤더라'가 되므로 진행 상황을 상단에 고정 -->
              <div class="pt-pd-list-summary">문제정의 {{ problemDefs.length }}건 · 검토 {{ pdReviewedCount }}건</div>
              <template
                v-for="group in pdGroups"
                :key="group.code"
              >
                <div class="pt-pd-cat">
                  <span class="pt-pd-cat-label">{{ group.label }}</span>
                  <span class="pt-pd-cat-count">{{ group.items.length }}</span>
                </div>
                <!-- 목록 제목은 문장 단위로 잘리므로 hover 시 전문을 보여준다 -->
                <UiTooltip
                  v-for="pd in group.items"
                  :key="pd.problemId"
                  side="right"
                  align="start"
                  :side-offset="8"
                  content-class="pt-pd-tip"
                >
                  <div
                    class="pt-pd-item"
                    :class="[`state-${pdReviewState(pd)}`, { active: pd.problemId === activeProblemId }]"
                    @click="onSelectPd(pd.problemId)"
                  >
                    <span><span class="dot" /> {{ pdTitle(pd) }}</span>
                  </div>
                  <template #content>
                    <span class="pt-pd-tip-state">
                      {{ pdReviewState(pd) === 'ai' ? 'AI 생성 원본 · 미검토' : '검토·수정함' }}
                    </span>
                    <p class="pt-pd-tip-text">{{ pd.currentProblem || '(내용 없음)' }}</p>
                    <p
                      v-if="pd.goal"
                      class="pt-pd-tip-goal"
                    >
                      목표 · {{ pd.goal }}
                    </p>
                  </template>
                </UiTooltip>
              </template>
              <div class="pt-pd-list-foot">
                <UiButton
                  variant="primary-line"
                  size="sm"
                  full-width
                  class="pt-pd-list-add"
                  @click="onAddPd"
                >
                  <template #icon-left>
                    <UiIcon
                      name="plus"
                      size="14"
                    />
                  </template>
                  새 문제정의 추가
                </UiButton>
              </div>
            </div>

            <div
              v-if="activePd"
              class="pt-pd-detail"
            >
              <!-- 좌측에서 무엇을 골랐는지 되비쳐 목록과 상세를 잇는다 -->
              <div class="pt-pd-detail-head">
                <div class="pt-pd-detail-head-main">
                  <UiBadge
                    variant="info"
                    size="sm"
                  >
                    {{ activePdCategory }}
                  </UiBadge>
                  <h4 class="pt-pd-detail-title">{{ pdDetailTitle(activePd) }}</h4>
                </div>
                <div
                  class="pt-pd-section-toggle"
                  role="tablist"
                  aria-label="진단·대응 구간 이동"
                >
                  <button
                    type="button"
                    role="tab"
                    :aria-selected="activePdSection === 'diagnosis'"
                    :class="[
                      'pt-pd-section-toggle-btn',
                      'is-diagnosis',
                      { 'is-active': activePdSection === 'diagnosis' },
                    ]"
                    @click="onScrollToPdGroup('diagnosis')"
                  >
                    진단
                  </button>
                  <button
                    type="button"
                    role="tab"
                    :aria-selected="activePdSection === 'response'"
                    :class="[
                      'pt-pd-section-toggle-btn',
                      'is-response',
                      { 'is-active': activePdSection === 'response' },
                    ]"
                    @click="onScrollToPdGroup('response')"
                  >
                    대응
                  </button>
                </div>
              </div>
              <section
                v-for="g in pdFieldGroups"
                :id="`pt-pd-group-${g.variant}`"
                :key="g.title"
                class="pt-pd-group"
              >
                <div
                  class="pt-pd-group-head"
                  :class="`is-${g.variant}`"
                >
                  <span class="pt-pd-group-label">
                    <span
                      class="pt-pd-group-bar"
                      aria-hidden="true"
                    />
                    <span class="pt-pd-group-title">{{ g.title }}</span>
                  </span>
                </div>
                <template
                  v-for="f in g.fields"
                  :key="f.key"
                >
                  <div class="pt-pd-field">
                    <label>{{ f.label }}</label>
                    <!-- rows=2 고정이면 3~5줄짜리 본문이 박스마다 스크롤에 갇혀 검토가 안 된다 -->
                    <UiTextarea
                      v-model="editPd[f.key]"
                      class="pt-pd-textarea"
                      :rows="2"
                      :max-rows="14"
                      auto-resize
                    />
                  </div>
                  <!-- 근거는 '현재 문제' 주장의 출처라 바로 뒤에 둔다 (맨 아래면 검증 동선이 끊김) -->
                  <div
                    v-if="g.hasEvidence && f.key === 'currentProblem'"
                    class="pt-pd-field"
                  >
                    <label>근거</label>
                    <UiButton
                      v-if="hasPdEvidence"
                      variant="primary-line"
                      size="xs"
                      @click="onOpenEvidenceModal"
                    >
                      상세 보기
                    </UiButton>
                    <span
                      v-else
                      class="pt-muted"
                      >근거 없음 (수동 작성)</span
                    >
                  </div>
                </template>
              </section>
              <div class="pt-pd-actions">
                <UiButton
                  variant="primary"
                  size="sm"
                  :loading="isSavingPd"
                  :disabled="!isPdDirty"
                  @click="onSavePd"
                >
                  {{ isPdDirty ? '변경사항 저장' : '저장됨' }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :loading="isRefining"
                  @click="onRefinePd('이 문제정의의 표현을 더 구체적이고 제안서에 맞게 다듬어줘', true)"
                >
                  ↻ 이 문제정의만 재생성
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="pt-pd-actions-del"
                  @click="onDeletePd(activePd.problemId)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="trash-2"
                      size="14"
                    />
                  </template>
                  삭제
                </UiButton>
              </div>
            </div>
            <div
              v-else
              class="pt-pd-detail"
            >
              <p class="pt-muted">문제정의가 없습니다. 새 문제정의를 추가하세요.</p>
            </div>

            <div
              v-if="activePd"
              class="pt-pd-chat"
            >
              <div class="pt-pd-chat-head">
                <h3 v-show="isPdChatOpen">"{{ pdTitle(activePd) }}" 보완요청</h3>
                <UiButton
                  variant="ghost"
                  size="xs"
                  icon-only
                  :title="isPdChatOpen ? '보완요청 접기' : '보완요청 펼치기'"
                  :aria-label="isPdChatOpen ? '보완요청 접기' : '보완요청 펼치기'"
                  :aria-expanded="isPdChatOpen"
                  @click="isPdChatOpen = !isPdChatOpen"
                >
                  <template #icon-left>
                    <UiIcon
                      :name="isPdChatOpen ? 'chevron-right' : 'chevron-left'"
                      size="16"
                    />
                  </template>
                </UiButton>
              </div>
              <div
                v-show="isPdChatOpen"
                class="pt-pd-chat-hint"
              >
                예) 방치 시 위험을 더 구체적인 수치로 표현해줘<br />
                예) 목표에 클라우드 전환 일정도 함께 언급해줘
              </div>
              <div
                v-show="isPdChatOpen"
                class="pt-pd-chat-input"
              >
                <!-- 보완 요청은 두세 줄이 되기 쉬워 textarea로. Enter 전송 / Shift+Enter 줄바꿈 -->
                <UiTextarea
                  v-model="refineFeedback"
                  class="pt-pd-chat-textarea"
                  placeholder="보완 요청을 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
                  :disabled="isRefining"
                  :rows="1"
                  :max-rows="6"
                  auto-resize
                  border
                  @keydown.enter.exact.prevent="onRefinePd(refineFeedback)"
                />
                <UiButton
                  variant="primary"
                  size="sm"
                  class="pt-pd-chat-send"
                  :loading="isRefining"
                  :disabled="!refineFeedback.trim()"
                  @click="onRefinePd(refineFeedback)"
                >
                  전송
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Win Theme -->
        <div v-show="activeTab === 'wt'">
          <div class="pt-wt-grid">
            <div
              v-for="wt in winThemes"
              :key="wt.winThemeId"
              class="pt-wt-card"
              :class="{ stale: wt.stale }"
            >
              <!-- 상단 행 — 겨냥 문제 / stale 배지 / 액션. 현황·이슈 카드와 같은 배치 -->
              <div class="pt-wt-top">
                <button
                  type="button"
                  class="pt-wt-target"
                  :title="(wt.sourceProblemDefinitionIds || []).join(', ')"
                  @click="focusPd(wt.sourceProblemDefinitionIds?.[0])"
                >
                  겨냥 문제 · {{ targetPdTitle(wt) }}
                </button>
                <UiBadge
                  v-if="wt.stale"
                  variant="warning"
                  size="sm"
                >
                  {{ staleBadgeText(wt) }}
                </UiBadge>
                <UiButton
                  variant="ghost"
                  size="xs"
                  icon-only
                  class="pt-btn-del pt-wt-del"
                  title="삭제"
                  :aria-label="`${targetPdTitle(wt)} Win Theme 삭제`"
                  @click="onDeleteWt(wt.winThemeId)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="trash-2"
                      size="14"
                    />
                  </template>
                </UiButton>
              </div>
              <UiTextarea
                class="pt-wt-core-input"
                :model-value="wtFieldValue(wt, 'coreMessage')"
                :rows="2"
                :max-rows="6"
                auto-resize
                border
                placeholder="핵심 메시지를 입력하세요"
                @update:model-value="onWtFieldChange(wt, 'coreMessage', $event)"
              />
              <div class="pt-wt-row">
                <label>제안 전략</label>
                <UiTextarea
                  class="pt-wt-field"
                  :model-value="wtFieldValue(wt, 'proposalStrategy')"
                  :rows="2"
                  :max-rows="10"
                  auto-resize
                  border
                  placeholder="제안 전략을 입력하세요"
                  @update:model-value="onWtFieldChange(wt, 'proposalStrategy', $event)"
                />
              </div>
              <div class="pt-wt-row">
                <label>근거</label>
                <UiTextarea
                  :class="['pt-wt-field', { 'is-missing': isEvidenceMissing(wt.evidence) }]"
                  :model-value="wtFieldValue(wt, 'evidence')"
                  :rows="2"
                  :max-rows="10"
                  auto-resize
                  border
                  placeholder="근거를 입력하세요"
                  @update:model-value="onWtFieldChange(wt, 'evidence', $event)"
                />
              </div>
              <div class="pt-wt-row">
                <label>기대효과</label>
                <UiTextarea
                  class="pt-wt-field"
                  :model-value="wtFieldValue(wt, 'expectedEffect')"
                  :rows="2"
                  :max-rows="10"
                  auto-resize
                  border
                  placeholder="기대효과를 입력하세요"
                  @update:model-value="onWtFieldChange(wt, 'expectedEffect', $event)"
                />
              </div>
              <div class="pt-wt-foot">
                <UiButton
                  variant="primary-line"
                  size="sm"
                  @click="onSaveWt(wt)"
                >
                  저장
                </UiButton>
              </div>
            </div>
          </div>
          <p class="pt-hint">
            각 카드는 겨냥한 문제정의를 근거로 참조합니다. 근거 문제정의가 수정되면 해당 카드에만 stale 배지가
            표시됩니다.
          </p>
        </div>
      </div>

      <div class="pt-panel-actions pt-strategy-actions">
        <UiButton
          variant="primary"
          size="md"
          :disabled="!['005', '003'].includes(summary?.stage2StatusCd ?? '')"
          @click="emit('next')"
        >
          이 전략 확정 · 다음 진행
          <template #icon-right>
            <i class="icon-arrow-right size-14" />
          </template>
        </UiButton>
      </div>
    </div>
  </div>

  <ProposalPromptModal
    :is-open="isPromptModalOpen"
    :stage-cds="['S2A_PROBLEM_TOC', 'S2B_WINTHEME']"
    @close="isPromptModalOpen = false"
  />

  <ProposalPdEvidenceModal
    :is-open="isEvidenceModalOpen"
    :pt-project-id="ptProjectId"
    :issue-ids="activePd?.sourceIssueIds ?? []"
    :requirement-ids="activePd?.sourceRequirementIds ?? []"
    @close="isEvidenceModalOpen = false"
  />
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiBadge, UiTab, UiTextarea, UiTooltip } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { openLoading, closeLoading } from '~/composables/useLoading'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { Stage2Summary, ProblemDefinition, WinTheme } from '~/types/proposal'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
}>()

const emit = defineEmits<{
  next: []
  'go-requirements': [payload: { tab: 'toc' | 'req' | 'ec' | 'issue'; id?: string }]
}>()

const {
  fetchSelectStage2Summary,
  fetchSelectStage2ProblemDefinitions,
  fetchSelectStage2WinThemes,
  fetchResetStage2Status,
  streamAnalyzeStage2,
  fetchUpdateStage2ProblemDefinition,
  fetchInsertStage2ProblemDefinition,
  fetchDeleteStage2ProblemDefinition,
  fetchRefineStage2ProblemDefinition,
  fetchUpdateStage2WinTheme,
  fetchInsertStage2WinTheme,
  fetchDeleteStage2WinTheme,
  fetchRegenerateStage2ProblemDefinitions,
  fetchRegenerateStage2WinThemes,
} = useProposalApi()

const PROBLEM_TYPE_MAP: Record<string, string> = {
  '001': '기술적',
  '002': '업무적',
  '003': '조직적',
  '004': '운영적',
  '005': '보안품질',
}

const loadingSteps = [
  {
    key: 'pd',
    title: '문제정의 분석',
    doneMsg: '발주기관 핵심 문제 도출 완료',
    activeMsg: '문제 정의 생성 중…',
    waitMsg: '대기 중',
  },
  {
    key: 'wt',
    title: 'Win Theme 도출',
    doneMsg: 'Win Theme 도출 완료',
    activeMsg: '자사·경쟁사 자료 분석 중…',
    waitMsg: '대기 중',
  },
]

const summary = ref<Stage2Summary | null>(null)
const problemDefs = ref<ProblemDefinition[]>([])
const winThemes = ref<WinTheme[]>([])

const activeTab = ref('pd')
const strategyTabs = computed(() => [
  { label: '문제정의', value: 'pd', count: problemDefs.value.length },
  { label: 'Win Theme', value: 'wt', count: winThemes.value.length },
])
const isPromptModalOpen = ref(false)
const isEvidenceModalOpen = ref(false)
const activeProblemId = ref<string | null>(null)
const isLoadingStage2 = ref(false)
const loadingStepIdx = ref(0)
const isRegeneratingAll = ref(false)
const isRegeneratingAllPd = ref(false)
const isSavingPd = ref(false)
const isRefining = ref(false)
const refineFeedback = ref('')
/** 보완요청 패널 접기 — 좁은 컬럼이라 문제정의 본문을 넓게 보고 싶을 때 접는다 */
const isPdChatOpen = ref(true)
const regeneratingWtId = ref<string | null>(null)

// ===== 헤더 액션 =====
/** 탭에 따라 달라지는 생성 작업 메뉴 — 버튼을 늘어놓지 않고 ⋮ 하나로 모은다 */
const strategyMenuItems = computed<DropdownMenuItemDef[]>(() =>
  activeTab.value === 'pd'
    ? [
        { value: 'regenPd', label: '문제정의 재생성', icon: 'icon-refresh', disabled: isRegeneratingAllPd.value },
        { value: 'regenAll', label: '전체 재생성', icon: 'icon-refresh', disabled: isRegeneratingAll.value },
      ]
    : [
        {
          value: 'regenWt',
          label: 'Win Theme 재생성',
          icon: 'icon-refresh',
          disabled: regeneratingWtId.value === 'all',
        },
        { value: 'addWt', label: 'Win Theme 수동 추가', icon: 'icon-plus' },
        { value: 'regenAll', label: '전체 재생성', icon: 'icon-refresh', disabled: isRegeneratingAll.value },
      ],
)

const onStrategyMenuSelect = (value: string) => {
  if (value === 'regenPd') onRegenerateAllPd()
  else if (value === 'regenWt') onRegenerateWt()
  else if (value === 'addWt') onAddWt()
  else if (value === 'regenAll') onRegenerateAll()
}

/**
 * 패널을 뷰포트로 확대 — 사이드바·페이지 헤드·스텝퍼가 쓰던 공간을 회수한다.
 * 앱 헤더($z-header: 450)는 그대로 두고 그 아래부터 채운다.
 * 헤더까지 덮으려면 z-index가 모달(451)보다 커져야 하고, 그러면 이 패널에서 연 모달이 뒤로 숨는다.
 */
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const onFullscreenEsc = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !isFullscreen.value) return
  isFullscreen.value = false
}

onMounted(() => window.addEventListener('keydown', onFullscreenEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onFullscreenEsc))
const wtDraft = ref<Record<string, Partial<WinTheme>>>({})

const editPd = reactive({
  currentProblem: '',
  rootCause: '',
  riskIfIgnored: '',
  goal: '',
  requiredCapability: '',
  strategySummary: '',
  kpi: '',
})

/**
 * 현재 문제 → 원인 → 위험 → 목표 → 역량 → 전략 → KPI 는 하나의 논리 사슬이다.
 * 평평하게 7개를 나열하면 검토자가 '원인이 문제와 맞는가'를 볼 수 없어 구간으로 묶는다.
 */
const pdFieldGroups = [
  {
    variant: 'diagnosis' as const,
    // 검토자가 '이게 사실인가'를 판단하는 구간 — 근거를 주장 바로 뒤에 붙인다
    title: '진단',
    fields: [
      { key: 'currentProblem' as const, label: '현재 문제' },
      { key: 'rootCause' as const, label: '원인' },
      { key: 'riskIfIgnored' as const, label: '방치 시 위험' },
    ],
    hasEvidence: true,
  },
  {
    variant: 'response' as const,
    // '말이 되는가'를 판단하는 구간. 목표·역량·전략·KPI는 모두 '무엇을 할 것인가'라 한 덩어리
    title: '대응',
    fields: [
      { key: 'goal' as const, label: '목표' },
      { key: 'requiredCapability' as const, label: '필요 역량' },
      { key: 'strategySummary' as const, label: '전략 요약' },
      { key: 'kpi' as const, label: 'KPI' },
    ],
    hasEvidence: false,
  },
] as const

type PdGroupVariant = (typeof pdFieldGroups)[number]['variant']

/** 상세 패널 진단·대응 토글 활성 상태 */
const activePdSection = ref<PdGroupVariant>('diagnosis')

/** 상세 패널 내 진단·대응 구간으로 스크롤 — scrollIntoView는 바깥 레이아웃까지 움직일 수 있어 컨테이너 기준으로 계산 */
const onScrollToPdGroup = async (variant: PdGroupVariant) => {
  activePdSection.value = variant
  await nextTick()
  const el = document.getElementById(`pt-pd-group-${variant}`)
  const container = el?.closest<HTMLElement>('.pt-pd-detail')
  if (!el || !container) return
  const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top
  container.scrollTo({ top: container.scrollTop + offset - 8, behavior: 'smooth' })
}

const PD_EDIT_KEYS = pdFieldGroups.flatMap((g) => g.fields.map((f) => f.key))

const activePd = computed(() => problemDefs.value.find((p) => p.problemId === activeProblemId.value) ?? null)

/** 근거(이슈·요구사항) 연결 여부 */
const hasPdEvidence = computed(() => {
  const pd = activePd.value
  if (!pd) return false
  return pd.sourceIssueIds.length > 0 || pd.sourceRequirementIds.length > 0
})

const onOpenEvidenceModal = () => {
  isEvidenceModalOpen.value = true
}

/** 저장되지 않은 편집이 있는지 — 항목 전환·재생성 전에 확인하기 위함 */
const isPdDirty = computed(() => {
  const pd = activePd.value
  if (!pd) return false
  return PD_EDIT_KEYS.some((k) => (editPd[k] || '') !== (pd[k] || ''))
})

/**
 * 목록에서 다른 문제정의로 이동.
 * watch(activePd)가 editPd를 조건 없이 덮어쓰므로, 가드 없이 전환하면 편집이 조용히 사라진다.
 */
const onSelectPd = async (problemId: string) => {
  if (problemId === activeProblemId.value) return
  if (isPdDirty.value) {
    const confirmed = await openConfirm({
      title: '저장하지 않은 변경사항',
      message: '변경사항이 저장되지 않았습니다. 저장하지 않고 이동하시겠습니까?',
    })
    if (!confirmed) return
  }
  activeProblemId.value = problemId
}

/** 상세 헤더에 노출할 분류명 — 좌측 목록 그룹 라벨과 같은 형식(코드 없이 라벨만) */
const activePdCategory = computed(() => {
  const code = activePd.value?.problemTypeCd || '001'
  return PROBLEM_TYPE_MAP[code] || '기타'
})

const pdGroups = computed(() => {
  const order = ['001', '002', '003', '004', '005', '999']
  const map = new Map<string, ProblemDefinition[]>()
  for (const pd of problemDefs.value) {
    const code = pd.problemTypeCd || '001'
    if (!map.has(code)) map.set(code, [])
    map.get(code)!.push(pd)
  }
  return order
    .filter((c) => map.has(c))
    .map((c) => ({ code: c, label: PROBLEM_TYPE_MAP[c] || '기타', items: map.get(c)! }))
})

// tocMappingBlocks — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// const tocMappingBlocks = computed(() => { ... })

/** 제목용 첫 문장. 목록은 길이 제한, 상세 헤더는 자르지 않는다. */
const pdHeading = (pd: ProblemDefinition) => {
  const t = (pd.currentProblem || '').trim()
  if (!t) return '(제목 없음)'
  return t.split(/[.。]\s*/)[0]
}

/**
 * 목록 제목 — LLM이 생성한 title이 있으면 우선 사용, 없으면 currentProblem 첫 문장으로 폴백.
 * title은 15~20자 내외로 생성되므로 별도 말줄임 없이 그대로 노출한다.
 */
const pdTitle = (pd: ProblemDefinition) => {
  if (pd.problemTitleTxt) return pd.problemTitleTxt
  const head = pdHeading(pd)
  if (head === '(제목 없음)') return head
  const clause = head.length > 45 ? head.split(/,\s*/)[0] : head
  return clause.length > 45 ? clause.slice(0, 45) + '…' : clause
}

/** 상세 헤더 — title이 있으면 요약, 없으면 currentProblem 첫 문장 전체 */
const pdDetailTitle = (pd: ProblemDefinition) => pd.problemTitleTxt || pdHeading(pd)

/** 검토 상태 — 서버 필드로 도출(별도 컬럼 없이). manualYn=직접추가 / modifyDt=사람이 손댐 */
type PdReviewState = 'manual' | 'edited' | 'ai'
const pdReviewState = (pd: ProblemDefinition): PdReviewState => {
  if (pd.manualYn === 'Y') return 'manual'
  return pd.modifyDt ? 'edited' : 'ai'
}
const pdReviewedCount = computed(() => problemDefs.value.filter((pd) => pdReviewState(pd) !== 'ai').length)
const isEvidenceMissing = (ev: string) => !ev || ev.includes('[증빙자료 필요]')
// reqLabel — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// const reqLabel = (id: string) => reqLabelMap.value[id] || id
const staleBadgeText = (wt: WinTheme) => {
  const reason = wt.staleDetails?.[0]?.reason
  if (reason === 'DELETED') return '근거 문제정의가 삭제됨'
  return '근거 문제정의 수정됨 · 재생성 권장'
}
const targetPdTitle = (wt: WinTheme) => {
  const id = wt.sourceProblemDefinitionIds?.[0]
  const pd = problemDefs.value.find((p) => p.problemId === id)
  return pd ? pdTitle(pd) : '선택 필요'
}
watch(activePd, (pd) => {
  if (!pd) return
  activePdSection.value = 'diagnosis'
  editPd.currentProblem = pd.currentProblem || ''
  editPd.rootCause = pd.rootCause || ''
  editPd.riskIfIgnored = pd.riskIfIgnored || ''
  editPd.goal = pd.goal || ''
  editPd.requiredCapability = pd.requiredCapability || ''
  editPd.strategySummary = pd.strategySummary || ''
  editPd.kpi = pd.kpi || ''
})

const loadAll = async () => {
  const [s, pds, wts] = await Promise.all([
    fetchSelectStage2Summary(props.ptProjectId),
    fetchSelectStage2ProblemDefinitions(props.ptProjectId),
    fetchSelectStage2WinThemes(props.ptProjectId),
    // fetchSelectStage2TocMapping(props.ptProjectId),  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
    // fetchSelectStage1Result(props.ptProjectId),       // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
  ])
  if (s.result === 'OK') summary.value = s.data
  if (pds.result === 'OK') {
    problemDefs.value = pds.data || []
    if (!activeProblemId.value && problemDefs.value.length) {
      activeProblemId.value = problemDefs.value[0].problemId
    }
  }
  if (wts.result === 'OK') winThemes.value = wts.data || []
}

const pollSummaryUntilDone = () =>
  new Promise<void>((resolve) => {
    const tick = async () => {
      try {
        const res = await fetchSelectStage2Summary(props.ptProjectId)
        if (res.result === 'OK' && res.data) {
          summary.value = res.data
          const cd = res.data.stage2StatusCd
          if (cd === '002') loadingStepIdx.value = Math.max(loadingStepIdx.value, 1)
          if (cd === '005' || cd === '003' || cd === '004') {
            loadingStepIdx.value = 2
            resolve()
            return
          }
        }
      } catch {
        /* ignore */
      }
      setTimeout(tick, 2000)
    }
    tick()
  })

const startStage2 = async (force = false) => {
  isLoadingStage2.value = true
  loadingStepIdx.value = 0
  if (force) {
    await fetchResetStage2Status(props.ptProjectId)
  }
  await new Promise<void>((resolve) => {
    streamAnalyzeStage2(props.ptProjectId, props.modelId, props.agentId, {
      onProgress: (data) => {
        if (data.step === 'problem_def' || data.step === 'prompt' || data.step === 'parse') loadingStepIdx.value = 0
        if (data.step === 'win_theme' || data.step === 'save') loadingStepIdx.value = 1
      },
      onDone: async () => {
        loadingStepIdx.value = 3
        resolve()
      },
      onError: async (msg) => {
        openToast({ message: msg || '전략 분석 실패', type: 'error' })
        await pollSummaryUntilDone()
        resolve()
      },
    })
  })
  await loadAll()
  isLoadingStage2.value = false
}

onMounted(async () => {
  try {
    // 1) 항상 summary/DB 건수부터 조회 — 상태코드만 보지 않고 실제 적재 여부 확인
    const res = await fetchSelectStage2Summary(props.ptProjectId)
    if (res.result === 'OK' && res.data) {
      summary.value = res.data
      const pdCnt = res.data.problemDefinitionCount ?? 0
      const wtCnt = res.data.winThemeCount ?? 0
      const status = res.data.stage2StatusCd

      // 문제정의·Win Theme가 이미 있으면 LLM 스킵하고 조회만
      if (status === '005' || status === '003' || (pdCnt > 0 && wtCnt > 0)) {
        await loadAll()
        return
      }

      // 002: 문제정의만 저장된 미완료 → S2C/S2B 재개
      // 001/004 + 데이터 없음 → 최초 실행
      if (status === '002' || (pdCnt === 0 && wtCnt === 0)) {
        await startStage2(false)
        return
      }

      // PD만 있는 등 애매한 상태 → 조회만 (자동 LLM 금지)
      await loadAll()
      return
    }
    await startStage2(false)
  } catch {
    await startStage2(false)
  }
})

const onRegenerateAll = async () => {
  const ok = await openConfirm({
    title: '전체 재생성',
    message:
      '문제정의·목차매핑·Win Theme를 처음부터 다시 생성합니다. 직접 수정한 내용이 사라지고, 이후 슬라이드가 최신 상태가 아닐 수 있습니다.',
  })
  if (!ok) return
  isRegeneratingAll.value = true
  try {
    await startStage2(true)
  } finally {
    isRegeneratingAll.value = false
  }
}

const onRegenerateAllPd = async () => {
  const ok = await openConfirm({
    title: '문제정의 재생성',
    message: '문제정의 전체를 다시 생성합니다. 직접 수정한 내용이 사라집니다.',
  })
  if (!ok) return
  isRegeneratingAllPd.value = true
  openLoading({ text: '문제정의를 재생성하는 중...' })
  try {
    const res = await fetchRegenerateStage2ProblemDefinitions({
      ptProjectId: props.ptProjectId,
      modelId: props.modelId,
      agentId: props.agentId,
    })
    if (res.result === 'OK') {
      openToast({ message: '문제정의가 재생성되었습니다.' })
      await loadAll()
      activeProblemId.value = problemDefs.value[0]?.problemId ?? null
    } else {
      openToast({ message: '재생성 실패', type: 'error' })
    }
  } finally {
    isRegeneratingAllPd.value = false
    closeLoading()
  }
}

const onSavePd = async () => {
  if (!activePd.value) return
  isSavingPd.value = true
  try {
    const res = await fetchUpdateStage2ProblemDefinition({
      ptProjectId: props.ptProjectId,
      problemId: activePd.value.problemId,
      ...editPd,
    })
    if (res.result === 'OK') {
      openToast({ message: '문제정의가 저장되었습니다.' })
      await loadAll()
    } else openToast({ message: '저장 실패', type: 'error' })
  } finally {
    isSavingPd.value = false
  }
}

/**
 * @param feedback - LLM에 전달할 보완 요청 텍스트
 * @param regenerateTitle - true면 "이 문제정의만 재생성" 경로: LLM이 title도 갱신.
 *                         false(기본)면 채팅 보완요청 경로: title은 변경하지 않는다.
 */
const onRefinePd = async (feedback: string, regenerateTitle = false) => {
  if (!activePd.value || !feedback.trim()) return
  // AI가 5개 필드를 덮어쓰므로 편집 중이면 먼저 확인받는다
  if (isPdDirty.value) {
    const confirmed = await openConfirm({
      title: '문제정의 재생성',
      message: '저장하지 않은 변경사항이 있습니다. 재생성하면 현재 편집 내용이 사라집니다. 계속할까요?',
    })
    if (!confirmed) return
  }
  isRefining.value = true
  try {
    const res = await fetchRefineStage2ProblemDefinition({
      ptProjectId: props.ptProjectId,
      problemId: activePd.value.problemId,
      userFeedback: feedback.trim(),
      modelId: props.modelId,
      agentId: props.agentId,
      regenerateTitle,
    })
    if (res.result === 'OK') {
      refineFeedback.value = ''
      openToast({ message: '문제정의가 보완되었습니다.' })
      await loadAll()
      activeProblemId.value = res.data.problemId
    } else openToast({ message: '보완 요청 실패', type: 'error' })
  } finally {
    isRefining.value = false
  }
}

const onAddPd = async () => {
  const res = await fetchInsertStage2ProblemDefinition({
    ptProjectId: props.ptProjectId,
    problemTypeCd: '001',
    currentProblem: '새 문제정의',
  })
  if (res.result === 'OK') {
    await loadAll()
    activeProblemId.value = res.data.problemId
  }
}

const onDeletePd = async (problemId: string) => {
  const ok = await openConfirm({
    title: '문제정의 삭제',
    message: '이 문제정의를 삭제하시겠습니까? 이를 겨냥하는 Win Theme는 다음 조회 시 stale로 표시됩니다.',
  })
  if (!ok) return
  await fetchDeleteStage2ProblemDefinition(props.ptProjectId, problemId)
  await loadAll()
  if (activeProblemId.value === problemId) {
    activeProblemId.value = problemDefs.value[0]?.problemId ?? null
  }
}

const focusPd = (problemId?: string) => {
  if (!problemId) return
  activeTab.value = 'pd'
  activeProblemId.value = problemId
}

/** 초안이 있으면 초안 값, 없으면 서버 값 — 저장 전까지 입력 내용을 wtDraft에 보관한다 */
const wtFieldValue = (wt: WinTheme, field: keyof WinTheme) =>
  (wtDraft.value[wt.winThemeId]?.[field] as string | undefined) ?? ((wt[field] as string | null) || '')

const onWtFieldChange = (wt: WinTheme, field: keyof WinTheme, value: string) => {
  if (!wtDraft.value[wt.winThemeId]) wtDraft.value[wt.winThemeId] = {}
  ;(wtDraft.value[wt.winThemeId] as Record<string, string>)[field] = value
}

const onSaveWt = async (wt: WinTheme) => {
  const draft = wtDraft.value[wt.winThemeId] || {}
  const res = await fetchUpdateStage2WinTheme({
    ptProjectId: props.ptProjectId,
    winThemeId: wt.winThemeId,
    ...draft,
  })
  if (res.result === 'OK') {
    openToast({ message: 'Win Theme가 저장되었습니다.' })
    await loadAll()
  }
}

const onAddWt = async () => {
  const src = activeProblemId.value
    ? [activeProblemId.value]
    : problemDefs.value[0]
      ? [problemDefs.value[0].problemId]
      : []
  if (!src.length) {
    openToast({ message: '먼저 문제정의를 추가하세요.', type: 'warning' })
    return
  }
  const res = await fetchInsertStage2WinTheme({
    ptProjectId: props.ptProjectId,
    coreMessage: '핵심 메시지를 입력하세요',
    proposalStrategy: '',
    evidence: '',
    expectedEffect: '',
    sourceProblemDefinitionIds: src,
  })
  if (res.result === 'OK') {
    activeTab.value = 'wt'
    await loadAll()
  }
}

const onDeleteWt = async (winThemeId: string) => {
  const ok = await openConfirm({ title: 'Win Theme 삭제', message: '삭제하시겠습니까?' })
  if (!ok) return
  await fetchDeleteStage2WinTheme(props.ptProjectId, winThemeId)
  await loadAll()
}

const onRegenerateWt = async () => {
  regeneratingWtId.value = 'all'
  openLoading({ text: 'Win Theme를 재생성하는 중...' })
  try {
    const res = await fetchRegenerateStage2WinThemes({
      ptProjectId: props.ptProjectId,
      modelId: props.modelId,
      agentId: props.agentId,
    })
    if (res.result === 'OK') {
      winThemes.value = res.data
      await loadAll()
    } else
      openToast({
        message: res.errorCd === 'PROBLEM_DEFINITION_REQUIRED' ? '문제정의가 먼저 필요합니다.' : '재생성 실패',
        type: 'error',
      })
  } finally {
    regeneratingWtId.value = null
    closeLoading()
  }
}

// 목차매핑 관련 함수 — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// removeCovered / addCovered / onEvalChange / saveTocNode
</script>

<style lang="scss" scoped>
.pt-strategy-chrome {
  :deep(.ui-tab) {
    border-bottom: none;
  }
}

.pt-strategy-tabs {
  border-bottom: none;

  :deep(.ui-tab-inner) {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  :deep(.ui-tab-item) {
    padding: 8px 12px;
    @include typo($body-medium);
  }
}
</style>
