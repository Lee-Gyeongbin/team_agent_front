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

    <!-- 메인 공지 -->
    <div class="notice-list">
      <div class="notice-item is-main">
        <div class="notice-icon">
          <i class="icon-dash-notice size-24" />
        </div>
        <div class="notice-date">
          <span class="date-month">{{ mainNotice.year }}.{{ mainNotice.month }}</span>
          <span class="date-day">{{ mainNotice.day }}</span>
        </div>
        <div class="notice-content">
          <span class="notice-title">{{ mainNotice.title }}</span>
        </div>
      </div>
    </div>

    <!-- 하위 공지 목록 -->
    <div class="notice-sub-list">
      <div
        v-for="item in subNotices"
        :key="item.id"
        class="notice-sub-item"
      >
        <span class="sub-text">{{ item.title }}</span>
        <span class="sub-date">{{ item.date }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Notice {
  id: string
  year: string
  month: string
  day: string
  title: string
  description: string
}

interface SubNotice {
  id: string
  title: string
  date: string
}

// 🔽 더보기 — 백엔드 연결 시 공지사항 페이지 이동으로 교체
const onClickMore = () => {
  console.warn('[TODO] 공지사항 더보기 페이지 이동')
}

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const mainNotice: Notice = {
  id: '1',
  year: '2026',
  month: '03',
  day: '27',
  title:
    '연간 방문자 수 최고치 갱신! 162만 명의 이용량 급증에 대비하여 데이터 처리 엔진의 대규모 스케일업(Scale-up) 및 최적화가 완료되었습니다연간 방문자 수 최고치 갱신! 162만 명의 이용량 급증에 대비하여 데이터 처리 엔진의 대규모 스케일업(Scale-up) 및 최적화가 완료되었습니다연간 방문자 수 최고치 갱신! 162만 명의 이용량 급증에 대비하여 데이터 처리 엔진의 대규모 스케일업(Scale-up) 및 최적화가 완료되었습니다연간 방문자 수 최고치 갱신! 162만 명의 이용량 급증에 대비하여 데이터 처리 엔진의 대규모 스케일업(Scale-up) 및 최적화가 완료되었습니다.',
  description: '',
}

const subNotices: SubNotice[] = [
  {
    id: '2',
    title: 'TextToSQL 활용 비중 76% 돌파 데이터 분석 효율성을 극대화하기 위한 엔진...',
    date: '03.26',
  },
  {
    id: '3',
    title: '누적 피드백 162만 건 돌파! 현재 질의 만족도 85.4%에 안주하지 않고, 사용자...',
    date: '03.25',
  },
  {
    id: '4',
    title: '최근 토큰 사용량 급증에 따른 서버 자원 확충 안내: 더 빠른 질의 응답 속도와 안정...',
    date: '03.24',
  },
]
</script>
