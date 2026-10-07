<template>
  <div class="marketing-channel-connect">
    <button
      class="marketing-back-btn"
      type="button"
      @click="emit('close')"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      마케팅 프로젝트
    </button>
    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">계정 관리</h1>
        <p class="marketing-list-desc">외부 채널 계정 연결은 준비 중입니다.</p>
      </div>
    </div>

    <div class="marketing-list-table-wrap">
      <UiTable
        :columns="marketingChannelConnectColumns"
        :data="channelAccounts"
      >
        <template #cell-channelNm="{ value }">
          <strong class="marketing-channel-name">{{ value }}</strong>
        </template>
        <template #cell-accountId="{ value }">
          {{ formatMarketingCellText(value) }}
        </template>
        <template #cell-status="{ row }">
          <span :class="['marketing-channel-status', `is-${row.status}`]">
            <UiIcon
              v-if="row.status === 'connected'"
              name="check"
              size="12"
            />
            <UiIcon
              v-else-if="row.status === 'verify'"
              name="triangle-alert"
              size="12"
            />
            <span
              v-else
              class="marketing-channel-status__circle"
            />
            {{ STATUS_LABEL[row.status] }}
          </span>
        </template>
        <template #cell-actions>
          <div class="marketing-channel-connect-actions">
            <UiButton
              variant="outline"
              size="sm"
              :disabled="true"
            >
              준비 중
              <template #icon-right>
                <UiIcon
                  name="chevron-right"
                  size="12"
                />
              </template>
            </UiButton>
          </div>
        </template>
      </UiTable>
    </div>

    <p class="marketing-channel-connect-guide">이번 버전에서는 발행 일정과 완료 상태를 관리합니다.</p>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiTable } from '@leechanyong/ispark-ui'
import {
  marketingChannelConnectColumns,
  type MarketingChannelAccount,
  type MarketingChannelConnectionStatus,
} from '~/types/marketing'
import { formatMarketingCellText, MARKETING_CHANNEL_SEEDS } from '~/utils/marketing/marketingUtil'

const emit = defineEmits<{
  close: []
}>()

const STATUS_LABEL: Record<MarketingChannelConnectionStatus, string> = {
  connected: '연결됨',
  verify: '확인 필요',
  disconnected: '연결 안됨',
}

const channelAccounts = ref<(MarketingChannelAccount & Record<string, unknown>)[]>(
  MARKETING_CHANNEL_SEEDS.map((seed) => ({
    channelNm: seed.channelNm,
    accountId: '',
    status: 'disconnected',
  })),
)
</script>
