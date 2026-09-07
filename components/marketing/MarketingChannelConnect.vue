<template>
  <MarketingRecipientManage
    v-if="isRecipientManageOpen"
    :channel-nm="recipientChannelNm"
    @close="closeRecipientManage"
  />
  <div
    v-else
    class="marketing-channel-connect"
  >
    <button
      class="marketing-back-btn"
      type="button"
      @click="onClose"
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
        <h1 class="marketing-list-title">발행 채널 연결</h1>
        <p class="marketing-list-desc">콘텐츠를 발행할 채널을 연결하고 관리하세요.</p>
      </div>
    </div>

    <div class="marketing-list-table-wrap">
      <UiTable
        :columns="marketingChannelConnectColumns"
        :data="channelAccounts"
        empty-text="연결된 채널이 없습니다."
      >
        <template #cell-channelNm="{ value }">
          <strong class="marketing-channel-name">{{ value }}</strong>
        </template>
        <template #cell-accountId="{ value }">
          {{ formatCellText(value) }}
        </template>
        <template #cell-recipientCount="{ row }">
          {{ formatRecipientCount(row.recipientCount) }}
        </template>
        <template #cell-recipientSync="{ value }">
          {{ formatCellText(value) }}
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
            {{ statusLabel(row.status) }}
          </span>
        </template>
        <template #cell-actions="{ row }">
          <div class="marketing-channel-connect-actions">
            <UiButton
              :variant="primaryAction(row.status).variant"
              size="sm"
              @click="onPrimaryAction(row)"
            >
              {{ primaryAction(row.status).label }}
              <template #icon-right>
                <UiIcon
                  name="chevron-right"
                  size="12"
                />
              </template>
            </UiButton>
            <UiButton
              v-if="row.recipientCount !== null"
              variant="outline"
              size="sm"
              @click="onRecipientManage(row)"
            >
              수신 대상 관리
            </UiButton>
          </div>
        </template>
      </UiTable>
    </div>

    <p class="marketing-channel-connect-guide">
      채널 연결 시 아래 정보 확인이 필요합니다: OAuth 연결 · 발행/게시 권한 · API Access 상태 · 수신 대상 연결
    </p>

    <MarketingChannelConnectModal
      v-if="isConnectModalOpen"
      :is-open="isConnectModalOpen"
      :channel-nm="connectingChannelNm"
      @close="closeConnectModal"
      @connect="onChannelConnect"
    />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiTable } from '@leechanyong/ispark-ui'
import {
  marketingChannelConnectColumns,
  type MarketingChannelAccount,
  type MarketingChannelConnectionStatus,
} from '~/types/marketing'

const emit = defineEmits<{
  close: []
}>()

const STATUS_LABEL: Record<MarketingChannelConnectionStatus, string> = {
  connected: '연결됨',
  verify: '확인 필요',
  disconnected: '연결 안됨',
}

const PRIMARY_ACTION: Record<MarketingChannelConnectionStatus, { label: string; variant: 'primary' | 'outline' }> = {
  connected: { label: '연결 관리', variant: 'outline' },
  verify: { label: '확인하기', variant: 'outline' },
  disconnected: { label: '연동하기', variant: 'primary' },
}

const channelAccounts = ref<(MarketingChannelAccount & Record<string, unknown>)[]>([])

const formatCellText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || '-'
}

const formatRecipientCount = (count: number | null) => {
  if (count === null) return '-'
  return `${formatNumberWithComma(count)}명`
}

const statusLabel = (status: MarketingChannelConnectionStatus) => STATUS_LABEL[status]

const primaryAction = (status: MarketingChannelConnectionStatus) => PRIMARY_ACTION[status]

const isConnectModalOpen = ref(false)
const connectingChannelNm = ref('')
const isRecipientManageOpen = ref(false)
const recipientChannelNm = ref('')

const openConnectModal = (channelNm: string) => {
  connectingChannelNm.value = channelNm
  isConnectModalOpen.value = true
}

const closeConnectModal = () => {
  isConnectModalOpen.value = false
  connectingChannelNm.value = ''
}

const onPrimaryAction = (row: MarketingChannelAccount) => {
  openConnectModal(row.channelNm)
}

const onRecipientManage = (row: MarketingChannelAccount) => {
  recipientChannelNm.value = row.channelNm
  isRecipientManageOpen.value = true
}

const closeRecipientManage = () => {
  isRecipientManageOpen.value = false
  recipientChannelNm.value = ''
}

const onChannelConnect = () => {
  closeConnectModal()
}

const onClose = () => {
  emit('close')
}
</script>
