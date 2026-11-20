<template>
  <div class="meeting2-record-control">
    <div class="meeting2-record-status-row">
      <!-- 왼쪽: 녹음 상태 + 실시간 STT 현재 모드 (OpenAI / 브라우저 음성 인식 등) -->
      <div class="meeting2-record-status-group">
        <span
          class="meeting2-record-status"
          :class="statusClass"
        >
          <span class="meeting2-record-status-dot"></span>
          {{ statusLabel }}
        </span>
        <span class="meeting2-stt-toggle">
          실시간 STT
          <UiBadge :variant="sttBadge.variant">{{ sttBadge.label }}</UiBadge>
        </span>
      </div>
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

      <!-- 녹음 중: 일시정지 / 회의 종료 -->
      <template v-else-if="isRecording">
        <UiButton
          variant="outline"
          size="sm"
          class="meeting2-record-action-half"
          :disabled="isFinishing"
          @click="emit('pause')"
        >
          <template #icon-left>
            <UiIcon
              name="pause"
              size="16"
            />
          </template>
          일시정지
        </UiButton>
        <UiButton
          variant="dark"
          size="sm"
          class="meeting2-record-action-half"
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
      </template>

      <!-- 일시정지: 이어서 녹음 / 회의 종료 (지금까지 녹음을 합쳐 회의록 생성) -->
      <template v-else-if="isPaused">
        <UiButton
          variant="primary"
          size="sm"
          class="meeting2-record-action-half"
          :disabled="isFinishing"
          @click="emit('resume')"
        >
          <template #icon-left>
            <UiIcon
              name="play"
              size="16"
            />
          </template>
          이어서 녹음
        </UiButton>
        <UiButton
          variant="dark"
          size="sm"
          class="meeting2-record-action-half"
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
      </template>

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
import { UiBadge, UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { useSttMode } from '~/composables/meeting/useSttMode'

const { currentMeeting } = useMeetingStore()
const { sttBadge } = useSttMode()

const props = defineProps<{
  isRecording: boolean
  isConnecting: boolean
  isFinishing: boolean
  isAbnormal?: boolean
  /** 일시정지 상태 (녹음 중이 아님) — 이어서 녹음 / 회의 종료 */
  isPaused?: boolean
  /** 서버에 백업된 녹음 구간 수 (비정상 종료 화면 버튼 분기) */
  backupCnt?: number
  elapsed?: number
}>()

const emit = defineEmits<{
  start: []
  pause: []
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
  if (props.isPaused || props.isAbnormal) return 'is-paused'
  return 'is-idle'
})

const statusLabel = computed(() => {
  if (props.isRecording) return '녹음 중'
  if (props.isConnecting) return '연결 중'
  if (props.isPaused) return '일시정지'
  if (props.isAbnormal) return '비정상 종료'
  return '대기 중'
})
</script>
