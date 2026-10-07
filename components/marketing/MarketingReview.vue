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
        <UiButton
          variant="primary"
          size="sm"
          :disabled="isReviewing || isApplyingFix"
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
              <span :class="['marketing-status-badge', verdictBadgeClass]">
                {{ reviewResult.verdictLabel }}
              </span>
              <p class="marketing-review-panel__desc">
                {{ verdictDesc }}
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
                v-if="reviewResult.issues.some((issue) => issue.targetType === 'TEXT' && issue.fixAppliedYn !== 'Y')"
                variant="ghost"
                size="xs"
                :disabled="isApplyingFix || isReviewing"
                @click="handleApplyFix('ALL')"
              >
                문구 수정안 모두 적용
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
                {{ issue.targetType === 'IMAGE' ? '[이미지]' : '[문구]' }} {{ issue.title }}
              </div>
              <p>{{ issue.description }}</p>
              <div class="marketing-review-issue__fix">{{ issue.fixSuggestion }}</div>
              <UiButton
                variant="outline"
                size="xs"
                :disabled="isApplyingFix || isReviewing || issue.fixAppliedYn === 'Y'"
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
            v-if="canProceedToApproval"
            variant="primary"
            size="md"
            full-width
            @click="pushMarketingPhase('approval')"
          >
            사용자 승인 진행하기 →
          </UiButton>
        </template>
        <UiEmpty
          v-else
          icon="icon-search"
          title="검수를 실행하면 결과가 여기에 표시됩니다."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiEmpty, UiIcon, UiLoading } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import { marketingReviewVerdictBadgeClass, type MarketingReviewVerdict } from '~/types/marketing'

const {
  currentContent,
  displayResult,
  displayTitle,
  selectedVariantId,
  reviewResult,
  isReviewing,
  isApplyingFix,
  handleRunReview,
  handleApplyFix,
  pushMarketingPhase,
  popMarketingPhase,
} = useMarketingStore()

const contentId = computed(() => currentContent.value?.contentId ?? '')

const previewText = computed(() => {
  const variants = displayResult.value?.variants ?? []
  return variants.find((variant) => variant.id === selectedVariantId.value)?.content ?? ''
})

const previewImageUrl = computed(() => {
  const images = displayResult.value?.images ?? []
  return images.find((image) => image.id === selectedVariantId.value)?.url ?? ''
})

/** 검수 판정 3단계 공통 색상 — PASS(초록)/REVIEW(주황, 확인 필요)/FAIL(빨강, 승인·발행 차단) */
const VERDICT_RING_COLOR: Record<MarketingReviewVerdict, string> = {
  PASS: '#1e8e5a',
  REVIEW: '#b4780f',
  FAIL: '#ef4444',
}
const VERDICT_DESC: Record<MarketingReviewVerdict, string> = {
  PASS: '검수를 통과했습니다. 승인 단계로 진행할 수 있습니다.',
  REVIEW: '확인이 필요한 항목이 있습니다. 내용을 확인한 뒤 승인 단계로 진행할 수 있습니다.',
  FAIL: '승인·발행을 막는 문제가 발견되었습니다. AI 수정안을 적용한 뒤 다시 검수해 주세요.',
}

const ringColor = computed(() => VERDICT_RING_COLOR[reviewResult.value?.verdict ?? 'REVIEW'])
const verdictBadgeClass = computed(() => marketingReviewVerdictBadgeClass[reviewResult.value?.verdict ?? 'REVIEW'])
const verdictDesc = computed(() => VERDICT_DESC[reviewResult.value?.verdict ?? 'REVIEW'])
/** FAIL만 승인 진입을 막는다 — REVIEW는 확인 후 승인 가능. 반려 후(002)에는 재검수가 먼저다 */
const canProceedToApproval = computed(
  () =>
    !!reviewResult.value &&
    reviewResult.value.verdict !== 'FAIL' &&
    ['003', '004', '005', '006'].includes(currentContent.value?.statusCd ?? '') &&
    !isApplyingFix.value &&
    !isReviewing.value,
)

const onRerunReview = () => {
  if (!contentId.value) return
  void handleRunReview(contentId.value)
}

onMounted(() => {
  if (contentId.value && reviewResult.value?.contentId !== contentId.value) onRerunReview()
})
</script>
