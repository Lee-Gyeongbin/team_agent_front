<template>
  <div class="meeting2-record-control">
    <div class="meeting2-record-status-row">
      <span
        class="meeting2-record-status"
        :class="`is-${recordStatus}`"
      >
        <span class="meeting2-record-status-dot"></span>
        {{ statusLabel }}
      </span>
      <span class="meeting2-record-time">{{ formattedTime }}</span>
    </div>

    <div class="meeting2-record-actions">
      <UiButton
        v-if="recordStatus === 'idle' || recordStatus === 'paused' || recordStatus === 'stopped'"
        variant="primary"
        size="sm"
        full-width
        @click="onClickStart"
      >
        <template #icon-left>
          <i class="icon-play size-16" />
        </template>
        {{ startButtonLabel }}
      </UiButton>

      <UiButton
        v-if="recordStatus === 'recording'"
        variant="line-secondary"
        size="sm"
        full-width
        @click="onClickPause"
      >
        일시정지
      </UiButton>

      <UiButton
        v-if="recordStatus === 'recording' || recordStatus === 'paused'"
        variant="dark"
        size="sm"
        full-width
        @click="onClickStop"
      >
        녹음 중지
      </UiButton>

      <UiButton
        v-if="recordStatus === 'stopped'"
        variant="line-secondary"
        size="sm"
        full-width
        @click="onClickReset"
      >
        처음부터
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const {
  recordStatus,
  elapsedSeconds,
  currentMeeting,
  handleStartRecord,
  handlePauseRecord,
  handleStopRecord,
  handleResetRecord,
} = useMeeting2Store()

const formattedTime = computed(() => {
  const total = elapsedSeconds.value
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

const statusLabel = computed(() => {
  if (recordStatus.value === 'recording') return '녹음 중'
  if (recordStatus.value === 'paused') return '일시정지'
  if (recordStatus.value === 'stopped') return '중지됨'
  return '대기 중'
})

const startButtonLabel = computed(() => {
  if (recordStatus.value === 'paused') return '녹음 재개'
  if (recordStatus.value === 'stopped') return '이어서 녹음'
  return '녹음 시작'
})

const onClickStart = () => handleStartRecord()
const onClickPause = () => handlePauseRecord()
const onClickStop = () => handleStopRecord()
const onClickReset = () => {
  openConfirm({
    title: '처음부터 녹음',
    message: '시간과 발화 기록이 초기화됩니다.\n계속하시겠습니까?',
    onConfirm: () => {
      handleResetRecord()
      if (currentMeeting.value) currentMeeting.value.sttList = []
    },
  })
}
</script>
