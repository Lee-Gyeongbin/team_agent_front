<template>
  <div class="marketing-recipient-manage">
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
      발행 채널 연결
    </button>
    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">수신 대상 관리 · {{ channelNm }}</h1>
        <p class="marketing-list-desc">고객사 DB 연동 또는 Excel 업로드를 통해 수집한 수신자 목록입니다.</p>
      </div>
    </div>

    <div class="marketing-list-table-wrap">
      <UiTable
        :columns="marketingRecipientManageColumns"
        :data="recipients"
        empty-text="수신 대상이 없습니다."
      >
        <template #cell-adConsentNm="{ row }">
          <span :class="['marketing-recipient-badge', consentBadgeClass(row.adConsentNm)]">
            {{ row.adConsentNm }}
          </span>
        </template>
        <template #cell-adConsentDt="{ value }">
          {{ formatCellText(value) }}
        </template>
        <template #cell-optOutNm="{ row }">
          <span :class="['marketing-recipient-badge', optOutBadgeClass(row.optOutNm)]">
            {{ row.optOutNm }}
          </span>
        </template>
      </UiTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiIcon, UiTable } from '@leechanyong/ispark-ui'
import { marketingRecipientManageColumns, type MarketingRecipient } from '~/types/marketing'

interface Props {
  channelNm: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const recipients: (MarketingRecipient & Record<string, unknown>)[] = []

const formatCellText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || '-'
}

const consentBadgeClass = (adConsentNm: string) => (adConsentNm === '동의' ? 'is-consent' : 'is-no-consent')

const optOutBadgeClass = (optOutNm: string) => (optOutNm === '예' ? 'is-opt-out-yes' : 'is-opt-out-no')

const onClose = () => {
  emit('close')
}
</script>
