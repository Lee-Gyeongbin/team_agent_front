<template>
  <div class="marketing-channel-content-tabs">
    <Teleport
      defer
      to="#marketing-form-bar-extra"
    >
      <p
        v-if="contentEditLock"
        class="marketing-channel-content-tabs__locked"
        role="status"
      >
        <UiIcon
          name="lock"
          size="14"
        />
        <span>{{ CONTENT_LOCK_MESSAGE[contentEditLock] }}</span>
      </p>
    </Teleport>
    <Teleport
      defer
      to="#marketing-form-bar-actions"
    >
      <UiButton
        v-if="currentContent?.aiStatusCd === '004'"
        variant="outline"
        size="sm"
        :disabled="isSubmitting"
        @click="handleRetryGeneration"
      >
        실패한 부분 다시 생성
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        :disabled="isSubmitting || isSelectingVariant || currentContent?.aiStatusCd !== '003' || !!contentEditLock"
        @click="pushMarketingPhase('review')"
      >
        저장 및 AI 검수 →
      </UiButton>
    </Teleport>

    <div
      v-if="channelBatch.length > 1"
      class="marketing-channel-tabs"
    >
      <button
        v-for="item in channelBatch"
        :key="item.channelCd"
        type="button"
        class="marketing-channel-tabs__tab"
        :class="{ 'is-active': item.mktContentId === activeBatchContentId }"
        :disabled="!item.mktContentId || isSubmitting || isSelectingVariant"
        @click="handleSwitchChannelTab(item.mktContentId)"
      >
        {{ item.channelNm }}
      </button>
    </div>

    <UiLoading
      v-if="isLoadingContent"
      text="콘텐츠를 불러오는 중..."
    />
    <!-- 채널 탭을 바꾸면 보완 대화·입력·선택 시안이 섞이지 않도록 콘텐츠마다 새로 그린다 -->
    <MarketingResult
      v-else-if="hasDisplayResult && displayAuthoringResult"
      :key="currentContent?.mktContentId"
      class="marketing-page-result-card"
      :result="displayAuthoringResult"
      :mkt-content-id="currentContent?.mktContentId ?? ''"
      :content-title="displayTitle"
      :org-nm="currentProject?.orgNm ?? ''"
      :project-nm="currentProject?.projectNm ?? ''"
      :request="displayRequest"
      :config="config"
      :is-loading="isSubmitting && !refiningType"
      :refining-type="refiningType"
      :refining-variant-id="refiningVariantId"
      :refine-completed-at="refineCompletedAt"
      :generating-step="generatingStep"
      :save-variant="handleSaveVariantText"
      :restore-variant="handleRestoreVariant"
      :adopted-variant-id="selectedVariantId"
      :is-selecting-variant="isSelectingVariant"
      :is-locked="!!contentEditLock"
      @edit-with-agent="handleEditWithAgent"
      @used="handleUseVariant"
    />
    <UiEmpty
      v-else
      icon="icon-edit"
      title="생성 결과가 없습니다."
    />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiEmpty, UiIcon, UiLoading } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import { enrichMarketingResultForDisplay } from '~/utils/marketing/marketingUtil'

const {
  config,
  currentProject,
  currentContent,
  displayResult,
  displayTitle,
  displayRequest,
  selectedVariantId,
  isSelectingVariant,
  handleRetryGeneration,
  isSubmitting,
  isLoadingContent,
  refiningType,
  refiningVariantId,
  refineCompletedAt,
  generatingStep,
  handleEditWithAgent,
  handleSaveVariantText,
  handleRestoreVariant,
  handleUseVariant,
  channelBatch,
  activeBatchContentId,
  handleSwitchChannelTab,
  pushMarketingPhase,
  contentEditLock,
} = useMarketingStore()

const CONTENT_LOCK_MESSAGE = {
  APPROVAL: '검토자 승인 진행 중에는 콘텐츠를 수정·재검수할 수 없습니다. 검토자가 반려하면 다시 수정할 수 있습니다.',
  APPROVED:
    '승인 완료·예약·발행완료 콘텐츠는 수정·재검수·이름 변경을 할 수 없습니다. 발행 전이라면 승인자가 승인을 취소해 다시 수정할 수 있습니다.',
} as const

const hasDisplayResult = computed(() => {
  const result = displayResult.value
  if (!result) return false
  return isSubmitting.value || result.variants.length > 0 || result.images.length > 0
})

const displayAuthoringResult = computed(() => {
  if (!displayResult.value) return null
  return enrichMarketingResultForDisplay(displayResult.value, displayRequest.value)
})
</script>
