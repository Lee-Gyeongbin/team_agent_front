<template>
  <div class="mtlcare-report-page">
    <div
      v-if="reportLoading"
      class="mtlcare-report-state"
    >
      <UiLoading text="" />
    </div>

    <UiEmpty
      v-else-if="reportError || !report"
      icon="icon-comment-other"
      :title="reportError || '리포트를 찾을 수 없습니다.'"
    />

    <div
      v-else
      class="mtlcare-report-layout"
    >
      <!-- 좌측: 방사형 그래프 + 영역별 점수 -->
      <div class="mtlcare-report-main">
        <div class="mtlcare-report-sheet">
          <div class="mtlcare-report-sheet-head">
            <div class="mtlcare-report-sheet-head-left">
              <i class="icon icon-chart size-18" />
              <span class="mtlcare-report-sheet-title">스트레스 진단 분석</span>
            </div>
          </div>

          <div
            ref="analysisSheetBodyRef"
            class="mtlcare-report-sheet-body"
          >
            <div class="mtlcare-report-radar-chart">
              <UiChart
                type="radar"
                :config="psychologyRadarChartConfig"
              />
            </div>
            <div class="mtlcare-report-radar-metrics">
              <StressScoreGrid
                :items="psychologyStressItems"
                :core-areas-text="report.coreAreasSummary"
                :risk-summary="report.riskSummary"
                :risk-color="report.riskColor"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 요청 정보 + AI 진단 보고서 -->
      <aside
        class="mtlcare-report-side"
        aria-label="면담 요청 및 진단 보고서"
      >
        <div class="mtlcare-report-side-scroll">
          <div class="mtlcare-report-lead-row">
            <div class="mtlcare-report-lead-main">
              <h1 class="mtlcare-report-title">{{ report.reqUserNm }}님의 면담 요청</h1>
              <p class="mtlcare-report-meta">
                <i class="icon-time size-14" />
                요청일 {{ report.createDt }}
              </p>
            </div>
            <button
              type="button"
              class="mtlcare-report-pdf-btn"
              :disabled="pdfDownloading"
              title="PDF 다운로드"
              @click="onDownloadPdf"
            >
              <span
                class="mtlcare-report-pdf-btn-icon is-pdf"
                aria-hidden="true"
              >
                <i class="icon icon-file-pdf size-24" />
              </span>
              <span class="mtlcare-report-pdf-btn-text">
                <span class="mtlcare-report-pdf-btn-label">PDF</span>
                <span class="mtlcare-report-pdf-btn-ext">{{ pdfDownloading ? '생성 중...' : '.pdf' }}</span>
              </span>
              <i
                class="icon icon-download size-16 mtlcare-report-pdf-btn-arrow"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            v-if="report.reqComment"
            class="mtlcare-report-comment"
          >
            <span class="mtlcare-report-comment-label">요청 메시지</span>
            <p class="mtlcare-report-comment-text">{{ report.reqComment }}</p>
          </div>

          <div class="mtlcare-report-side-divider" />

          <div class="mtlcare-report-sheet is-document">
            <div class="mtlcare-report-sheet-head">
              <div class="mtlcare-report-sheet-head-left">
                <i class="icon icon-sparkle size-18" />
                <span class="mtlcare-report-sheet-title">AI 진단 보고서</span>
              </div>
            </div>

            <div class="mtlcare-report-sheet-body is-scroll">
              <div
                class="mtlcare-report-html"
                v-html="formattedReportHtml"
              />
            </div>
          </div>
        </div>

        <div class="mtlcare-report-footer">
          <UiButton
            variant="primary"
            size="lg"
            :disabled="isConfirmed"
            :loading="confirming"
            @click="onConfirm"
          >
            {{ isConfirmed ? '확인 완료' : '확인 처리' }}
          </UiButton>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMtlcareStore } from '~/composables/mtlcare/useMtlcareStore'
import { downloadMtlcareReportAsPdf } from '~/utils/mtlcare/mtlcareReportExportUtil'
import { buildPsychologyRadarUiChartConfig, buildStressItemsFromRadarChartData } from '~/utils/chat/surveyUtil'
import type { RadarChartData, RadarChartScore } from '~/utils/chat/surveyUtil'

definePageMeta({ layout: 'default' })

const route = useRoute()
const reportId = computed(() => String(route.params.id))

const { report, reportLoading, reportError, handleSelectReport, handleConfirmReport } = useMtlcareStore()

const confirming = ref(false)
const pdfDownloading = ref(false)
const analysisSheetBodyRef = ref<HTMLElement | null>(null)

const isConfirmed = computed(() => report.value?.status === 'CONFIRMED')

/** 면담 권고사항의 br 구분 텍스트를 목록 형태로 변환 */
const formattedReportHtml = computed(() => {
  const html = report.value?.reportHtml
  if (!html) return ''

  return html.replace(
    /(<section class="mtlcare-report__section"><h3>면담 권고사항<\/h3><p>)([\s\S]*?)(<\/p><\/section>)/,
    (_match, prefix: string, content: string, suffix: string) => {
      const items = content
        .split(/<br\s*\/?>/i)
        .map((item) => item.trim())
        .filter(Boolean)

      if (!items.length) return `${prefix}${content}${suffix}`

      const list = items.map((item) => `<li>${item}</li>`).join('')
      return `${prefix}<ul class="mtlcare-report__recommend-list">${list}</ul>${suffix}`
    },
  )
})

const radarChartData = computed<RadarChartData | null>(() => {
  if (!report.value) return null
  let scores: RadarChartScore | null = null
  try {
    scores = JSON.parse(report.value.scoreJson) as RadarChartScore
  } catch {
    return null
  }
  return {
    scores,
    riskLevel: report.value.riskLevel,
    riskColor: report.value.riskColor,
    riskBgColor: report.value.riskBgColor,
    riskSummary: report.value.riskSummary,
    coreAreasSummary: report.value.coreAreasSummary,
  }
})

const psychologyStressItems = computed(() =>
  radarChartData.value ? buildStressItemsFromRadarChartData(radarChartData.value, 'male') : [],
)

const psychologyRadarChartConfig = computed(() =>
  radarChartData.value ? buildPsychologyRadarUiChartConfig(radarChartData.value, 'male') : {},
)

const onDownloadPdf = async () => {
  if (!report.value || !formattedReportHtml.value.trim()) {
    openToast({ message: '다운로드할 리포트 내용이 없습니다.', type: 'warning' })
    return
  }

  pdfDownloading.value = true
  try {
    const ok = await downloadMtlcareReportAsPdf({
      reqUserNm: report.value.reqUserNm,
      createDt: report.value.createDt,
      reqComment: report.value.reqComment,
      reportHtml: formattedReportHtml.value,
      analysisSheetBodyElement: analysisSheetBodyRef.value,
    })

    if (!ok) {
      openToast({ message: 'PDF 생성에 실패했습니다.', type: 'warning' })
      return
    }

    openToast({ message: '인쇄 창이 열렸습니다. PDF로 저장을 선택하세요.', type: 'success' })
  } finally {
    pdfDownloading.value = false
  }
}

const onConfirm = async () => {
  confirming.value = true
  try {
    const res = await handleConfirmReport(reportId.value)
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || '확인 처리에 실패했습니다.', type: 'warning' })
      return
    }
    openToast({ message: '확인 처리가 완료되었습니다.', type: 'success' })
  } finally {
    confirming.value = false
  }
}

onMounted(() => {
  if (reportId.value) handleSelectReport(reportId.value)
})
</script>
