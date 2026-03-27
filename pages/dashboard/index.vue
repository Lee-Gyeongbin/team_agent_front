<template>
  <div class="dashboard-page l-center">
    <!-- 상단 통계 카드 -->
    <div data-aos="fade-up">
      <DashboardStatCards />
    </div>

    <!-- 중단: 질의 비율 + 공지사항 -->
    <div class="dashboard-middle-row">
      <DashboardQueryRatio
        data-aos="fade-up"
        data-aos-delay="100"
      />
      <DashboardNotice
        data-aos="fade-up"
        data-aos-delay="200"
      />
    </div>

    <!-- 하단: 토큰 사용량 + 방문자추이 -->
    <div class="dashboard-bottom-row">
      <DashboardTokenUsage
        data-aos="fade-up"
        data-aos-delay="100"
      />
      <DashboardVisitorTrend
        data-aos="fade-up"
        data-aos-delay="200"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
