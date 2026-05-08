<template>
  <div class="guide-page">
    <h1 class="guide-title">UiChart</h1>
    <p class="guide-description">Chart.js 기반 범용 차트 컴포넌트 — bar, line, pie, mixed, horizontalBar, radar 6종 지원</p>

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
          <div style="height: 480px; max-width: 480px; margin: 0 auto">
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

    <!-- Radar Chart -->
    <section class="guide-section">
      <h2 class="section-title">Radar Chart (방사선 차트) — 단일 데이터셋</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 400px; max-width: 480px; margin: 0 auto">
            <UiChart
              type="radar"
              :config="radarSingleConfig"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarSingleConfig" /&gt;</pre>
      </div>
    </section>

    <section class="guide-section">
      <h2 class="section-title">Radar Chart — 다중 데이터셋 비교</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 400px; max-width: 480px; margin: 0 auto">
            <UiChart
              type="radar"
              :config="radarMultiConfig"
              show-legend
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarMultiConfig" show-legend /&gt;</pre>
      </div>
    </section>

    <section class="guide-section">
      <h2 class="section-title">Radar Chart — 데이터 라벨 표시</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 400px; max-width: 480px; margin: 0 auto">
            <UiChart
              type="radar"
              :config="radarLabelConfig"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarLabelConfig" /&gt;</pre>
      </div>
    </section>

    <section class="guide-section">
      <h2 class="section-title">Radar Chart — 0~4 스케일 (다른 max 케이스)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 400px; max-width: 480px; margin: 0 auto">
            <UiChart
              type="radar"
              :config="radarSmallScaleConfig"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarSmallScaleConfig" /&gt;</pre>
      </div>
    </section>

    <section class="guide-section">
      <h2 class="section-title">Radar Chart — 축 라벨에 점수 표기</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="height: 400px; max-width: 520px; margin: 0 auto">
            <UiChart
              type="radar"
              :config="radarLabelFormatConfig"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarLabelFormatConfig" /&gt;
// pointLabelFormat: (name, value) =&gt; `${name} (${value})`</pre>
      </div>
    </section>

    <section class="guide-section">
      <h2 class="section-title">Radar + StressScoreGrid 조합 예시 (도메인 컴포넌트)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="max-width: 720px; margin: 0 auto">
            <div style="height: 400px">
              <UiChart
                type="radar"
                :config="radarStressConfig"
              />
            </div>
            <StressScoreGrid
              :items="stressItems"
              :core-areas-text="stressCoreAreasText"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiChart type="radar" :config="radarStressConfig" /&gt;
&lt;StressScoreGrid :items="stressItems" :core-areas-text="stressCoreAreasText" /&gt;</pre>
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
            <td><code>'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'</code></td>
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

    <!-- Config 상세 사용법 -->
    <section class="guide-section">
      <h2 class="section-title">Config 옵션 (타입별)</h2>

      <!-- Bar Config -->
      <h3 class="section-subtitle">bar — 막대 차트</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>categories</td>
            <td><code>string[]</code></td>
            <td>O</td>
            <td>X축 라벨 배열</td>
          </tr>
          <tr>
            <td>data</td>
            <td><code>number[]</code></td>
            <td>△</td>
            <td>단일 데이터셋일 때 사용 (datasets와 택1)</td>
          </tr>
          <tr>
            <td>datasets</td>
            <td><code>{ label, data, colorKey, colorIndex }[]</code></td>
            <td>△</td>
            <td>다중 데이터셋 (data와 택1)</td>
          </tr>
          <tr>
            <td>colorKey</td>
            <td><code>string</code></td>
            <td></td>
            <td>ChartColors 경로 (예: <code>'bar.set1'</code>)</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td><code>number</code></td>
            <td>O</td>
            <td>Y축 최대값</td>
          </tr>
          <tr>
            <td>showDataLabels</td>
            <td><code>boolean</code></td>
            <td></td>
            <td>막대 위 수치 표시</td>
          </tr>
          <tr>
            <td>barStyleType</td>
            <td><code>'quarterly'</code></td>
            <td></td>
            <td>분기별 스타일 적용</td>
          </tr>
          <tr>
            <td>averageLine</td>
            <td><code>number</code></td>
            <td></td>
            <td>평균선 값 (빨간 점선)</td>
          </tr>
          <tr>
            <td>tooltipValueSuffix</td>
            <td><code>string</code></td>
            <td></td>
            <td>툴팁 값 뒤 단위 (기본: '명')</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
// 단일 데이터셋
const config = {
  categories: ['서울', '부산', '대구'],
  data: [1200, 900, 750],
  colorKey: 'bar.set1',
  maxValue: 1500,
}

// 다중 데이터셋
const config = {
  categories: ['서울', '부산', '대구'],
  datasets: [
    { label: '2024년', data: [1200, 900, 750], colorKey: 'bar.set1', colorIndex: 0 },
    { label: '2025년', data: [1350, 980, 820], colorKey: 'bar.set1', colorIndex: 1 },
  ],
  maxValue: 1500,
  showDataLabels: true,
}</pre
        >
      </div>

      <!-- Line Config -->
      <h3 class="section-subtitle">line — 라인 차트</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>categories</td>
            <td><code>string[]</code></td>
            <td>O</td>
            <td>X축 라벨 배열</td>
          </tr>
          <tr>
            <td>datasets</td>
            <td><code>{ label, data, colorKey, colorIndex? }[]</code></td>
            <td>O</td>
            <td>라인 데이터셋 배열</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td><code>number</code></td>
            <td>O</td>
            <td>Y축 최대값</td>
          </tr>
          <tr>
            <td>minValue</td>
            <td><code>number</code></td>
            <td></td>
            <td>Y축 최소값 (기본: 0)</td>
          </tr>
          <tr>
            <td>useGradient</td>
            <td><code>boolean</code></td>
            <td></td>
            <td>라인 아래 그라데이션 채우기</td>
          </tr>
          <tr>
            <td>averageLine</td>
            <td><code>number</code></td>
            <td></td>
            <td>평균선 값 (빨간 점선)</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
const config = {
  categories: ['1월', '2월', '3월', '4월'],
  datasets: [
    { label: '매출', data: [650, 720, 800, 780], colorKey: 'line.primary' },
    { label: '비용', data: [400, 450, 500, 480], colorKey: 'line.success' },
  ],
  maxValue: 1000,
  useGradient: true,
}</pre
        >
      </div>

      <!-- Pie Config -->
      <h3 class="section-subtitle">pie — 파이/도넛 차트</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>items</td>
            <td><code>{ name, value, count? }[]</code></td>
            <td>O</td>
            <td>파이 항목 배열 (name: 라벨, value: 값)</td>
          </tr>
          <tr>
            <td>style</td>
            <td><code>'primary' | 'secondary' | 'regionRatio' | 'taskStatus' | 'empty'</code></td>
            <td>O</td>
            <td>파이 스타일 (primary=테두리O, regionRatio=지역비율, taskStatus=도넛)</td>
          </tr>
          <tr>
            <td>textStyle</td>
            <td><code>'primary' | 'secondary'</code></td>
            <td></td>
            <td>데이터 라벨 텍스트 스타일 (내부 라벨 시 슬라이스 색상 기반 자동 대비)</td>
          </tr>
          <tr>
            <td>labelColor</td>
            <td><code>string[]</code></td>
            <td></td>
            <td>직접 색상 지정 (style 색상 대신 사용)</td>
          </tr>
          <tr>
            <td>type</td>
            <td><code>'outerLabel'</code></td>
            <td></td>
            <td>외부 라벨 + 연결선 파이 차트</td>
          </tr>
          <tr>
            <td>useSvgDonut</td>
            <td><code>boolean</code></td>
            <td></td>
            <td>SVG 도넛 차트 사용 (외부 라벨 + 연결선)</td>
          </tr>
          <tr>
            <td>valueMode</td>
            <td><code>'percent' | 'raw'</code></td>
            <td></td>
            <td>값 표시 모드 (기본: percent)</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
// 기본 파이 (내부 라벨 — 자동 대비 색상)
const config = {
  items: [
    { name: '개발팀', value: 35 },
    { name: '디자인팀', value: 25 },
  ],
  style: 'primary',
  textStyle: 'primary',
}

// 외부 라벨 파이 (연결선 + 바깥 %)
const config = {
  items: [
    { name: '개발팀', value: 25 },
    { name: '디자인팀', value: 18 },
  ],
  type: 'outerLabel',
  style: 'regionRatio',
}

// 도넛 차트
const config = {
  items: [
    { name: '완료', value: 70, count: 14 },
    { name: '진행중', value: 30, count: 6 },
  ],
  style: 'taskStatus',
}</pre
        >
      </div>

      <!-- Mixed Config -->
      <h3 class="section-subtitle">mixed — 혼합 차트 (Bar + Line)</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>categories</td>
            <td><code>string[]</code></td>
            <td>O</td>
            <td>X축 라벨 배열</td>
          </tr>
          <tr>
            <td>datasets</td>
            <td><code>{ label, type, data, colorKey, yAxisID }[]</code></td>
            <td>O</td>
            <td>각 데이터셋에 type='bar' 또는 'line' 지정</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td><code>number</code></td>
            <td>O</td>
            <td>좌측 Y축 최대값 (bar용)</td>
          </tr>
          <tr>
            <td>maxValue2</td>
            <td><code>number</code></td>
            <td>O</td>
            <td>우측 Y1축 최대값 (line용, %)</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
const config = {
  categories: ['1분기', '2분기', '3분기', '4분기'],
  datasets: [
    { label: '매출', type: 'bar', data: [5000, 6200, 7100, 8500],
      colorKey: 'mixed.set1', colorIndex: 0, yAxisID: 'y' },
    { label: '성장률', type: 'line', data: [12, 24, 15, 20],
      borderColor: '#FFB4A1', yAxisID: 'y1' },
  ],
  maxValue: 10000,
  maxValue2: 100,
}</pre
        >
      </div>

      <!-- Horizontal Bar Config -->
      <h3 class="section-subtitle">horizontalBar — 가로 막대 차트</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>categories</td>
            <td><code>string[]</code></td>
            <td>O</td>
            <td>Y축 라벨 배열</td>
          </tr>
          <tr>
            <td>data</td>
            <td><code>number[]</code></td>
            <td>O</td>
            <td>각 항목의 값</td>
          </tr>
          <tr>
            <td>colorKey</td>
            <td><code>string</code></td>
            <td>O</td>
            <td>ChartColors 경로</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td><code>number</code></td>
            <td>O</td>
            <td>X축 최대값</td>
          </tr>
          <tr>
            <td>showDataLabels</td>
            <td><code>boolean</code></td>
            <td></td>
            <td>막대 끝 수치 표시</td>
          </tr>
          <tr>
            <td>unit</td>
            <td><code>string</code></td>
            <td></td>
            <td>값 뒤 단위 (예: '%', '명')</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
const config = {
  categories: ['React', 'Vue', 'Angular'],
  data: [85, 72, 45],
  colorKey: 'bar.set1',
  colorIndex: 0,
  maxValue: 100,
  showDataLabels: true,
  unit: '%',
}</pre
        >
      </div>

      <!-- Radar Config -->
      <h3 class="section-subtitle">radar — 방사선 차트</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>categories</td>
            <td><code>string[]</code></td>
            <td>O</td>
            <td>축 라벨 배열 (3개 이상 권장)</td>
          </tr>
          <tr>
            <td>data</td>
            <td><code>number[]</code></td>
            <td>△</td>
            <td>단일 모드 (datasets와 택1)</td>
          </tr>
          <tr>
            <td>datasets</td>
            <td><code>{ label, data, color?, colorKey?, colorIndex? }[]</code></td>
            <td>△</td>
            <td>다중 모드 (data와 택1)</td>
          </tr>
          <tr>
            <td>color</td>
            <td><code>string</code></td>
            <td></td>
            <td>hex 직접 지정 (colorKey보다 우선, riskColor 등)</td>
          </tr>
          <tr>
            <td>colorKey</td>
            <td><code>string</code></td>
            <td></td>
            <td>ChartColors 경로 (기본 <code>'radar.primary'</code>)</td>
          </tr>
          <tr>
            <td>colorIndex</td>
            <td><code>number</code></td>
            <td></td>
            <td>다중 팔레트 인덱스 (기본 0)</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td><code>number</code></td>
            <td></td>
            <td>축 최대값 (생략 시 자동)</td>
          </tr>
          <tr>
            <td>stepSize</td>
            <td><code>number</code></td>
            <td></td>
            <td>격자 간격 (생략 시 자동)</td>
          </tr>
          <tr>
            <td>showDataLabels</td>
            <td><code>boolean</code></td>
            <td></td>
            <td>각 점에 수치 표시 (기본 false)</td>
          </tr>
          <tr>
            <td>fillOpacity</td>
            <td><code>number</code></td>
            <td></td>
            <td>채움 투명도 0~1 (기본 0.35)</td>
          </tr>
          <tr>
            <td>pointLabelFormat</td>
            <td><code>(name, value, index) =&gt; string</code></td>
            <td></td>
            <td>축 라벨 포맷 콜백. value는 첫 번째 데이터셋 값</td>
          </tr>
        </tbody>
      </table>
      <div class="guide-demo">
        <pre class="demo-code">
// 단일 데이터셋 (실데이터 응답에 맞춰 hex 직접 주입)
const config = {
  categories: ['직무요구','번아웃','조직관계','신체인지','회복력','워라밸','심리안전감','의미동기'],
  data: [30, 30, 20, 27, 75, 30, 20, 20],
  color: '#c62828',  // riskColor 등 hex 그대로
  maxValue: 100,
  stepSize: 25,
  fillOpacity: 0.25,
}

// 다중 데이터셋 비교
const config = {
  categories: [...],
  datasets: [
    { label: '본인', data: [...], colorKey: 'radar.set1', colorIndex: 0 },
    { label: '부서 평균', data: [...], colorKey: 'radar.set1', colorIndex: 1 },
  ],
  maxValue: 100,
  stepSize: 25,
}</pre
        >
      </div>
    </section>

    <!-- 기본 사용법 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용법</h2>
      <div class="guide-demo">
        <pre class="demo-code">
&lt;template&gt;
  &lt;!-- 반드시 height가 있는 부모로 감싸야 함 --&gt;
  &lt;div style="height: 300px"&gt;
    &lt;UiChart
      type="bar"
      :config="chartConfig"
      show-legend
    /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
const chartConfig = {
  categories: ['A', 'B', 'C'],
  data: [100, 200, 150],
  colorKey: 'bar.set1',
  maxValue: 250,
}
&lt;/script&gt;</pre
        >
      </div>
      <div class="guide-demo">
        <p class="demo-label">주의사항</p>
        <ul style="padding: 16px 16px 16px 32px; line-height: 2">
          <li>UiChart의 부모 요소에 <strong>반드시 높이(height)</strong>를 지정해야 합니다.</li>
          <li>
            <code>colorKey</code>는 <code>utils/chart/chart-colors.ts</code>의 ChartColors 객체 경로입니다 (예:
            <code>'bar.set1'</code>, <code>'line.primary'</code>).
          </li>
          <li>
            <code>showLegend</code> prop을 켜면 차트 위에 범례가 생성됩니다. 범례 클릭으로 데이터 토글 가능합니다.
          </li>
          <li>config가 변경되면 차트가 자동으로 재생성됩니다 (watch).</li>
          <li>컴포넌트 unmount 시 차트가 자동 파괴되어 메모리 누수가 없습니다.</li>
          <li>
            파이 차트(outerLabel)는 외부 라벨 공간이 필요합니다. 부모에
            <strong>max-height, max-width, padding</strong>을 충분히 확보하세요.
          </li>
        </ul>
      </div>
      <div class="guide-demo">
        <p class="demo-label">차트 부모 높이 가이드</p>
        <table class="guide-status-table">
          <thead>
            <tr>
              <th>차트 타입</th>
              <th>권장 높이</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>bar / line / mixed</td>
              <td><code>height: 300px</code></td>
              <td>기본 권장값</td>
            </tr>
            <tr>
              <td>horizontalBar</td>
              <td><code>height: 300px</code></td>
              <td>항목 수에 따라 조절</td>
            </tr>
            <tr>
              <td>pie (내부 라벨)</td>
              <td><code>height: 300px; max-width: 400px</code></td>
              <td>라벨이 슬라이스 안에 표시</td>
            </tr>
            <tr>
              <td>pie (outerLabel)</td>
              <td><code>height: 480px; max-width: 480px</code></td>
              <td>외부 라벨 + 연결선 공간 확보 필수</td>
            </tr>
            <tr>
              <td>radar</td>
              <td><code>height: 400px; max-width: 480px</code></td>
              <td>정사각형에 가까울수록 좋음, 라벨 공간 확보</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="guide-demo">
        <p class="demo-label">예시: outerLabel 파이 — 잘리지 않는 설정</p>
        <pre class="demo-code">
&lt;!-- 부모에 충분한 높이/너비 확보 --&gt;
&lt;div style="height: 480px; max-width: 480px; margin: 0 auto"&gt;
  &lt;UiChart
    type="pie"
    :config="{
      items: [...],
      type: 'outerLabel',
      style: 'regionRatio',
    }"
    show-legend
  /&gt;
&lt;/div&gt;

&lt;!-- SCSS에서 사용 시 --&gt;
.chart-area {
  min-height: 500px;
  max-height: 500px;

  &amp;.is-pie {
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 24px;
  }
}</pre
        >
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { StressScoreItem } from '~/types/stress'

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

// 방사선 차트 — 단일 데이터셋 (스트레스 진단 재현, 0~100점, 고위험 빨강)
const radarSingleConfig = {
  categories: ['직무요구', '번아웃', '조직관계', '신체인지', '회복력', '워라밸', '심리안전감', '의미동기'],
  data: [30, 30, 20, 27, 75, 30, 20, 20],
  color: '#c62828',
  maxValue: 100,
  stepSize: 25,
  fillOpacity: 0.25,
}

// 방사선 차트 — 다중 데이터셋 비교 (본인 vs 부서 평균)
const radarMultiConfig = {
  categories: ['직무요구', '번아웃', '조직관계', '신체인지', '회복력', '워라밸', '심리안전감', '의미동기'],
  datasets: [
    { label: '본인', data: [30, 30, 20, 27, 75, 30, 20, 20], colorKey: 'radar.set1', colorIndex: 0 },
    { label: '부서 평균', data: [50, 40, 45, 50, 50, 45, 50, 45], colorKey: 'radar.set1', colorIndex: 1 },
  ],
  maxValue: 100,
  stepSize: 25,
}

// 방사선 차트 — 데이터 라벨 표시
const radarLabelConfig = {
  categories: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt'],
  data: [85, 90, 60, 55, 80, 75],
  colorKey: 'radar.secondary',
  maxValue: 100,
  stepSize: 20,
  showDataLabels: true,
}

// 방사선 차트 — 0~4 스케일 (이미지 톤)
const radarSmallScaleConfig = {
  categories: ['직무요구', '번아웃', '조직관계', '신체인지', '회복력', '워라밸', '심리안전감', '의미동기'],
  data: [2.75, 2.0, 2.5, 3.0, 3.0, 2.0, 2.5, 2.0],
  colorKey: 'radar.primary',
  maxValue: 4,
  stepSize: 1,
}

// 방사선 차트 — 축 라벨에 점수 표기
const radarLabelFormatConfig = {
  categories: ['직무요구', '번아웃', '조직관계', '신체인지', '회복력', '워라밸', '심리안전감', '의미동기'],
  data: [30, 30, 20, 27, 75, 30, 20, 20],
  color: '#c62828',
  maxValue: 100,
  stepSize: 25,
  fillOpacity: 0.25,
  pointLabelFormat: (name: string, value: number) => `${name} (${value})`,
}

// ============================================
// 🔽 도메인 조합 예시 (StressScoreGrid + radar)
// ============================================
const stressItems: StressScoreItem[] = [
  { name: '직무요구', value: 2.75, level: '주의' },
  { name: '번아웃', value: 2.0, level: '관심' },
  { name: '조직관계', value: 2.5, level: '주의' },
  { name: '신체인지', value: 3.0, level: '고위험' },
  { name: '회복력', value: 3.0, level: '고위험' },
  { name: '워라밸', value: 2.0, level: '관심' },
  { name: '심리안전감', value: 2.5, level: '주의' },
  { name: '의미동기', value: 2.0, level: '관심' },
]

const stressCoreAreasText = '※ 핵심 영역: 신체인지(3.00) · 회복력(3.00)'

const radarStressConfig = {
  categories: stressItems.map((i) => i.name),
  data: stressItems.map((i) => i.value),
  color: '#c62828',
  maxValue: 4,
  stepSize: 1,
  fillOpacity: 0.25,
  pointLabelFormat: (name: string, value: number) => `${name} (${value.toFixed(2)})`,
}
</script>
