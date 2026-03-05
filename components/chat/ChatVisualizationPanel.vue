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

    <!-- 본문 -->
    <div class="chat-vis-body">
      <!-- 차트 섹션 -->
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
        <!-- 🔽 더미 데이터 — 백엔드 연결 시 차트 라이브러리로 교체 -->
        <div class="chat-vis-chart-placeholder">
          <i class="icon-chart size-48"></i>
          <span>차트 영역 ({{ { bar: '막대', line: '라인', pie: '파이' }[chartType] }} 차트)</span>
        </div>
      </div>

      <!-- SQL 섹션 -->
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
          v-if="isSqlOpen"
          class="chat-vis-sql-content"
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
