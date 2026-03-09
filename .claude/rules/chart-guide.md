# 차트 개발 가이드

## 기술 스택

- **Chart.js 4** + `chartjs-plugin-datalabels`
- **UiChart.vue** — 범용 래퍼 컴포넌트
- **useChart.ts** — 생명주기 관리 (생성/파괴 자동)
- **utils/chart/** — 타입별 모듈 + 공통 설정 + 색상

## 폴더 구조

```
utils/chart/
├── index.ts                # 통합 export + 플러그인 등록
├── chart-config.ts         # 공통 설정, 플러그인(backgroundBar, averageLine), getContrastColor
├── chart-colors.ts         # 색상 팔레트 (ChartColors)
├── chart-bar.ts            # 막대 차트 (BarChartModule)
├── chart-line.ts           # 라인 차트 (LineChartModule)
├── chart-pie.ts            # 파이/도넛 차트 (PieChartModule)
├── chart-mixed.ts          # 혼합 차트 (MixedChartModule)
└── chart-horizontal-bar.ts # 가로 막대 차트 (XBarChartModule)

composables/chart/useChart.ts   # 차트 생명주기 관리
components/ui/UiChart.vue       # 범용 래퍼
```

## 기본 사용법

```vue
<template>
  <div style="height: 300px">
    <UiChart type="bar" :config="chartConfig" show-legend />
  </div>
</template>
```

### 필수 규칙

- **부모에 반드시 height 지정** (없으면 차트 안 보임)
- config 변경 → 자동 재생성 (watch)
- unmount → 자동 파괴 (Canvas + SVG DOM 정리)

### 부모 높이 가이드

| 차트 타입 | 권장 설정 |
|-----------|----------|
| bar / line / mixed / horizontalBar | `height: 300px` |
| pie (내부 라벨) | `height: 300px; max-width: 400px` |
| pie (outerLabel) | `height: 480px; max-width: 480px` |

## UiChart Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `type` | `'bar' \| 'line' \| 'pie' \| 'mixed' \| 'horizontalBar'` | - | 필수 |
| `config` | `Record<string, any>` | - | 필수 |
| `showLegend` | `boolean` | `false` | 범례 표시 |

## 차트 타입별 config

### 1. Bar

```ts
{ categories: ['A', 'B'], data: [100, 200], colorKey: 'bar.set1', maxValue: 300 }
// 다중: datasets: [{ label, data, colorKey, colorIndex }]
```

| 옵션 | 설명 |
|------|------|
| `showDataLabels` | 막대 위 수치 |
| `averageLine` | 빨간 점선 |
| `barStyleType: 'quarterly'` | 분기별 넓은 막대 |
| `useCenterBars` | 중앙 정렬 |

### 2. Line

```ts
{ categories: [...], datasets: [{ label, data, colorKey }], maxValue: 1000 }
```

| 옵션 | 설명 |
|------|------|
| `useGradient` | 라인 아래 그라데이션 |
| `averageLine` | 빨간 점선 |

### 3. Pie

```ts
// 내부 라벨 (자동 대비 색상 — 밝은 슬라이스→어두운 텍스트, 어두운→흰색)
{ items: [{ name, value }], style: 'primary', textStyle: 'primary' }

// 외부 라벨 (연결선 + 바깥 %)
{ items: [...], type: 'outerLabel', style: 'regionRatio' }

// 도넛
{ items: [{ name, value, count }], style: 'taskStatus' }

// SVG 도넛 (커스텀, 외부 라벨 + 연결선)
{ items: [...], useSvgDonut: true, svgConfig: { width, height, radius } }
```

| style | 설명 |
|-------|------|
| `'primary'` | 테두리 O |
| `'secondary'` | 테두리 X |
| `'regionRatio'` | 8색 팔레트, 테두리 O |
| `'taskStatus'` | 도넛 (cutout: 48%) |
| `'empty'` | 빈 상태 도넛 |

### 4. Mixed (Bar + Line)

```ts
{
  categories: [...],
  datasets: [
    { label, type: 'bar', data, colorKey, colorIndex, yAxisID: 'y' },
    { label, type: 'line', data, borderColor, yAxisID: 'y1' },
  ],
  maxValue: 10000,   // 좌측 Y축
  maxValue2: 100,    // 우측 Y1축
}
```

### 5. HorizontalBar

```ts
{ categories: [...], data: [...], colorKey: 'bar.set1', colorIndex: 0, maxValue: 100, unit: '%' }
```

## 색상 시스템

`colorKey`로 `chart-colors.ts`의 ChartColors 경로 지정, `colorIndex`로 배열 인덱스.

```ts
// 주요 키
'bar.set1'         // [보라, 연주황, 민트, 주황]
'line.primary'     // 파랑
'line.success'     // 초록
'pie.regionRatio'  // 8색
'mixed.set1'       // [보라, 연주황]

// 직접 지정
{ labelColor: ['#FF6565', '#258CEC'] }
```

## 공통 기능

| 기능 | 설명 |
|------|------|
| 범례 | `show-legend` prop, 클릭 시 데이터 토글 |
| 평균선 | `averageLine: 950` → 빨간 점선 (bar, line, mixed 지원) |
| 막대 배경 | bar/mixed/horizontalBar에 자동 적용 (공통 플러그인) |
| 자동 대비 | pie 내부 라벨에서 슬라이스 밝기 기반 텍스트 색상 자동 결정 |

## 공통 플러그인 (ChartConfig.plugins)

| 플러그인 | 위치 | 용도 |
|---------|------|------|
| `backgroundBar` | chart-config.ts | 세로 막대 배경 (bar, mixed 공통) |
| `backgroundBarHorizontal` | chart-config.ts | 가로 막대 배경 |
| `averageLine` | chart-config.ts | 평균선 (bar, line, mixed 공통) |

## 새 차트 추가 체크리스트

1. config 정의 — 필수값(categories/items, maxValue) 확인
2. colorKey 선택 — `chart-colors.ts`에서 팔레트 선택/추가
3. 부모 높이 지정 — 타입별 가이드 참고
4. 범례 필요 시 — `show-legend` prop
5. 반응형 — config를 `computed`로 감싸면 자동 재생성

## 확장 방법

### 색상 추가

```ts
// chart-colors.ts → 사용: colorKey: 'bar.mySet'
bar: { mySet: ['#FF0000', '#00FF00'] }
```

### 차트 타입 추가

1. `utils/chart/chart-[type].ts` 생성 (create, update)
2. `utils/chart/index.ts`에 export
3. `useChart.ts`의 `getModule()` switch에 분기 추가
4. `UiChart.vue`의 ChartType에 추가

## 가이드 페이지

`/guide/ui-chart` — 5종 라이브 데모 + Props + Config 예시 + 부모 높이 가이드
