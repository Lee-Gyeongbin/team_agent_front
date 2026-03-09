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
      <!-- 데이터 표 섹션 -->
      <div class="chat-vis-table">
        <div class="chat-vis-table-header">
          <div class="chat-vis-table-header-left">
            <i class="icon-file-ai size-16"></i>
            <span class="chat-vis-table-title">데이터 표</span>
          </div>
          <span class="chat-vis-table-subtitle">{{ tableSubtitle }}</span>
        </div>
        <div class="chat-vis-table-body">
          <UiTable
            :columns="tableColumns"
            :data="tableData"
            sticky-header
          />
        </div>
      </div>

      <!-- 데이터 차트 섹션 -->
      <div class="chat-vis-chart">
        <!-- 차트 타이틀 -->
        <div class="chat-vis-chart-header">
          <div class="chat-vis-chart-header-left">
            <i class="icon-file-ai size-16"></i>
            <span class="chat-vis-chart-title">데이터 차트</span>
          </div>
        </div>
        <!-- 차트 툴바: 범례/기준값 셀렉트 + 차트 타입 아이콘 -->
        <div class="chat-vis-chart-toolbar">
          <div class="chat-vis-chart-toolbar-left">
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">범례</span>
              <UiSelect
                v-model="legendOption"
                id="chart-legend"
                name="chart-legend"
                :options="legendOptions"
                class="w-96"
              />
            </div>
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">기준값(좌)</span>
              <UiSelect
                v-model="leftAxisOption"
                id="chart-left-axis"
                name="chart-left-axis"
                :options="axisOptions"
                class="w-96"
              />
            </div>
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">기준값(우)</span>
              <UiSelect
                v-model="rightAxisOption"
                id="chart-right-axis"
                name="chart-right-axis"
                :options="axisOptions"
                class="w-96"
              />
            </div>
          </div>
          <div class="chat-vis-chart-actions">
            <UiButton
              variant="ghost"
              icon-only
              title="새로고침"
            >
              <template #icon-left>
                <i class="icon-refresh size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'bar' }"
              title="막대 차트"
              @click="chartType = 'bar'"
            >
              <template #icon-left>
                <i class="icon-bar-chart size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'line' }"
              title="라인 차트"
              @click="chartType = 'line'"
            >
              <template #icon-left>
                <i class="icon-line-chart size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'pie' }"
              title="파이 차트"
              @click="chartType = 'pie'"
            >
              <template #icon-left>
                <i class="icon-pie-chart size-16"></i>
              </template>
            </UiButton>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'

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

// 데이터 표
const tableSubtitle = 'BF.총매출액.케이블플랫폼매출액(총 8건)'
const tableColumns: TableColumn[] = [
  { key: 'statName', label: '통계명', width: '320px' },
  { key: 'region', label: '지역', width: '150px' },
  { key: 'total', label: '합계', align: 'right', headerAlign: 'center' },
  { key: 'average', label: '평균', align: 'right', headerAlign: 'center' },
]
const tableData = [
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '대전', total: '44,865,368,290', average: '3,738,780,690.83' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '충청', total: '13,332,726,992', average: '1,111,060,582.67' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '세종', total: '1,074,601,827', average: '89,550,152.25' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '광주', total: '33,910,931,382', average: '2,825,910,948.50' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '전남', total: '9,927,838,771', average: '827,319,897.58' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '영등포', total: '10,915,703,515', average: '909,641,959.58' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '동대문', total: '5,405,915,010', average: '450,492,917.50' },
  { statName: 'BF.총매출액.케이블플랫폼매출액', region: '대구', total: '8,602,288,731', average: '716,857,394.25' },
]
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

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const legendOption = ref('department_name')
const legendOptions = [
  { label: '부서명', value: 'department_name' },
  { label: '지역', value: 'region' },
  { label: '직급', value: 'position' },
]

const leftAxisOption = ref('employee_count')
const rightAxisOption = ref('avg_salary')
const axisOptions = [
  { label: '직원수', value: 'employee_count' },
  { label: '평균급여', value: 'avg_salary' },
  { label: '급여합계', value: 'total_salary' },
  { label: '최고급여', value: 'max_salary' },
  { label: '최저급여', value: 'min_salary' },
]

// 차트 타입별 설정
const chartConfig = computed(() => {
  const categories = [
    '개발팀',
    '디자인팀',
    '기획팀',
    '마케팅팀',
    '영업팀',
    '인사팀',
    'CS팀',
    '재무팀',
    '법무팀',
    '경영지원',
  ]

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
    type: 'outerLabel',
    style: 'regionRatio',
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
