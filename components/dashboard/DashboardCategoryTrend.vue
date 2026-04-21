<template>
  <div class="dashboard-card dashboard-category">
    <div class="dashboard-card-header">
      <div class="category-title-group">
        <span class="card-title">사용자 관심 카테고리</span>
      </div>
      <div
        class="category-period-buttons"
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
    <div class="category-badge-area">
      <UiLoading
        v-if="categoryTrendLoading"
        text="카테고리 데이터를 불러오는 중..."
      />
      <ul
        v-else-if="categoryTrend.length"
        class="category-badge-list"
      >
        <li
          v-for="(item, idx) in categoryTrend.slice(0, 5)"
          :key="`${item.categoryNm}-${idx}`"
          class="category-row"
        >
          <div class="category-row-left">
            <span
              class="category-rank"
              :aria-label="`${idx + 1}`"
            >
              {{ idx + 1 }}
            </span>
            <UiBadge
              variant="default"
              size="lg"
            >
              {{ item.categoryNm }}
            </UiBadge>
          </div>
          <span class="category-cnt">{{ item.categoryCnt.toLocaleString() }}건</span>
        </li>
      </ul>
      <p
        v-else
        class="category-empty"
      >
        표시할 카테고리가 없습니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORY_TREND_DEFAULT_DAY_CNT } from '~/composables/dashboard/useDashboardStore'

const { categoryTrend, categoryTrendLoading, handleSelectDashboardCategoryTrend } = useDashboardStore()

/** 집계 기간 옵션 */
const periodOptions = [
  { label: '1일', value: 1 },
  { label: '3일', value: 3 },
  { label: '7일', value: 7 },
]

const selectedDayCnt = ref<number>(CATEGORY_TREND_DEFAULT_DAY_CNT)

const onSelectPeriod = async (dayCnt: number) => {
  if (selectedDayCnt.value === dayCnt) {
    return
  }

  selectedDayCnt.value = dayCnt
  await handleSelectDashboardCategoryTrend(dayCnt)
}
</script>

<style lang="scss" scoped>
.dashboard-category {
  .category-title-group {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: $spacing-sm;
    min-width: 0;
  }

  .category-period-buttons {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;

    :deep(.ui-button-text) {
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
    }
  }

  .category-badge-area {
    display: flex;
    flex-direction: column;
    min-height: 120px;
  }

  .category-badge-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .category-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    min-width: 0;
  }

  .category-row-left {
    display: flex;
    align-items: center;
    flex: 1;
    gap: $spacing-sm;
    min-width: 0;
  }

  .category-rank,
  .category-cnt,
  .category-empty {
    @include typo($body-medium-medium);
    color: $color-text-secondary;
  }

  .category-rank,
  .category-cnt {
    flex-shrink: 0;
    text-align: right;
  }

  .category-rank {
    min-width: 28px;
    font-variant-numeric: tabular-nums;
  }

  .category-empty {
    margin: 0;
    padding: $spacing-xl 0;
    text-align: center;
  }
}
</style>
