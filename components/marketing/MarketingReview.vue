<template>
  <div class="marketing-review">
    <Teleport
      defer
      to="#marketing-form-bar-actions"
    >
      <UiButton
        variant="primary"
        size="sm"
        :disabled="isReviewing || isApplyingFix || !!contentEditLock"
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
    </Teleport>

    <div class="marketing-review__layout">
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
        <!-- 첫 검수·재검수 모두 이전 결과 대신 진행 상태를 패널에 보여준다 -->
        <UiLoading
          v-if="isReviewing"
          class="marketing-review-panel__progress"
          text="AI가 콘텐츠를 검수하고 있습니다..."
        />
        <template v-else-if="reviewResult">
          <p
            v-if="contentEditLock === 'APPROVED'"
            class="marketing-approval-waiting"
          >
            승인이 완료된 콘텐츠입니다. 검수 결과만 확인할 수 있습니다.
          </p>
          <p
            v-else-if="contentEditLock === 'APPROVAL'"
            class="marketing-approval-waiting"
          >
            검수를 통과해 검토자 승인이 진행 중입니다. 수정·재검수는 검토자가 반려한 뒤에 할 수 있습니다.
          </p>
          <p
            v-else-if="isRejected"
            class="marketing-approval-waiting"
          >
            검토자가 반려했습니다{{ approval?.memo ? ` (사유: ${approval.memo})` : '' }}. 내용을 수정하거나 다시 검수한
            뒤 승인을 진행해 주세요.
          </p>
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
                :disabled="isApplyingFix || isReviewing || !!contentEditLock"
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
                :disabled="isApplyingFix || isReviewing || !!contentEditLock || issue.fixAppliedYn === 'Y'"
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

          <div
            v-if="canProceedToApproval"
            class="marketing-review-panel__foot"
          >
            <UiButton
              variant="primary"
              size="sm"
              @click="pushMarketingPhase('approval')"
            >
              사용자 승인 진행하기 →
            </UiButton>
          </div>
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
  approval,
  contentEditLock,
} = useMarketingStore()

const mktContentId = computed(() => currentContent.value?.mktContentId ?? '')

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

/** 반려되면 검수 중(002)으로 돌아오고 마지막 승인 이력이 반려(N)로 남는다 */
const isRejected = computed(() => currentContent.value?.statusCd === '002' && approval.value?.approvedYn === 'N')
const ringColor = computed(() => VERDICT_RING_COLOR[reviewResult.value?.verdict ?? 'REVIEW'])
const verdictBadgeClass = computed(() => marketingReviewVerdictBadgeClass[reviewResult.value?.verdict ?? 'REVIEW'])
const verdictDesc = computed(() => VERDICT_DESC[reviewResult.value?.verdict ?? 'REVIEW'])
/** 검수 통과(003)일 때만 승인 단계로 보낸다 — FAIL은 막고, 반려 후(002)는 재검수가 먼저, 승인 완료 이후는 결과 보기만 */
const canProceedToApproval = computed(
  () =>
    !!reviewResult.value &&
    reviewResult.value.verdict !== 'FAIL' &&
    currentContent.value?.statusCd === '003' &&
    !isApplyingFix.value &&
    !isReviewing.value,
)

const onRerunReview = () => {
  if (!mktContentId.value || contentEditLock.value) return
  void handleRunReview(mktContentId.value)
}

onMounted(() => {
  // 결과가 없을 때만 자동 검수한다. 잠긴 콘텐츠는 서버가 막으므로 실행하지 않는다
  if (mktContentId.value && !contentEditLock.value && reviewResult.value?.mktContentId !== mktContentId.value) {
    void handleRunReview(mktContentId.value)
  }
})
</script>
