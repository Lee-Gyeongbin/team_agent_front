<template>
  <div class="dashboard-card dashboard-keyword">
    <div class="dashboard-card-header">
      <div class="keyword-title-group">
        <span class="card-title">사용자 관심 키워드</span>
      </div>
      <div
        class="keyword-period-buttons"
        role="group"
        aria-label="집계 기간"
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
      <ul
        v-if="keywordTrend.length"
        class="keyword-badge-list"
      >
        <li
          v-for="(item, idx) in keywordTrend.slice(0, 5)"
          :key="`${item.keyword}-${idx}`"
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
              {{ item.keyword }}
            </UiBadge>
          </div>
          <span class="keyword-cnt">{{ item.cnt.toLocaleString() }}건</span>
        </li>
      </ul>
      <p
        v-else
        class="keyword-empty"
      >
        표시할 키워드가 없습니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const periodOptions = [
  { label: '1일', value: 1 },
  { label: '3일', value: 3 },
  { label: '7일', value: 7 },
]

const selectedDayCnt = ref<number>(3)

// 백엔드 연결 코드
// const { keywordTrend, handleSelectDashboardKeywordTrend } = useDashboardStore()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const keywordTrendDummyMap: Record<number, { keyword: string; cnt: number }[]> = {
  1: [
    { keyword: '연차 신청', cnt: 152 },
    { keyword: '급여명세서', cnt: 121 },
    { keyword: '출장비 정산', cnt: 97 },
    { keyword: '복리후생', cnt: 83 },
    { keyword: '인사평가', cnt: 64 },
  ],
  3: [
    { keyword: '연차 신청', cnt: 842 },
    { keyword: '급여명세서', cnt: 651 },
    { keyword: '복리후생', cnt: 534 },
    { keyword: '출장비 정산', cnt: 412 },
    { keyword: '인사평가', cnt: 298 },
  ],
  7: [
    { keyword: '연차 신청', cnt: 1842 },
    { keyword: '복리후생', cnt: 1461 },
    { keyword: '급여명세서', cnt: 1390 },
    { keyword: '출장비 정산', cnt: 1012 },
    { keyword: '인사평가', cnt: 858 },
  ],
}

const keywordTrend = computed(() => keywordTrendDummyMap[selectedDayCnt.value] ?? [])

const onSelectPeriod = (dayCnt: number) => {
  selectedDayCnt.value = dayCnt
  // TODO : API 연결 시 아래 조회 호출 복구 필요
  // handleSelectDashboardKeywordTrend(dayCnt)
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
