<template>
  <div class="guide-page">
    <h1 class="guide-title">UiChart</h1>
    <p class="guide-description">Chart.js 기반 범용 차트 컴포넌트 — bar, line, pie, mixed, horizontalBar 5종 지원</p>

    <!-- Bar Chart -->
    <section class="guide-section">
      <h2 class="section-title">Bar Chart (막대 차트)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 300px">
            <UiChart
              type="bar"
              :config="barConfig"
              show-legend
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="bar" :config="barConfig" show-legend /&gt;</pre>
      </div>
    </section>

    <!-- Line Chart -->
    <section class="guide-section">
      <h2 class="section-title">Line Chart (라인 차트)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 300px">
            <UiChart
              type="line"
              :config="lineConfig"
              show-legend
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="line" :config="lineConfig" show-legend /&gt;</pre>
      </div>
    </section>

    <!-- Pie Chart -->
    <section class="guide-section">
      <h2 class="section-title">Pie Chart (파이 차트)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 300px; max-width: 400px; margin: 0 auto">
            <UiChart
              type="pie"
              :config="pieConfig"
              show-legend
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="pie" :config="pieConfig" show-legend /&gt;</pre>
      </div>
    </section>

    <!-- Mixed Chart -->
    <section class="guide-section">
      <h2 class="section-title">Mixed Chart (혼합 차트 — Bar + Line)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 300px">
            <UiChart
              type="mixed"
              :config="mixedConfig"
              show-legend
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="mixed" :config="mixedConfig" show-legend /&gt;</pre>
      </div>
    </section>

    <!-- Horizontal Bar Chart -->
    <section class="guide-section">
      <h2 class="section-title">Horizontal Bar Chart (가로 막대 차트)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 300px">
            <UiChart
              type="horizontalBar"
              :config="horizontalBarConfig"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="horizontalBar" :config="horizontalBarConfig" /&gt;</pre>
      </div>
    </section>

    <!-- Props 테이블 -->
    <section class="guide-section">
      <h2 class="section-title">Props</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>type</td>
            <td><code>'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'</code></td>
            <td>-</td>
            <td>차트 타입 (필수)</td>
          </tr>
          <tr>
            <td>config</td>
            <td><code>Record&lt;string, any&gt;</code></td>
            <td>-</td>
            <td>차트 설정 객체 (필수)</td>
          </tr>
          <tr>
            <td>showLegend</td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>범례 표시 여부</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================

// 막대 차트 설정
const barConfig = {
  categories: ['서울', '부산', '대구', '인천', '광주', '대전'],
  datasets: [
    { label: '2024년', data: [1200, 900, 750, 680, 520, 480], colorKey: 'bar.set1', colorIndex: 0 },
    { label: '2025년', data: [1350, 980, 820, 720, 600, 540], colorKey: 'bar.set1', colorIndex: 1 },
  ],
  maxValue: 1500,
  showDataLabels: true,
}

// 라인 차트 설정
const lineConfig = {
  categories: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  datasets: [
    { label: '매출', data: [650, 720, 800, 780, 900, 850, 920, 980, 1050, 1100, 1020, 1150], colorKey: 'line.primary' },
    { label: '비용', data: [400, 450, 500, 480, 520, 510, 540, 560, 580, 600, 570, 620], colorKey: 'line.success' },
  ],
  maxValue: 1300,
  useGradient: true,
}

// 파이 차트 설정
const pieConfig = {
  items: [
    { name: '개발팀', value: 35 },
    { name: '디자인팀', value: 25 },
    { name: '기획팀', value: 20 },
    { name: '마케팅팀', value: 20 },
  ],
  style: 'primary',
  textStyle: 'primary',
}

// 혼합 차트 설정
const mixedConfig = {
  categories: ['1분기', '2분기', '3분기', '4분기'],
  datasets: [
    { label: '매출', type: 'bar', data: [5000, 6200, 7100, 8500], colorKey: 'mixed.set1', colorIndex: 0, yAxisID: 'y' },
    { label: '성장률', type: 'line', data: [12, 24, 15, 20], borderColor: '#FFB4A1', yAxisID: 'y1' },
  ],
  maxValue: 10000,
  maxValue2: 100,
}

// 가로 막대 차트 설정
const horizontalBarConfig = {
  categories: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js'],
  data: [85, 72, 45, 38, 65],
  colorKey: 'bar.set1',
  colorIndex: 0,
  maxValue: 100,
  showDataLabels: true,
  unit: '%',
}
</script>
