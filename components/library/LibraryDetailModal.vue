<template>
  <div
    class="library-detail-modal"
    :class="{ 'is-show': isOpen && !isTransitioning }"
  >
    <div
      class="library-detail-modal-panel"
      :style="{ maxWidth: modalWidth + 'px', height: contentHeight }"
    >
      <!-- 왼쪽 리사이즈 핸들 — 스크롤 영역 밖, y축 스크롤과 무관하게 고정 -->
      <div
        class="library-detail-modal-resize-handle"
        :class="{ 'is-dragging': isResizing }"
        @mousedown="onResizeStart"
      ></div>
      <div
        ref="contentRef"
        class="library-detail-modal-content"
        @scroll="handleScroll"
      >
        <!-- 상단 헤더 -->
        <div class="library-detail-modal-header">
          <!-- 뱃지 -->
          <div class="library-detail-modal-badge-wrapper flex">
            <UiButton
              v-if="displayData?.pinYn === 'Y'"
              icon-only
              variant="ghost"
              class="btn-star is-active"
            >
              <template #icon-left>
                <i class="icon icon-star-fill size-12"></i>
              </template>
            </UiButton>
            <UiBadge variant="default">
              <template #icon-left>
                <i class="icon icon-diamond-small size-12"></i>
              </template>
              {{ displayData?.categoryNm }}
            </UiBadge>
            <UiBadge
              v-if="displayData?.svcTy === 'C' || displayData?.agentId"
              variant="default"
              :color-hex="displayData?.svcTy === 'C' ? '#ac5e00' : displayData?.colorHex"
            >
              <template #icon-left>
                <i
                  :class="`icon ${displayData?.svcTy === 'C' ? 'icon-comment-other' : displayData?.iconClassNm} size-14`"
                ></i>
              </template>
              {{ displayData?.svcTy === 'C' ? '기본대화' : displayData?.agentNm }}
            </UiBadge>
          </div>

          <!-- 제목 행(제목+날짜) + 태그 + 액션 행 — 한 블록 -->
          <div class="library-detail-modal-title-section">
            <div class="library-detail-modal-title-row">
              <h2 class="library-detail-modal-title">{{ displayData?.title }}</h2>
              <p class="library-detail-modal-date">
                {{ formatDateTimeDisplay(displayData?.createDt ?? '') }}
              </p>
            </div>
            <div class="library-detail-modal-tags-actions-row">
              <div class="library-detail-modal-tags">
                <span
                  v-for="tag in displayData?.tags?.split(',')"
                  :key="tag"
                  class="library-detail-modal-tag"
                >
                  #{{ tag }}
                </span>
              </div>
              <div class="library-detail-modal-actions">
                <!-- 지식 제목 변경 -->
                <UiButton
                  variant="ghost"
                  size="xxs"
                  icon-only
                  class="btn-custom-white"
                  title="지식 제목 변경"
                  @click="handleRenameTitle"
                >
                  <template #icon-left>
                    <i class="icon icon-edit-version size-16"></i>
                  </template>
                </UiButton>
                <!-- 카테고리 이동 -->
                <UiButton
                  variant="ghost"
                  size="xxs"
                  icon-only
                  class="btn-custom-white"
                  title="카테고리 이동"
                  @click="handleMove"
                >
                  <template #icon-left>
                    <i class="icon icon-transfer size-16"></i>
                  </template>
                </UiButton>
                <!-- 문서만들기 -->
                <UiButton
                  variant="ghost"
                  size="xxs"
                  icon-only
                  class="btn-custom-white"
                  title="문서만들기"
                  @click="handleCreateDoc"
                >
                  <template #icon-left>
                    <i class="icon icon-dropdown-document size-16"></i>
                  </template>
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="xxs"
                  icon-only
                  class="btn-custom-white"
                  title="공유하기"
                  @click="handleShare"
                >
                  <template #icon-left>
                    <i class="icon icon-sidebar-share size-16"></i>
                  </template>
                </UiButton>
                <!-- 삭제 btn -->
                <UiButton
                  variant="ghost"
                  size="xxs"
                  icon-only
                  class="btn-custom-light-gray"
                  title="삭제"
                  @click="handleDelete"
                >
                  <template #icon-left>
                    <i class="icon icon-delete-bg size-16"></i>
                  </template>
                </UiButton>
              </div>
            </div>
          </div>
          <!-- 닫기 -->
          <button
            class="btn btn-modal-close type-library-detail"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>

        <!-- 본문 -->
        <div class="library-detail-modal-body">
          <!-- 사용자 질문 -->
          <div class="content-box type-question">
            <LibraryCardQuestionBody
              v-if="displayData"
              :item="displayData"
            />
          </div>

          <!-- 시스템 응답 -->
          <div class="content-box type-response">
            <UiButton
              v-if="
                parsedRecommendItems.length === 0 &&
                parsedNewsCuratorItems.length === 0 &&
                parsedAutoRecommendItems.length === 0 &&
                !isTranslateLibraryCard
              "
              variant="line-secondary"
              size="xs"
              icon-only
              class="btn-copy btn-no-border"
              @click="handleCopyResponse"
            >
              <template #icon-left>
                <i class="icon icon-copy size-16"></i>
              </template>
            </UiButton>
            <UiButton
              v-if="displayData?.svcTy === 'S'"
              variant="solid-muted"
              size="xs"
              icon-only
              class="btn-copy btn-no-border"
              style="right: 44px"
              :aria-pressed="isSqlCodeVisible"
              @click="toggleSqlCodeVisible"
            >
              <template #icon-left>
                <i class="icon icon-sql size-16"></i>
              </template>
            </UiButton>

            <LibraryCardResponseBody
              v-if="displayData"
              :item="displayData"
            />
          </div>

          <!-- 생성 보고서 HTML (reportHtml) -->
          <LibraryCardReportPreview
            v-if="displayData?.reportHtml?.trim()"
            :report-html="displayData.reportHtml"
          />

          <!-- 참조 매뉴얼 (매뉴얼AI 타입) -->
          <div
            v-if="displayData?.svcTy === 'M'"
            class="content-box type-reference"
          >
            <div class="reference-header">
              <span class="reference-title">참조 매뉴얼</span>
            </div>
            <ul class="reference-list">
              <li
                v-for="item in refItems"
                :key="item.docFileId"
                class="reference-list-item"
              >
                <div
                  class="reference-item"
                  :class="{ 'is-active': expandedRefKey === refDocKey(item) }"
                  role="button"
                  tabindex="0"
                  @click="onReferenceRowClick(item)"
                  @keydown.enter.prevent="onReferenceRowClick(item)"
                  @keydown.space.prevent="onReferenceRowClick(item)"
                >
                  <i class="icon icon-document size-20 reference-doc-icon"></i>
                  <div class="reference-item-info">
                    <span class="reference-item-title">{{ item.fileName }}</span>
                    <span class="reference-item-page">{{ item.relatedPages ? `p.${item.relatedPages}` : '' }}</span>
                  </div>
                  <button
                    class="btn-reference-link"
                    type="button"
                    @click.stop="onReferenceLink(item)"
                  >
                    <i class="icon icon-link-agent size-16"></i>
                  </button>
                </div>
                <LibraryReferencePdfViewer
                  v-if="expandedRefKey === refDocKey(item)"
                  :key="refDocKey(item)"
                  :item="item"
                  :open="true"
                />
              </li>
            </ul>
          </div>
          <!-- SQL 코드 블록 -->
          <div
            v-if="displayData?.svcTy === 'S'"
            ref="sqlCodeRef"
            class="chat-vis-sql-area"
            :class="{ 'is-open': isSqlCodeVisible }"
          >
            <UiCodeBlock
              :code="displayData?.ttsq"
              format-sql
            />
            <button
              class="chat-vis-sql-toggle"
              type="button"
              @click="toggleSqlCodeVisible"
            >
              <i
                class="icon-chevron-down size-12"
                :class="{ 'is-flipped': isSqlCodeVisible }"
              ></i>
            </button>
          </div>
          <!-- 데이터 시각화 (데이터분석 타입) -->
          <div
            v-if="displayData?.svcTy === 'S'"
            class="content-box type-visualization"
          >
            <LibraryVisualizationContent
              ref="visContentRef"
              :open="isOpen"
              :view-model="visualizationView"
              :initial-charts="knowChartList"
              :on-save-chart="onVisSaveChart"
              :on-update-chart="onVisUpdateChart"
              :on-delete-chart="handleDeleteKnowChart"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 탑 버튼 -->
    <button
      class="btn btn-modal-top"
      :class="{ 'is-show': isScrolled }"
      @click="handleScrollToTop"
    >
      <i class="icon icon-arrow-down size-20"></i>
    </button>

    <!-- 문서 만들기 (유형 선택) -->
    <LibraryCreateDocModal
      :is-open="isCreateDocModalOpen"
      :tmpl-list="tmplList"
      :card-id="displayData?.cardId ?? ''"
      @close="handleCreateDocTypeModalClose"
      @generate="handleCreateDocGenerateWithCharts"
    />

    <!-- AI 생성 보고서 편집 -->
    <LibraryCreateDocReportModal
      v-model:report="generatedReport"
      v-model:tmpl-html="generatedReportTmplHtml"
      :is-open="isCreateDocReportOpen"
      :tmpl-nm="selectedCreateDocTmplNm"
      :svc-ty="displayData?.svcTy ?? ''"
      :refine-completed-at="reportRefineCompletedAt"
      :refined-html="refinedEditorHtml"
      :r-content="displayData?.rcontent ?? ''"
      @close="handleCreateDocReportClose"
      @save-to-my-docs="onCreateDocSaveToMyDocs"
      @select-other-type="handleCreateDocSelectOtherType"
      @send-refine="onCreateDocSendRefine"
      @request-insight="onCreateDocRequestInsight"
    />

    <!-- 공유 대상 사용자 선택 모달 -->
    <UserSelectModal
      :is-open="isUserSelectModalOpen"
      title="공유 대상 선택"
      confirm-text="공유하기"
      @close="closeUserSelectModal"
      @confirm="onShareConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiBadge } from '@leechanyong/ispark-ui'
import {
  isRecommendAgentPrompt,
  normalizeRecommendResultItems,
  parseRecommendJsonArray,
} from '~/utils/chat/recommendAgentUtil'
import { NEWS_CURATOR_AGENT_ID, parseNewsCuratorItems } from '~/utils/chat/newsCuratorUtil'
import { isAutoRecommendLibraryCardItem, parseAutoRecommendJsonArray } from '~/utils/chat/autoRecommendUtil'
import { isTranslateLibraryCardItem } from '~/utils/chat/translateAgentUtil'
import type { LibraryCardDetail, DocItem, TableDataItem, ChartStatItem, ChartDetailCdItem } from '~/types/library'
import type { LibraryReportInsightRequest } from '~/utils/library/libraryReportEditorUtil'
import type { RecommendResultItem, VisualizationChartSelection, VisualizationViewModel } from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { useFileStore } from '~/composables/com/useFileStore'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'
import type { OrgUserItem } from '~/types/org-manage'
const { handleViewFileUrl } = useFileStore()
const { isUserSelectModalOpen, openUserSelectModal, closeUserSelectModal } = useUserSelectStore()

/** LibraryVisualizationContent 컴포넌트 참조 — 차트 캡처용 */
const visContentRef = ref<{ captureChartImages: () => Promise<string[]> } | null>(null)
const {
  handleSelectTmplList,
  tmplList,
  isCreateDocModalOpen,
  isCreateDocReportOpen,
  generatedReport,
  generatedReportTmplHtml,
  reportRefineCompletedAt,
  refinedEditorHtml,
  selectedCreateDocTmplNm,
  handleCreateDocTypeModalClose,
  handleCreateDocGenerate,
  handleCreateDocReportClose,
  resetLibraryDetailCreateDocUi,
  handleCreateDocSelectOtherType,
  handleSaveReportToMyDocs,
  handleReAskReport,
  handleInsightReport,
  handleShareCard,
  libraryAgents,
  handleSelectLibraryAgents,
  knowChartList,
  handleSaveKnowChart,
  handleUpdateKnowChart,
  handleDeleteKnowChart,
} = useLibraryStore()

/** LibraryVisualizationContent의 onSaveChart 콜백 — 현재 카드 ID를 클로저로 바인딩 */
const onVisSaveChart = async (selection: VisualizationChartSelection, sortOrd: number): Promise<string> => {
  const cardId = displayData.value?.cardId
  if (!cardId) throw new Error('cardId 없음')
  return handleSaveKnowChart(cardId, selection, sortOrd)
}

/** LibraryVisualizationContent의 onUpdateChart 콜백 */
const onVisUpdateChart = async (
  chartId: string,
  selection: VisualizationChartSelection,
  sortOrd: number,
): Promise<void> => {
  return handleUpdateKnowChart(chartId, selection, sortOrd)
}
const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    cardDetail?: LibraryCardDetail | null
    refItems?: DocItem[]
    tableData?: TableDataItem | null
    chartStatItems?: ChartStatItem[]
    chartDetailCdItems?: ChartDetailCdItem[]
    /** KS 배너가 표시될 때 사이드 패널 상단을 내려야 하는 추가 오프셋(px) */
    bannerOffset?: number
  }>(),
  {
    isOpen: false,
    cardDetail: null,
    refItems: () => [] as DocItem[],
    tableData: null,
    chartStatItems: () => [] as ChartStatItem[],
    chartDetailCdItems: () => [] as ChartDetailCdItem[],
    bannerOffset: 0,
  },
)

const emit = defineEmits<{
  close: []
  renameTitle: [card: LibraryCardDetail]
  move: [card: LibraryCardDetail]
  delete: [card: LibraryCardDetail]
}>()

// 참조 매뉴얼 PDF 아코디언 (한 행만 펼침)
const expandedRefKey = ref<string | null>(null)
const refDocKey = (item: DocItem) => item.docFileId
const onReferenceRowClick = (item: DocItem) => {
  const key = refDocKey(item)
  expandedRefKey.value = expandedRefKey.value === key ? null : key
}

// 스크롤 상태
const contentRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

const isModalTopBtnShown = computed(() => props.isOpen && isScrolled.value)
useModalTopBtnSync(isModalTopBtnShown)

// KS 배너 오프셋을 반영한 패널 높이 — SCSS calc(100vh - 102px) 기준에서 banner만큼 추가 차감
const contentHeight = computed(() => `calc(100vh - ${102 + props.bannerOffset}px)`)

// 리사이즈 상태
const MIN_WIDTH = 680
const MAX_WIDTH_RATIO = 0.8
const modalWidth = ref(MIN_WIDTH)
const isResizing = ref(false)

const onResizeStart = (e: MouseEvent) => {
  e.preventDefault()
  isResizing.value = true
  const startX = e.clientX
  const startWidth = modalWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    // 오른쪽 고정, 왼쪽으로 드래그 → width 증가
    const delta = startX - moveEvent.clientX
    const maxWidth = window.innerWidth * MAX_WIDTH_RATIO
    modalWidth.value = Math.min(Math.max(startWidth + delta, MIN_WIDTH), maxWidth)
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 카드 전환 트랜지션 상태
const isTransitioning = ref(false)

// tableData → VisualizationViewModel 변환 (스키마 추론 포함)
const visualizationView = computed<VisualizationViewModel | null>(() => {
  if (!props.tableData?.tableData) return null
  return buildVisualizationViewModel({
    messageId: props.tableData.logId,
    sql: props.tableData.sql ?? props.cardDetail?.ttsq ?? '',
    tableData: props.tableData.tableData,
    chartOption: props.tableData.chartOption,
    statList: props.chartStatItems,
    statDetailList: props.chartDetailCdItems,
  })
})

// 내부 표시용 데이터 (트랜지션 타이밍 제어용)
const displayData = ref<LibraryCardDetail | null>(props.cardDetail ?? null)

/** 시스템 응답 복사 버튼 노출 — RECOMMEND JSON 답변은 별도 UI */
const parsedRecommendItems = computed<RecommendResultItem[]>(() => {
  const qcontent = displayData.value?.qcontent ?? ''
  if (!isRecommendAgentPrompt(qcontent)) return []
  const raw = (displayData.value?.rcontent ?? '').trim()
  if (!raw) return []
  return normalizeRecommendResultItems(parseRecommendJsonArray(raw))
})

const parsedNewsCuratorItems = computed(() => {
  if (displayData.value?.agentId !== NEWS_CURATOR_AGENT_ID) return []
  const raw = (displayData.value?.rcontent ?? '').trim()
  if (!raw) return []
  return parseNewsCuratorItems(raw)
})

const parsedAutoRecommendItems = computed(() => {
  if (!displayData.value || !isAutoRecommendLibraryCardItem(displayData.value, libraryAgents.value)) return []
  const raw = (displayData.value?.rcontent ?? '').trim()
  if (!raw) return []
  return parseAutoRecommendJsonArray(raw)
})

const isTranslateLibraryCard = computed(() => {
  if (!displayData.value) return false
  return isTranslateLibraryCardItem(displayData.value, libraryAgents.value)
})
// SQL 코드 블록 표시 (데이터분석 타입에서 SQL 버튼으로 토글, 초기 숨김)
const isSqlCodeVisible = ref(false)
const sqlCodeRef = ref<HTMLElement | null>(null)
const toggleSqlCodeVisible = () => {
  if (displayData.value?.svcTy !== 'S') return
  isSqlCodeVisible.value = !isSqlCodeVisible.value
  if (isSqlCodeVisible.value) {
    setTimeout(() => {
      if (!sqlCodeRef.value || !contentRef.value) return
      const stickyHeader = contentRef.value.querySelector('.library-detail-modal-header')
      const headerHeight = stickyHeader ? (stickyHeader as HTMLElement).offsetHeight : 0
      const containerRect = contentRef.value.getBoundingClientRect()
      const targetRect = sqlCodeRef.value.getBoundingClientRect()
      const offset = targetRect.top - containerRect.top + contentRef.value.scrollTop - headerHeight
      contentRef.value.scrollTo({ top: offset, behavior: 'smooth' })
    }, 320)
  }
}
// 스크롤 이벤트 핸들러
const handleScroll = () => {
  if (!contentRef.value) return
  isScrolled.value = contentRef.value.scrollTop > 50
}

// 탑 버튼 클릭 핸들러
const handleScrollToTop = () => {
  if (!contentRef.value) return
  contentRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const handleShare = () => {
  openUserSelectModal()
}

const onShareConfirm = (users: OrgUserItem[]) => handleShareCard(users)

// 카드 변경 시 모달 전체 슬라이드 재실행 + 스크롤 리셋
watch(
  () => props.cardDetail?.cardId,
  (newId, oldId) => {
    // 최초 열기 — 바로 표시
    if (!oldId) {
      displayData.value = props.cardDetail ?? null
      isSqlCodeVisible.value = false
      expandedRefKey.value = null
      return
    }
    if (!newId || newId === oldId) return

    // 1) is-show 제거 → 기존 데이터 상태로 오른쪽으로 나감
    isTransitioning.value = true

    // 2) 나간 후 → 데이터 교체 → 다시 들어옴
    setTimeout(() => {
      displayData.value = props.cardDetail ?? null
      isSqlCodeVisible.value = false
      expandedRefKey.value = null
      if (contentRef.value) {
        contentRef.value.scrollTo({ top: 0 })
        isScrolled.value = false
      }
      nextTick(() => {
        isTransitioning.value = false
      })
    }, 250)
  },
)

/** 동일 카드에서 제목만 갱신된 경우 상세 본문과 동기화 */
watch(
  () => props.cardDetail?.title,
  (title) => {
    if (title === undefined || !displayData.value) return
    if (props.cardDetail?.cardId !== displayData.value.cardId) return
    if (isTransitioning.value) return
    displayData.value = { ...displayData.value, title }
  },
)

// 모달 닫힐 때 displayData도 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open && libraryAgents.value.length === 0) {
      void handleSelectLibraryAgents()
    }
    if (!open) {
      displayData.value = null
      isSqlCodeVisible.value = false
      expandedRefKey.value = null
      resetLibraryDetailCreateDocUi()
    }
  },
)

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleRenameTitle = () => {
  if (!displayData.value) return
  emit('renameTitle', displayData.value)
}

const handleMove = () => {
  if (!displayData.value) return
  emit('move', displayData.value)
}

const handleDelete = () => {
  if (!displayData.value) return
  emit('delete', displayData.value)
}

const onReferenceLink = async (item: DocItem) => {
  const url = await handleViewFileUrl(item.docFileId)
  if (!url) {
    openToast({ message: '참조 매뉴얼 파일을 찾을 수 없습니다.', type: 'error' })
    return
  }
  await copyToClipboard(url.url ?? '')
  openToast({ message: '참조 매뉴얼 링크가 복사되었습니다.', type: 'success' })
}

const handleCreateDoc = () => {
  handleSelectTmplList()
  isCreateDocModalOpen.value = true
}

/**
 * svcTy='S'인 경우 차트 이미지를 캡처해 백엔드로 함께 전달한다.
 * 백엔드에서 extractedImgTags에 추가 → LLM 프롬프트에 토큰 지시 → 보고서 본문에 배치.
 */
const handleCreateDocGenerateWithCharts = async (payload: { cardId: string; tmplId: string }) => {
  const chartImages =
    displayData.value?.svcTy === 'S' ? await (visContentRef.value?.captureChartImages() ?? Promise.resolve([])) : []

  await handleCreateDocGenerate({ ...payload, chartImages: chartImages.length ? chartImages : undefined })
}

const onCreateDocSaveToMyDocs = async (docHtml: string) => {
  await handleSaveReportToMyDocs(docHtml)
}

/** 보고서 보완 요청 — currentHtml: 현재 에디터 전체 HTML */
const onCreateDocSendRefine = async (message: string, currentHtml: string) => {
  await handleReAskReport(message, currentHtml)
}

/** 보고서 인사이트 분석 요청 */
const onCreateDocRequestInsight = async (payload: LibraryReportInsightRequest) => {
  await handleInsightReport(payload)
}

const handleCopyResponse = async () => {
  // 채팅 onCopy와 동일 — 태그 제거 후 클립보드
  const text = (displayData.value?.rcontent ?? '').replace(/<[^>]*>/g, '')
  await copyToClipboard(text)
  openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
}
</script>

<style lang="scss" scoped></style>
