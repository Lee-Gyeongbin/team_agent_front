<template>
  <div class="dashboard-card dashboard-keyword">
    <div class="dashboard-card-header">
      <div class="keyword-title-group">
        <span class="card-title">사용자 관심 키워드</span>
      </div>
      <div
        class="keyword-period-buttons"
        role="group"
        aria-label="사용자 관심 키워드 집계 기간"
      >
        <UiButton
          v-for="opt in periodOptions"
          :key="opt.value"
          type="button"
          size="sm"
          :variant="selectedDayCnt === opt.value ? 'primary' : 'line-secondary'"
          :aria-pressed="selectedDayCnt === opt.value"
          @click="onSelectPeriod(opt.value)"
        >
          {{ opt.label }}
        </UiButton>
      </div>
    </div>
    <div class="keyword-badge-area">
      <UiLoading
        v-if="keywordTrendLoading"
        text="사용자 관심 키워드 데이터를 불러오는 중..."
      />
      <ul
        v-else-if="keywordTrend.length"
        class="keyword-badge-list"
      >
        <li
          v-for="(item, idx) in keywordTrend.slice(0, 5)"
          :key="`${item.llmKeyword}-${idx}`"
          class="keyword-row"
        >
          <div class="keyword-row-left">
            <span
              class="keyword-rank"
              :aria-label="`${idx + 1}`"
            >
              {{ idx + 1 }}
            </span>
            <UiBadge
              variant="default"
              size="lg"
            >
              {{ item.llmKeyword }}
            </UiBadge>
          </div>
          <span class="keyword-cnt">{{ item.keywordCnt.toLocaleString() }}건</span>
        </li>
      </ul>
      <p
        v-else
        class="keyword-empty"
      >
        표시할 사용자 관심 키워드가 없습니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiLoading } from '@leechanyong/ispark-ui'
import { KEYWORD_TREND_DEFAULT_DAY_CNT } from '~/composables/dashboard/useDashboardStore'

const { keywordTrend, keywordTrendLoading, handleSelectDashboardKeywordTrend } = useDashboardStore()

/** 집계 기간 옵션 */
const periodOptions = [
  { label: '1일', value: 1 },
  { label: '3일', value: 3 },
  { label: '7일', value: 7 },
]

const selectedDayCnt = ref<number>(KEYWORD_TREND_DEFAULT_DAY_CNT)

const onSelectPeriod = async (dayCnt: number) => {
  if (selectedDayCnt.value === dayCnt) {
    return
  }

  selectedDayCnt.value = dayCnt
  await handleSelectDashboardKeywordTrend(dayCnt)
}
</script>

<style lang="scss" scoped>
.dashboard-keyword {
  .keyword-title-group {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: $spacing-sm;
    min-width: 0;
  }

  .keyword-period-buttons {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;

    :deep(.ui-button-text) {
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
    }
  }

  .keyword-badge-area {
    display: flex;
    flex-direction: column;
    min-height: 120px;
  }

  .keyword-badge-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .keyword-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    min-width: 0;
  }

  .keyword-row-left {
    display: flex;
    align-items: center;
    flex: 1;
    gap: $spacing-sm;
    min-width: 0;
  }

  .keyword-rank,
  .keyword-cnt,
  .keyword-empty {
    @include typo($body-medium-medium);
    color: $color-text-secondary;
  }

  .keyword-rank,
  .keyword-cnt {
    flex-shrink: 0;
    text-align: right;
  }

  .keyword-rank {
    min-width: 28px;
    font-variant-numeric: tabular-nums;
  }

  .keyword-empty {
    margin: 0;
    padding: $spacing-xl 0;
    text-align: center;
  }
}
</style>
