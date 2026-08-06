<template>
  <div class="pt-panel pt-panel--lg pt-step-b">
    <h3 class="pt-panel-title">목차·요구사항</h3>
    <p class="pt-panel-desc">
      RFP에서 자동 추출된 목차와 함께, 같은 분석으로 함께 추출된 요구사항·평가기준·현황이슈를 확인하고 직접 보완할 수
      있습니다.
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

    <UiTab
      v-model="activeTab"
      class="pt-step-b-tabs"
      :tabs="subTabs"
    />

    <!-- 목차 탭 -->
    <div v-show="activeTab === 'toc'">
      <div class="pt-toc-toolbar">
        <UiButton
          variant="ghost"
          size="sm"
          @click="onAddItem(null)"
        >
          대목차 추가
        </UiButton>
      </div>
      <div class="pt-step-b-scroll-list">
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
          v-else-if="!isLoading"
          title="목차가 없습니다. RFP 데이터 추출 또는 직접 추가하세요."
        />
      </div>
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
        <div
          class="pt-tab-usage-hint"
          role="note"
        >
          <i
            class="icon-warning-triangle size-16"
            aria-hidden="true"
          />
          <p class="pt-tab-usage-hint__text">
            소목차에 매핑되어 슬라이드 본문 작성에 쓰입니다. 현황·이슈가 없을 때는 문제정의 근거로도 활용됩니다.
          </p>
        </div>
        <UiButton
          variant="primary-line"
          size="sm"
          @click="onAddReq"
        >
          + 요구사항 수동 추가
        </UiButton>
      </div>
      <div class="pt-req-table-wrap">
        <UiTable
          :columns="reqColumns"
          :data="requirements"
          size="sm"
          sticky-header
          max-height="min(480px, 50vh)"
          empty-text="요구사항이 없습니다. RFP 데이터 추출 또는 수동 추가하세요."
          selected-row-key="requirementId"
          :selected-row-value="focusId ?? undefined"
        >
          <template #header-mandatoryYn>
            <span class="pt-req-mandatory-header">
              필수
              <UiTooltip
                font-size="11px"
                side="bottom"
                align="center"
                content="필수 요구사항은 목차·슬라이드 작성 시 우선 반영되며, 누락되지 않도록 배정됩니다."
                content-class="pt-req-mandatory-tooltip"
              >
                <button
                  type="button"
                  class="pt-req-mandatory-info"
                  aria-label="필수 안내"
                >
                  <i class="icon-info size-12" />
                </button>
              </UiTooltip>
            </span>
          </template>
          <template #cell-reqNo="{ row }">
            <span :id="'req-' + row.requirementId">{{ row.reqNo || '—' }}</span>
          </template>
          <template #cell-reqCategoryTxt="{ row }">
            <span class="pt-badge is-gray">{{ row.reqCategoryTxt || '미분류' }}</span>
          </template>
          <template #cell-reqContent="{ row }">
            <span
              class="pt-req-content-text"
              :title="row.reqContent"
            >
              {{ row.reqContent }}
            </span>
          </template>
          <template #cell-mandatoryYn="{ row }">
            <span
              class="pt-badge"
              :class="row.mandatoryYn === 'Y' ? 'is-ok' : 'is-gray'"
            >
              {{ row.mandatoryYn === 'Y' ? '필수' : '선택' }}
            </span>
          </template>
          <template #cell-sourceTypeCd="{ row }">
            <span
              class="pt-badge"
              :class="sourceBadgeClass(row.sourceTypeCd)"
            >
              {{ sourceLabel(row.sourceTypeCd) }}
            </span>
          </template>
          <template #cell-_actions="{ row }">
            <div class="pt-req-actions">
              <UiButton
                variant="ghost"
                size="sm"
                @click="openReqEdit(row as PtRequirement)"
              >
                수정
              </UiButton>
              <UiButton
                variant="ghost"
                size="sm"
                @click="onDeleteReq(row.requirementId)"
              >
                삭제
              </UiButton>
            </div>
          </template>
        </UiTable>
      </div>

      <!-- 요구사항 수정 모달 -->
      <UiModal
        :is-open="isReqEditOpen"
        title="요구사항 수정"
        max-width="720px"
        custom-class="pt-req-edit-modal"
        @close="closeReqEdit"
      >
        <div class="pt-req-edit-form">
          <div class="pt-req-edit-meta">
            <span
              v-if="editingReq?.reqNo"
              class="pt-req-edit-no"
            >
              {{ editingReq.reqNo }}
            </span>
            <span class="pt-badge is-gray">{{ editingReq?.reqCategoryTxt || '미분류' }}</span>
            <span
              v-if="editingReq"
              class="pt-badge"
              :class="sourceBadgeClass(editingReq.sourceTypeCd)"
            >
              {{ sourceLabel(editingReq.sourceTypeCd) }}
            </span>
          </div>

          <div class="pt-req-edit-field">
            <label class="pt-req-edit-label">내용</label>
            <UiTextarea
              v-model="editReqContent"
              class="pt-req-edit-textarea"
              :rows="10"
              :auto-resize="false"
              border
              size="md"
              placeholder="요구사항 내용을 입력하세요"
            />
          </div>

          <div class="pt-req-edit-field">
            <div class="pt-req-edit-label-row">
              <label class="pt-req-edit-label">필수 여부</label>
              <span class="pt-req-edit-hint">필수 요구사항은 목차·슬라이드 작성 시 우선 반영됩니다.</span>
            </div>
            <div class="pt-toggle-row">
              <button
                type="button"
                :class="['pt-toggle-opt', { 'is-active': editMandatoryYn === 'Y' }]"
                @click="editMandatoryYn = 'Y'"
              >
                필수
              </button>
              <button
                type="button"
                :class="['pt-toggle-opt', { 'is-active': editMandatoryYn === 'N' }]"
                @click="editMandatoryYn = 'N'"
              >
                선택
              </button>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="modal-dialog-footer">
            <UiButton
              class="btn-modal-dialog"
              variant="outline"
              size="xlg"
              @click="closeReqEdit"
            >
              취소
            </UiButton>
            <UiButton
              class="btn-modal-dialog"
              variant="primary"
              size="xlg"
              :loading="isReqSaving"
              @click="onReqEditConfirm"
            >
              저장
            </UiButton>
          </div>
        </template>
      </UiModal>
    </div>

    <!-- 평가기준 탭 -->
    <div v-show="activeTab === 'ec'">
      <div class="pt-toolbar">
        <div
          class="pt-tab-usage-hint"
          role="note"
        >
          <i
            class="icon-warning-triangle size-16"
            aria-hidden="true"
          />
          <p class="pt-tab-usage-hint__text">
            소목차와 연결되어 슬라이드 배분·본문 작성 시 평가 관점과 배점을 반영합니다.
          </p>
        </div>
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
      <div class="pt-step-b-scroll-list">
        <div
          v-for="ec in evalCriteria"
          :id="'ec-' + ec.evalCriteriaId"
          :key="ec.evalCriteriaId"
          class="pt-ec-row"
          :class="{
            'is-open': openEcIds.has(ec.evalCriteriaId),
            'is-editing': editingEcId === ec.evalCriteriaId,
          }"
        >
          <div
            class="pt-ec-head"
            role="button"
            tabindex="0"
            :aria-expanded="openEcIds.has(ec.evalCriteriaId)"
            @click="toggleEc(ec.evalCriteriaId)"
            @keydown.enter.prevent="toggleEc(ec.evalCriteriaId)"
            @keydown.space.prevent="toggleEc(ec.evalCriteriaId)"
          >
            <div
              v-if="editingEcId === ec.evalCriteriaId"
              class="pt-ec-score is-editing"
              @click.stop
            >
              <UiInput
                id="ec-score-edit"
                v-model="ecDraft.score"
                number-only
                size="sm"
                aria-label="배점"
              />
            </div>
            <div
              v-else
              class="pt-ec-score"
            >
              {{ ec.score }}
            </div>
            <div class="pt-ec-name-wrap">
              <UiInput
                v-if="editingEcId === ec.evalCriteriaId"
                id="ec-name-edit"
                v-model="ecDraft.evalItemNm"
                class="pt-ec-name-input"
                size="sm"
                placeholder="평가기준명"
                @click.stop
              />
              <span
                v-else
                class="pt-ec-name"
              >
                {{ ec.evalItemNm }}
              </span>
              <span
                v-if="!openEcIds.has(ec.evalCriteriaId)"
                class="pt-ec-hint"
              >
                평가의도 · 고득점 조건 · 필수 증빙
              </span>
            </div>
            <button
              v-if="editingEcId !== ec.evalCriteriaId"
              type="button"
              class="pt-rowdel"
              @click.stop="onDeleteEc(ec.evalCriteriaId)"
            >
              ✕
            </button>
            <button
              type="button"
              class="pt-ec-chev"
              :aria-label="openEcIds.has(ec.evalCriteriaId) ? '상세 접기' : '상세 펼치기'"
              @click.stop="toggleEc(ec.evalCriteriaId)"
            >
              <i
                class="icon-chevron-down size-16"
                :class="{ 'is-open': openEcIds.has(ec.evalCriteriaId) }"
              />
            </button>
          </div>
          <div
            v-show="openEcIds.has(ec.evalCriteriaId)"
            class="pt-ec-detail"
          >
            <template v-if="editingEcId === ec.evalCriteriaId">
              <label>평가 의도</label>
              <UiTextarea
                v-model="ecDraft.evalIntent"
                :rows="3"
                :auto-resize="false"
                border
                size="md"
                placeholder="평가 의도를 입력하세요"
              />
              <label>고득점 조건</label>
              <UiTextarea
                v-model="ecDraft.highScoreCondition"
                :rows="3"
                :auto-resize="false"
                border
                size="md"
                placeholder="고득점 조건을 입력하세요"
              />
              <label>필수 증빙</label>
              <UiTextarea
                v-model="ecDraft.requiredEvidence"
                :rows="3"
                :auto-resize="false"
                border
                size="md"
                placeholder="필수 증빙을 입력하세요"
              />
            </template>
            <template v-else>
              <label>평가 의도</label>
              <p
                class="pt-ec-view-text"
                :class="{ 'is-empty': !ec.evalIntent }"
              >
                {{ ec.evalIntent || '내용 없음' }}
              </p>
              <label>고득점 조건</label>
              <p
                class="pt-ec-view-text"
                :class="{ 'is-empty': !ec.highScoreCondition }"
              >
                {{ ec.highScoreCondition || '내용 없음' }}
              </p>
              <label>필수 증빙</label>
              <p
                class="pt-ec-view-text"
                :class="{ 'is-empty': !ec.requiredEvidence }"
              >
                {{ ec.requiredEvidence || '내용 없음' }}
              </p>
            </template>

            <div class="pt-ec-detail-toolbar">
              <template v-if="editingEcId === ec.evalCriteriaId">
                <UiButton
                  variant="outline"
                  size="sm"
                  :disabled="isEcSaving"
                  @click="onCancelEditEc"
                >
                  취소
                </UiButton>
                <UiButton
                  variant="primary"
                  size="sm"
                  :loading="isEcSaving"
                  @click="onSaveEc"
                >
                  저장
                </UiButton>
              </template>
              <UiButton
                v-else
                variant="primary-line"
                size="sm"
                @click="onStartEditEc(ec)"
              >
                수정
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 현황·이슈 탭 -->
    <div v-show="activeTab === 'issue'">
      <div class="pt-toolbar">
        <div
          class="pt-tab-usage-hint"
          role="note"
        >
          <i
            class="icon-warning-triangle size-16"
            aria-hidden="true"
          />
          <p class="pt-tab-usage-hint__text">
            발주기관의 현황·문제점으로, 전략분석(문제정의·Win Theme)의 핵심 근거로 사용됩니다.
          </p>
        </div>
        <UiButton
          variant="primary-line"
          size="sm"
          @click="onAddIssue"
        >
          + 이슈 수동 추가
        </UiButton>
      </div>
      <div class="pt-step-b-scroll-list">
        <div class="pt-issue-grid">
          <div
            v-for="issue in rfpIssues"
            :id="'issue-' + issue.issueId"
            :key="issue.issueId"
            class="pt-issue-card"
            :class="{
              'is-focus': focusId === issue.issueId,
              'is-editing': editingIssueId === issue.issueId,
            }"
          >
            <div class="pt-issue-top">
              <span
                class="pt-badge"
                :class="issueTypeBadge(issue.issueTypeCd)"
                >{{ issueTypeLabel(issue.issueTypeCd) }}</span
              >
              <UiInput
                v-if="editingIssueId === issue.issueId"
                id="issue-label-edit"
                v-model="issueDraft.issueLabel"
                class="pt-issue-label-input"
                size="sm"
                placeholder="이슈 제목"
              />
              <span
                v-else
                class="pt-issue-label-text"
              >
                {{ issue.issueLabel || '제목 없음' }}
              </span>
              <button
                v-if="editingIssueId !== issue.issueId"
                type="button"
                class="pt-rowdel"
                @click="onDeleteIssue(issue.issueId)"
              >
                ✕
              </button>
            </div>

            <template v-if="editingIssueId === issue.issueId">
              <UiTextarea
                v-model="issueDraft.issueContent"
                class="pt-issue-content-edit"
                :rows="3"
                :auto-resize="false"
                border
                size="md"
                placeholder="이슈 내용을 입력하세요"
              />
            </template>
            <p
              v-else
              class="pt-issue-view-text"
              :class="{ 'is-empty': !issue.issueContent }"
            >
              {{ issue.issueContent || '내용 없음' }}
            </p>

            <div class="pt-issue-meta">
              출처: {{ issue.sourceSection || '—' }}
              <template v-if="issue.sourcePage"> · {{ issue.sourcePage }}p</template>
              · {{ issue.issueId }}
            </div>

            <div class="pt-issue-detail-toolbar">
              <template v-if="editingIssueId === issue.issueId">
                <UiButton
                  variant="outline"
                  size="sm"
                  :disabled="isIssueSaving"
                  @click="onCancelEditIssue"
                >
                  취소
                </UiButton>
                <UiButton
                  variant="primary"
                  size="sm"
                  :loading="isIssueSaving"
                  @click="onSaveIssue"
                >
                  저장
                </UiButton>
              </template>
              <UiButton
                v-else
                variant="primary-line"
                size="sm"
                @click="onStartEditIssue(issue)"
              >
                수정
              </UiButton>
            </div>
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
import type { TableColumn } from '~/types/table'

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
const { handleUploadPtFile } = useProposalFileStore()
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

const activeTab = ref('toc')
const requirements = ref<PtRequirement[]>([])
const evalCriteria = ref<PtEvalCriteria[]>([])
const rfpIssues = ref<PtRfpIssue[]>([])
const openEcIds = ref(new Set<string>())
const editingEcId = ref<string | null>(null)
const isEcSaving = ref(false)
const ecDraft = ref({
  evalItemNm: '',
  score: '',
  evalIntent: '',
  highScoreCondition: '',
  requiredEvidence: '',
})
const editingIssueId = ref<string | null>(null)
const isIssueSaving = ref(false)
const issueDraft = ref({
  issueLabel: '',
  issueContent: '',
})
const focusId = computed(() => props.focusId)

const focusEcField = (id: string) => {
  nextTick(() => {
    const el = document.getElementById(id) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

const focusIssueField = (id: string) => {
  nextTick(() => {
    const el = document.getElementById(id) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

const subTabs = computed(() => [
  { label: '목차', value: 'toc' },
  { label: `요구사항 ${requirements.value.length}`, value: 'req' },
  { label: `평가기준 ${evalCriteria.value.length}`, value: 'ec' },
  { label: `현황·이슈 ${rfpIssues.value.length}`, value: 'issue' },
])

const reqColumns: TableColumn[] = [
  { key: 'reqNo', label: '번호', width: '90px', align: 'center', headerAlign: 'center' },
  { key: 'reqCategoryTxt', label: '분류', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'reqContent', label: '내용', align: 'left', headerAlign: 'left' },
  { key: 'mandatoryYn', label: '필수', width: '84px', align: 'center', headerAlign: 'center' },
  { key: 'sourceTypeCd', label: '출처', width: '80px', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '', width: '110px', align: 'center', headerAlign: 'center' },
]

const isReqEditOpen = ref(false)
const isReqSaving = ref(false)
const editingReq = ref<PtRequirement | null>(null)
const editReqContent = ref('')
const editMandatoryYn = ref<'Y' | 'N'>('Y')

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
  handleSelectTocList,
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
          const el = document.getElementById(
            `${tab === 'req' ? 'req' : tab === 'issue' ? 'issue' : tab === 'ec' ? 'ec' : 'toc'}-${props.focusId}`,
          )
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        emit('focus-cleared')
      })
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const [, rfpRes] = await Promise.all([handleSelectTocList(), fetchSelectPtRfpFile(props.ptProjectId)])
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

const onAddItem = async (parentId: string | null) => handleAddTocItem(parentId)
const onTitleBlur = async (tocId: string, title: string) => handleUpdateTocTitle(tocId, title)
const onDeleteItem = async (tocId: string) => handleDeleteTocItem(tocId)
const onDragEnd = async () => handleReorderToc()

const sourceLabel = (cd: string) =>
  (({ '001': '명시', '002': '추론', '003': '확인필요', '999': '직접입력' }) as Record<string, string>)[cd] || cd
const sourceBadgeClass = (cd: string) => (cd === '003' ? 'is-warn' : cd === '002' ? 'is-blue' : 'is-gray')
const issueTypeLabel = (cd: string) =>
  (({ '001': '문제점', '002': '개선방향', '003': '배경·필요성' }) as Record<string, string>)[cd] || cd
const issueTypeBadge = (cd: string) => (cd === '001' ? 'is-danger' : cd === '002' ? 'is-ok' : 'is-accent')

const openReqEdit = (req: PtRequirement) => {
  editingReq.value = req
  editReqContent.value = req.reqContent
  editMandatoryYn.value = req.mandatoryYn
  isReqEditOpen.value = true
}

const closeReqEdit = () => {
  if (isReqSaving.value) return
  isReqEditOpen.value = false
  editingReq.value = null
}

/** 수정 모달 저장 — openConfirm 후 update */
const onReqEditConfirm = async () => {
  const requirementId = editingReq.value?.requirementId
  if (!requirementId || isReqSaving.value) return

  const reqContent = editReqContent.value.trim()
  if (!reqContent) {
    openToast({ message: '요구사항 내용을 입력하세요.', type: 'warning' })
    return
  }

  const ok = await openConfirm({
    title: '요구사항 수정',
    message: '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isReqSaving.value = true
  try {
    const res = await fetchUpdateRequirement({
      requirementId,
      reqContent,
      mandatoryYn: editMandatoryYn.value,
    })
    if (res.result !== 'OK') {
      openToast({ message: '요구사항 수정에 실패했습니다.', type: 'error' })
      return
    }
    await loadStage1()
    openToast({ message: '요구사항이 수정되었습니다.' })
    isReqEditOpen.value = false
    editingReq.value = null
  } finally {
    isReqSaving.value = false
  }
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
  // 수정 중에는 접기 방지
  if (editingEcId.value === id && openEcIds.value.has(id)) {
    openToast({ message: '수정 중입니다. 저장 또는 취소 후 접어주세요.', type: 'warning' })
    return
  }
  const next = new Set(openEcIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openEcIds.value = next
}

const onStartEditEc = (ec: PtEvalCriteria) => {
  editingEcId.value = ec.evalCriteriaId
  ecDraft.value = {
    evalItemNm: ec.evalItemNm || '',
    score: String(ec.score ?? ''),
    evalIntent: ec.evalIntent || '',
    highScoreCondition: ec.highScoreCondition || '',
    requiredEvidence: ec.requiredEvidence || '',
  }
  // 수정 진입 시 상세 영역 펼침
  if (!openEcIds.value.has(ec.evalCriteriaId)) {
    const next = new Set(openEcIds.value)
    next.add(ec.evalCriteriaId)
    openEcIds.value = next
  }
  focusEcField('ec-name-edit')
}

const onCancelEditEc = () => {
  if (isEcSaving.value) return
  editingEcId.value = null
}

const onSaveEc = async () => {
  const evalCriteriaId = editingEcId.value
  if (!evalCriteriaId || isEcSaving.value) return

  const evalItemNm = ecDraft.value.evalItemNm.trim()
  if (!evalItemNm) {
    openToast({ message: '평가기준명을 입력하세요.', type: 'warning' })
    focusEcField('ec-name-edit')
    return
  }

  const score = Number(ecDraft.value.score)
  if (ecDraft.value.score === '' || Number.isNaN(score)) {
    openToast({ message: '배점을 입력하세요.', type: 'warning' })
    focusEcField('ec-score-edit')
    return
  }

  const ok = await openConfirm({
    title: '평가기준 수정',
    message: '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isEcSaving.value = true
  try {
    const res = await fetchUpdateEvalCriteria({
      evalCriteriaId,
      evalItemNm,
      score,
      evalIntent: ecDraft.value.evalIntent.trim() || null,
      highScoreCondition: ecDraft.value.highScoreCondition.trim() || null,
      requiredEvidence: ecDraft.value.requiredEvidence.trim() || null,
    })
    if (res.result !== 'OK') {
      openToast({ message: '평가기준 수정에 실패했습니다.', type: 'error' })
      return
    }
    await loadStage1()
    editingEcId.value = null
    openToast({ message: '평가기준이 수정되었습니다.' })
  } catch {
    openToast({ message: '평가기준 수정 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isEcSaving.value = false
  }
}

const onAddEc = async () => {
  const res = await fetchInsertEvalCriteria({
    ptProjectId: props.ptProjectId,
    evalItemNm: '새 평가기준',
    score: 0,
  })
  await loadStage1()
  if (res.result === 'OK' && res.data?.evalCriteriaId) {
    const created = evalCriteria.value.find((e) => e.evalCriteriaId === res.data.evalCriteriaId)
    if (created) onStartEditEc(created)
  }
}

const onDeleteEc = async (id: string) => {
  if (editingEcId.value === id) {
    openToast({ message: '수정 중에는 삭제할 수 없습니다. 취소 후 다시 시도하세요.', type: 'warning' })
    return
  }
  const ok = await openConfirm({
    title: '평가기준 삭제',
    message: '이 평가기준을 삭제하시겠습니까? 목차매핑에서 참조 중일 수 있습니다.',
  })
  if (!ok) return
  const res = await fetchDeleteEvalCriteria(id)
  if (res.result !== 'OK') {
    openToast({ message: '평가기준 삭제에 실패했습니다.', type: 'error' })
    return
  }
  await loadStage1()
  openToast({ message: '평가기준이 삭제되었습니다.' })
}

const onStartEditIssue = (issue: PtRfpIssue) => {
  editingIssueId.value = issue.issueId
  issueDraft.value = {
    issueLabel: issue.issueLabel || '',
    issueContent: issue.issueContent || '',
  }
  focusIssueField('issue-label-edit')
}

const onCancelEditIssue = () => {
  if (isIssueSaving.value) return
  editingIssueId.value = null
}

const onSaveIssue = async () => {
  const issueId = editingIssueId.value
  if (!issueId || isIssueSaving.value) return

  const issueLabel = issueDraft.value.issueLabel.trim()
  if (!issueLabel) {
    openToast({ message: '이슈 제목을 입력하세요.', type: 'warning' })
    focusIssueField('issue-label-edit')
    return
  }

  const issueContent = issueDraft.value.issueContent.trim()
  if (!issueContent) {
    openToast({ message: '이슈 내용을 입력하세요.', type: 'warning' })
    return
  }

  const ok = await openConfirm({
    title: '이슈 수정',
    message: '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isIssueSaving.value = true
  try {
    const res = await fetchUpdateRfpIssue({
      issueId,
      issueLabel,
      issueContent,
    })
    if (res.result !== 'OK') {
      openToast({ message: '이슈 수정에 실패했습니다.', type: 'error' })
      return
    }
    await loadStage1()
    editingIssueId.value = null
    openToast({ message: '이슈가 수정되었습니다.' })
  } catch {
    openToast({ message: '이슈 수정 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isIssueSaving.value = false
  }
}

const onAddIssue = async () => {
  const res = await fetchInsertRfpIssue({
    ptProjectId: props.ptProjectId,
    issueTypeCd: '003',
    issueContent: '이슈 내용을 입력하세요',
    issueLabel: '새 이슈',
  })
  await loadStage1()
  activeTab.value = 'issue'
  if (res.result === 'OK' && res.data?.issueId) {
    const created = rfpIssues.value.find((i) => i.issueId === res.data.issueId)
    if (created) onStartEditIssue(created)
  }
}

const onDeleteIssue = async (id: string) => {
  if (editingIssueId.value === id) {
    openToast({ message: '수정 중에는 삭제할 수 없습니다. 취소 후 다시 시도하세요.', type: 'warning' })
    return
  }
  const ok = await openConfirm({
    title: '이슈 삭제',
    message: '이 이슈를 삭제하시겠습니까?',
  })
  if (!ok) return
  const res = await fetchDeleteRfpIssue(id)
  if (res.result !== 'OK') {
    openToast({ message: '이슈 삭제에 실패했습니다.', type: 'error' })
    return
  }
  await loadStage1()
  openToast({ message: '이슈가 삭제되었습니다.' })
}
</script>

<style lang="scss" scoped>
.pt-step-b-tabs {
  margin: $spacing-md 0;

  :deep(.ui-tab-inner) {
    max-width: none;
    margin: 0;
    padding: 0;
  }
}

.pt-step-b-scroll-list {
  max-height: min(480px, 50vh);
  overflow-y: auto;
  @include custom-scrollbar;
}

.pt-req-table-wrap {
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  overflow: hidden;
  background: #fff;

  :deep(.ui-table-wrap) {
    @include custom-scrollbar;
  }

  :deep(.ui-table thead.is-sticky th) {
    background: #f4f7f9;
  }

  :deep(.ui-table tbody td) {
    height: auto;
    min-height: 44px;
    padding: 10px 12px;
    vertical-align: middle;
  }

  // 내용 컬럼: 좌측 정렬 + 여유 패딩
  :deep(.ui-table tbody td:nth-child(3)) {
    text-align: left;
    padding: 12px 16px;
  }

  :deep(.pt-badge) {
    white-space: nowrap;
  }
}

.pt-req-content-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}

.pt-req-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.pt-req-mandatory-header {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.pt-req-mandatory-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: $color-text-muted;
  cursor: help;

  &:hover {
    color: $color-text-heading;
  }
}

.pt-req-edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.pt-req-edit-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: $color-surface;
  border: 1px solid $color-border-light;
  border-radius: $border-radius-base;
}

.pt-req-edit-no {
  @include typo($body-small-bold);
  color: $color-text-heading;
  margin-right: 2px;
}

.pt-req-edit-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pt-req-edit-label-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.pt-req-edit-label {
  @include typo($body-small-bold);
  color: $color-text-heading;
}

.pt-req-edit-hint {
  @include typo($body-small);
  color: $color-text-muted;
}

.pt-req-edit-textarea {
  width: 100%;
  min-height: 220px;
  line-height: 1.55;
}

.pt-tab-usage-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 0 8px;
  min-width: 0;

  > i {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-primary);
  }
}

.pt-toolbar .pt-tab-usage-hint {
  flex: 1;
  margin: 0;
  align-items: center;
  padding-right: 12px;

  > i {
    margin-top: 0;
  }
}

.pt-tab-usage-hint__text {
  margin: 0;
  @include typo($body-small);
  color: var(--color-primary);
  line-height: $line-height-base;
}
</style>

<style lang="scss">
// Radix 포탈용 — scoped 불가
.pt-req-mandatory-tooltip {
  max-width: 260px;
}

.pt-req-edit-modal {
  .modal-dialog-body {
    align-items: stretch;
    width: 100%;
  }

  .pt-req-edit-form {
    width: 100%;
  }

  .pt-req-edit-textarea.ui-textarea {
    min-height: 220px;
    line-height: 1.55;
  }
}
</style>
