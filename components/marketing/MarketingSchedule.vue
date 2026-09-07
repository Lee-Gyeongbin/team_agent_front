<template>
  <div class="marketing-schedule">
    <div class="marketing-page-form-bar">
      <button
        type="button"
        class="marketing-page-back"
        @click="emit('back-to-list')"
      >
        <UiIcon
          name="arrow-right"
          size="16"
          class="marketing-page-back__arrow"
        />
        제작 내역
      </button>
    </div>

    <div class="marketing-schedule__layout">
      <div class="marketing-schedule-panel">
        <h2 class="marketing-schedule-panel__title">{{ displayTitle || '콘텐츠' }} 발행 설정</h2>

        <div class="marketing-schedule-radio-group">
          <label
            v-for="option in PUBLISH_TYPE_OPTIONS"
            :key="option.value"
            class="marketing-schedule-radio"
            :class="{ 'is-active': publishType === option.value }"
          >
            <input
              v-model="publishType"
              type="radio"
              name="marketing-publish-type"
              :value="option.value"
            />
            <span>
              <strong>{{ option.label }}</strong>
              <em>{{ option.desc }}</em>
            </span>
          </label>
        </div>

        <template v-if="publishType === 'SCHEDULE'">
          <div class="marketing-form-field">
            <label class="marketing-form-label">발행 일시<span class="marketing-req">*</span></label>
            <div class="marketing-schedule-datetime">
              <input
                v-model="scheduleDate"
                type="date"
                class="marketing-calendar-filter"
              />
              <select
                v-model="scheduleHour"
                class="marketing-calendar-filter"
              >
                <option
                  v-for="hour in HOUR_OPTIONS"
                  :key="hour"
                  :value="hour"
                >
                  {{ hour }}시
                </option>
              </select>
            </div>
          </div>
          <div class="marketing-form-field">
            <label class="marketing-form-label">발행 전 알림</label>
            <select
              v-model.number="alertHour"
              class="marketing-calendar-filter"
            >
              <option :value="0">알림 없음</option>
              <option :value="1">1시간 전</option>
              <option :value="3">3시간 전</option>
              <option :value="6">6시간 전</option>
            </select>
          </div>
        </template>

        <UiButton
          variant="primary"
          size="md"
          full-width
          :disabled="isSavingSchedule || (publishType === 'SCHEDULE' && !scheduleDate)"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>

      <div class="marketing-schedule-summary">
        <div class="marketing-schedule-summary__row">
          <span>캠페인</span>
          <strong>{{ props.projectNm || '-' }}</strong>
        </div>
        <div class="marketing-schedule-summary__row">
          <span>콘텐츠</span>
          <strong>{{ displayTitle || '-' }}</strong>
        </div>
        <div class="marketing-schedule-summary__row">
          <span>발행 일시</span>
          <strong>{{ summaryDtLabel }}</strong>
        </div>
        <div class="marketing-schedule-summary__row">
          <span>상태</span>
          <span
            v-if="scheduleSetting"
            :class="['marketing-status-badge', `schedule-${scheduleSetting.scheduleStateCd.toLowerCase()}`]"
          >
            {{ STATE_LABELS[scheduleSetting.scheduleStateCd] }}
          </span>
          <span v-else>-</span>
        </div>

        <div class="marketing-step-track">
          <div
            v-for="(step, index) in STEP_TRACK"
            :key="step.key"
            class="marketing-step-track__step"
            :class="{ 'is-done': stepIndex > index, 'is-now': stepIndex === index }"
          >
            <span class="marketing-step-track__dot">{{ stepIndex > index ? '✓' : index + 1 }}</span>
            <label>{{ step.label }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingPublishType, MarketingScheduleStateCd } from '~/types/marketing'

const props = defineProps<{
  projectNm?: string
}>()

const emit = defineEmits<{
  'back-to-list': []
}>()

const PUBLISH_TYPE_OPTIONS: { value: MarketingPublishType; label: string; desc: string }[] = [
  { value: 'NOW', label: '즉시 발행', desc: '저장 즉시 연결된 채널로 발행합니다.' },
  { value: 'SCHEDULE', label: '예약 발행', desc: '지정한 일시에 자동으로 발행합니다.' },
  { value: 'HOLD', label: '미발행 유지', desc: '발행하지 않고 임시 저장 상태로 둡니다.' },
]

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

const STEP_TRACK = [
  { key: 'queued', label: '예약' },
  { key: 'waiting', label: '발행 대기' },
  { key: 'publishing', label: '발행 중' },
  { key: 'done', label: '완료' },
] as const

const STATE_LABELS: Record<MarketingScheduleStateCd, string> = {
  WAITING: '미발행 유지',
  QUEUED: '발행 예약됨',
  PUBLISHING: '발행 중',
  DONE: '발행 완료',
  FAILED: '발행 실패',
}

const STEP_INDEX: Record<MarketingScheduleStateCd, number> = {
  WAITING: 0,
  QUEUED: 1,
  PUBLISHING: 2,
  DONE: 4,
  FAILED: 2,
}

const { currentContent, displayTitle, scheduleSetting, isSavingSchedule, handleSaveSchedule } = useMarketingStore()

const contentId = computed(() => currentContent.value?.contentId ?? '')
const publishType = ref<MarketingPublishType>('SCHEDULE')
const scheduleDate = ref('')
const scheduleHour = ref('10')
const alertHour = ref(1)

const stepIndex = computed(() => (scheduleSetting.value ? STEP_INDEX[scheduleSetting.value.scheduleStateCd] : -1))

const summaryDtLabel = computed(() => {
  if (publishType.value === 'NOW') return '저장 즉시 발행'
  if (publishType.value === 'HOLD') return '미발행 유지'
  if (!scheduleDate.value) return '-'
  return `${scheduleDate.value} ${scheduleHour.value}:00`
})

const onSave = async () => {
  if (!contentId.value) return
  if (publishType.value === 'SCHEDULE' && !scheduleDate.value) {
    openToast({ message: '발행 일시를 선택해 주세요.', type: 'warning' })
    return
  }
  const ok = await handleSaveSchedule(contentId.value, {
    publishType: publishType.value,
    publishScheduledDt: publishType.value === 'SCHEDULE' ? `${scheduleDate.value} ${scheduleHour.value}:00:00` : '',
    alertHour: publishType.value === 'SCHEDULE' ? alertHour.value : 0,
  })
  if (ok) openToast({ message: '발행 설정을 저장했습니다.' })
}
</script>
