<template>
  <div class="marketing-channel-content-tabs">
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
        콘텐츠 목록
      </button>
      <UiButton
        variant="primary"
        size="sm"
        :disabled="isSubmitting || !currentContent"
        @click="pushMarketingPhase('review')"
      >
        저장 및 AI 검수 →
      </UiButton>
    </div>

    <div
      v-if="channelBatch.length > 1"
      class="marketing-channel-tabs"
    >
      <button
        v-for="item in channelBatch"
        :key="item.channelCd"
        type="button"
        class="marketing-channel-tabs__tab"
        :class="{ 'is-active': item.contentId === activeBatchContentId }"
        :disabled="item.statusCd !== '003'"
        @click="handleSwitchChannelTab(item.contentId)"
      >
        {{ item.channelNm }}
      </button>
    </div>

    <UiLoading
      v-if="isLoadingContent"
      text="콘텐츠를 불러오는 중..."
    />
    <MarketingResult
      v-else-if="hasDisplayResult && displayAuthoringResult"
      class="marketing-page-result-card"
      :result="displayAuthoringResult"
      :content-id="currentContent?.contentId ?? ''"
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
      :theme-color-hex="themeColorHex"
      :show-side-panel="true"
      :save-variant="handleSaveVariantText"
      :adopted-variant-id="selectedVariantId"
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
  themeColorHex,
  currentProject,
  currentContent,
  displayResult,
  displayTitle,
  displayRequest,
  selectedVariantId,
  isSubmitting,
  isLoadingContent,
  refiningType,
  refiningVariantId,
  refineCompletedAt,
  generatingStep,
  handleEditWithAgent,
  handleSaveVariantText,
  handleUseVariant,
  channelBatch,
  activeBatchContentId,
  handleSwitchChannelTab,
  pushMarketingPhase,
  popMarketingPhase,
} = useMarketingStore()

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
