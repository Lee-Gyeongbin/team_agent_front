<template>
  <div class="marketing-channel-results">
    <button
      class="marketing-back-btn"
      type="button"
      @click="popMarketingPhase()"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      채널 구성 확인
    </button>

    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">멀티채널 생성 결과</h1>
        <p class="marketing-list-desc">채널별로 시안이 생성되었습니다. 카드를 눌러 콘텐츠를 확인하고 수정하세요.</p>
      </div>
    </div>

    <div class="marketing-channel-results__strategy">
      <h2>자료 분석 기반 이미지 전략</h2>
      <p>
        업로드한 자료와 프로젝트 기획서에서 제품 특징, 브랜드 톤, 강조 메시지를 추출한 뒤 각 채널의 발행 목적에 맞게
        이미지 전략을 다르게 세웠습니다.
      </p>
      <p class="marketing-channel-results__strategy-box">{{ strategyIntro }}</p>
    </div>

    <UiEmpty
      v-if="!resultCards.length"
      icon="icon-edit"
      title="생성된 채널 콘텐츠가 없습니다."
    />
    <div
      v-else
      class="marketing-channel-results__grid"
    >
      <button
        v-for="card in resultCards"
        :key="card.channelCd"
        type="button"
        class="marketing-channel-results__card"
        :disabled="!card.contentId || isGeneratingChannelBatch"
        @click="handleOpenChannelContent(card.contentId)"
      >
        <div class="marketing-channel-results__card-head">
          <div>
            <strong>{{ card.channelNm }}</strong>
            <span class="marketing-channel-results__card-format">{{ card.formatLabel }}</span>
          </div>
          <span :class="['marketing-status-badge', `progress-${STATUS_KEY[card.aiStatusCd]}`]">
            {{ STATUS_LABEL[card.aiStatusCd] }}
          </span>
        </div>
        <MarketingPreparingStatus
          v-if="card.aiStatusCd === '002'"
          :bordered="false"
        />
        <template v-else>
          <div class="marketing-channel-results__card-meta">
            <span>텍스트 생성</span>
            <span :class="{ 'is-off': card.withImageYn !== 'Y' }">
              {{ card.withImageYn === 'Y' ? '이미지 생성' : '이미지 없음' }}
            </span>
          </div>
          <p class="marketing-channel-results__card-desc">{{ card.imageStrategy }}</p>
          <span
            v-if="card.aiStatusCd === '003'"
            class="marketing-channel-results__card-action"
          >
            콘텐츠 수정 →
          </span>
          <span
            v-else
            class="marketing-channel-results__card-desc is-failed"
          >
            생성에 실패했습니다. 눌러서 확인하고 다시 생성할 수 있습니다.
          </span>
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiEmpty, UiIcon } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingAiStatusCd } from '~/types/marketing'

const STATUS_LABEL: Record<MarketingAiStatusCd, string> = {
  '001': '대기',
  '002': '생성 중',
  '003': '생성 완료',
  '004': '생성 실패',
}

const STATUS_KEY: Record<MarketingAiStatusCd, string> = {
  '001': 'waiting',
  '002': 'generating',
  '003': 'done',
  '004': 'failed',
}

const {
  channelBatch,
  channelPicks,
  campaignDraft,
  isGeneratingChannelBatch,
  handleOpenChannelContent,
  popMarketingPhase,
} = useMarketingStore()

const resultCards = computed(() =>
  channelBatch.value.map((item) => {
    const pick = channelPicks.value.find((channel) => channel.channelCd === item.channelCd)
    return {
      ...item,
      formatLabel: pick?.formatOptions.join(' · ') ?? '',
      imageStrategy: pick?.imageStrategy ?? '',
      withImageYn: pick?.withImageYn ?? 'Y',
    }
  }),
)

const strategyIntro = computed(() => {
  const visualTxt = String(campaignDraft.value?.visualTxt ?? '').trim()
  const lines = resultCards.value
    .map((card) => (card.imageStrategy ? `${card.channelNm}: ${card.imageStrategy}` : ''))
    .filter(Boolean)
  if (visualTxt && lines.length) return `${visualTxt} ${lines.join(' ')}`
  if (visualTxt) return visualTxt
  if (lines.length) return lines.join(' ')
  return '분석된 자료 기준으로 채널별 이미지 전략을 생성합니다.'
})
</script>
