<template>
  <div class="dashboard-stat-cards">
    <!-- 피드백 수 -->
    <UiStatCard
      icon="icon-dash-feedback"
      label="피드백 수"
      :value="feedbackCount"
      unit="명"
      color="green"
    />

    <!-- 오늘 질의 수 -->
    <UiStatCard
      icon="icon-dash-query"
      label="오늘 질의 수"
      :value="todayQueryCount"
      unit="명"
      color="blue"
    />

    <!-- 질의 만족도 -->
    <div class="dashboard-satisfaction-card">
      <div class="satisfaction-top">
        <div class="satisfaction-title-area">
          <div class="satisfaction-icon">
            <i class="icon-dash-satisfaction size-24" />
          </div>
          <span class="satisfaction-label">질의 만족도</span>
        </div>
        <div class="satisfaction-legend">
          <span class="legend-item">
            <span class="legend-dot is-positive" />
            <span class="legend-text">만족</span>
          </span>
          <span class="legend-item">
            <span class="legend-dot is-negative" />
            <span class="legend-text">불만족</span>
          </span>
        </div>
      </div>
      <div class="satisfaction-bottom">
        <div class="satisfaction-bar">
          <div
            class="bar-positive"
            :style="{ width: `${satisfactionRate}%` }"
          />
          <div
            class="bar-negative"
            :style="{ width: `${dissatisfactionRate}%` }"
          />
        </div>
        <div class="satisfaction-values">
          <span class="satisfaction-item is-positive">
            <i class="icon-dash-satisfied size-24" />
            <span class="value">{{ satisfactionRate }}%</span>
          </span>
          <span class="satisfaction-item is-negative">
            <span class="value">{{ dissatisfactionRate }}%</span>
            <i class="icon-dash-dissatisfied size-24" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const feedbackCount = '1,624,906'
const todayQueryCount = '1,624,906'
const satisfactionRate = 60.4
const dissatisfactionRate = 39.6
</script>
