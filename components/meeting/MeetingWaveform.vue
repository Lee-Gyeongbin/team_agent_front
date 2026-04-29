<template>
  <div
    class="meeting2-waveform"
    :class="isRecording ? 'is-recording' : isConnecting ? 'is-connecting' : 'is-idle'"
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
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'

const { isRecording, isConnecting } = useRealtimeTranscription()

// 🔽 더미 — 백엔드에서 WebSocket으로 audio level 데이터 받기로 결정
//    실제 연동 시: 백엔드가 push하는 levels 배열을 bars.value에 그대로 할당
//    예) ws.onmessage = (e) => { if (msg.type === 'audio_level') bars.value = msg.levels }
const BAR_COUNT = 48
const bars = ref<number[]>(Array(BAR_COUNT).fill(20))

let timer: ReturnType<typeof setInterval> | null = null

watch(
  isRecording,
  (recording) => {
    if (recording) {
      // 백엔드 연결 전 임시 — 시각 효과용 random 막대
      timer = setInterval(() => {
        bars.value = bars.value.map(() => 20 + Math.random() * 70)
      }, 120)
    } else {
      if (timer) clearInterval(timer)
      timer = null
      bars.value = Array(BAR_COUNT).fill(20)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>
