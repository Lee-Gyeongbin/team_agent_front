<template>
  <div
    class="meeting2-waveform"
    :class="`is-${recordStatus}`"
  >
    <span
      v-for="(bar, idx) in bars"
      :key="idx"
      class="meeting2-waveform-bar"
      :style="{ height: `${bar}%` }"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const { recordStatus } = useMeeting2Store()

// 🔽 더미 — 백엔드에서 WebSocket으로 audio level 데이터 받기로 결정
//    실제 연동 시: 백엔드가 push하는 levels 배열을 bars.value에 그대로 할당
//    예) ws.onmessage = (e) => { if (msg.type === 'audio_level') bars.value = msg.levels }
const BAR_COUNT = 48
const bars = ref<number[]>(Array(BAR_COUNT).fill(20))

let timer: ReturnType<typeof setInterval> | null = null

watch(
  recordStatus,
  (status) => {
    if (status === 'recording') {
      // 백엔드 연결 전 임시 — 시각 효과용 random 막대
      timer = setInterval(() => {
        bars.value = bars.value.map(() => 20 + Math.random() * 70)
      }, 120)
    } else {
      if (timer) clearInterval(timer)
      timer = null
      // 대기 / 중지됨 — 작은 균일 막대로 reset
      // 일시정지 — 마지막 파형 유지 (CSS opacity로 흐리게)
      if (status === 'idle' || status === 'stopped') {
        bars.value = Array(BAR_COUNT).fill(20)
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>
