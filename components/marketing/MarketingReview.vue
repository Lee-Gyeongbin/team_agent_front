<template>
  <div class="marketing-review">
    <div class="marketing-page-form-bar">
      <button
        type="button"
        class="marketing-page-back"
        @click="popMarketingPhase()"
      >
        <UiIcon
          name="arrow-right"
          size="16"
          class="marketing-page-back__arrow"
        />
        시안 수정하기
      </button>
      <div class="marketing-review__actions">
        <UiDropdownMenu
          v-if="contentId"
          :items="EXPORT_MENU_ITEMS"
          align="end"
          :open="isExportMenuOpen"
          @update:open="onExportMenuOpenChange"
          @select="onExport"
        >
          <template #trigger>
            <UiButton
              variant="outline"
              size="sm"
              :disabled="isExporting"
            >
              <template #icon-left>
                <UiIcon
                  name="download"
                  size="14"
                />
              </template>
              다운로드
            </UiButton>
          </template>
        </UiDropdownMenu>
        <UiButton
          variant="primary"
          size="sm"
          :disabled="isReviewing"
          @click="onRerunReview"
        >
          <template #icon-left>
            <UiIcon
              name="refresh-cw"
              size="14"
            />
          </template>
          {{ isReviewing ? '검수 중...' : '검수하기' }}
        </UiButton>
      </div>
    </div>

    <UiLoading
      v-if="isReviewing && !reviewResult"
      text="AI가 콘텐츠를 검수하고 있습니다..."
    />

    <div
      v-else
      class="marketing-review__layout"
    >
      <div class="marketing-review-preview">
        <h2 class="marketing-review-preview__title">{{ displayTitle || '콘텐츠 미리보기' }}</h2>
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          class="marketing-review-preview__image"
          alt="시안 이미지"
        />
        <p
          v-if="previewText"
          class="marketing-review-preview__text"
        >
          {{ previewText }}
        </p>
      </div>

      <div class="marketing-review-panel">
        <template v-if="reviewResult">
          <div class="marketing-review-panel__head">
            <div
              class="marketing-score-ring"
              :style="{ '--pct': `${reviewResult.score}%`, '--ring-color': ringColor }"
            >
              <span>{{ reviewResult.score }}</span>
            </div>
            <div>
              <span
                :class="[
                  'marketing-status-badge',
                  reviewResult.verdict === 'PASS' ? 'status-review-pass' : 'status-review-fail',
                ]"
              >
                {{ reviewResult.verdictLabel }}
              </span>
              <p class="marketing-review-panel__desc">
                {{
                  reviewResult.verdict === 'PASS'
                    ? '검수를 통과했습니다. 승인 단계로 진행할 수 있습니다.'
                    : '수정이 필요한 항목이 있습니다. AI 수정안을 적용한 뒤 다시 검수해 주세요.'
                }}
              </p>
            </div>
          </div>

          <div class="marketing-review-checklist">
            <div
              v-for="check in reviewResult.checks"
              :key="check.key"
              class="marketing-review-check-row"
            >
              <span>{{ check.label }}</span>
              <span :class="['marketing-review-check-row__status', `is-${check.status.toLowerCase()}`]">
                {{ check.score }}점
              </span>
            </div>
          </div>

          <div
            v-if="reviewResult.issues.length"
            class="marketing-review-issues"
          >
            <div class="marketing-review-issues__head">
              <h3>발견된 주요 이슈 ({{ reviewResult.issues.length }})</h3>
              <UiButton
                variant="ghost"
                size="xs"
                @click="handleApplyAllFixes"
              >
                AI 수정안 모두 적용
              </UiButton>
            </div>
            <div
              v-for="issue in reviewResult.issues"
              :key="issue.issueId"
              class="marketing-review-issue"
              :class="{ 'is-applied': issue.fixAppliedYn === 'Y' }"
            >
              <div class="marketing-review-issue__label">
                <UiIcon
                  :name="issue.severity === 'FAIL' ? 'octagon-alert' : 'triangle-alert'"
                  size="14"
                />
                {{ issue.title }}
              </div>
              <p>{{ issue.description }}</p>
              <div class="marketing-review-issue__fix">{{ issue.fixSuggestion }}</div>
              <UiButton
                variant="outline"
                size="xs"
                :disabled="issue.fixAppliedYn === 'Y'"
                @click="handleApplyFix(issue.issueId)"
              >
                {{ issue.fixAppliedYn === 'Y' ? '적용됨' : 'AI 수정안 적용' }}
              </UiButton>
            </div>
          </div>
          <div
            v-else
            class="marketing-review-clean-pass"
          >
            <UiIcon
              name="check"
              size="16"
            />
            발견된 이슈가 없습니다.
          </div>

          <UiButton
            v-if="reviewResult.verdict === 'PASS'"
            variant="primary"
            size="md"
            full-width
            @click="pushMarketingPhase('approval')"
          >
            사용자 승인 진행하기 →
          </UiButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiDropdownMenu, UiIcon, UiLoading, type DropdownMenuItemDef } from '@leechanyong/ispark-ui'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingExport } from '~/composables/marketing/useMarketingExport'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'

const {
  currentContent,
  displayResult,
  displayTitle,
  reviewResult,
  isReviewing,
  handleRunReview,
  handleApplyFix,
  handleApplyAllFixes,
  pushMarketingPhase,
  popMarketingPhase,
} = useMarketingStore()
const { fetchExportMarketingContentHtml } = useMarketingApi()
const { exportMarketingHtmlAsPdf, exportMarketingHtmlAsDocx } = useMarketingExport()

const contentId = computed(() => currentContent.value?.contentId ?? '')

const previewText = computed(() => {
  const variants = displayResult.value?.variants ?? []
  return variants.find((variant) => variant.recommended)?.content ?? variants[0]?.content ?? ''
})

const previewImageUrl = computed(() => {
  const images = displayResult.value?.images ?? []
  return images.find((image) => image.recommended)?.url ?? images[0]?.url ?? ''
})

const ringColor = computed(() => (reviewResult.value?.verdict === 'PASS' ? '#1e8e5a' : '#b4780f'))

const EXPORT_MENU_ITEMS: DropdownMenuItemDef[] = [
  { label: 'Word로 저장', value: 'word' },
  { label: 'PDF로 저장', value: 'pdf' },
]

const isExportMenuOpen = ref(false)
const isExporting = ref(false)

const onExportMenuOpenChange = (open: boolean) => {
  if (open && isExporting.value) {
    isExportMenuOpen.value = false
    return
  }
  isExportMenuOpen.value = open
}

const onExport = async (format: string) => {
  isExportMenuOpen.value = false
  const id = contentId.value
  if (!id || isExporting.value || (format !== 'word' && format !== 'pdf')) return
  isExporting.value = true
  try {
    const { successYn, html, returnMsg } = await fetchExportMarketingContentHtml(id)
    if (!successYn || !html) {
      openToast({ message: returnMsg || '내보내기에 실패했습니다.', type: 'error' })
      return
    }
    if (format === 'pdf') await exportMarketingHtmlAsPdf(html)
    else await exportMarketingHtmlAsDocx(html, displayTitle.value || '마케팅_콘텐츠')
  } catch {
    openToast({ message: '내보내기에 실패했습니다.', type: 'error' })
  } finally {
    isExporting.value = false
  }
}

const onRerunReview = () => {
  if (!contentId.value) return
  void handleRunReview(contentId.value)
}

onMounted(() => {
  if (contentId.value && reviewResult.value?.contentId !== contentId.value) onRerunReview()
})
</script>
