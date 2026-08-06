<template>
  <div class="pt-panel">
    <h3 class="pt-panel-title">목차·요구사항</h3>
    <p class="pt-panel-desc">
      RFP에서 자동 추출된 목차와 함께, 같은 분석으로 함께 추출된 요구사항·평가기준·현황이슈를 확인하고
      직접 보완할 수 있습니다.
    </p>

    <!-- RFP 파일 업로드 -->
    <div class="pt-section-label">RFP 파일</div>
    <div
      class="pt-dropzone"
      @click="onClickRfpDropzone"
      @dragover.prevent
      @drop.prevent="onDropRfp"
    >
      <i class="icon-attach-file size-18" />
      <span
        v-if="rfpFile"
        class="pt-dropzone-file"
      >
        <i class="icon-document size-14" />
        {{ rfpFile.name }}
        <button
          class="pt-dropzone-remove"
          @click.stop="rfpFile = null"
        >
          <i class="icon-close size-12" />
        </button>
      </span>
      <span
        v-else-if="savedRfpFileNm"
        class="pt-dropzone-file"
      >
        <i class="icon-document size-14" />
        {{ savedRfpFileNm }}
        <span class="pt-dropzone-tag">저장됨</span>
      </span>
      <span v-else> <b>RFP 파일</b>을 첨부하세요 (.pdf, .hwp, .hwpx, .docx) </span>
      <input
        ref="rfpInputRef"
        type="file"
        accept=".pdf,.hwp,.hwpx,.docx,.doc"
        style="display: none"
        @change="onRfpFileChange"
      />
    </div>
    <div class="pt-rfp-btn-row">
      <UiButton
        variant="primary-line"
        size="sm"
        :loading="isUploading"
        :disabled="!rfpFile"
        @click="onUploadRfp"
      >
        RFP 업로드
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        :loading="isAnalyzing"
        :disabled="!savedRfpFileNm || isAnalyzing"
        @click="onExtractStage1"
      >
        RFP 데이터 추출
      </UiButton>
    </div>

    <div class="pt-subtabs">
      <button
        type="button"
        class="pt-subtab"
        :class="{ active: activeTab === 'toc' }"
        @click="activeTab = 'toc'"
      >
        목차
      </button>
      <button
        type="button"
        class="pt-subtab"
        :class="{ active: activeTab === 'req' }"
        @click="activeTab = 'req'"
      >
        요구사항
        <span class="pt-subtab-count">{{ requirements.length }}</span>
      </button>
      <button
        type="button"
        class="pt-subtab"
        :class="{ active: activeTab === 'ec' }"
        @click="activeTab = 'ec'"
      >
        평가기준
        <span class="pt-subtab-count">{{ evalCriteria.length }}</span>
      </button>
      <button
        type="button"
        class="pt-subtab"
        :class="{ active: activeTab === 'issue' }"
        @click="activeTab = 'issue'"
      >
        현황·이슈
        <span class="pt-subtab-count">{{ rfpIssues.length }}</span>
      </button>
    </div>

    <!-- 목차 탭 -->
    <div v-show="activeTab === 'toc'">
      <div class="pt-toc-toolbar">
        <UiButton
          variant="primary-line"
          size="sm"
          :loading="isExtracting"
          @click="onAutoExtract"
        >
          RFP에서 목차 자동 추출
        </UiButton>
        <UiButton
          variant="ghost"
          size="sm"
          @click="onAddItem(null)"
        >
          대목차 추가
        </UiButton>
      </div>
      <template v-if="isLoading">
        <div
          v-for="i in 4"
          :key="i"
          class="pt-toc-skeleton"
        />
      </template>
      <draggable
        v-else-if="tocList.length > 0"
        v-model="tocList"
        item-key="tocId"
        handle=".pt-toc-drag"
        animation="200"
        class="pt-toc-list"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div :class="['pt-toc-item', { 'is-sub': element.parentId !== null }]">
            <span class="pt-toc-drag"><i class="icon-move-handle size-14" /></span>
            <input
              :value="element.title"
              class="pt-toc-input"
              @blur="onTitleBlur(element.tocId, ($event.target as HTMLInputElement).value)"
            />
            <span :class="['pt-toc-tag', element.source === 'rfp' ? 'is-rfp' : 'is-user']">
              {{ element.source === 'rfp' ? 'RFP 추출' : '사용자 입력' }}
            </span>
            <button
              v-if="element.parentId === null"
              class="pt-toc-add-child"
              title="소목차 추가"
              @click="onAddItem(element.tocId)"
            >
              <i class="icon-plus size-12" />
            </button>
            <button
              class="pt-toc-del"
              @click="onDeleteItem(element.tocId)"
            >
              <i class="icon-close size-12" />
            </button>
          </div>
        </template>
      </draggable>
      <UiEmpty
        v-else-if="!isLoading && !isExtracting"
        title="목차가 없습니다. RFP 자동 추출 또는 직접 추가하세요."
      />
    </div>

    <!-- 요구사항 탭 -->
    <div v-show="activeTab === 'req'">
      <div
        v-if="confirmNeededCount"
        class="pt-alertbar"
      >
        ⚠ 확인이 필요한 요구사항이 {{ confirmNeededCount }}건 있습니다.
      </div>
      <div class="pt-toolbar">
        <UiButton
          variant="primary-line"
          size="sm"
          @click="onAddReq"
        >
          + 요구사항 수동 추가
        </UiButton>
        <UiButton
          variant="ghost"
          size="sm"
          @click="onExtractStage1"
        >
          ↻ RFP 재추출 (전체)
        </UiButton>
      </div>
      <div class="pt-card-table">
        <table class="pt-datatable">
          <thead>
            <tr>
              <th style="width: 90px">번호</th>
              <th style="width: 100px">분류</th>
              <th>내용</th>
              <th style="width: 80px">필수</th>
              <th style="width: 90px">출처</th>
              <th style="width: 36px" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="req in requirements"
              :id="'req-' + req.requirementId"
              :key="req.requirementId"
              :class="{ 'is-focus': focusId === req.requirementId }"
            >
              <td>{{ req.reqNo || '—' }}</td>
              <td><span class="pt-badge is-gray">{{ req.reqCategoryCd || '미분류' }}</span></td>
              <td>
                <textarea
                  class="pt-editable"
                  rows="2"
                  :value="req.reqContent"
                  @blur="onUpdateReq(req, 'reqContent', ($event.target as HTMLTextAreaElement).value)"
                />
              </td>
              <td>
                <button
                  type="button"
                  class="pt-toggle"
                  @click="onUpdateReq(req, 'mandatoryYn', req.mandatoryYn === 'Y' ? 'N' : 'Y')"
                >
                  <span :class="{ on: req.mandatoryYn === 'Y' }">필수</span>
                  <span :class="{ on: req.mandatoryYn !== 'Y' }">선택</span>
                </button>
              </td>
              <td>
                <span
                  class="pt-badge"
                  :class="sourceBadgeClass(req.sourceTypeCd)"
                >{{ sourceLabel(req.sourceTypeCd) }}</span>
              </td>
              <td>
                <button
                  type="button"
                  class="pt-rowdel"
                  @click="onDeleteReq(req.requirementId)"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 평가기준 탭 -->
    <div v-show="activeTab === 'ec'">
      <div class="pt-toolbar">
        <span />
        <UiButton
          variant="primary-line"
          size="sm"
          @click="onAddEc"
        >
          + 평가기준 추가
        </UiButton>
      </div>
      <div
        class="pt-ec-sumbar"
        :class="{ bad: evalScoreSum !== 100 }"
      >
        <b>합계 {{ evalScoreSum }}점</b>
        <span>{{ evalScoreSum === 100 ? '— RFP 명시 총점(100점)과 일치합니다' : '— 총점 100점과 불일치합니다' }}</span>
      </div>
      <div
        v-for="ec in evalCriteria"
        :id="'ec-' + ec.evalCriteriaId"
        :key="ec.evalCriteriaId"
        class="pt-ec-row"
      >
        <div
          class="pt-ec-head"
          @click="toggleEc(ec.evalCriteriaId)"
        >
          <div
            class="pt-ec-score"
            contenteditable="true"
            @click.stop
            @blur="onUpdateEcScore(ec, ($event.target as HTMLElement).innerText)"
          >
            {{ ec.score }}
          </div>
          <input
            class="pt-ec-name"
            :value="ec.evalItemNm"
            @click.stop
            @blur="onUpdateEc(ec, 'evalItemNm', ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="pt-rowdel"
            @click.stop="onDeleteEc(ec.evalCriteriaId)"
          >
            ✕
          </button>
          <span class="pt-ec-chev">{{ openEcIds.has(ec.evalCriteriaId) ? '▴' : '▾' }}</span>
        </div>
        <div
          v-show="openEcIds.has(ec.evalCriteriaId)"
          class="pt-ec-detail"
        >
          <label>평가 의도</label>
          <textarea
            rows="2"
            :value="ec.evalIntent || ''"
            @blur="onUpdateEc(ec, 'evalIntent', ($event.target as HTMLTextAreaElement).value)"
          />
          <label>고득점 조건</label>
          <textarea
            rows="2"
            :value="ec.highScoreCondition || ''"
            @blur="onUpdateEc(ec, 'highScoreCondition', ($event.target as HTMLTextAreaElement).value)"
          />
          <label>필수 증빙</label>
          <textarea
            rows="2"
            :value="ec.requiredEvidence || ''"
            @blur="onUpdateEc(ec, 'requiredEvidence', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- 현황·이슈 탭 -->
    <div v-show="activeTab === 'issue'">
      <div class="pt-toolbar">
        <span />
        <UiButton
          variant="primary-line"
          size="sm"
          @click="onAddIssue"
        >
          + 이슈 수동 추가
        </UiButton>
      </div>
      <div class="pt-issue-grid">
        <div
          v-for="issue in rfpIssues"
          :id="'issue-' + issue.issueId"
          :key="issue.issueId"
          class="pt-issue-card"
          :class="{ 'is-focus': focusId === issue.issueId }"
        >
          <div class="pt-issue-top">
            <span
              class="pt-badge"
              :class="issueTypeBadge(issue.issueTypeCd)"
            >{{ issueTypeLabel(issue.issueTypeCd) }}</span>
            <input
              class="pt-issue-label"
              :value="issue.issueLabel || ''"
              placeholder="이슈 제목"
              @blur="onUpdateIssue(issue, 'issueLabel', ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              class="pt-rowdel"
              @click="onDeleteIssue(issue.issueId)"
            >
              ✕
            </button>
          </div>
          <textarea
            class="pt-issue-content"
            rows="3"
            :value="issue.issueContent"
            @blur="onUpdateIssue(issue, 'issueContent', ($event.target as HTMLTextAreaElement).value)"
          />
          <div class="pt-issue-meta">
            출처: {{ issue.sourceSection || '—' }}
            <template v-if="issue.sourcePage"> · {{ issue.sourcePage }}p</template>
            · {{ issue.issueId }}
          </div>
        </div>
      </div>
    </div>

    <div class="pt-panel-actions">
      <UiButton
        variant="primary"
        size="md"
        :disabled="tocList.length === 0"
        @click="emit('next')"
      >
        다음 · 설정 입력
        <template #icon-right>
          <i class="icon-arrow-right size-14" />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { openLoading, updateLoadingText, closeLoading } from '~/composables/useLoading'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { PtRequirement, PtEvalCriteria, PtRfpIssue } from '~/types/proposal'

const STAGE1_STEP_MESSAGES: Record<string, string> = {
  extract: 'RFP 파일에서 텍스트를 추출하는 중...',
  condense: 'RFP 내용을 요약하는 중...',
  prompt: '프롬프트를 준비하는 중...',
  llm: 'AI가 RFP를 분석하는 중...',
  chunk_extract: '대용량 RFP를 분할하여 추출하는 중...',
  chunk: '청크 단위로 분석하는 중...',
  parse: '분석 결과를 검증하는 중...',
  save: '결과를 저장하는 중...',
}

interface Props {
  ptProjectId: string
  modelId: string
  agentId: string
  writingGuidelineJson?: string
  focusTab?: 'toc' | 'req' | 'ec' | 'issue' | null
  focusId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ next: []; 'focus-cleared': [] }>()

const ptProjectIdRef = computed(() => props.ptProjectId)
const {
  handleUploadPtFile,
} = useProposalFileStore()
const {
  streamExtractStage1,
  fetchSelectPtRfpFile,
  fetchSelectStage1Result,
  fetchUpdateRequirement,
  fetchInsertRequirement,
  fetchDeleteRequirement,
  fetchUpdateEvalCriteria,
  fetchInsertEvalCriteria,
  fetchDeleteEvalCriteria,
  fetchInsertRfpIssue,
  fetchUpdateRfpIssue,
  fetchDeleteRfpIssue,
} = useProposalApi()

const activeTab = ref<'toc' | 'req' | 'ec' | 'issue'>('toc')
const requirements = ref<PtRequirement[]>([])
const evalCriteria = ref<PtEvalCriteria[]>([])
const rfpIssues = ref<PtRfpIssue[]>([])
const openEcIds = ref(new Set<string>())
const focusId = computed(() => props.focusId)

const rfpInputRef = ref<HTMLInputElement | null>(null)
const rfpFile = ref<File | null>(null)
const savedRfpFileNm = ref<string | null>(null)
const isUploading = ref(false)
const isAnalyzing = ref(false)

const confirmNeededCount = computed(
  () => requirements.value.filter((r) => r.sourceTypeCd === '003' || r.confirmNeededYn === 'Y').length,
)
const evalScoreSum = computed(() => evalCriteria.value.reduce((a, b) => a + (Number(b.score) || 0), 0))

const {
  tocList,
  isLoading,
  isExtracting,
  handleSelectTocList,
  handleAutoExtractToc,
  handleAddTocItem,
  handleUpdateTocTitle,
  handleDeleteTocItem,
  handleReorderToc,
} = useProposalToc(ptProjectIdRef)

const loadStage1 = async () => {
  const res = await fetchSelectStage1Result(props.ptProjectId)
  if (res.result === 'OK' && res.data) {
    requirements.value = res.data.requirements || []
    evalCriteria.value = res.data.evalCriteria || []
    rfpIssues.value = res.data.rfpIssues || []
  }
}

watch(
  () => props.focusTab,
  (tab) => {
    if (tab) {
      activeTab.value = tab
      nextTick(() => {
        if (props.focusId) {
          const el = document.getElementById(`${tab === 'req' ? 'req' : tab === 'issue' ? 'issue' : tab === 'ec' ? 'ec' : 'toc'}-${props.focusId}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        emit('focus-cleared')
      })
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const [, rfpRes] = await Promise.all([
    handleSelectTocList(),
    fetchSelectPtRfpFile(props.ptProjectId),
  ])
  await loadStage1()
  if (rfpRes?.result === 'OK' && rfpRes.data?.fileName) {
    savedRfpFileNm.value = rfpRes.data.fileName
  }
})

const onClickRfpDropzone = () => rfpInputRef.value?.click()
const onRfpFileChange = (e: Event) => {
  rfpFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}
const onDropRfp = (e: DragEvent) => {
  rfpFile.value = e.dataTransfer?.files?.[0] ?? null
}

const onUploadRfp = async () => {
  if (!rfpFile.value) return
  isUploading.value = true
  const uploadingFileName = rfpFile.value.name
  try {
    const res = await handleUploadPtFile(rfpFile.value, '001', props.ptProjectId)
    if (!res || res.result !== 'OK') {
      openToast({ message: 'RFP 파일 업로드에 실패했습니다.', type: 'error' })
      return
    }
    savedRfpFileNm.value = res.fileName || uploadingFileName
    rfpFile.value = null
    openToast({ message: 'RFP 파일이 업로드되었습니다.' })
  } catch {
    openToast({ message: '업로드 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isUploading.value = false
  }
}

const onExtractStage1 = async () => {
  const message = props.writingGuidelineJson
    ? '이미 추출된 내역이 존재합니다. 그래도 추출하시겠습니까? 직접 수정한 내용도 사라집니다.'
    : '업로드한 RFP 파일의 데이터를 추출하시겠습니까?'
  const confirmed = await openConfirm({ title: 'RFP 데이터 추출', message })
  if (!confirmed) return

  isAnalyzing.value = true
  openLoading({ text: 'RFP 분석을 시작하는 중...' })
  streamExtractStage1(props.ptProjectId, props.modelId, props.agentId, {
    onProgress: (data) => {
      const msg = STAGE1_STEP_MESSAGES[data.step]
      if (msg) updateLoadingText(msg)
    },
    onDone: async () => {
      closeLoading()
      isAnalyzing.value = false
      openToast({ message: 'RFP 분석이 완료되었습니다.' })
      await Promise.all([handleSelectTocList(), loadStage1()])
    },
    onError: () => {
      closeLoading()
      isAnalyzing.value = false
      openToast({ message: 'RFP 분석 중 오류가 발생했습니다.', type: 'error' })
    },
  })
}

const onAutoExtract = async () => {
  if (tocList.value.length > 0) {
    const confirmed = await openConfirm({
      title: 'RFP 목차 자동 추출',
      message: `기존 목차 ${tocList.value.length}개가 모두 대체됩니다. 계속하시겠습니까?`,
    })
    if (!confirmed) return
  }
  const msg = await handleAutoExtractToc()
  if (msg) openToast({ message: msg, type: 'warning' })
}

const onAddItem = async (parentId: string | null) => handleAddTocItem(parentId)
const onTitleBlur = async (tocId: string, title: string) => handleUpdateTocTitle(tocId, title)
const onDeleteItem = async (tocId: string) => handleDeleteTocItem(tocId)
const onDragEnd = async () => handleReorderToc()

const sourceLabel = (cd: string) =>
  ({ '001': '명시', '002': '추론', '003': '확인필요', '999': '직접입력' } as Record<string, string>)[cd] || cd
const sourceBadgeClass = (cd: string) =>
  cd === '003' ? 'is-warn' : cd === '002' ? 'is-blue' : 'is-gray'
const issueTypeLabel = (cd: string) =>
  ({ '001': '문제점', '002': '개선방향', '003': '배경·필요성' } as Record<string, string>)[cd] || cd
const issueTypeBadge = (cd: string) =>
  cd === '001' ? 'is-danger' : cd === '002' ? 'is-ok' : 'is-accent'

const onUpdateReq = async (req: PtRequirement, field: string, value: string) => {
  await fetchUpdateRequirement({ requirementId: req.requirementId, [field]: value } as any)
  await loadStage1()
}
const onAddReq = async () => {
  await fetchInsertRequirement({
    ptProjectId: props.ptProjectId,
    reqContent: '새 요구사항 내용을 입력하세요',
    mandatoryYn: 'Y',
  })
  await loadStage1()
  activeTab.value = 'req'
}
const onDeleteReq = async (id: string) => {
  const ok = await openConfirm({ title: '요구사항 삭제', message: '이 요구사항을 삭제하시겠습니까?' })
  if (!ok) return
  await fetchDeleteRequirement(id)
  await loadStage1()
}

const toggleEc = (id: string) => {
  const next = new Set(openEcIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openEcIds.value = next
}
const onUpdateEc = async (ec: PtEvalCriteria, field: string, value: string) => {
  await fetchUpdateEvalCriteria({ evalCriteriaId: ec.evalCriteriaId, [field]: value } as any)
  await loadStage1()
}
const onUpdateEcScore = async (ec: PtEvalCriteria, text: string) => {
  const score = parseFloat(text) || 0
  await fetchUpdateEvalCriteria({ evalCriteriaId: ec.evalCriteriaId, score } as any)
  await loadStage1()
}
const onAddEc = async () => {
  await fetchInsertEvalCriteria({
    ptProjectId: props.ptProjectId,
    evalItemNm: '새 평가기준',
    score: 0,
  })
  await loadStage1()
}
const onDeleteEc = async (id: string) => {
  const ok = await openConfirm({
    title: '평가기준 삭제',
    message: '이 평가기준을 삭제하시겠습니까? 목차매핑에서 참조 중일 수 있습니다.',
  })
  if (!ok) return
  await fetchDeleteEvalCriteria(id)
  await loadStage1()
}

const onUpdateIssue = async (issue: PtRfpIssue, field: string, value: string) => {
  await fetchUpdateRfpIssue({ issueId: issue.issueId, [field]: value } as any)
  await loadStage1()
}
const onAddIssue = async () => {
  await fetchInsertRfpIssue({
    ptProjectId: props.ptProjectId,
    issueTypeCd: '003',
    issueContent: '이슈 내용을 입력하세요',
    issueLabel: '새 이슈',
  })
  await loadStage1()
  activeTab.value = 'issue'
}
const onDeleteIssue = async (id: string) => {
  const ok = await openConfirm({ title: '이슈 삭제', message: '삭제하시겠습니까?' })
  if (!ok) return
  await fetchDeleteRfpIssue(id)
  await loadStage1()
}
</script>
