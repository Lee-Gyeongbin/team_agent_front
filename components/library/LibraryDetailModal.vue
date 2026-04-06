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
            v-if="displayData?.svcTy === 'S'"
            variant="data-line"
          >
            <template #icon-left>
              <i class="icon icon-data-line-small size-14"></i>
            </template>
            데이터분석
          </UiBadge>
          <UiBadge
            v-else-if="displayData?.svcTy === 'C'"
            variant="basic-chat"
          >
            <template #icon-left>
              <i class="icon icon-comment-other size-14"></i>
            </template>
            기본대화
          </UiBadge>
          <UiBadge
            v-else-if="displayData?.svcTy === 'M'"
            variant="manual-ai"
          >
            <template #icon-left>
              <i class="icon icon-book size-14"></i>
            </template>
            매뉴얼AI
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
              <!-- 변경 btn -->
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
          <p>{{ displayData?.qcontent }}</p>
        </div>

        <!-- 시스템 응답 -->
        <div class="content-box type-response">
          <UiButton
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

          <div
            class="message-content"
            v-html="toHtmlContent(displayData?.rcontent ?? '')"
          ></div>
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
              :key="`${item.docId}::${item.docFileId}`"
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
      @close="isCreateDocModalOpen = false"
      @generate="onCreateDocGenerate"
    />

    <!-- 문서 생성 중 (AI 응답 대기) -->
    <LibraryCreateDocLoadingModal
      :is-open="isCreateDocLoadingOpen"
      @close="onCreateDocLoadingClose"
    />

    <!-- AI 생성 보고서 편집 -->
    <LibraryCreateDocReportModal
      v-model:report="generatedReport"
      :field-defs="reportFieldDefs"
      :is-open="isCreateDocReportOpen"
      @close="onCreateDocReportClose"
      @export-pdf="onCreateDocExportPdf"
      @share-link="onCreateDocShareLink"
      @select-other-type="onCreateDocSelectOtherType"
      @send-refine="onCreateDocSendRefine"
    />
  </div>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type {
  LibraryCardDetail,
  DocItem,
  TableDataItem,
  ChartStatItem,
  ChartDetailCdItem,
  LibraryGeneratedReportValues,
} from '~/types/library'
import type { TmplField } from '~/types/tmpl'
import type { VisualizationViewModel } from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { useFileStore } from '~/composables/com/useFileStore'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
import { useTmplApi } from '~/composables/tmpl/useTmplApi'
const { handleViewFileUrl } = useFileStore()
const { handleSelectTmplList, tmplList } = useLibraryStore()
const { fetchTmplDetail } = useTmplApi()
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
  move: [card: LibraryCardDetail]
  delete: [card: LibraryCardDetail]
}>()

// 참조 매뉴얼 PDF 아코디언 (한 행만 펼침)
const expandedRefKey = ref<string | null>(null)
const refDocKey = (item: DocItem) => `${item.docId}::${item.docFileId}`
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

// 모달 닫힐 때 displayData도 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      displayData.value = null
      isSqlCodeVisible.value = false
      expandedRefKey.value = null
      isCreateDocModalOpen.value = false
      isCreateDocLoadingOpen.value = false
      isCreateDocReportOpen.value = false
      generatedReport.value = {}
      reportFieldDefs.value = []
    }
  },
)

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
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
  const url = await handleViewFileUrl(item.docId, item.docFileId)
  if (!url) {
    openToast({ message: '참조 매뉴얼 파일을 찾을 수 없습니다.', type: 'error' })
    return
  }
  await copyToClipboard(url)
  openToast({ message: '참조 매뉴얼 링크가 복사되었습니다.', type: 'success' })
}

/** 문서 만들기 — 유형 선택 모달 */
const isCreateDocModalOpen = ref(false)
const isCreateDocLoadingOpen = ref(false)
const isCreateDocReportOpen = ref(false)

/** 보고서 편집 행 정의 (템플릿형 `T`일 때만 API/목록에서 채움) */
const reportFieldDefs = ref<TmplField[]>([])

const normalizedReportFields = (fields: TmplField[]) =>
  [...fields].filter((f) => f.useYn === 'Y').sort((a, b) => a.sortOrd - b.sortOrd)

const buildEmptyReportFromFields = (fields: TmplField[]): LibraryGeneratedReportValues => {
  const out: LibraryGeneratedReportValues = {}
  for (const f of normalizedReportFields(fields)) {
    out[f.jsonKey] = ''
  }
  return out
}

const generatedReport = ref<LibraryGeneratedReportValues>({})

const handleCreateDoc = () => {
  handleSelectTmplList()
  isCreateDocModalOpen.value = true
}

/** 문서 생성하기 — 로딩 → (추후 AI JSON) → 보고서 모달 */
const onCreateDocGenerate = async (payload: { docTypeId: string }) => {
  isCreateDocModalOpen.value = false
  isCreateDocLoadingOpen.value = true
  reportFieldDefs.value = []
  generatedReport.value = {}

  const tmpl = tmplList.value.find((t) => t.tmplId === payload.docTypeId)

  try {
    if (tmpl?.tmplType === 'T') {
      try {
        const res = await fetchTmplDetail(payload.docTypeId)
        const fields = normalizedReportFields(res.data?.fields ?? [])
        reportFieldDefs.value = fields
        generatedReport.value = buildEmptyReportFromFields(fields)
      } catch {
        const fallback = normalizedReportFields(tmpl?.fields ?? [])
        reportFieldDefs.value = fallback
        generatedReport.value = buildEmptyReportFromFields(fallback)
      }
    } else {
      // 자유형식(`F`): 필드 틀 없음 — 상세 조회하지 않음 (목록에 fields가 없을 수 있음)
      reportFieldDefs.value = []
      generatedReport.value = {}
    }

    // 🔽 더미 지연 — AI API 연동 시 제거하고 응답 JSON으로 `generatedReport` 설정
    await new Promise((r) => setTimeout(r, 1600))
    for (const f of reportFieldDefs.value) {
      generatedReport.value[f.jsonKey] = `${f.fieldNm} 예시 내용입니다.`
    }

    isCreateDocReportOpen.value = true
  } finally {
    isCreateDocLoadingOpen.value = false
  }
}

const onCreateDocLoadingClose = () => {
  isCreateDocLoadingOpen.value = false
}

const onCreateDocReportClose = () => {
  isCreateDocReportOpen.value = false
  generatedReport.value = {}
  reportFieldDefs.value = []
}

const onCreateDocExportPdf = () => {
  openToast({ message: 'PDF 다운로드는 추후 연동 예정입니다.', duration: 2000 })
}

const onCreateDocShareLink = () => {
  openToast({ message: '공유 링크는 추후 연동 예정입니다.', duration: 2000 })
}

const onCreateDocSelectOtherType = () => {
  isCreateDocReportOpen.value = false
  generatedReport.value = {}
  reportFieldDefs.value = []
  handleSelectTmplList()
  isCreateDocModalOpen.value = true
}

const onCreateDocSendRefine = (_message: string) => {
  openToast({ message: '문서 보완 요청은 AI 연동 후 사용할 수 있습니다.', duration: 2000 })
}

const handleCopyResponse = async () => {
  // 채팅 onCopy와 동일 — 태그 제거 후 클립보드
  const text = (displayData.value?.rcontent ?? '').replace(/<[^>]*>/g, '')
  await copyToClipboard(text)
  openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
}
</script>
