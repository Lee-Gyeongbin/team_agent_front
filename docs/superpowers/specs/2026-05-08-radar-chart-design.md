# 방사선(Radar) 차트 설계 문서

- **작성일**: 2026-05-08
- **작성자**: 이찬용
- **대상**: 신규 차트 타입 `radar` 추가 (Chart.js 기반)
- **상태**: 설계 승인 대기

## 배경

스트레스 진단 결과처럼 다축(8축 등) 점수를 한눈에 비교해야 하는 화면이 늘어나고 있다. 현재 차트 시스템(Chart.js + UiChart.vue)은 bar / line / pie / mixed / horizontalBar 5종만 지원하므로 radar 타입을 동일 패턴으로 추가한다.

## 목표 / 비목표

### 목표

- Chart.js 4의 `radar` 타입을 `utils/chart/chart-radar.ts` 모듈로 래핑
- `<UiChart type="radar" :config>` 형태로 호출 (기존 차트와 동일 인터페이스)
- 단일 데이터셋(이미지 재현)과 다중 데이터셋 비교(예: 본인 vs 부서 평균) 모두 지원
- 0~100, 0~5, 0~4 등 도메인별 스케일을 config로 자유롭게 지정
- API 응답의 `riskColor` 같은 hex 값을 그대로 차트 색상에 적용 가능

### 비목표

- 점수표(직무요구 2.75 (주의) 등), 핵심 영역 안내, riskSummary 같은 도메인 UI는 페이지 책임이며 차트 모듈 범위 밖
- riskLevel 임계값 계산 로직은 차트 모듈에 포함하지 않음
- 외부 라이브러리(ECharts, ApexCharts 등) 추가하지 않음
- backgroundBar / averageLine 같은 카르테시안 전용 플러그인은 radar에 적용하지 않음

## 사용 시나리오

### 1) 스트레스 진단 결과 (단일 데이터셋, 0~100점)

API가 다음 형태를 반환한다고 가정:

```ts
{
  riskLevel: '고위험',
  riskColor: '#c62828',
  riskBgColor: '#ffebee',
  riskSummary: '...',
  coreAreasSummary: '...',
  scores: {
    recovery: 75,
    jobDemand: 30,
    burnout: 30,
    workLifeBalance: 30,
    physicalCognition: 27,
    organizationRelation: 20,
    psychologicalSafety: 20,
    meaningMotivation: 20,
  },
}
```

페이지에서 영문 키 → 한글 라벨로 매핑한 뒤 chart config 구성:

```ts
const SCORE_LABEL_MAP: Record<string, string> = {
  jobDemand: '직무요구',
  burnout: '번아웃',
  organizationRelation: '조직관계',
  physicalCognition: '신체인지',
  recovery: '회복력',
  workLifeBalance: '워라밸',
  psychologicalSafety: '심리안전감',
  meaningMotivation: '의미동기',
}
const SCORE_ORDER = [
  'jobDemand', 'burnout', 'organizationRelation', 'physicalCognition',
  'recovery', 'workLifeBalance', 'psychologicalSafety', 'meaningMotivation',
]

const chartConfig = computed(() => ({
  categories: SCORE_ORDER.map((k) => SCORE_LABEL_MAP[k]),
  data: SCORE_ORDER.map((k) => result.value.scores[k]),
  color: result.value.riskColor,
  maxValue: 100,
  stepSize: 25,
  fillOpacity: 0.25,
}))
```

```vue
<div style="height: 400px; max-width: 480px">
  <UiChart type="radar" :config="chartConfig" />
</div>
```

### 2) 비교 시나리오 (다중 데이터셋)

```ts
{
  categories: ['직무요구', '번아웃', '조직관계', '신체인지', '회복력', '워라밸', '심리안전감', '의미동기'],
  datasets: [
    { label: '본인',     data: [75, 30, 20, 27, 75, 30, 20, 20], colorKey: 'radar.set1', colorIndex: 0 },
    { label: '부서 평균', data: [50, 40, 45, 50, 50, 45, 50, 45], colorKey: 'radar.set1', colorIndex: 1 },
  ],
  maxValue: 100,
  stepSize: 25,
}
```

```vue
<UiChart
  type="radar"
  :config="config"
  show-legend
/>
```

## 아키텍처

기존 차트 5종과 완전히 동일한 패턴을 따른다.

```
페이지 config 객체 ──▶ <UiChart type="radar" :config>
                              │
                              ▼
              useChart() ──▶ RadarChartModule.create
                              │
                              ▼
                     Chart.js radar 인스턴스
```

### 변경 파일

| 파일 | 작업 | 변경량 |
|------|------|--------|
| `utils/chart/chart-radar.ts` | **신규** — `RadarChartModule { create, update }` | ~120줄 |
| `utils/chart/chart-colors.ts` | `radar` 카테고리 신규 | ~12줄 |
| `utils/chart/chart-config.ts` | `hexToRgba(hex, alpha)` 헬퍼 export 추가 | ~12줄 |
| `utils/chart/index.ts` | `export { RadarChartModule } from './chart-radar'` | 1줄 |
| `composables/chart/useChart.ts` | `ChartType`에 `'radar'`, `getModule()` switch에 분기 추가 | 3줄 |
| `components/ui/UiChart.vue` | `ChartType`에 `'radar'` 추가 | 1줄 |
| `pages/guide/ui-chart.vue` | radar 데모 4개 + Props 테이블 + 부모 높이 가이드 추가 | ~100줄 |
| `pages/guide/index.vue` | 차트 카드 설명에 "방사선" 추가 (개수 6종) | 1줄 |
| `.claude/rules/chart-guide.md` | radar 항목 추가 | ~30줄 |

## Config 인터페이스

### 단일 데이터셋

```ts
{
  categories: string[]
  data: number[]
  color?: string         // hex 직접 지정 (colorKey 우선)
  colorKey?: string      // ChartColors 경로 (기본 'radar.primary')
  maxValue?: number      // 미지정 시 Chart.js 자동
  stepSize?: number      // 미지정 시 자동
  showDataLabels?: boolean   // 점 위 수치 표시 (기본 false)
  fillOpacity?: number   // 채움 투명도 (기본 0.35)
}
```

### 다중 데이터셋

```ts
{
  categories: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
    colorKey?: string
    colorIndex?: number
  }>
  maxValue?: number
  stepSize?: number
  showDataLabels?: boolean
  fillOpacity?: number
}
```

### Props 우선순위

- `color` (hex) → 있으면 1순위
- `colorKey` + `colorIndex` → `color` 없을 때 ChartColors에서 조회
- 둘 다 없으면 → `'radar.primary'` 기본값

## 색상 시스템

`utils/chart/chart-colors.ts`의 `ChartColors`에 `radar` 카테고리 신규 추가:

```ts
radar: {
  // 단일 데이터셋용
  primary:   '#FF8127',  // 주황
  secondary: '#258CEC',  // 파랑
  success:   '#00B248',  // 초록
  danger:    '#FF6565',  // 빨강
  purple:    '#725FEA',  // 보라

  // 다중 데이터셋용 (colorIndex로 선택)
  set1:  ['#FF8127', '#258CEC'],
  set2:  ['#725FEA', '#FF8127', '#40D4B1'],
  multi: ['#725FEA', '#DB59B6', '#258CEC', '#FF8127',
          '#40D4B1', '#FFC927', '#4CCCFF', '#FF6565'],
},
```

### 색상 처리 규칙 (모듈 내부)

- `color` / `colorKey`로 받은 hex → 테두리 솔리드, 채움은 `fillOpacity` 적용해 자동 변환
  - 예: `'#FF8127'` + `fillOpacity: 0.35` → border `#FF8127`, fill `rgba(255, 129, 39, 0.35)`
- 점(point) 색상은 테두리와 동일
- 다중 데이터셋: 각 dataset의 `colorIndex` 미지정 시 dataset 인덱스 자동 사용

### 신규 헬퍼: `hexToRgba`

기존 `utils/chart/`에 hex→rgba 변환 헬퍼가 없으므로 신규 추가.

- 위치: `utils/chart/chart-config.ts`에 `export` (다른 모듈에서도 재사용 가능)
- 시그니처: `hexToRgba(hex: string, alpha: number): string`
- 입력: `'#FF8127'` 또는 `'#f81'` (3자리 단축형 지원)
- 출력: `'rgba(255, 129, 39, 0.35)'`
- alpha 범위: 0~1 (벗어나면 0/1로 클램프)
- 잘못된 hex 입력 시: 콘솔 경고 + 입력값 그대로 반환 (Chart.js가 처리)

### 격자 / 축 색상 (디자인 토큰 사용)

| 요소 | 값 |
|------|-----|
| 격자 다각형 라인 | `var(--color-border)` |
| 축 라벨 | `var(--color-text-secondary)`, `@include typo($body-small)` |
| 스케일 라벨 (1.0/2.0/...) | `var(--color-text-disabled)`, `@include typo($body-xsmall)` |
| 배경 | 투명 |

## RadarChartModule 동작

```ts
export const RadarChartModule = {
  create(config: RadarChartConfig): void
  update(chartId: string, newData: any): void
}
```

### create() 흐름

1. **config 파싱 / 검증**
   - `datasets` 있으면 다중, 없으면 `data`로 단일
   - `categories.length !== data.length` 시 콘솔 경고
   - `categories.length < 3` 시 콘솔 경고 (radar는 3축 이상 권장)
2. **데이터셋 정규화**
   ```ts
   datasets.map((ds) => ({
     label: ds.label,
     data: ds.data,
     borderColor: resolvedColor,
     backgroundColor: hexToRgba(resolvedColor, fillOpacity),
     pointBackgroundColor: resolvedColor,
     pointBorderColor: '#fff',
     pointRadius: 4,
     pointHoverRadius: 6,
     borderWidth: 2,
   }))
   ```
3. **Chart.js 옵션**
   ```ts
   {
     type: 'radar',
     data: { labels: categories, datasets: normalized },
     options: {
       responsive: true,
       maintainAspectRatio: false,
       scales: {
         r: {
           min: 0,
           max: maxValue,
           ticks: { stepSize, showLabelBackdrop: false, color: 격자라벨색 },
           grid: { color: 격자라인색 },
           angleLines: { color: 격자라인색 },
           pointLabels: { font: {...$body-small}, color: 라벨색 },
         },
       },
       plugins: {
         legend: { display: false },        // UiChart의 커스텀 범례 사용
         datalabels: showDataLabels ? { display: true, anchor: 'end', align: 'end' } : { display: false },
         tooltip: { enabled: true },
       },
       elements: { line: { tension: 0 } },
     },
   }
   ```
4. **커스텀 범례** (`showLegend && legendId`): `ChartConfig.renderLegend(chart, legendId)` 호출
5. **인스턴스 등록**: `ChartConfig.instances[id] = chart`

### update() 흐름

```ts
const chart = ChartConfig.instances[chartId]
if (!chart) return
chart.data.labels = newData.categories
chart.data.datasets = normalize(newData)
chart.update('none')
```

### 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| `data` 빈 배열 | 차트는 그려지되 점 없음 |
| `categories.length < 3` | 콘솔 경고, 그래도 그림 |
| `maxValue` 미지정 | Chart.js 자동 스케일 |
| 다중 데이터셋 일부 누락 | `null`로 채워 Chart.js가 점 생략 |
| `data` / `datasets` 둘 다 없음 | 콘솔 에러 + 빈 차트 |
| 단일 모드에서 `colorKey` / `color` 둘 다 없음 | `'radar.primary'` 기본값 |

### 공통 플러그인과의 관계

`backgroundBar` / `averageLine` 플러그인은 카르테시안 전용 → radar에 적용 안 함.

## UiChart.vue / useChart.ts 통합

### `composables/chart/useChart.ts`

```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'

function getModule(type: ChartType) {
  switch (type) {
    case 'bar': return BarChartModule
    case 'line': return LineChartModule
    case 'pie': return PieChartModule
    case 'mixed': return MixedChartModule
    case 'horizontalBar': return XBarChartModule
    case 'radar': return RadarChartModule
    default: return BarChartModule
  }
}
```

### `components/ui/UiChart.vue`

```ts
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar' | 'radar'
```

기타 변경 없음.

## 가이드 페이지 (`pages/guide/ui-chart.vue`)

### 추가 데모

| 데모 | 의도 | 핵심 옵션 |
|------|------|-----------|
| 1. 단일 데이터셋 (스트레스 진단) | 기본 사용법 | `data`, `color`, `maxValue: 100`, `stepSize: 25` |
| 2. 다중 데이터셋 비교 | 본인 vs 부서 평균 | `datasets`, `colorKey: 'radar.set1'`, `showLegend` |
| 3. 데이터 라벨 표시 | 점 위 수치 노출 | `showDataLabels: true` |
| 4. 0~4 스케일 | 다른 max 케이스 | `maxValue: 4`, `stepSize: 1`, `colorKey: 'radar.primary'` |

각 데모 하단에 config 코드 블록 노출 (다른 차트 데모와 동일).

### Props 테이블

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `categories` | `string[]` | — | 축 라벨 (3개 이상 권장) |
| `data` | `number[]` | — | 단일 모드 (datasets와 택일) |
| `datasets` | `Array<{label, data, colorKey?, colorIndex?, color?}>` | — | 다중 모드 |
| `color` | `string` | — | hex 직접 지정 (colorKey 우선) |
| `colorKey` | `string` | `'radar.primary'` | ChartColors 경로 |
| `colorIndex` | `number` | `0` | 다중 팔레트 인덱스 |
| `maxValue` | `number` | auto | 축 최대값 |
| `stepSize` | `number` | auto | 격자 간격 |
| `showDataLabels` | `boolean` | `false` | 점 위 수치 표시 |
| `fillOpacity` | `number` | `0.35` | 채움 투명도 |

### 부모 높이 가이드 표 갱신

| 차트 타입 | 권장 설정 |
|-----------|----------|
| bar / line / mixed / horizontalBar | `height: 300px` |
| pie (내부 라벨) | `height: 300px; max-width: 400px` |
| pie (outerLabel) | `height: 480px; max-width: 480px` |
| **radar** | **`height: 400px; max-width: 480px`** (정사각형에 가까울수록 좋음, 라벨 공간 확보) |

## `pages/guide/index.vue` 변경

- `componentList`의 차트 카드 설명을 "방사선 포함 6종"으로 갱신
- `statusList`엔 추가하지 않음 (CLAUDE.md: UI 컴포넌트는 statusList 비포함)

## `.claude/rules/chart-guide.md` 갱신

- 폴더 구조에 `chart-radar.ts` 추가
- "차트 타입별 config" 섹션에 **6. Radar** 신규
- "색상 시스템" `colorKey` 예시에 `'radar.primary'`, `'radar.set1'` 추가
- "공통 플러그인" 표에서 backgroundBar / averageLine은 radar에 적용 안 함 명시
- 부모 높이 가이드 표에 radar 행 추가

## 책임 분리 원칙

| 데이터 / UI | 처리 위치 |
|-------------|-----------|
| API 응답의 `scores` (key-value) → `categories` + `data` 변환 | 페이지 (한/영 키 매핑) |
| `riskColor` → 차트 색상 | 페이지가 prop으로 전달 |
| `riskLevel` 임계값 계산 | 페이지 또는 백엔드 |
| 점수표 / 핵심 영역 안내 / riskSummary | 페이지 별도 UI |
| Chart.js 라이프사이클 / 인스턴스 관리 | `useChart` (기존) |
| Chart.js 옵션 / 정규화 / 색상 변환 | `RadarChartModule` (신규) |

차트 모듈은 도메인 키(영문/한글), HCM, 위험 등급을 모른다. 범용으로 유지.

## 검증 방법

1. 가이드 페이지에서 4개 데모 모두 정상 렌더링 확인
2. config 변경 시 차트 자동 재생성 확인 (computed로 감싼 case)
3. unmount 시 인스턴스 정리 확인 (devtools에서 ChartConfig.instances 비워짐)
4. 단일 / 다중 데이터셋 hover, 툴팁, 범례 클릭 토글 동작
5. 0~4, 0~5, 0~100 스케일 모두 격자 / 라벨 정상 표시
6. `color` prop으로 hex 직접 주입 시 fill 투명도 적용 확인

## 오픈 이슈

- 없음

## 다음 단계

`superpowers:writing-plans` 스킬로 구현 계획서 작성.
