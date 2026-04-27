<template>
  <div
    ref="transcriptRef"
    class="meeting-transcript"
  >
    <!-- 녹음 전 안내 -->
    <p
      v-if="!isRecording && !isConnecting && blocks.length === 0"
      class="meeting-transcript-hint"
    >
      녹음 시작 버튼을 눌러 회의를 시작하세요.
    </p>

    <!-- 연결 중 안내 -->
    <p
      v-else-if="isConnecting && blocks.length === 0"
      class="meeting-transcript-hint"
    >
      음성 인식 서버에 연결하는 중입니다...
    </p>

    <!-- 실시간 자막 안내 배지 -->
    <span
      v-if="isRecording || blocks.length > 0"
      class="meeting-transcript-interim-badge"
    >
      실시간 임시 자막 (참고용) · 회의 종료 후 AI 전사본으로 대체됩니다
    </span>

    <!-- 자막 블록 목록 -->
    <div class="meeting-transcript-blocks">
      <div
        v-for="block in blocks"
        :key="block.id"
        class="meeting-transcript-block"
        :class="{
          'is-confirmed': block.status === 'confirmed',
          'is-waiting': block.status === 'waiting',
          'is-interim': block.status === 'interim',
        }"
      >
        <!-- confirmed: 화자 뱃지 -->
        <span
          v-if="block.status === 'confirmed' && block.speaker"
          class="meeting-transcript-speaker"
        >
          {{ block.speaker }}
        </span>
        <!-- waiting: diarize 대기 표시 -->
        <span
          v-else-if="block.status === 'waiting'"
          class="meeting-transcript-speaker is-waiting"
        >
          ···
        </span>

        <span class="meeting-transcript-block-text">{{ block.text }}</span>
      </div>
    </div>

    <!-- 녹음 중 커서 -->
    <span
      v-if="isRecording"
      class="meeting-transcript-cursor"
    />
  </div>
</template>

<script setup lang="ts">
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'

const { isRecording, isConnecting, blocks } = useRealtimeTranscription()

const transcriptRef = ref<HTMLElement | null>(null)

// 블록 추가·변경 시 자동 스크롤
watch(
  () => blocks.value.length + (blocks.value.at(-1)?.text ?? ''),
  () => {
    nextTick(() => {
      if (transcriptRef.value) {
        transcriptRef.value.scrollTop = transcriptRef.value.scrollHeight
      }
    })
  },
)
</script>
