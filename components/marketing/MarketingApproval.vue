<template>
  <div class="marketing-approval">
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
        AI 검수
      </button>
    </div>

    <div
      v-if="approval && approval.approvedYn === 'Y'"
      class="marketing-approval-done"
    >
      <UiIcon
        name="check"
        size="24"
      />
      <h2>승인이 완료되었습니다.</h2>
      <p>다음 단계로 발행 설정을 진행하거나 캘린더에서 일정을 확인하세요.</p>

      <div class="marketing-approval-next-grid">
        <button
          type="button"
          class="marketing-approval-next-card"
          @click="pushMarketingPhase('schedule')"
        >
          <UiIcon
            name="send"
            size="20"
          />
          <strong>발행 설정하기</strong>
          <span>즉시 발행 또는 예약 발행을 설정합니다.</span>
        </button>
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
          <span>전체 캠페인의 발행 일정을 확인합니다.</span>
        </button>
        <button
          type="button"
          class="marketing-approval-next-card"
          @click="emit('go-list')"
        >
          <UiIcon
            name="arrow-right"
            size="20"
          />
          <strong>캠페인으로 돌아가기</strong>
          <span>제작 내역 목록으로 이동합니다.</span>
        </button>
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
          <span
            :class="[
              'marketing-status-badge',
              reviewResult.verdict === 'PASS' ? 'status-review-pass' : 'status-review-fail',
            ]"
          >
            AI 검수 {{ reviewResult.verdictLabel }}
          </span>
          <span>{{ reviewResult.score }}점</span>
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">검토자</label>
          <p class="marketing-approval-reviewer">{{ reviewerNm }}</p>
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">메모<span class="marketing-form-hint">(선택)</span></label>
          <UiTextarea
            v-model="memo"
            placeholder="승인/반려 사유를 남겨 주세요."
            :rows="3"
          />
        </div>

        <div class="marketing-approval-actions">
          <UiButton
            variant="outline"
            size="md"
            class="marketing-btn-danger"
            :disabled="isApproving"
            @click="onReject"
          >
            반려하기
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            :disabled="isApproving"
            @click="onApprove"
          >
            승인하기
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiTextarea } from '@leechanyong/ispark-ui'
import { useAuth } from '~/composables/com/useAuth'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'

const emit = defineEmits<{
  'go-calendar': []
  'go-list': []
}>()

const {
  currentContent,
  displayResult,
  displayTitle,
  reviewResult,
  approval,
  isApproving,
  handleApprove,
  handleReject,
  resetApprovalState,
  pushMarketingPhase,
  popMarketingPhase,
} = useMarketingStore()
const { user } = useAuth()

const contentId = computed(() => currentContent.value?.contentId ?? '')
const reviewerNm = computed(() => String(user.value?.userNm ?? '').trim() || '-')
const memo = ref('')

const previewText = computed(() => {
  const variants = displayResult.value?.variants ?? []
  return variants.find((variant) => variant.recommended)?.content ?? variants[0]?.content ?? ''
})

const previewImageUrl = computed(() => {
  const images = displayResult.value?.images ?? []
  return images.find((image) => image.recommended)?.url ?? images[0]?.url ?? ''
})

const onApprove = async () => {
  if (!contentId.value) return
  await handleApprove(contentId.value, memo.value)
}

const onReject = async () => {
  if (!contentId.value) return
  const ok = await handleReject(contentId.value, memo.value)
  if (ok) popMarketingPhase()
}

onMounted(() => {
  if (currentContent.value && approval.value?.contentId !== currentContent.value.contentId) resetApprovalState()
})
</script>
