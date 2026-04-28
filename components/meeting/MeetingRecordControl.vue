<template>
  <div class="meeting2-record-control">
    <div class="meeting2-record-status-row">
      <span
        class="meeting2-record-status"
        :class="statusClass"
      >
        <span class="meeting2-record-status-dot"></span>
        {{ statusLabel }}
      </span>
      <span class="meeting2-record-time">{{ formattedTime }}</span>
    </div>

    <div class="meeting2-record-actions">
      <!-- 녹음 시작 -->
      <UiButton
        v-if="!isRecording && !isConnecting"
        variant="primary"
        size="sm"
        full-width
        @click="emit('start')"
      >
        <template #icon-left>
          <i class="icon-play size-16" />
        </template>
        녹음 시작
      </UiButton>

      <!-- 연결 중 (비활성) -->
      <UiButton
        v-else-if="isConnecting"
        variant="primary"
        size="sm"
        full-width
        disabled
      >
        연결 중...
      </UiButton>

      <!-- 회의 종료 (녹음 중) -->
      <UiButton
        v-else
        variant="dark"
        size="sm"
        full-width
        :disabled="isFinishing"
        @click="emit('finish')"
      >
        <template #icon-left>
          <i class="icon-stop size-16" />
        </template>
        {{ isFinishing ? '회의록 생성 중...' : '회의 종료' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isRecording: boolean
  isConnecting: boolean
  isFinishing: boolean
  elapsed?: number
}>()

const emit = defineEmits<{
  start: []
  finish: []
}>()

const formattedTime = computed(() => {
  const total = props.elapsed ?? 0
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

const statusClass = computed(() => {
  if (props.isRecording) return 'is-recording'
  if (props.isConnecting) return 'is-connecting'
  return 'is-idle'
})

const statusLabel = computed(() => {
  if (props.isRecording) return '녹음 중'
  if (props.isConnecting) return '연결 중'
  return '대기 중'
})
</script>
