# 차트 개발 가이드

## 기술 스택

- **Chart.js 4** + `chartjs-plugin-datalabels`
- **UiChart.vue** — 범용 래퍼 컴포넌트
- **useChart.ts** — 생명주기 관리 composable
- **utils/chart/** — 타입별 모듈 + 공통 설정 + 색상 팔레트

## 폴더 구조

```
utils/chart/
├── index.ts              # 통합 export + Chart.js 플러그인 등록
├── chart-config.ts       # 공통 설정 (폰트, 스타일, 플러그인, 유틸)
├── chart-colors.ts       # 색상 팔레트 (ChartColors)
├── chart-bar.ts          # 막대 차트 모듈 (BarChartModule)
├── chart-line.ts         # 라인 차트 모듈 (LineChartModule)
├── chart-pie.ts          # 파이/도넛 차트 모듈 (PieChartModule)
├── chart-mixed.ts        # 혼합 차트 모듈 (MixedChartModule)
└── chart-horizontal-bar.ts # 가로 막대 차트 모듈 (XBarChartModule)

composables/chart/
└── useChart.ts           # 차트 생성/업데이트/파괴 관리

components/ui/
└── UiChart.vue           # 범용 차트 컴포넌트
```

## 기본 사용법

```vue
<template>
  <!-- 반드시 height가 있는 부모로 감싸야 함 -->
  <div style="height: 300px">
    <UiChart
      type="bar"
      :config="chartConfig"
      show-legend
    />
  </div>
</template>

<script setup lang="ts">
const chartConfig = {
  categories: ['서울', '부산', '대구'],
  data: [1200, 900, 750],
  colorKey: 'bar.set1',
  maxValue: 1500,
}
</script>
```

### 필수 규칙

- UiChart의 **부모 요소에 반드시 height 지정** (없으면 차트 안 보임)
- config 변경 시 차트 자동 재생성 (watch)
- unmount 시 자동 파괴 (메모리 누수 없음)

## UiChart Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `type` | `'bar' \| 'line' \| 'pie' \| 'mixed' \| 'horizontalBar'` | - | 차트 타입 (필수) |
| `config` | `Record<string, any>` | - | 차트 설정 객체 (필수) |
| `showLegend` | `boolean` | `false` | 범례 표시 여부 |

## 차트 타입별 config

### 1. Bar (막대 차트)

```ts
// 단일 데이터셋
const config = {
  categories: ['서울', '부산', '대구'],     // X축 라벨 (필수)
  data: [1200, 900, 750],                   // 값 배열 (datasets와 택1)
  colorKey: 'bar.set1',                     // ChartColors 경로
  maxValue: 1500,                           // Y축 최대값 (필수)
  showDataLabels: true,                     // 막대 위 수치 표시
  averageLine: 950,                         // 평균선 (빨간 점선)
  tooltipValueSuffix: '명',                 // 툴팁 단위 (기본: '명')
}

// 다중 데이터셋
const config = {
  categories: ['서울', '부산', '대구'],
  datasets: [                                // data 대신 사용
    { label: '2024년', data: [1200, 900, 750], colorKey: 'bar.set1', colorIndex: 0 },
    { label: '2025년', data: [1350, 980, 820], colorKey: 'bar.set1', colorIndex: 1 },
  ],
  maxValue: 1500,
}
```

**추가 옵션:**

| 옵션 | Type | 설명 |
|------|------|------|
| `barStyleType` | `'quarterly'` | 분기별 스타일 (넓은 막대) |
| `useCenterBars` | `boolean` | 막대 중앙 정렬 |
| `thinBars` | `boolean` | 얇은 막대 (maxBarThickness: 60) |
| `boldXAxis` | `boolean` | X축 라벨 굵게 |
| `yAxisStepSize` | `number` | Y축 간격 |
| `minValue` | `number` | Y축 최소값 |
| `labelColor` | `string \| string[]` | 데이터 라벨 색상 |
| `scales` | `object` | 커스텀 축 설정 (병합) |

### 2. Line (라인 차트)

```ts
const config = {
  categories: ['1월', '2월', '3월', '4월'],   // X축 라벨 (필수)
  datasets: [                                   // 라인 데이터셋 (필수)
    { label: '매출', data: [650, 720, 800, 780], colorKey: 'line.primary' },
    { label: '비용', data: [400, 450, 500, 480], colorKey: 'line.success' },
  ],
  maxValue: 1000,                               // Y축 최대값 (필수)
  minValue: 0,                                  // Y축 최소값
  useGradient: true,                            // 라인 아래 그라데이션
  averageLine: 600,                             // 평균선
}
```

**데이터셋 옵션:**

| 옵션 | 설명 |
|------|------|
| `colorKey` | ChartColors 경로 (`'line.primary'`, `'line.success'`) |
| `colorIndex` | 색상 배열 인덱스 |
| `borderColor` | 직접 색상 지정 (colorKey 대신) |
| `fill` | 영역 채우기 (useGradient와 함께) |

### 3. Pie (파이/도넛 차트)

```ts
// 기본 파이
const config = {
  items: [                                      // 항목 배열 (필수)
    { name: '개발팀', value: 35 },
    { name: '디자인팀', value: 25 },
  ],
  style: 'primary',                             // 파이 스타일 (필수)
  textStyle: 'primary',                         // 데이터 라벨 스타일
}

// 도넛 차트
const config = {
  items: [
    { name: '완료', value: 70, count: 14 },     // count: 범례에 개수 표시
    { name: '진행중', value: 30, count: 6 },
  ],
  style: 'taskStatus',                          // cutout이 있는 스타일 = 도넛
}

// 외부 라벨 파이
const config = {
  items: [...],
  type: 'outerLabel',                           // 외부 라벨 + 연결선
  outerLabelConfig: { size: 120, labelOffset: 20 },
}

// SVG 도넛 (커스텀 구현, 외부 라벨 + 연결선)
const config = {
  items: [...],
  useSvgDonut: true,
  svgConfig: { width: 524, height: 163, radius: 50 },
}
```

**파이 스타일 종류:**

| style | 설명 |
|-------|------|
| `'primary'` | 테두리 O, 기본 파이 |
| `'secondary'` | 테두리 X |
| `'taskStatus'` | 도넛 (cutout: 48%) |
| `'empty'` | 빈 상태 도넛 |

### 4. Mixed (혼합 차트 — Bar + Line)

```ts
const config = {
  categories: ['1분기', '2분기', '3분기', '4분기'],
  datasets: [
    {
      label: '매출', type: 'bar',               // type 필수 지정
      data: [5000, 6200, 7100, 8500],
      colorKey: 'mixed.set1', colorIndex: 0,
      yAxisID: 'y',                             // 좌측 축
    },
    {
      label: '성장률', type: 'line',
      data: [12, 24, 15, 20],
      borderColor: '#FFB4A1',
      yAxisID: 'y1',                            // 우측 축 (%)
    },
  ],
  maxValue: 10000,                              // 좌측 Y축 최대값
  maxValue2: 100,                               // 우측 Y1축 최대값
}
```

### 5. HorizontalBar (가로 막대 차트)

```ts
const config = {
  categories: ['React', 'Vue', 'Angular'],      // Y축 라벨
  data: [85, 72, 45],
  colorKey: 'bar.set1',
  colorIndex: 0,
  maxValue: 100,
  showDataLabels: true,
  unit: '%',                                    // 값 뒤 단위
}
```

**추가 옵션:**

| 옵션 | 설명 |
|------|------|
| `pointColorKey` | 막대 끝 포인트 색상 |
| `showBackground` | 배경 막대 표시 (기본: true) |

## 색상 시스템 (ChartColors)

`colorKey`는 `chart-colors.ts`의 ChartColors 객체 경로.
`colorIndex`는 배열일 때 인덱스 지정.

### 주요 색상 키

```ts
// 막대 차트
'bar.set1'          // [보라, 연주황, 민트, 주황]
'bar.set2'          // [연주황, 연하늘]
'bar.set3'          // [주황, 하늘, 민트, 회색]
'bar.single.quarterly1'  // 투명 파랑

// 라인 차트
'line.primary'      // 파랑 (단일)
'line.success'      // 초록 (단일)
'line.multi'        // [보라, 연주황, 민트, 주황]

// 파이 차트
'pie.primary'       // [진파랑, 초록]
'pie.secondary'     // [연파랑, 주황]
'pie.taskStatus'    // [파랑, 주황, 연주황, 연빨강, 초록]
'pie.regionRatio'   // 8색 팔레트

// 혼합 차트
'mixed.set1'        // [보라, 연주황]
'mixed.set2'        // [주황, 민트]

// 상태 색상
'status.error'      // 빨강
'status.success'    // 초록
'status.warning'    // 주황
'status.info'       // 파랑
```

### 색상 직접 지정

```ts
// colorKey 대신 labelColor로 직접 지정
const config = {
  items: [...],
  labelColor: ['#FF6565', '#258CEC', '#05A038'],
}
```

## 공통 기능

### 범례 (Legend)

- `show-legend` prop으로 활성화
- 범례 클릭 시 데이터 토글 (취소선 + 반투명)
- DOM 기반 커스텀 범례 (Chart.js 기본 범례 사용 안 함)

### 평균선 (Average Line)

```ts
const config = {
  ...
  averageLine: 950,  // 빨간 점선으로 표시
}
```

### 데이터 라벨

- bar: `showDataLabels: true`로 막대 위에 수치 표시
- pie: `textStyle`로 파이 내부 수치 스타일 지정
- mixed: 라인 데이터셋만 자동 표시 (배경 + 테두리 있는 라벨)

### 막대 배경 (Background Bars)

- bar, mixed, horizontalBar에 자동 적용
- 연한 회색 배경 막대가 최대값까지 표시

## 새 차트 추가 시 체크리스트

1. **config 객체 정의** — 필수값(categories/items, maxValue) 확인
2. **colorKey 선택** — `chart-colors.ts`에서 적절한 팔레트 선택, 없으면 추가
3. **부모 높이 지정** — `style="height: 300px"` 등
4. **범례 필요 시** — `show-legend` prop 추가
5. **반응형 데이터** — config를 `computed` 또는 `reactive`로 감싸면 자동 재생성

## 새 색상 팔레트 추가

```ts
// chart-colors.ts
export const ChartColors = {
  bar: {
    // 기존 세트들...
    myNewSet: ['#FF0000', '#00FF00', '#0000FF'],  // 추가
  },
}

// 사용
const config = { colorKey: 'bar.myNewSet', colorIndex: 0 }
```

## 새 차트 타입 추가 (확장)

1. `utils/chart/chart-[type].ts` 모듈 생성 (create, update 메서드)
2. `utils/chart/index.ts`에 export 추가
3. `composables/chart/useChart.ts`의 `getModule()` switch에 분기 추가
4. `UiChart.vue`의 ChartType 타입에 추가

## 가이드 페이지

- `/guide/ui-chart` — 5종 차트 라이브 데모 + Props 테이블 + Config 코드 예시
