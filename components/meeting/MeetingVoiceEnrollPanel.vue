<template>
  <div class="meeting-enroll-panel">
    <!-- 2분할 레이아웃 -->
    <div class="meeting-enroll-layout">
      <!-- 좌측: 참석자 리스트 -->
      <aside class="meeting-enroll-sidebar">
        <p class="meeting-enroll-sidebar-title">참석자</p>
        <ul class="meeting-enroll-sidebar-list">
          <li
            v-for="(attendee, index) in attendees"
            :key="attendee.speakerId"
            :class="[
              'meeting-enroll-sidebar-item',
              {
                'is-active': index === activeIndex,
                'is-done': attendee.status === 'done',
                'is-recording': attendee.status === 'recording' || attendee.status === 'processing',
                'is-failed': attendee.status === 'failed',
              },
            ]"
            @click="onSelectAttendee(index)"
          >
            <span class="meeting-enroll-sidebar-icon">
              <UiIcon
                v-if="attendee.status === 'done'"
                name="check"
                size="14"
              />
              <UiIcon
                v-else-if="attendee.status === 'failed'"
                name="alert-triangle"
                size="14"
              />
              <span
                v-else-if="attendee.status === 'recording' || attendee.status === 'processing'"
                class="meeting-enroll-pulse"
              ></span>
              <span
                v-else
                class="meeting-enroll-sidebar-dot"
              ></span>
            </span>
            <span class="meeting-enroll-sidebar-name">{{ attendee.userNm }}</span>
            <span :class="['meeting-enroll-sidebar-status', `is-${attendee.status}`]">
              {{ statusLabel(attendee.status) }}
            </span>
          </li>
        </ul>
      </aside>

      <!-- 우측: 메인 영역 -->
      <main class="meeting-enroll-main">
        <!-- 콘텐츠 래퍼 (수직 중앙 정렬) -->
        <div class="meeting-enroll-main-inner">
          <!-- 전체 완료 상태 -->
          <div
            v-if="isAllDone"
            class="meeting-enroll-complete"
          >
            <div class="meeting-enroll-complete-icon">
              <UiIcon
                name="check"
                size="32"
              />
            </div>
            <p class="meeting-enroll-complete-title">모든 참석자의 음성 확인이 완료되었습니다.</p>
            <p class="meeting-enroll-complete-desc">음성 등록을 닫고 회의를 진행할 수 있습니다.</p>
            <UiButton
              variant="primary"
              size="md"
              @click="emit('close')"
            >
              음성 등록 닫기
              <template #icon-right>
                <UiIcon
                  name="check"
                  size="16"
                />
              </template>
            </UiButton>
          </div>

          <!-- 현재 대상 녹음 영역 -->
          <template v-else-if="currentAttendee">
            <!-- 전체 진행률 -->
            <p class="meeting-enroll-step">
              참석자 음성 확인 {{ activeIndex + 1 }} / {{ attendees.length }}
            </p>

            <!-- 타이틀 + 안내 문구 -->
            <p class="meeting-enroll-main-title">
              {{ currentAttendee.userNm }}님의 음성을 확인합니다.
            </p>
            <p class="meeting-enroll-main-desc">
              아래 문장을 자연스럽게 읽어주세요.
            </p>

            <!-- 안내 문장 카드 -->
            <div class="meeting-enroll-script">
              <p>
                "안녕하세요. 저는 {{ currentAttendee.userNm }}입니다.<br />
                오늘 회의에 참석했습니다."
              </p>
            </div>

            <!-- 대기 상태 -->
            <div
              v-if="currentAttendee.status === 'waiting'"
              class="meeting-enroll-action"
            >
              <div class="meeting-enroll-action-btns">
                <button
                  type="button"
                  class="meeting-enroll-mic-btn"
                  @click="onStartRecord"
                >
                  <UiIcon
                    name="mic"
                    size="28"
                  />
                </button>
                <button
                  type="button"
                  class="meeting-enroll-mic-btn is-file"
                  @click="onClickPickFile"
                >
                  <UiIcon
                    name="paperclip"
                    size="28"
                  />
                </button>
              </div>
              <p class="meeting-enroll-action-hint">녹음 또는 파일 첨부</p>
              <input
                ref="audioFileInputRef"
                type="file"
                accept="audio/*"
                class="meeting-enroll-file-input"
                @change="onAudioFileChange"
              />
            </div>

            <!-- 녹음 중 -->
            <div
              v-else-if="currentAttendee.status === 'recording'"
              class="meeting-enroll-action"
            >
              <button
                type="button"
                class="meeting-enroll-mic-btn is-recording"
                @click="onStopRecord"
              >
                <UiIcon
                  name="square"
                  size="24"
                />
              </button>
              <div class="meeting-enroll-recording-info">
                <span class="meeting-enroll-pulse"></span>
                <span class="meeting-enroll-timer">{{ formatTime(currentAttendee.elapsed) }}</span>
              </div>
              <!-- 실시간 음량 레벨 -->
              <div class="meeting-enroll-volume">
                <div
                  v-for="i in 20"
                  :key="i"
                  :class="['meeting-enroll-volume-bar', { 'is-active': i <= volumeBars }]"
                ></div>
              </div>
              <p
                v-if="volumeLevel < VOLUME_LOW_THRESHOLD"
                class="meeting-enroll-volume-warn"
              >
                <UiIcon
                  name="alert-triangle"
                  size="14"
                />
                음성이 작습니다. 마이크에 가까이 말씀해주세요.
              </p>
              <div class="meeting-enroll-progress">
                <div
                  class="meeting-enroll-progress-bar"
                  :style="{ width: `${Math.min((currentAttendee.elapsed / MAX_DURATION) * 100, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- 등록 중 (백엔드 Enrollment + AI 처리) -->
            <div
              v-else-if="currentAttendee.status === 'processing'"
              class="meeting-enroll-action"
            >
              <span class="meeting-enroll-pulse is-lg"></span>
              <p class="meeting-enroll-processing-text">음성을 등록하는 중...</p>
            </div>

            <!-- 검증 실패 (재녹음 유도) -->
            <div
              v-else-if="currentAttendee.status === 'failed'"
              class="meeting-enroll-action"
            >
              <div class="meeting-enroll-warn-icon">
                <UiIcon
                  name="alert-triangle"
                  size="24"
                />
              </div>
              <p class="meeting-enroll-warn-text">{{ validationMessage }}</p>
              <UiButton
                variant="outline"
                size="sm"
                @click="onRetry"
              >
                다시 녹음
              </UiButton>
            </div>

            <!-- 완료 상태 (개별) -->
            <div
              v-else-if="currentAttendee.status === 'done'"
              class="meeting-enroll-action"
            >
              <div class="meeting-enroll-done-icon">
                <UiIcon
                  name="check"
                  size="24"
                />
              </div>
              <p class="meeting-enroll-done-text">음성 확인 완료</p>
              <UiButton
                variant="ghost"
                size="xs"
                @click="onRetry"
              >
                다시 녹음
              </UiButton>
            </div>
          </template>
        </div>

        <!-- 하단 푸터 -->
        <div class="meeting-enroll-footer">
          <span class="meeting-enroll-progress-text">
            음성 확인 {{ doneCount }} / {{ attendees.length }} 완료
          </span>
          <div class="meeting-enroll-footer-actions">
            <UiButton
              variant="ghost"
              size="md"
              @click="emit('close')"
            >
              닫기
            </UiButton>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import { openLoading, closeLoading } from '~/composables/useLoading'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingVoiceEnrollment } from '~/types/meeting'

const props = defineProps<{
  meetingId: number
}>()

const emit = defineEmits<{
  close: []
}>()

const { handleVoiceEnroll, handleSelectVoiceEnrollmentList, handleSelectMeetingDetail, meetingDetail } =
  useMeetingStore()

/** 최대 녹음 시간 (초) */
const MAX_DURATION = 10
/** 음량이 이 값 미만이면 실시간 경고 표시 (0~1 정규화) */
const VOLUME_LOW_THRESHOLD = 0.08
/** 검증: 평균 음량이 이 값 미만이면 실패 */
const VALIDATE_AVG_THRESHOLD = 0.05
/** 검증: 음성 구간(음량 > threshold)이 이 비율 미만이면 너무 짧음 */
const VALIDATE_SPEECH_RATIO = 0.3

// ── 참석자 정보 ─────────────────────────────────────────────────────
type EnrollStatus = 'waiting' | 'recording' | 'processing' | 'done' | 'failed'

interface EnrollAttendee {
  speakerId: number
  userId: string
  userNm: string
  status: EnrollStatus
  elapsed: number
  audioBlob: Blob | null
  errorMsg: string
}

/** createMeeting / 상세 speakers → 음성 확인 목록 (speakerId = auto_increment PK) */
const mapSpeakersToAttendees = (
  speakers: Array<{ speakerId?: number; speakerNm?: string; speakerLabel?: string; speakerUserId?: string }>,
): EnrollAttendee[] => {
  return speakers
    .filter((item) => Number.isFinite(Number(item.speakerId)) && Number(item.speakerId) > 0)
    .map((item) => ({
      speakerId: Number(item.speakerId),
      userId: item.speakerUserId ?? '',
      userNm: item.speakerNm || item.speakerLabel || '',
      status: 'waiting' as const,
      elapsed: 0,
      audioBlob: null,
      errorMsg: '',
    }))
}

/** attendees JSON [{userId, userNm}] — 상세 speakers가 비어 있을 때 목록 복원용 */
const mapAttendeesJson = (raw: unknown): EnrollAttendee[] => {
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((item: { userId?: string; userNm?: string }) => item?.userId && item?.userNm)
    .map((item: { userId: string; userNm: string }) => ({
      speakerId: 0,
      userId: item.userId,
      userNm: item.userNm,
      status: 'waiting' as const,
      elapsed: 0,
      audioBlob: null,
      errorMsg: '',
    }))
}

const attendees = ref<EnrollAttendee[]>([])
const activeIndex = ref(0)
const validationMessage = ref('')

const audioFileInputRef = ref<HTMLInputElement | null>(null)
const currentAttendee = computed(() => attendees.value[activeIndex.value] ?? null)
const doneCount = computed(() => attendees.value.filter((a) => a.status === 'done').length)
const isAllDone = computed(() => attendees.value.length > 0 && doneCount.value === attendees.value.length)

const statusLabel = (status: EnrollStatus): string => {
  if (status === 'done') return '완료'
  if (status === 'recording') return '진행중'
  if (status === 'processing') return '등록중'
  if (status === 'failed') return '재녹음'
  return '대기'
}

// ── MediaRecorder + 음량 분석 ───────────────────────────────────────
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordingChunks: Blob[] = []
let timerInterval: ReturnType<typeof setInterval> | null = null

// 음량 분석용
let audioContext: AudioContext | null = null
let analyserNode: AnalyserNode | null = null
let volumeRafId: number | null = null
const volumeLevel = ref(0)
const volumeBars = computed(() => Math.round(volumeLevel.value * 20))

// 녹음 중 음량 샘플 기록 (검증용)
let volumeSamples: number[] = []

/** 패널이 열릴 때 데이터 로드 */
const init = async () => {
  openLoading({ text: '음성 등록 현황을 불러오는 중...' })
  try {
    // meetingDetail에서 참석자 목록 구성
    const meeting = meetingDetail.value.meeting
    attendees.value = mapSpeakersToAttendees(meetingDetail.value.speakers ?? [])
    if (attendees.value.length === 0) {
      attendees.value = mapAttendeesJson(meeting?.attendees)
    }

    // 상세가 없으면 재조회
    if (attendees.value.length === 0) {
      await handleSelectMeetingDetail(props.meetingId)
      const m = meetingDetail.value.meeting
      attendees.value = mapSpeakersToAttendees(meetingDetail.value.speakers ?? [])
      if (attendees.value.length === 0) {
        attendees.value = mapAttendeesJson(m?.attendees)
      }
    }

    const enrollments = await handleSelectVoiceEnrollmentList(props.meetingId)
    applyEnrollmentStatus(enrollments)
    moveToFirstPending()
    syncFailedMessage()
  } finally {
    closeLoading()
  }

  if (attendees.value.length === 0) {
    openToast({ message: '음성 등록 대상 참석자가 없습니다.', type: 'warning' })
    emit('close')
  }
}

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  cleanup()
})

/** DB Enrollment 상태 → 화면 상태. 001/002는 미완료로 보고 재녹음 */
const mapEnrollmentToUiStatus = (status?: string): EnrollStatus => {
  if (status === '003') return 'done'
  if (status === '004') return 'failed'
  return 'waiting'
}

const applyEnrollmentStatus = (list: MeetingVoiceEnrollment[]) => {
  const latestBySpeaker = new Map<number, MeetingVoiceEnrollment>()
  const latestByUser = new Map<string, MeetingVoiceEnrollment>()
  const latestByName = new Map<string, MeetingVoiceEnrollment>()
  for (const item of list) {
    const id = Number(item.speakerId)
    if (Number.isFinite(id) && id > 0) latestBySpeaker.set(id, item)
    const userId = String(item.speakerUserId ?? '').trim()
    if (userId) latestByUser.set(userId, item)
    const name = (item.speakerNm ?? '').trim()
    if (name) latestByName.set(name, item)
  }

  attendees.value.forEach((attendee) => {
    const enroll =
      latestBySpeaker.get(attendee.speakerId) ??
      latestByUser.get(attendee.userId) ??
      latestByName.get(attendee.userNm)
    if (!enroll) return
    if (attendee.speakerId <= 0 && Number(enroll.speakerId) > 0) {
      attendee.speakerId = Number(enroll.speakerId)
    }
    attendee.status = mapEnrollmentToUiStatus(enroll.status)
    attendee.errorMsg = enroll.status === '004' ? enroll.errorMsg || '음성 등록에 실패했습니다. 다시 녹음해주세요.' : ''
  })
}

const moveToFirstPending = () => {
  const pendingIdx = attendees.value.findIndex((a) => a.status !== 'done')
  if (pendingIdx >= 0) activeIndex.value = pendingIdx
}

const syncFailedMessage = () => {
  const attendee = currentAttendee.value
  validationMessage.value = attendee?.status === 'failed' ? attendee.errorMsg : ''
}

// ── 좌측 리스트 클릭 ────────────────────────────────────────────────
const onSelectAttendee = (index: number) => {
  if (currentAttendee.value?.status === 'recording' || currentAttendee.value?.status === 'processing') {
    openToast({ message: '현재 녹음을 먼저 완료해주세요.', type: 'warning' })
    return
  }
  activeIndex.value = index
  syncFailedMessage()
}

// ── 녹음 시작 ───────────────────────────────────────────────────────
const onStartRecord = async () => {
  const attendee = currentAttendee.value
  if (!attendee) return

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    openToast({ message: '마이크 권한을 허용해주세요.', type: 'warning' })
    return
  }

  attendee.status = 'recording'
  attendee.elapsed = 0
  recordingChunks = []
  volumeSamples = []
  volumeLevel.value = 0

  // AudioContext + AnalyserNode 초기화 (실시간 음량 측정)
  audioContext = new AudioContext()
  analyserNode = audioContext.createAnalyser()
  analyserNode.fftSize = 256
  const source = audioContext.createMediaStreamSource(mediaStream)
  source.connect(analyserNode)
  startVolumeMonitor()

  const mimeType = getSupportedMimeType()
  mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordingChunks.push(e.data)
  }

  mediaRecorder.onstop = async () => {
    stopVolumeMonitor()
    const blob = new Blob(recordingChunks, { type: mimeType || 'audio/webm' })
    releaseStream()

    // 음성 품질 검증 (프론트 1차)
    const validation = validateAudio(attendee.elapsed)
    if (!validation.ok) {
      attendee.audioBlob = null
      attendee.status = 'failed'
      attendee.errorMsg = validation.message
      validationMessage.value = validation.message
      return
    }

    attendee.audioBlob = blob
    attendee.status = 'processing'

    const res = await handleVoiceEnroll({
      meetingId: props.meetingId,
      speakerId: attendee.speakerId,
      speakerNm: attendee.userNm,
      audioBlob: blob,
    })

    if (!res.successYn) {
      attendee.audioBlob = null
      attendee.status = 'failed'
      attendee.errorMsg = res.returnMsg || '음성 등록에 실패했습니다. 다시 녹음해주세요.'
      validationMessage.value = attendee.errorMsg
      return
    }

    attendee.status = 'done'
    advanceToNext()
  }

  mediaRecorder.start(500)

  timerInterval = setInterval(() => {
    attendee.elapsed++
    if (attendee.elapsed >= MAX_DURATION) {
      onStopRecord()
    }
  }, 1000)
}

// ── 녹음 종료 ───────────────────────────────────────────────────────
const onStopRecord = () => {
  const attendee = currentAttendee.value
  if (!attendee) return

  if (attendee.elapsed < 2) {
    openToast({ message: '최소 2초 이상 녹음해주세요.', type: 'warning' })
    return
  }

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
}

// ── 다시 녹음 ───────────────────────────────────────────────────────
const onRetry = () => {
  const attendee = currentAttendee.value
  if (!attendee) return
  attendee.status = 'waiting'
  attendee.elapsed = 0
  attendee.audioBlob = null
  attendee.errorMsg = ''
  validationMessage.value = ''
}

// ── 파일 첨부 ──────────────────────────────────────────────────────
const onClickPickFile = () => {
  audioFileInputRef.value?.click()
}

const onAudioFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const attendee = currentAttendee.value
  if (!attendee) return

  if (attendee.status === 'recording' || attendee.status === 'processing') {
    openToast({ message: '현재 녹음을 먼저 완료해주세요.', type: 'warning' })
    return
  }

  attendee.status = 'processing'

  const res = await handleVoiceEnroll({
    meetingId: props.meetingId,
    speakerId: attendee.speakerId,
    speakerNm: attendee.userNm,
    audioBlob: file,
  })

  if (!res.successYn) {
    attendee.audioBlob = null
    attendee.status = 'failed'
    attendee.errorMsg = res.returnMsg || '음성 등록에 실패했습니다. 다시 시도해주세요.'
    validationMessage.value = attendee.errorMsg
    return
  }

  attendee.status = 'done'
  advanceToNext()
}

// ── 실시간 음량 모니터링 ────────────────────────────────────────────
const startVolumeMonitor = () => {
  if (!analyserNode) return
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

  const tick = () => {
    if (!analyserNode) return
    analyserNode.getByteFrequencyData(dataArray)

    // RMS 계산 (0~255 → 0~1 정규화)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / dataArray.length)
    volumeLevel.value = rms
    volumeSamples.push(rms)

    volumeRafId = requestAnimationFrame(tick)
  }
  tick()
}

const stopVolumeMonitor = () => {
  if (volumeRafId !== null) {
    cancelAnimationFrame(volumeRafId)
    volumeRafId = null
  }
  volumeLevel.value = 0

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  analyserNode = null
}

// ── 음성 품질 검증 ──────────────────────────────────────────────────
const validateAudio = (durationSec: number): { ok: boolean; message: string } => {
  if (volumeSamples.length === 0) {
    return { ok: false, message: '음성이 감지되지 않았습니다. 다시 녹음해주세요.' }
  }

  const avgVolume = volumeSamples.reduce((a, b) => a + b, 0) / volumeSamples.length
  const speechSamples = volumeSamples.filter((v) => v >= VALIDATE_AVG_THRESHOLD).length
  const speechRatio = speechSamples / volumeSamples.length

  if (durationSec < 3 || speechRatio < VALIDATE_SPEECH_RATIO) {
    return { ok: false, message: '음성이 너무 짧습니다. 안내 문장을 끝까지 읽어주세요.' }
  }

  if (avgVolume < VALIDATE_AVG_THRESHOLD) {
    return { ok: false, message: '음성이 너무 작습니다. 마이크에 가까이 다시 말씀해주세요.' }
  }

  return { ok: true, message: '' }
}

// ── 다음 미완료 참석자로 자동 이동 ──────────────────────────────────
const advanceToNext = () => {
  const len = attendees.value.length
  for (let i = 1; i <= len; i++) {
    const idx = (activeIndex.value + i) % len
    if (attendees.value[idx].status !== 'done') {
      activeIndex.value = idx
      return
    }
  }
}

// ── 리소스 해제 ─────────────────────────────────────────────────────
const releaseStream = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
  mediaRecorder = null
}

const cleanup = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  stopVolumeMonitor()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  releaseStream()
}

// ── 유틸 ────────────────────────────────────────────────────────────
const getSupportedMimeType = (): string => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

const formatTime = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}
</script>
