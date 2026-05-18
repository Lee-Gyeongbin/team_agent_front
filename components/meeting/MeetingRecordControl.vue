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
      <!-- 연결 중 (비활성) -->
      <UiButton
        v-if="isConnecting"
        variant="primary"
        size="sm"
        full-width
        disabled
      >
        연결 중...
      </UiButton>

      <!-- 회의 종료 (녹음 중) -->
      <UiButton
        v-else-if="isRecording"
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

      <!-- 비정상 종료 복구 버튼 두 개 -->
      <template v-else-if="isAbnormal">
        <UiButton
          variant="primary"
          size="sm"
          @click="emit('resume')"
        >
          <template #icon-left>
            <i class="icon-play size-16" />
          </template>
          녹음하기 (이어서)
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          @click="emit('generateFromBackup')"
        >
          <template #icon-left>
            <i class="icon-edit size-16" />
          </template>
          기존 음성으로 회의록 생성
        </UiButton>
      </template>

      <!-- 녹음 시작 -->
      <UiButton
        v-else
        variant="primary"
        size="sm"
        :disabled="status == '002'"
        full-width
        @click="emit('start')"
      >
        <template #icon-left>
          <i class="icon-play size-16" />
        </template>
        녹음 시작
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { currentMeeting } = useMeetingStore()

const props = defineProps<{
  isRecording: boolean
  isConnecting: boolean
  isFinishing: boolean
  isAbnormal?: boolean
  elapsed?: number
}>()

const emit = defineEmits<{
  start: []
  finish: []
  resume: []
  generateFromBackup: []
}>()

const status = computed(() => currentMeeting.value?.status)

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
