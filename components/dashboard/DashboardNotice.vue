<template>
  <div class="dashboard-card dashboard-notice">
    <div class="dashboard-card-header">
      <span class="card-title">공지사항</span>
      <span
        class="notice-more"
        @click="onClickMore"
      >
        + 더보기
      </span>
    </div>

    <!-- 메인 공지 구역 -->
    <div class="notice-list">
      <template v-if="mainNotice">
        <div class="notice-item is-main">
          <div class="notice-icon">
            <i class="icon-dash-notice size-24" />
          </div>
          <div class="notice-date">
            <span class="date-month"
              >{{ mainNotice.createDt.split(' ')[0].split('-')[0] }}.{{
                mainNotice.createDt.split(' ')[0].split('-')[1]
              }}</span
            >
            <span class="date-day">{{ mainNotice.createDt.split(' ')[0].split('-')[2] }}</span>
          </div>
          <div class="notice-content">
            <span class="notice-title">{{ mainNotice.title }}</span>
          </div>
        </div>
      </template>
      <div
        v-else
        class="notice-item is-main notice-item--empty"
      >
        <div class="notice-icon">
          <i class="icon-dash-notice size-24" />
        </div>
        <div class="notice-content">
          <span class="notice-desc">대표 공지가 없습니다.</span>
        </div>
      </div>
    </div>

    <!-- 하위 공지 구역 -->
    <div class="notice-sub-list">
      <template v-if="subNotices.length">
        <div
          v-for="item in subNotices"
          :key="item.noticeId"
          class="notice-sub-item"
        >
          <span class="sub-text">{{ item.title }}</span>
          <span class="sub-date"
            >{{ item.createDt.split(' ')[0].split('-')[1] }}.{{ item.createDt.split(' ')[0].split('-')[2] }}</span
          >
        </div>
      </template>
      <div
        v-else
        class="notice-sub-empty"
      >
        <span class="notice-sub-empty-text">공지사항이 없습니다.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { mainNotice, subNotices } = useDashboardStore()

const onClickMore = () => {
  navigateTo('/notice')
}
</script>

<style lang="scss" scoped>
/* 메인 빈 상태: 아이콘은 왼쪽, 문구만 남은 영역 가운데 */
.notice-item--empty {
  .notice-content {
    flex: 1;
    min-width: 0;
    align-items: center;
    text-align: center;
    min-height: 50px;
    justify-content: center;
  }

  .notice-desc {
    width: 100%;
    text-align: center;
  }
}

/* 하위 구역 빈 상태 — sub-date 톤과 맞춤 */
.notice-sub-empty {
  padding: 20px 12px 4px;
  text-align: center;
}

.notice-sub-empty-text {
  @include typo($body-small);
  color: $color-text-disabled;
}
</style>
