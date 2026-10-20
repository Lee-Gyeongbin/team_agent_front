<template>
  <div class="marketing-approval">
    <div
      v-if="approval && approval.approvedYn === 'Y'"
      class="marketing-approval-done"
    >
      <UiIcon
        name="check"
        size="24"
      />
      <h2>승인이 완료되었습니다.</h2>
      <p>다음 단계로 발행 설정을 진행하세요.</p>

      <div class="marketing-approval-next-grid">
        <button
          type="button"
          class="marketing-approval-next-card"
          @click="moveMarketingContentStep('schedule')"
        >
          <UiIcon
            name="send"
            size="20"
          />
          <strong>발행 설정하기</strong>
          <span>즉시 발행 또는 예약 발행을 설정합니다.</span>
        </button>
        <!-- 프로젝트 캘린더는 기능 준비 전까지 숨긴다. 다시 열 때 'go-calendar' emit과 [id].vue 연결도 함께 추가 -->
        <!--
        <button
          type="button"
          class="marketing-approval-next-card"
          @click="emit('go-calendar')"
        >
          <UiIcon
            name="calendar"
            size="20"
          />
          <strong>캘린더 확인</strong>
          <span>전체 프로젝트의 발행 일정을 확인합니다.</span>
        </button>
        -->
        <button
          type="button"
          class="marketing-approval-next-card"
          @click="emit('go-list')"
        >
          <UiIcon
            name="arrow-right"
            size="20"
          />
          <strong>프로젝트로 돌아가기</strong>
          <span>콘텐츠 목록으로 이동합니다.</span>
        </button>
        <!-- 승인 취소는 기능 준비 전까지 숨긴다. 다시 열 때 아래 버튼과 canCancelApproval, onCancelApproval, handleCancelApproval 연결을 함께 복구 -->
        <!--
        <button
          v-if="canCancelApproval"
          type="button"
          class="marketing-approval-next-card is-danger"
          :disabled="isApproving"
          @click="onCancelApproval"
        >
          <UiIcon
            name="rotate-ccw"
            size="20"
          />
          <strong>승인 취소하기</strong>
          <span>검수 중으로 되돌려 작성자가 다시 수정할 수 있게 합니다. 예약도 함께 풀립니다.</span>
        </button>
        -->
      </div>
    </div>

    <div
      v-else
      class="marketing-approval__layout"
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

      <div class="marketing-approval-panel">
        <div
          v-if="reviewResult"
          class="marketing-approval-panel__review"
        >
          <span :class="['marketing-status-badge', verdictBadgeClass]"> AI 검수 {{ reviewResult.verdictLabel }} </span>
          <span>{{ reviewResult.score }}점</span>
        </div>

        <!-- 검토자가 판정 근거를 볼 수 있도록 검수 결과를 읽기 전용으로 요약한다 -->
        <details
          v-if="reviewResult"
          class="marketing-approval-report"
          open
        >
          <summary>AI 검수 리포트</summary>
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
            class="marketing-approval-report__issues"
          >
            <p class="marketing-approval-report__label">발견된 이슈 ({{ reviewResult.issues.length }})</p>
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
                <span v-if="issue.fixAppliedYn === 'Y'">· 수정안 적용됨</span>
              </div>
              <p>{{ issue.description }}</p>
            </div>
          </div>
          <p
            v-else
            class="marketing-approval-report__label"
          >
            발견된 이슈가 없습니다.
          </p>
        </details>

        <div class="marketing-form-field">
          <label class="marketing-form-label">검토자</label>
          <p class="marketing-approval-reviewer">{{ reviewerNm }}</p>
        </div>

        <!-- 지정 승인자가 아니면 승인 입력 대신 대기 안내만 보여준다 -->
        <p
          v-if="!isCurrentApprover"
          class="marketing-approval-waiting"
        >
          {{ reviewerNm }}님의 승인을 기다리고 있습니다.
          {{
            reviewResult?.verdict === 'REVIEW'
              ? '검토 필요 판정이라 승인 전까지 콘텐츠를 수정할 수 있으며, 수정하면 다시 검수해야 합니다.'
              : '승인 진행 중에는 콘텐츠를 수정할 수 없습니다.'
          }}
        </p>
        <template v-else>
          <div class="marketing-form-field">
            <label class="marketing-form-label">메모<span class="marketing-form-hint">(선택)</span></label>
            <UiTextarea
              v-model="memo"
              placeholder="승인/반려 사유를 남겨 주세요."
              :rows="3"
            />
          </div>

          <p
            v-if="!currentContent?.canApprove"
            class="marketing-form-hint"
          >
            현재 시안 검수 후 승인·반려할 수 있습니다.
          </p>
          <div class="marketing-approval-actions">
            <UiButton
              variant="outline"
              size="md"
              class="marketing-btn-danger"
              :disabled="isApproving || !currentContent?.canApprove"
              @click="onReject"
            >
              반려하기
            </UiButton>
            <UiButton
              variant="primary"
              size="md"
              :disabled="isApproving || !currentContent?.canApprove"
              @click="onApprove"
            >
              승인하기
            </UiButton>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiTextarea } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import { marketingReviewVerdictBadgeClass } from '~/types/marketing'

const emit = defineEmits<{
  'go-list': []
}>()

const {
  currentContent,
  displayResult,
  displayTitle,
  selectedVariantId,
  reviewResult,
  approval,
  isApproving,
  handleApprove,
  handleReject,
  popMarketingPhase,
  isCurrentApprover,
  moveMarketingContentStep,
} = useMarketingStore()

// 승인 취소는 기능 준비 전까지 닫아 둔다. 지정 승인자가 승인 완료(004)·예약(005)에서만 가능 (서버 cancelApproval과 같은 기준)
// const canCancelApproval = computed(
//   () => isCurrentApprover.value && ['004', '005'].includes(currentContent.value?.statusCd ?? ''),
// )
//
// const onCancelApproval = async () => {
//   if (!mktContentId.value || !canCancelApproval.value) return
//   const confirmed = await openConfirm({
//     title: '승인 취소',
//     message: '승인을 취소하면 콘텐츠가 검수 중으로 돌아가고, 예약된 발행도 함께 취소됩니다.\n승인을 취소할까요?',
//     confirmText: '승인 취소',
//     cancelText: '닫기',
//   })
//   if (!confirmed) return
//   const ok = await handleCancelApproval(mktContentId.value)
//   if (ok) handleBackToList()
// }

const mktContentId = computed(() => currentContent.value?.mktContentId ?? '')
const reviewerNm = computed(() => currentContent.value?.approverUserNm || '승인자 미지정')
const memo = ref('')
const verdictBadgeClass = computed(() => marketingReviewVerdictBadgeClass[reviewResult.value?.verdict ?? 'REVIEW'])

const previewText = computed(() => {
  const variants = displayResult.value?.variants ?? []
  return variants.find((variant) => variant.id === selectedVariantId.value)?.content ?? ''
})

const previewImageUrl = computed(() => {
  const images = displayResult.value?.images ?? []
  return images.find((image) => image.id === selectedVariantId.value)?.url ?? ''
})

const onApprove = async () => {
  if (!mktContentId.value) return
  await handleApprove(mktContentId.value, memo.value)
}

const onReject = async () => {
  if (!mktContentId.value) return
  const ok = await handleReject(mktContentId.value, memo.value)
  if (ok) popMarketingPhase()
}
</script>
