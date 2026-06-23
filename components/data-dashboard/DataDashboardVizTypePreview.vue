<template>
  <svg
    class="viz-type-preview"
    :class="`viz-type-preview--${type}`"
    viewBox="0 0 140 84"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- 막대 차트 -->
    <template v-if="type === 'bar'">
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#f8fafc"
      />
      <line
        x1="18"
        y1="68"
        x2="126"
        y2="68"
        stroke="#dce4e9"
        stroke-width="1"
      />
      <rect
        x="26"
        y="38"
        width="14"
        height="30"
        rx="2"
        fill="#258CEC"
      />
      <rect
        x="48"
        y="24"
        width="14"
        height="44"
        rx="2"
        fill="#725FEA"
      />
      <rect
        x="70"
        y="32"
        width="14"
        height="36"
        rx="2"
        fill="#40D4B1"
      />
      <rect
        x="92"
        y="18"
        width="14"
        height="50"
        rx="2"
        fill="#FF8127"
      />
    </template>

    <!-- 라인 차트 -->
    <template v-else-if="type === 'line'">
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#f8fafc"
      />
      <line
        x1="18"
        y1="68"
        x2="126"
        y2="68"
        stroke="#dce4e9"
        stroke-width="1"
      />
      <polyline
        points="24,52 46,34 68,42 90,22 112,30"
        fill="none"
        stroke="#258CEC"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(point, idx) in linePoints"
        :key="idx"
        :cx="point.x"
        :cy="point.y"
        r="3"
        fill="#fff"
        stroke="#258CEC"
        stroke-width="2"
      />
    </template>

    <!-- 파이 차트 -->
    <template v-else-if="type === 'pie'">
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#f8fafc"
      />
      <circle
        cx="70"
        cy="42"
        r="28"
        fill="#258CEC"
      />
      <path
        d="M 70 14 A 28 28 0 0 1 92 58 L 70 42 Z"
        fill="#725FEA"
      />
      <path
        d="M 92 58 A 28 28 0 0 1 48 58 L 70 42 Z"
        fill="#40D4B1"
      />
      <path
        d="M 48 58 A 28 28 0 0 1 70 14 L 70 42 Z"
        fill="#FF8127"
      />
    </template>

    <!-- 가로 막대 -->
    <template v-else-if="type === 'horizontalBar'">
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#f8fafc"
      />
      <rect
        x="18"
        y="18"
        width="72"
        height="10"
        rx="2"
        fill="#258CEC"
      />
      <rect
        x="18"
        y="34"
        width="96"
        height="10"
        rx="2"
        fill="#725FEA"
      />
      <rect
        x="18"
        y="50"
        width="58"
        height="10"
        rx="2"
        fill="#40D4B1"
      />
      <rect
        x="18"
        y="66"
        width="84"
        height="10"
        rx="2"
        fill="#FF8127"
      />
    </template>

    <!-- 막대/라인 콤비네이션 -->
    <template v-else-if="type === 'combination'">
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#f8fafc"
      />
      <line
        x1="18"
        y1="68"
        x2="126"
        y2="68"
        stroke="#dce4e9"
        stroke-width="1"
      />
      <!-- 막대 (YL 왼쪽) -->
      <rect
        x="26"
        y="38"
        width="14"
        height="30"
        rx="2"
        fill="#258CEC"
      />
      <rect
        x="48"
        y="24"
        width="14"
        height="44"
        rx="2"
        fill="#258CEC"
        opacity="0.75"
      />
      <rect
        x="70"
        y="32"
        width="14"
        height="36"
        rx="2"
        fill="#258CEC"
        opacity="0.55"
      />
      <rect
        x="92"
        y="18"
        width="14"
        height="50"
        rx="2"
        fill="#258CEC"
        opacity="0.4"
      />
      <!-- 라인 (YR 오른쪽) -->
      <polyline
        points="33,44 55,30 77,38 99,22"
        fill="none"
        stroke="#725FEA"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(point, idx) in combinationLinePoints"
        :key="idx"
        :cx="point.x"
        :cy="point.y"
        r="3"
        fill="#fff"
        stroke="#725FEA"
        stroke-width="2"
      />
    </template>

    <!-- 테이블 -->
    <template v-else>
      <rect
        x="0"
        y="0"
        width="140"
        height="84"
        rx="6"
        fill="#fff"
        stroke="#dce4e9"
        stroke-width="1"
      />
      <rect
        x="0"
        y="0"
        width="140"
        height="18"
        rx="6"
        fill="#eff3ff"
      />
      <line
        x1="0"
        y1="18"
        x2="140"
        y2="18"
        stroke="#dce4e9"
        stroke-width="1"
      />
      <line
        x1="47"
        y1="18"
        x2="47"
        y2="84"
        stroke="#eef2f6"
        stroke-width="1"
      />
      <line
        x1="93"
        y1="18"
        x2="93"
        y2="84"
        stroke="#eef2f6"
        stroke-width="1"
      />
      <line
        v-for="y in [36, 54, 72]"
        :key="y"
        x1="0"
        :y1="y"
        x2="140"
        :y2="y"
        stroke="#eef2f6"
        stroke-width="1"
      />
      <rect
        x="8"
        y="26"
        width="28"
        height="4"
        rx="1"
        fill="#c7d6f7"
      />
      <rect
        x="55"
        y="26"
        width="24"
        height="4"
        rx="1"
        fill="#c7d6f7"
      />
      <rect
        x="101"
        y="26"
        width="24"
        height="4"
        rx="1"
        fill="#c7d6f7"
      />
      <rect
        v-for="(row, idx) in tableRows"
        :key="idx"
        x="8"
        :y="row"
        width="120"
        height="4"
        rx="1"
        fill="#e5eaf0"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { DataDashboardVizType } from '~/types/data-dashboard'

interface Props {
  type: DataDashboardVizType
}

defineProps<Props>()

const linePoints = [
  { x: 24, y: 52 },
  { x: 46, y: 34 },
  { x: 68, y: 42 },
  { x: 90, y: 22 },
  { x: 112, y: 30 },
]

const combinationLinePoints = [
  { x: 33, y: 44 },
  { x: 55, y: 30 },
  { x: 77, y: 38 },
  { x: 99, y: 22 },
]

const tableRows = [44, 62, 74]
</script>

<style lang="scss" scoped>
.viz-type-preview {
  display: block;
  width: 140px;
  height: 84px;
}
</style>
