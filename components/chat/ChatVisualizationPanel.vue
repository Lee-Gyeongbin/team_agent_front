<template>
  <div
    class="chat-vis-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- 헤더 -->
    <div class="chat-vis-header">
      <span class="chat-vis-title">데이터 시각화 뷰</span>
      <div class="chat-vis-header-actions">
        <button
          class="btn btn-icon"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          ></i>
        </button>
        <button
          class="btn btn-icon"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>

    <!-- 본문 (차트만) -->
    <div class="chat-vis-body">
      <div class="chat-vis-chart">
        <div class="chat-vis-chart-header">
          <div class="chat-vis-chart-header-left">
            <i class="icon-file-ai size-16"></i>
            <span class="chat-vis-chart-title">{{ chartTitle }}</span>
          </div>
          <div class="chat-vis-chart-actions">
            <button
              class="btn btn-icon"
              title="새로고침"
            >
              <i class="icon-refresh size-16"></i>
            </button>
            <button
              class="btn btn-icon"
              :class="{ 'is-active': chartType === 'bar' }"
              title="막대 차트"
              @click="chartType = 'bar'"
            >
              <i class="icon-bar-chart size-16"></i>
            </button>
            <button
              class="btn btn-icon"
              :class="{ 'is-active': chartType === 'line' }"
              title="라인 차트"
              @click="chartType = 'line'"
            >
              <i class="icon-line-chart size-16"></i>
            </button>
            <button
              class="btn btn-icon"
              :class="{ 'is-active': chartType === 'pie' }"
              title="파이 차트"
              @click="chartType = 'pie'"
            >
              <i class="icon-pie-chart size-16"></i>
            </button>
          </div>
        </div>
        <!-- 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 -->
        <div
          class="chat-vis-chart-area"
          :class="{ 'is-pie': chartType === 'pie' }"
        >
          <UiChart
            :key="chartType"
            :type="chartType"
            :config="chartConfig"
            show-legend
          />
        </div>
      </div>
    </div>

    <!-- SQL 섹션 (하단 고정) -->
    <div class="chat-vis-sql">
      <div class="chat-vis-sql-bar">
        <div class="chat-vis-sql-bar-left">
          <i class="icon-copy size-16"></i>
          <span class="chat-vis-sql-label">SQL</span>
        </div>
        <UiButton
          size="xlg"
          variant="primary"
          @click="toggleSql"
        >
          SQL
          <template #icon-right>
            <i
              class="icon-chevron-down size-12"
              :class="{ 'is-flipped': isSqlOpen }"
            ></i>
          </template>
        </UiButton>
      </div>
      <div
        class="chat-vis-sql-content"
        :class="{ 'is-open': isSqlOpen }"
      >
        <pre class="chat-vis-sql-code"><code>{{ sqlQuery }}</code></pre>
        <button
          class="btn btn-icon chat-vis-sql-copy"
          title="SQL 복사"
          @click="onCopySql"
        >
          <i class="icon-copy size-16"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  messageId?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const isFullscreen = ref(false)
const isSqlOpen = ref(true)
const chartType = ref<'bar' | 'line' | 'pie'>('bar')

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const sqlQuery = `SELECT
  department_name,
  COUNT(*) AS employee_count,
  AVG(salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.status = 'active'
GROUP BY department_name
ORDER BY avg_salary DESC
LIMIT 10;`

const chartTitle = '부서별 평균 급여 현황'

// 차트 타입별 설정
const chartConfig = computed(() => {
  const categories = ['개발팀', '디자인팀', '기획팀', '마케팅팀', '영업팀', '인사팀', 'CS팀', '재무팀', '법무팀', '경영지원']

  if (chartType.value === 'bar') {
    return {
      categories,
      data: [850, 720, 680, 620, 580, 550, 520, 490, 470, 450],
      colorKey: 'bar.set1',
      maxValue: 1000,
      showDataLabels: true,
    }
  }

  if (chartType.value === 'line') {
    return {
      categories,
      datasets: [
        { label: '평균 급여', data: [850, 720, 680, 620, 580, 550, 520, 490, 470, 450], colorKey: 'line.primary' },
      ],
      maxValue: 1000,
    }
  }

  // pie
  return {
    items: [
      { name: '개발팀', value: 25 },
      { name: '디자인팀', value: 18 },
      { name: '기획팀', value: 15 },
      { name: '마케팅팀', value: 14 },
      { name: '영업팀', value: 12 },
      { name: '기타', value: 16 },
    ],
    style: 'regionRatio',
    textStyle: 'primary',
  }
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  emit('update:fullscreen', false)
  emit('update:open', false)
}

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const onCopySql = () => {
  navigator.clipboard.writeText(sqlQuery)
}
</script>
