<template>
  <div class="pt-panel pt-panel--lg pt-strategy">
    <h3 class="pt-panel-title">전략검토</h3>
    <p class="pt-panel-desc">
      템플릿 생성이 확정되면 RFP 분석 결과를 바탕으로 문제정의·Win Theme·요구사항 매핑이 자동 생성됩니다. 본문생성으로
      넘어가기 전 이 화면에서 결과를 확인하고 보완할 수 있습니다.
    </p>

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
      <div class="pt-s4-content">
        <div class="pt-toolbar pt-strategy-topbar">
          <UiButton
            variant="primary-line"
            size="sm"
            :loading="isRegeneratingAll"
            @click="onRegenerateAll"
          >
            ↻ 전체 재생성
          </UiButton>
        </div>

        <UiTab
          v-model="activeTab"
          class="pt-strategy-tabs"
          :tabs="strategyTabs"
        />

        <!-- 문제정의 -->
        <div v-show="activeTab === 'pd'">
          <div class="pt-toolbar">
            <span
              class="pt-badge"
              :class="summary?.problemDefinitionCount ? 'is-ok' : 'is-gray'"
            >
              {{ summary?.problemDefinitionCount ? `완료 ${summary.problemDefinitionCount}건` : '대기' }}
            </span>
            <UiButton
              variant="primary-line"
              size="sm"
              :loading="isRegeneratingAllPd"
              @click="onRegenerateAllPd"
            >
              ↻ 문제정의 재생성
            </UiButton>
          </div>
          <div class="pt-pd-wrap">
            <div class="pt-pd-list">
              <template
                v-for="group in pdGroups"
                :key="group.code"
              >
                <div class="pt-pd-cat">{{ group.label }} ({{ group.code }})</div>
                <div
                  v-for="pd in group.items"
                  :key="pd.problemId"
                  class="pt-pd-item"
                  :class="{ active: pd.problemId === activeProblemId }"
                  @click="activeProblemId = pd.problemId"
                >
                  <span><span class="dot" /> {{ pdTitle(pd) }}</span>
                  <button
                    type="button"
                    class="pt-pd-del"
                    title="삭제"
                    @click.stop="onDeletePd(pd.problemId)"
                  >
                    ✕
                  </button>
                </div>
              </template>
              <button
                type="button"
                class="pt-pd-list-add"
                @click="onAddPd"
              >
                + 새 문제정의 추가
              </button>
            </div>

            <div
              v-if="activePd"
              class="pt-pd-detail"
            >
              <div
                v-for="f in pdFields"
                :key="f.key"
                class="pt-pd-field"
              >
                <label>{{ f.label }}</label>
                <textarea
                  v-model="editPd[f.key]"
                  class="pt-pd-textarea"
                  rows="2"
                />
              </div>
              <div class="pt-pd-field">
                <label>근거</label>
                <div class="pt-src-badges">
                  <button
                    v-for="id in activePd.sourceIssueIds"
                    :key="'i' + id"
                    type="button"
                    class="pt-src-badge is-issue"
                    @click="emit('go-requirements', { tab: 'issue', id })"
                  >
                    이슈 {{ id }}
                  </button>
                  <button
                    v-for="id in activePd.sourceRequirementIds"
                    :key="'r' + id"
                    type="button"
                    class="pt-src-badge is-req"
                    @click="emit('go-requirements', { tab: 'req', id })"
                  >
                    요구사항 {{ id }}
                  </button>
                  <span
                    v-if="!activePd.sourceIssueIds.length && !activePd.sourceRequirementIds.length"
                    class="pt-muted"
                    >근거 없음 (수동 작성)</span
                  >
                </div>
              </div>
              <div class="pt-pd-actions">
                <UiButton
                  variant="primary"
                  size="sm"
                  :loading="isSavingPd"
                  @click="onSavePd"
                >
                  변경사항 저장
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :loading="isRefining"
                  @click="onRefinePd('이 문제정의의 표현을 더 구체적이고 제안서에 맞게 다듬어줘')"
                >
                  ↻ 이 문제정의만 재생성
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
              <h3>"{{ pdTitle(activePd) }}" 보완요청</h3>
              <div class="pt-pd-chat-hint">
                예) 방치 시 위험을 더 구체적인 수치로 표현해줘<br />
                예) 목표에 클라우드 전환 일정도 함께 언급해줘
              </div>
              <div class="pt-pd-chat-input">
                <input
                  v-model="refineFeedback"
                  placeholder="보완 요청을 입력하세요"
                  :disabled="isRefining"
                  @keyup.enter="onRefinePd(refineFeedback)"
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
          <div class="pt-toolbar">
            <span
              class="pt-badge"
              :class="summary?.winThemeStaleCount ? 'is-warn' : summary?.winThemeCount ? 'is-ok' : 'is-gray'"
            >
              {{
                summary?.winThemeStaleCount
                  ? `보완필요 ${summary.winThemeStaleCount}건`
                  : summary?.winThemeCount
                    ? `완료 ${summary.winThemeCount}건`
                    : '대기'
              }}
            </span>
            <div class="pt-toolbar-actions">
              <UiButton
                variant="primary-line"
                size="sm"
                :loading="regeneratingWtId === 'all'"
                @click="onRegenerateWt"
              >
                ↻ Win Theme 재생성
              </UiButton>
              <UiButton
                variant="primary-line"
                size="sm"
                @click="onAddWt"
              >
                + Win Theme 수동 추가
              </UiButton>
            </div>
          </div>
          <div class="pt-wt-grid">
            <div
              v-for="wt in winThemes"
              :key="wt.winThemeId"
              class="pt-wt-card"
              :class="{ stale: wt.stale }"
            >
              <span
                v-if="wt.stale"
                class="pt-wt-stale-badge"
                >{{ staleBadgeText(wt) }}</span
              >
              <button
                type="button"
                class="pt-wt-del"
                title="삭제"
                @click="onDeleteWt(wt.winThemeId)"
              >
                ✕
              </button>
              <div
                class="pt-wt-target"
                :title="(wt.sourceProblemDefinitionIds || []).join(', ')"
                @click="focusPd(wt.sourceProblemDefinitionIds?.[0])"
              >
                겨냥 문제 · {{ targetPdTitle(wt) }}
              </div>
              <div
                class="pt-wt-core"
                contenteditable="true"
                @blur="(e) => onWtFieldBlur(wt, 'coreMessage', e)"
              >
                {{ wt.coreMessage }}
              </div>
              <div class="pt-wt-row">
                <label>제안 전략</label>
                <div
                  class="v"
                  contenteditable="true"
                  @blur="(e) => onWtFieldBlur(wt, 'proposalStrategy', e)"
                >
                  {{ wt.proposalStrategy }}
                </div>
              </div>
              <div class="pt-wt-row">
                <label>근거</label>
                <div
                  class="v"
                  :class="{ 'is-missing': isEvidenceMissing(wt.evidence) }"
                  contenteditable="true"
                  @blur="(e) => onWtFieldBlur(wt, 'evidence', e)"
                >
                  {{ wt.evidence }}
                </div>
              </div>
              <div class="pt-wt-row">
                <label>기대효과</label>
                <div
                  class="v"
                  contenteditable="true"
                  @blur="(e) => onWtFieldBlur(wt, 'expectedEffect', e)"
                >
                  {{ wt.expectedEffect }}
                </div>
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

        <!-- 목차매핑 UI 제거 — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동 -->
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
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { Stage2Summary, ProblemDefinition, WinTheme } from '~/types/proposal'
// TocMappingResult, TocMappingNode — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동

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
  // fetchSelectStage2TocMapping,  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
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
  // fetchUpdateStage2TocMapping,  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
  // fetchSelectStage1Result,      // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
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
// const tocMapping = ref<TocMappingResult | null>(null)  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// const reqLabelMap = ref<Record<string, string>>({})    // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동

const activeTab = ref('pd')
const strategyTabs = [
  { label: '문제정의', value: 'pd' },
  { label: 'Win Theme', value: 'wt' },
  // 목차매핑 탭 제거 — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
]
const activeProblemId = ref<string | null>(null)
const isLoadingStage2 = ref(false)
const loadingStepIdx = ref(0)
const isRegeneratingAll = ref(false)
const isRegeneratingAllPd = ref(false)
const isSavingPd = ref(false)
const isRefining = ref(false)
const refineFeedback = ref('')
const regeneratingWtId = ref<string | null>(null)
// const savingTocId = ref<string | null>(null)      // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// const localCovered = ref<Record<string, string[]>>({})  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// const localEval = ref<Record<string, string | null>>({})  // TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
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

const pdFields = [
  { key: 'currentProblem' as const, label: '현재 문제' },
  { key: 'rootCause' as const, label: '원인' },
  { key: 'riskIfIgnored' as const, label: '방치 시 위험' },
  { key: 'goal' as const, label: '목표' },
  { key: 'requiredCapability' as const, label: '필요 역량' },
  { key: 'strategySummary' as const, label: '전략 요약' },
  { key: 'kpi' as const, label: 'KPI' },
]

const activePd = computed(() => problemDefs.value.find((p) => p.problemId === activeProblemId.value) ?? null)

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

const pdTitle = (pd: ProblemDefinition) => {
  const t = (pd.currentProblem || '').trim()
  return t.length > 28 ? t.slice(0, 28) + '…' : t || '(제목 없음)'
}
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

const onRefinePd = async (feedback: string) => {
  if (!activePd.value || !feedback.trim()) return
  isRefining.value = true
  try {
    const res = await fetchRefineStage2ProblemDefinition({
      ptProjectId: props.ptProjectId,
      problemId: activePd.value.problemId,
      userFeedback: feedback.trim(),
      modelId: props.modelId,
      agentId: props.agentId,
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

const onWtFieldBlur = (wt: WinTheme, field: keyof WinTheme, e: Event) => {
  const text = (e.target as HTMLElement).innerText?.trim() ?? ''
  if (!wtDraft.value[wt.winThemeId]) wtDraft.value[wt.winThemeId] = {}
  ;(wtDraft.value[wt.winThemeId] as any)[field] = text
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
  }
}

// 목차매핑 관련 함수 — TODO: 세부목차 스텝(ProposalStepToc.vue)으로 이동
// removeCovered / addCovered / onEvalChange / saveTocNode
</script>

<style lang="scss" scoped>
.pt-strategy-tabs {
  margin: 0 0 $spacing-md;

  :deep(.ui-tab-inner) {
    max-width: none;
    margin: 0;
    padding: 0;
  }
}

.pt-strategy-topbar {
  justify-content: flex-end;
}
</style>
