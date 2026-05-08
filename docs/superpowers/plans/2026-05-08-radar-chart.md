# Radar Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UiChart에 `type="radar"` 지원을 추가하여, 다축 점수(예: 8축 스트레스 진단) 시각화를 다른 5종 차트와 동일한 인터페이스로 제공한다.

**Architecture:** Chart.js 4의 내장 `radar` 타입을 `RadarChartModule`로 래핑한다. 기존 5종(`BarChartModule`, `LineChartModule`, …)과 같은 `{ create, update }` 인터페이스를 노출하고, `useChart`의 `getModule()` 분기에 추가한다. 색상은 `ChartColors.radar` 팔레트 신규 추가 + `color` prop으로 hex 직접 지정도 지원한다.

**Tech Stack:** Vue 3 + Nuxt 3 (SPA), TypeScript 5, Chart.js 4.5, chartjs-plugin-datalabels 2.2, SCSS.

**Spec:** `docs/superpowers/specs/2026-05-08-radar-chart-design.md`

**검증 방식 (이 프로젝트 특성)**: 테스트 러너가 없음. 각 task 끝에 `/guide/ui-chart` 페이지에서 시각 확인. 사용자 메모리: "빌드 확인 금지 — 사용자가 직접 확인함". 따라서 **자동 빌드 실행 X**, **자동 커밋 X** (CLAUDE.md: "NEVER commit unless explicitly asked"). 커밋이 필요한 단계는 "(사용자 승인 후 커밋)"으로 표기.

**구현 노트**: spec 단계에서 "신규 `hexToRgba` 헬퍼 추가"로 적었으나, 실제 코드를 보니 `ChartConfig.parseColorToRgb`가 이미 존재하고 `chart-line.ts`가 로컬 `colorToRgba` 헬퍼로 그것을 감싸 사용 중. 동일 패턴을 따라 **`chart-radar.ts` 내부에 로컬 `colorToRgba` 추가**(chart-line.ts와 일관). chart-config.ts 변경 불필요.

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| `utils/chart/chart-colors.ts` | `ChartColors.radar` 카테고리 신규 추가 |
| `utils/chart/chart-radar.ts` | **신규 파일** — `RadarChartModule { create, update }` |
| `utils/chart/index.ts` | `export { RadarChartModule } from './chart-radar'` |
| `composables/chart/useChart.ts` | `ChartType` 유니온에 `'radar'` 추가 + `getModule()` switch case |
| `components/ui/UiChart.vue` | `ChartType` 유니온에 `'radar'` 추가 |
| `pages/guide/ui-chart.vue` | radar 데모 4개 + Props/Config/높이 가이드 갱신 |
| `pages/guide/index.vue` | 차트 카드 설명 갱신 (5종 → 6종) |
| `.claude/rules/chart-guide.md` | radar 항목 추가 |

---

## Task 1: ChartColors.radar 팔레트 추가

**목표:** chart-colors.ts에 radar 전용 색상 팔레트 추가. 후속 모듈에서 `colorKey: 'radar.*'`로 참조 가능하게.

**Files:**
- Modify: `utils/chart/chart-colors.ts` (line 표 카테고리 다음에 추가)

- [ ] **Step 1: 파일 열고 `// ===== 라인 차트 색상 =====` 섹션 위치 확인**

`utils/chart/chart-colors.ts` 라인 98 부근에 `line: { ... }` 섹션이 있음. 그 다음 또는 `mixed:` 섹션 다음 어디든 OK. mixed 다음(라인 138 닫는 `}` 다음)에 추가하기로.

- [ ] **Step 2: `radar` 카테고리 추가**

`mixed: { ... },` 닫는 중괄호 바로 다음 라인에 다음 코드 삽입:

```ts
  // ===== 방사선(Radar) 차트 색상 =====
  radar: {
    // 단일 데이터셋용 (단일 hex)
    primary: '#FF8127', // 주황 (위험 상태 강조용)
    secondary: '#258CEC', // 파랑
    success: '#00B248', // 초록 (안전)
    danger: '#FF6565', // 빨강 (고위험)
    purple: '#725FEA', // 보라

    // 다중 데이터셋용 (colorIndex로 선택)
    set1: ['#FF8127', '#258CEC'], // 주황, 파랑 — 본인 vs 평균
    set2: ['#725FEA', '#FF8127', '#40D4B1'], // 보라, 주황, 민트 — 3자 비교
    multi: ['#725FEA', '#DB59B6', '#258CEC', '#FF8127', '#40D4B1', '#FFC927', '#4CCCFF', '#FF6565'], // 8색
  },
```

- [ ] **Step 3: 시각 확인**

저장 후 dev 서버에서 콘솔 에러가 없는지 확인. (이 시점엔 아직 차트가 없어서 실제로는 사용 안 됨, 단지 컴파일 에러가 없는지만 확인.)

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add utils/chart/chart-colors.ts
git commit -m "feat(chart): radar 차트 색상 팔레트 추가

1. ChartColors.radar 카테고리 신규 (단일 5색 + 다중 set1/set2/multi)
2. 후속 RadarChartModule에서 colorKey 'radar.*'로 참조"
```

---

## Task 2: chart-radar.ts 모듈 작성

**목표:** Chart.js radar 타입을 래핑한 `RadarChartModule { create, update }` 구현. 단일/다중 데이터셋 모두 지원.

**Files:**
- Create: `utils/chart/chart-radar.ts`

- [ ] **Step 1: 파일 생성 + 헤더/import 작성**

`utils/chart/chart-radar.ts` 신규 파일에 다음 내용 작성:

```ts
/**
 * 방사선(Radar) 차트 모듈
 * 다축 점수 비교 (스트레스 진단, 역량 평가 등)
 * @module RadarChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

/** 색상을 rgba 문자열로 변환 (chart-line.ts와 동일 패턴) */
function colorToRgba(color: string, alpha: number): string {
  const rgb = ChartConfig.parseColorToRgb(color)
  if (!rgb) return color
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
}
```

- [ ] **Step 2: `createLegend` 메서드 추가** (chart-line.ts와 동일 패턴)

```ts
export const RadarChartModule = {
  /** 범례 생성 */
  createLegend(chartId: string, legendId: string, datasets: any[]) {
    const legendContainer = document.getElementById(legendId)
    if (!legendContainer) {
      console.warn(`Legend container with id '${legendId}' not found`)
      return
    }

    legendContainer.innerHTML = ''

    const isSingle = datasets.length <= 1
    datasets.forEach((dataset, datasetIndex) => {
      const legendItem = ChartConfig.createLegendItem({
        label: dataset.label,
        color: dataset.borderColor,
        dotStyle: 'circle',
        onClick: isSingle
          ? undefined
          : () => {
              const chart = ChartConfig.instances[chartId]
              if (chart) {
                ChartConfig.toggleLegend(legendItem, chart, datasetIndex, 'dataset')
              }
            },
      })
      if (isSingle) {
        legendItem.style.cursor = 'default'
      }
      legendContainer.appendChild(legendItem)
    })
  },
```

- [ ] **Step 3: `create()` 메서드 — config 파싱 + 데이터셋 정규화**

다음을 `createLegend` 메서드 다음에 추가:

```ts
  /** 방사선 차트 생성 */
  create(config: any) {
    const {
      id,
      legendId,
      categories = [],
      data,
      datasets,
      color,
      colorKey = 'radar.primary',
      colorIndex = 0,
      maxValue,
      stepSize,
      showDataLabels = false,
      fillOpacity = 0.35,
      showLegend = false,
    } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 카테고리 검증
    if (!Array.isArray(categories) || categories.length < 3) {
      console.warn('Radar chart: categories should have at least 3 axes')
    }

    // 데이터셋 정규화
    let normalizedDatasets: any[] = []
    if (Array.isArray(datasets) && datasets.length > 0) {
      // 다중 모드
      normalizedDatasets = datasets.map((ds: any, idx: number) => {
        const resolvedColor =
          ds.color ||
          (ds.colorKey
            ? ChartConfig.getColor(ds.colorKey, ds.colorIndex ?? idx)
            : ChartConfig.getColor('radar.set1', idx))
        return {
          label: ds.label,
          data: ds.data,
          borderColor: resolvedColor,
          backgroundColor: colorToRgba(resolvedColor, fillOpacity),
          pointBackgroundColor: resolvedColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: true,
        }
      })
    } else if (Array.isArray(data)) {
      // 단일 모드
      const resolvedColor = color || ChartConfig.getColor(colorKey, colorIndex)
      normalizedDatasets = [
        {
          label: '',
          data,
          borderColor: resolvedColor,
          backgroundColor: colorToRgba(resolvedColor, fillOpacity),
          pointBackgroundColor: resolvedColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: true,
        },
      ]
    } else {
      console.error('Radar chart: either `data` or `datasets` is required')
      return
    }
```

- [ ] **Step 4: `create()` — Chart.js 옵션 + 인스턴스 생성**

Step 3에 이어서 같은 `create()` 메서드 안에 다음 추가:

```ts
    // 범례
    if (showLegend && legendId) {
      this.createLegend(id, legendId, normalizedDatasets)
    }

    // Chart.js 옵션
    const radarOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 16, bottom: 16, left: 16, right: 16 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            label(context: any) {
              const label = context.dataset.label || ''
              const value = context.parsed.r
              return label ? `${label}: ${value}` : `${value}`
            },
          },
        },
        datalabels: showDataLabels
          ? {
              display: true,
              anchor: 'end',
              align: 'end',
              offset: 4,
              color: '#464C53',
              font: {
                family: ChartConfig.font.family,
                size: ChartConfig.font.size.small,
                weight: 'bold',
              },
              formatter: (value: number) => value,
            }
          : { display: false },
      },
      scales: {
        r: {
          min: 0,
          ...(typeof maxValue === 'number' ? { max: maxValue } : {}),
          ticks: {
            ...(typeof stepSize === 'number' ? { stepSize } : {}),
            showLabelBackdrop: false,
            color: '#9CA3AF',
            font: {
              family: ChartConfig.font.family,
              size: 11,
            },
          },
          grid: { color: 'rgba(0, 0, 26, 0.12)' },
          angleLines: { color: 'rgba(0, 0, 26, 0.12)' },
          pointLabels: {
            color: '#5C6677',
            font: {
              family: ChartConfig.font.family,
              size: ChartConfig.font.size.small,
              weight: 500,
            },
          },
        },
      },
      elements: {
        line: { tension: 0 },
      },
    }

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'radar',
      data: { labels: categories, datasets: normalizedDatasets },
      options: radarOptions,
    })
  },
```

- [ ] **Step 5: `update()` 메서드 추가**

`create()` 메서드 닫는 `},` 다음에 추가:

```ts
  /** 차트 업데이트 (재생성 없이 데이터만) */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) {
      chart.data.labels = newData.categories
    }
    if (newData.datasets) {
      chart.data.datasets = newData.datasets
    } else if (newData.data) {
      // 단일 모드 업데이트
      if (chart.data.datasets[0]) {
        chart.data.datasets[0].data = newData.data
      }
    }

    chart.update('none')
  },
}
```

- [ ] **Step 6: 파일 전체 구조 확인**

저장 후 파일이 다음 구조인지 확인:
1. 파일 헤더 주석
2. `import` 2줄
3. `function colorToRgba(...)` 헬퍼
4. `export const RadarChartModule = { createLegend, create, update }`

- [ ] **Step 7: ESLint/TS 에러 확인**

`npm run lint` 실행. 에러 없으면 통과.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add utils/chart/chart-radar.ts
git commit -m "feat(chart): RadarChartModule 신규 추가

1. Chart.js radar 타입 래핑, 단일/다중 데이터셋 지원
2. color/colorKey/maxValue/stepSize/showDataLabels/fillOpacity 옵션
3. createLegend 메서드 (다중 시 클릭 토글)
4. update 메서드 (재생성 없이 데이터 갱신)"
```

---

## Task 3: 모듈 통합 — index/useChart/UiChart

**목표:** 신규 모듈을 차트 시스템에 등록. `<UiChart type="radar">` 가 동작하게.

**Files:**
- Modify: `utils/chart/index.ts`
- Modify: `composables/chart/useChart.ts`
- Modify: `components/ui/UiChart.vue`

- [ ] **Step 1: `utils/chart/index.ts`에 export 추가**

기존:
```ts
export { XBarChartModule } from './chart-horizontal-bar'
```

다음으로 변경:
```ts
export { XBarChartModule } from './chart-horizontal-bar'
export { RadarChartModule } from './chart-radar'
```

- [ ] **Step 2: `composables/chart/useChart.ts` — import 추가**

기존 import 블록:
```ts
import {
  ChartConfig,
  BarChartModule,
  LineChartModule,
  PieChartModule,
  MixedChartModule,
  XBarChartModule,
} from '~/utils/chart'
```

다음으로 변경:
```ts
import {
  ChartConfig,
  BarChartModule,
  LineChartModule,
  PieChartModule,
  MixedChartModule,
  XBarChartModule,
  RadarChartModule,
} from '~/utils/chart'
```

- [ ] **Step 3: `useChart.ts` — ChartType 유니온 + switch 분기 추가**

기존:
```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'
```

다음으로 변경:
```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'
```

기존 `getModule` switch:
```ts
    case 'horizontalBar':
      return XBarChartModule
    default:
      return BarChartModule
```

다음으로 변경:
```ts
    case 'horizontalBar':
      return XBarChartModule
    case 'radar':
      return RadarChartModule
    default:
      return BarChartModule
```

- [ ] **Step 4: `components/ui/UiChart.vue` — ChartType 유니온 추가**

기존:
```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'
```

다음으로 변경:
```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'
```

또한 Props 주석의 `차트 타입`에 'radar' 포함되도록 (이미 일반 주석이라면 변경 불필요).

- [ ] **Step 5: ESLint/TS 에러 확인**

`npm run lint` 실행. 통과 확인.

- [ ] **Step 6: 시각 확인 — 임시 테스트**

`/guide/ui-chart` 페이지에 임시로 다음 코드 한 블록 추가해 동작 확인 (Task 5에서 정식 데모로 대체할 예정):

```vue
<!-- 임시 테스트 — Task 5에서 제거 -->
<section class="guide-section">
  <h2 class="section-title">[임시] Radar Chart 동작 확인</h2>
  <div style="height: 400px; max-width: 480px; margin: 0 auto">
    <UiChart
      type="radar"
      :config="{
        categories: ['직무요구','번아웃','조직관계','신체인지','회복력','워라밸','심리안전감','의미동기'],
        data: [30, 30, 20, 27, 75, 30, 20, 20],
        color: '#c62828',
        maxValue: 100,
        stepSize: 25,
      }"
    />
  </div>
</section>
```

브라우저에서 `/guide/ui-chart` 열어 8축 방사선 차트가 정상 그려지는지 확인. 격자 다각형 / 축 라벨 / 빨간 채움 영역 / 점이 모두 보여야 함. 콘솔 에러 없어야 함.

- [ ] **Step 7: 임시 테스트 코드 제거**

확인 끝났으면 Step 6에서 추가한 `<!-- 임시 테스트 -->` 섹션 제거. (Task 5에서 정식 데모로 추가할 것이므로.)

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add utils/chart/index.ts composables/chart/useChart.ts components/ui/UiChart.vue
git commit -m "feat(chart): radar 타입을 차트 시스템에 통합

1. utils/chart/index.ts에 RadarChartModule export
2. useChart.ts ChartType + getModule() 분기 추가
3. UiChart.vue ChartType에 'radar' 추가"
```

---

## Task 4: 가이드 페이지 — 데모 4개 추가

**목표:** `/guide/ui-chart`에 radar 데모 4종을 다른 차트와 동일한 형식으로 추가.

**Files:**
- Modify: `pages/guide/ui-chart.vue`

- [ ] **Step 1: 페이지 description 갱신**

기존:
```html
<p class="guide-description">Chart.js 기반 범용 차트 컴포넌트 — bar, line, pie, mixed, horizontalBar 5종 지원</p>
```

다음으로 변경:
```html
<p class="guide-description">Chart.js 기반 범용 차트 컴포넌트 — bar, line, pie, mixed, horizontalBar, radar 6종 지원</p>
```

- [ ] **Step 2: Radar 데모 섹션 4개 추가**

기존 `<!-- Horizontal Bar Chart -->` 섹션 닫는 `</section>` 바로 다음에 다음 4개 섹션 추가:

```vue
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
```

- [ ] **Step 3: 더미 데이터 4개 추가 (`<script setup>` 내부)**

기존 `// 가로 막대 차트 설정 ... const horizontalBarConfig = { ... }` 다음에 추가:

```ts
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
```

- [ ] **Step 4: Props 테이블 업데이트 (이미 충분히 일반적이므로 type 행만 갱신)**

기존:
```html
<td>type</td>
<td><code>'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'</code></td>
```

다음으로 변경:
```html
<td>type</td>
<td><code>'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'</code></td>
```

- [ ] **Step 5: Config 옵션 섹션에 radar 서브섹션 추가**

기존 `<!-- Horizontal Bar Config -->` 섹션의 마지막 `<pre>...</pre>` 닫고 그 다음(같은 `<section>` 내 마지막 자식)에 다음 서브섹션 추가:

```vue
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
            <td>hex 직접 지정 (colorKey보다 우선)</td>
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
```

- [ ] **Step 6: 부모 높이 가이드 표에 radar 행 추가**

기존 `차트 부모 높이 가이드` 표의 마지막 `<tr>` (pie outerLabel) 다음에 추가:

```html
            <tr>
              <td>radar</td>
              <td><code>height: 400px; max-width: 480px</code></td>
              <td>정사각형에 가까울수록 좋음, 라벨 공간 확보</td>
            </tr>
```

- [ ] **Step 7: 시각 확인**

`/guide/ui-chart` 페이지를 브라우저로 열어 4개 데모가 모두 정상 렌더링되는지 확인:
1. 단일 데이터셋 (빨간 8각 방사선)
2. 다중 데이터셋 (주황 + 파랑 겹침, 범례 표시, 클릭 토글 동작)
3. 데이터 라벨 (각 점 옆에 숫자)
4. 0~4 스케일 (격자 0/1/2/3/4)

콘솔 에러 없어야 함. Props/Config 표가 잘 출력되어야 함.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add pages/guide/ui-chart.vue
git commit -m "docs(chart): radar 차트 가이드 페이지 데모 추가

1. 단일/다중/라벨/0~4 스케일 4개 데모 섹션
2. Props 테이블 type 유니온에 'radar' 반영
3. Config 옵션 — radar 서브섹션 + 코드 예시
4. 부모 높이 가이드 표에 radar 행 추가"
```

---

## Task 5: chart-guide.md 문서 갱신

**목표:** `.claude/rules/chart-guide.md`에 radar 정보 추가. (CLAUDE 컨텍스트로 자동 로드되는 문서.)

**Files:**
- Modify: `.claude/rules/chart-guide.md`

- [ ] **Step 1: 폴더 구조 섹션에 chart-radar.ts 추가**

기존:
```
├── chart-mixed.ts          # 혼합 차트 (MixedChartModule)
└── chart-horizontal-bar.ts # 가로 막대 차트 (XBarChartModule)
```

다음으로 변경:
```
├── chart-mixed.ts          # 혼합 차트 (MixedChartModule)
├── chart-horizontal-bar.ts # 가로 막대 차트 (XBarChartModule)
└── chart-radar.ts          # 방사선 차트 (RadarChartModule)
```

- [ ] **Step 2: 부모 높이 가이드 표에 radar 행 추가**

기존:
```
| pie (outerLabel) | `height: 480px; max-width: 480px` |
```

다음으로 변경:
```
| pie (outerLabel) | `height: 480px; max-width: 480px` |
| radar | `height: 400px; max-width: 480px` |
```

- [ ] **Step 3: UiChart Props의 type 유니온 갱신**

기존:
```
| `type` | `'bar' \| 'line' \| 'pie' \| 'mixed' \| 'horizontalBar'` | - | 필수 |
```

다음으로 변경:
```
| `type` | `'bar' \| 'line' \| 'pie' \| 'mixed' \| 'horizontalBar' \| 'radar'` | - | 필수 |
```

- [ ] **Step 4: "차트 타입별 config" 섹션에 6번 추가**

`### 5. HorizontalBar` 섹션 다음에 다음 섹션 추가:

````markdown
### 6. Radar (방사선)

```ts
// 단일 데이터셋
{ categories: [...], data: [...], color: '#c62828', maxValue: 100, stepSize: 25, fillOpacity: 0.25 }

// 다중 데이터셋
{ categories: [...], datasets: [{ label, data, colorKey, colorIndex }], maxValue: 100 }
```

| 옵션 | 설명 |
|------|------|
| `color` | hex 직접 지정 (colorKey보다 우선, riskColor 등 그대로 주입) |
| `colorKey` | ChartColors 경로 (기본 `'radar.primary'`) |
| `maxValue` / `stepSize` | 축 최대값과 격자 간격 (생략 시 자동) |
| `showDataLabels` | 점 위 수치 표시 |
| `fillOpacity` | 채움 투명도 0~1 (기본 0.35) |
````

- [ ] **Step 5: 색상 시스템 섹션의 주요 키 예시에 radar 추가**

기존:
```ts
// 주요 키
'bar.set1'         // [보라, 연주황, 민트, 주황]
'line.primary'     // 파랑
'line.success'     // 초록
'pie.regionRatio'  // 8색
'mixed.set1'       // [보라, 연주황]
```

다음으로 변경:
```ts
// 주요 키
'bar.set1'         // [보라, 연주황, 민트, 주황]
'line.primary'     // 파랑
'line.success'     // 초록
'pie.regionRatio'  // 8색
'mixed.set1'       // [보라, 연주황]
'radar.primary'    // 주황 (단일)
'radar.set1'       // [주황, 파랑] (다중 비교)
```

- [ ] **Step 6: 공통 플러그인 섹션에 radar 비적용 메모 추가**

기존 "공통 플러그인 (ChartConfig.plugins)" 표 바로 아래에 다음 한 줄 추가:

```
**참고**: `backgroundBar` / `averageLine`은 카르테시안 좌표계 전용 — radar에는 적용 안 됨.
```

- [ ] **Step 7: 가이드 페이지 안내 갱신**

기존:
```
`/guide/ui-chart` — 5종 라이브 데모 + Props + Config 예시 + 부모 높이 가이드
```

다음으로 변경:
```
`/guide/ui-chart` — 6종 라이브 데모 + Props + Config 예시 + 부모 높이 가이드
```

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add .claude/rules/chart-guide.md
git commit -m "docs(chart): chart-guide.md radar 항목 추가

1. 폴더 구조에 chart-radar.ts
2. 부모 높이 가이드 표에 radar 행
3. UiChart Props type 유니온 갱신
4. 차트 타입별 config — 6. Radar 신규
5. 색상 키 예시에 radar.primary/set1
6. 공통 플러그인 — radar 비적용 메모"
```

---

## Task 6: guide/index.vue 카드 설명 갱신

**목표:** 가이드 인덱스 페이지의 차트 카드 설명을 5종 → 6종으로 갱신.

**Files:**
- Modify: `pages/guide/index.vue`

- [ ] **Step 1: 차트 카드 description 갱신**

`pages/guide/index.vue` 라인 484 부근의 `componentList` 항목을 다음과 같이 수정.

기존:
```ts
{
  name: 'UiChart',
  to: '/guide/ui-chart',
  description: 'Chart.js 기반 차트 — bar, line, pie, mixed, horizontalBar 5종',
  tags: ['type', 'config', 'showLegend'],
},
```

다음으로 변경:
```ts
{
  name: 'UiChart',
  to: '/guide/ui-chart',
  description: 'Chart.js 기반 차트 — bar, line, pie, mixed, horizontalBar, radar 6종',
  tags: ['type', 'config', 'showLegend'],
},
```

- [ ] **Step 2: 시각 확인**

`/guide` 페이지에서 차트 카드 설명이 갱신됐는지 확인.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add pages/guide/index.vue
git commit -m "docs(guide): 차트 카드 설명에 radar 반영"
```

---

## 최종 검증 (모든 Task 완료 후)

- [ ] **Step 1: dev 서버 띄우고 다음을 모두 확인**

1. `/guide/ui-chart` — 6개 차트 모두 정상 렌더링 (bar/line/pie/mixed/horizontalBar/radar)
2. radar 데모 4개 — 단일/다중/라벨/0~4 스케일 모두 정상
3. radar 다중 데이터셋의 범례 클릭 토글 동작 확인
4. 다른 차트 5종이 회귀 없이 그대로 동작하는지 확인
5. 페이지 이동 후 돌아왔을 때 차트 인스턴스가 정리되고 재생성되는지 (Vue devtools에서 메모리 누수 점검)
6. 콘솔 에러 / 경고 0건

- [ ] **Step 2: ESLint 통과 확인**

`npm run lint`

- [ ] **Step 3: TypeScript 타입 에러 확인**

Nuxt가 자동으로 타입 체크 — dev 서버 띄운 상태에서 터미널에 타입 에러가 없는지 확인.

- [ ] **Step 4: 사용자 최종 확인 후 develop 브랜치에 머지 또는 PR 생성 (사용자 지시)**

(브랜치 전략: 작업은 `feat/radar-chart` 브랜치에서, develop으로 PR. CLAUDE.md `git-branch-strategy.md` 참조.)

---

## 참고 자료

- **Spec**: `docs/superpowers/specs/2026-05-08-radar-chart-design.md`
- **Chart.js radar 문서**: https://www.chartjs.org/docs/latest/charts/radar.html
- **유사 모듈 (참고용)**:
  - `utils/chart/chart-line.ts` — `colorToRgba` 헬퍼 패턴, createLegend 패턴
  - `utils/chart/chart-pie.ts` — datalabels 옵션, 색상 매핑
- **공통 헬퍼 (재사용)**:
  - `ChartConfig.parseColorToRgb` — hex/rgb/rgba → [r,g,b]
  - `ChartConfig.getColor(colorKey, colorIndex, default?)` — 팔레트 lookup
  - `ChartConfig.createLegendItem(opts)` — 범례 DOM 생성
  - `ChartConfig.toggleLegend(item, chart, idx, type)` — 범례 클릭 토글
  - `ChartConfig.tooltipConfig` — 공통 툴팁 스타일
  - `ChartConfig.font` — 공통 폰트 설정
