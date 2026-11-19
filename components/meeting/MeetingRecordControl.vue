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
        v-if="isConnecting && !isRecording"
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
          <UiIcon
            name="circle-stop"
            size="16"
          />
        </template>
        {{ isFinishing ? '회의록 생성 중...' : '회의 종료' }}
      </UiButton>

      <!-- 비정상 종료 — 서버 백업 있음: 이어서 녹음 / 기존 음성으로 회의록 생성 -->
      <template v-else-if="isAbnormal && backupCnt > 0">
        <UiButton
          variant="primary"
          size="sm"
          :disabled="isFinishing"
          @click="emit('resume')"
        >
          <template #icon-left>
            <UiIcon
              name="play"
              size="16"
            />
          </template>
          녹음하기 (이어서)
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="isFinishing"
          @click="emit('generateFromBackup')"
        >
          <template #icon-left>
            <UiIcon
              name="pencil"
              size="16"
            />
          </template>
          기존 음성으로 회의록 생성
        </UiButton>
      </template>

      <!-- 비정상 종료 — 서버 백업 없음: 새로 녹음 -->
      <UiButton
        v-else-if="isAbnormal"
        variant="primary"
        size="sm"
        full-width
        :disabled="isFinishing"
        @click="emit('start')"
      >
        <template #icon-left>
          <UiIcon
            name="play"
            size="16"
          />
        </template>
        새로 녹음
      </UiButton>

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
          <UiIcon
            name="play"
            size="16"
          />
        </template>
        녹음 시작
      </UiButton>
    </div>

    <!-- 비정상 종료 보조 동작: 누락 구간 첨부 / 다른 오디오로 대체 -->
    <div
      v-if="isAbnormal && !isRecording && !isConnecting"
      class="meeting2-record-actions"
    >
      <UiButton
        variant="ghost"
        size="xs"
        :disabled="isFinishing"
        @click="emit('attachMissing')"
      >
        <template #icon-left>
          <UiIcon
            name="upload"
            size="14"
          />
        </template>
        누락 구간 첨부
      </UiButton>
      <UiButton
        variant="ghost"
        size="xs"
        :disabled="isFinishing"
        @click="emit('replaceAudio')"
      >
        <template #icon-left>
          <UiIcon
            name="replace"
            size="14"
          />
        </template>
        다른 오디오로 대체
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { currentMeeting } = useMeetingStore()

const props = defineProps<{
  isRecording: boolean
  isConnecting: boolean
  isFinishing: boolean
  isAbnormal?: boolean
  /** 서버에 백업된 녹음 구간 수 (비정상 종료 화면 버튼 분기) */
  backupCnt?: number
  elapsed?: number
}>()

const emit = defineEmits<{
  start: []
  finish: []
  resume: []
  generateFromBackup: []
  attachMissing: []
  replaceAudio: []
}>()

const status = computed(() => currentMeeting.value?.status)
const backupCnt = computed(() => props.backupCnt ?? 0)

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
  if (props.isAbnormal) return 'is-paused'
  return 'is-idle'
})

const statusLabel = computed(() => {
  if (props.isRecording) return '녹음 중'
  if (props.isConnecting) return '연결 중'
  if (props.isAbnormal) return '비정상 종료'
  return '대기 중'
})
</script>
