<template>
  <div class="marketing-channel-results">
    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">멀티채널 생성 결과</h1>
        <p class="marketing-list-desc">
          {{
            isGeneratingChannelBatch
              ? '채널별로 시안을 만들고 있습니다. 화면을 나가도 생성은 계속되며 제작 내역에서 확인할 수 있습니다.'
              : '채널별로 시안이 생성되었습니다. 카드를 눌러 콘텐츠를 확인하고 수정하세요.'
          }}
        </p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="outline"
          size="md"
          @click="onLeave"
        >
          콘텐츠 목록으로 돌아가기
        </UiButton>
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
        :class="{ 'is-failed': card.aiStatusCd === '004' }"
        :disabled="!card.mktContentId || card.aiStatusCd === '001' || card.aiStatusCd === '002'"
        @click="handleOpenChannelContent(card.mktContentId)"
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
          class="marketing-channel-results__card-preparing"
        />
        <p
          v-else-if="card.aiStatusCd === '001'"
          class="marketing-channel-results__card-waiting"
        >
          앞 채널 생성이 끝나면 이어서 생성합니다.
        </p>
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
import { UiButton, UiEmpty } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import { marketingAiStatuses, type MarketingAiStatusCd } from '~/types/marketing'

const STATUS_LABEL = Object.fromEntries(
  marketingAiStatuses.map((item) => [item.aiStatusCd, item.aiStatusNm]),
) as Record<MarketingAiStatusCd, string>

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
  handleBackToList,
} = useMarketingStore()

/** 생성 중에 나가도 생성은 서버·스토어에서 계속되므로 제작 내역으로 보낸다 */
const onLeave = async () => {
  if (isGeneratingChannelBatch.value) {
    openToast('생성은 계속 진행됩니다. 제작 내역에서 진행 상태를 확인할 수 있습니다.')
  }
  await handleBackToList()
}

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
