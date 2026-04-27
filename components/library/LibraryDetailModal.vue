<template>
  <div
    class="library-detail-modal"
    :class="{ 'is-show': isOpen && !isTransitioning }"
  >
    <!-- 왼쪽 리사이즈 핸들 -->
    <div
      class="library-detail-modal-resize-handle"
      :class="{ 'is-dragging': isResizing }"
      @mousedown="onResizeStart"
    ></div>
    <div
      ref="contentRef"
      class="library-detail-modal-content"
      :style="{ maxWidth: modalWidth + 'px' }"
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
          <UiBadge variant="category">
            <template #icon-left>
              <i class="icon icon-diamond-small size-12"></i>
            </template>
            {{ displayData?.categoryNm }}
          </UiBadge>
          <UiBadge
            v-if="displayData?.svcTy === 'C' || displayData?.agentId"
            :variant="displayData?.svcTy === 'C' ? 'basic-chat' : 'default'"
            :color-hex="displayData?.svcTy === 'C' ? '' : displayData?.colorHex"
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
          <ChatPsychologySurvey
            v-if="isPsychologySurveyCard"
            class="library-detail-survey-readonly"
            readonly
            :initial-answers="surveyReadonlyAnswers"
            :theme-icon-class-nm="displayData?.iconClassNm ?? ''"
            :theme-color-hex="displayData?.colorHex ?? ''"
          />
          <ChatLunchAgentCard
            v-else-if="lunchQuestionPayload"
            class="library-detail-lunch-readonly"
            readonly
            :initial-payload="lunchQuestionPayload"
            :theme-icon-class-nm="displayData?.iconClassNm ?? ''"
            :theme-color-hex="displayData?.colorHex ?? ''"
          />
          <p v-else>{{ displayData?.qcontent }}</p>
        </div>

        <!-- 시스템 응답 -->
        <div class="content-box type-response">
          <UiButton
            v-if="parsedLunchRecommendations.length === 0"
            variant="ghost"
            size="xxs"
            icon-only
            class="btn-copy btn-copy-white"
            @click="handleCopyResponse"
          >
            <template #icon-left>
              <i class="icon icon-copy size-16"></i>
            </template>
          </UiButton>
          <UiButton
            v-if="displayData?.svcTy === 'S'"
            variant="ghost"
            size="xxs"
            icon-only
            class="btn-copy btn-custom-gray"
            style="right: 44px"
            :aria-pressed="isSqlCodeVisible"
            @click="toggleSqlCodeVisible"
          >
            <template #icon-left>
              <i class="icon icon-sql size-16"></i>
            </template>
          </UiButton>

          <ChatLunchAgentCard
            v-if="parsedLunchRecommendations.length"
            :recommendations="parsedLunchRecommendations"
            :theme-icon-class-nm="displayData?.iconClassNm ?? ''"
            :theme-color-hex="displayData?.colorHex ?? ''"
          />
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <div
            v-else
            class="message-content markdown-body"
            v-html="responseRenderedHtml"
          />
          <!-- eslint-enable vue/no-v-html -->
        </div>

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
        <UiCodeBlock
          v-if="displayData?.svcTy === 'S' && isSqlCodeVisible"
          :code="displayData?.ttsq"
        />
        <!-- 데이터 시각화 (데이터분석 타입) -->
        <div
          v-if="displayData?.svcTy === 'S'"
          class="content-box type-visualization"
        >
          <ChatVisualizationContent
            :open="isOpen"
            :view-model="visualizationView"
          />
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
      @generate="handleCreateDocGenerate"
    />

    <!-- AI 생성 보고서 편집 -->
    <LibraryCreateDocReportModal
      v-model:report="generatedReport"
      :is-open="isCreateDocReportOpen"
      :tmpl-nm="selectedCreateDocTmplNm"
      :refine-completed-at="reportRefineCompletedAt"
      @close="handleCreateDocReportClose"
      @save-to-my-docs="onCreateDocSaveToMyDocs"
      @share-link="onCreateDocShareLink"
      @select-other-type="handleCreateDocSelectOtherType"
      @send-refine="onCreateDocSendRefine"
    />
  </div>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseLunchPayloadFromPrompt } from '~/utils/chat/lunchAgentUtil'
import { parseSurveyAnswersFromPrompt } from '~/utils/chat/psychologyConsultUtil'
import type { LibraryCardDetail, DocItem, TableDataItem, ChartStatItem, ChartDetailCdItem } from '~/types/library'
import type { LunchRecommendationItem, VisualizationViewModel } from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { useFileStore } from '~/composables/com/useFileStore'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
const { handleViewFileUrl } = useFileStore()
const {
  handleSelectTmplList,
  tmplList,
  isCreateDocModalOpen,
  isCreateDocReportOpen,
  generatedReport,
  reportRefineCompletedAt,
  selectedCreateDocTmplNm,
  handleCreateDocTypeModalClose,
  handleCreateDocGenerate,
  handleCreateDocReportClose,
  resetLibraryDetailCreateDocUi,
  handleCreateDocSelectOtherType,
  handleReAskReport,
} = useLibraryStore()
const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    cardDetail?: LibraryCardDetail | null
    refItems?: DocItem[]
    tableData?: TableDataItem | null
    chartStatItems?: ChartStatItem[]
    chartDetailCdItems?: ChartDetailCdItem[]
  }>(),
  {
    isOpen: false,
    cardDetail: null,
    refItems: () => [] as DocItem[],
    tableData: null,
    chartStatItems: () => [] as ChartStatItem[],
    chartDetailCdItems: () => [] as ChartDetailCdItem[],
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
    tableData: props.tableData.tableData,
    statList: props.chartStatItems,
    statDetailList: props.chartDetailCdItems,
  })
})

// 내부 표시용 데이터 (트랜지션 타이밍 제어용)
const displayData = ref<LibraryCardDetail | null>(props.cardDetail ?? null)
const isPsychologySurveyCard = computed(() => displayData.value?.agentId === 'AG000010')
const surveyReadonlyAnswers = computed<Record<number, number>>(() =>
  parseSurveyAnswersFromPrompt(displayData.value?.qcontent ?? ''),
)
/** 점심 추천 전송 프롬프트(qcontent) — 검색기록·채팅과 동일하게 제출 완료 카드로 표시 */
const lunchQuestionPayload = computed(() => parseLunchPayloadFromPrompt(displayData.value?.qcontent ?? ''))

/** 시스템 응답 마크다운 렌더 결과 — v-html (ChatMessageItem과 동일) */
const responseRenderedHtml = computed(() => toHtmlContent(displayData.value?.rcontent ?? ''))
const parseLunchRecommendations = (raw: string): LunchRecommendationItem[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as LunchRecommendationItem[]
  } catch {
    return []
  }
}
const parsedLunchRecommendations = computed<LunchRecommendationItem[]>(() => {
  const raw = (displayData.value?.rcontent ?? '').trim()
  if (!raw) return []
  return parseLunchRecommendations(raw)
})
// SQL 코드 블록 표시 (데이터분석 타입에서 SQL 버튼으로 토글, 초기 숨김)
const isSqlCodeVisible = ref(false)
const toggleSqlCodeVisible = () => {
  if (displayData.value?.svcTy !== 'S') return
  isSqlCodeVisible.value = !isSqlCodeVisible.value
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
  await copyToClipboard(url)
  openToast({ message: '참조 매뉴얼 링크가 복사되었습니다.', type: 'success' })
}

const handleCreateDoc = () => {
  handleSelectTmplList()
  isCreateDocModalOpen.value = true
}

const onCreateDocSaveToMyDocs = () => {
  openToast({ message: '내 문서보관함 저장을 추후 연동 예정입니다.', type: 'warning' })
}

const onCreateDocShareLink = () => {
  openToast({ message: '공유 링크는 추후 연동 예정입니다.', type: 'warning' })
}

/** 보고서 보완 요청 */
const onCreateDocSendRefine = async (_message: string) => {
  await handleReAskReport(_message)
}

const handleCopyResponse = async () => {
  // 채팅 onCopy와 동일 — 태그 제거 후 클립보드
  const text = (displayData.value?.rcontent ?? '').replace(/<[^>]*>/g, '')
  await copyToClipboard(text)
  openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
}
</script>

<style lang="scss" scoped>
.library-detail-survey-readonly {
  width: 100%;
  max-width: 100%;
  max-height: min(560px, calc(100vh - 280px));
  overflow: hidden;
}

.library-detail-lunch-readonly {
  width: 100%;
  max-width: 100%;
  max-height: min(560px, calc(100vh - 280px));
  overflow: hidden;
}
</style>
