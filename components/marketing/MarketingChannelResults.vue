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

    <div class="marketing-channel-results__grid">
      <button
        v-for="item in channelBatch"
        :key="item.channelCd"
        type="button"
        class="marketing-channel-results__card"
        :disabled="item.statusCd !== '003'"
        @click="handleOpenChannelContent(item.contentId)"
      >
        <div class="marketing-channel-results__card-head">
          <strong>{{ item.channelNm }}</strong>
          <span :class="['marketing-status-badge', `progress-${STATUS_KEY[item.statusCd]}`]">
            {{ STATUS_LABEL[item.statusCd] }}
          </span>
        </div>
        <MarketingPreparingStatus
          v-if="item.statusCd === '002'"
          :bordered="false"
        />
        <div
          v-else-if="item.statusCd === '003'"
          class="marketing-channel-results__card-desc"
        >
          콘텐츠 수정 →
        </div>
        <div
          v-else
          class="marketing-channel-results__card-desc is-failed"
        >
          생성에 실패했습니다.
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingContentStatusCd } from '~/types/marketing'

const STATUS_LABEL: Record<MarketingContentStatusCd, string> = {
  '001': '대기',
  '002': '생성 중',
  '003': '생성 완료',
  '004': '생성 실패',
}

const STATUS_KEY: Record<MarketingContentStatusCd, string> = {
  '001': 'waiting',
  '002': 'generating',
  '003': 'done',
  '004': 'failed',
}

const { channelBatch, handleOpenChannelContent, popMarketingPhase } = useMarketingStore()
</script>
