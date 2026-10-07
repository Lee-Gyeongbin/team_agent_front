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
              <UiDatePicker
                v-model="scheduleDateValue"
                size="sm"
              />
              <UiSelect
                :model-value="scheduleHour"
                :options="hourSelectOptions"
                size="sm"
                @update:model-value="onSelectHour"
              />
            </div>
          </div>
          <div class="marketing-form-field">
            <label class="marketing-form-label">발행 전 알림</label>
            <UiSelect
              :model-value="String(alertHour)"
              :options="alertSelectOptions"
              size="sm"
              @update:model-value="onSelectAlert"
            />
          </div>
        </template>

        <p class="marketing-form-hint">외부 채널 게시와 알림 발송은 제공하지 않습니다. 알림 입력값은 저장됩니다.</p>
        <UiButton
          variant="primary"
          size="md"
          full-width
          :disabled="!canSaveSchedule"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>

      <div class="marketing-schedule-summary">
        <div class="marketing-schedule-summary__row">
          <span>프로젝트</span>
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
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import { UiButton, UiDatePicker, UiIcon, UiSelect } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingPublishType, MarketingScheduleStateCd } from '~/types/marketing'

const props = defineProps<{
  projectNm?: string
}>()

const emit = defineEmits<{
  'back-to-list': []
}>()

const PUBLISH_TYPE_OPTIONS: { value: MarketingPublishType; label: string; desc: string }[] = [
  { value: 'NOW', label: '즉시 완료', desc: '저장 즉시 발행 완료 상태로 변경합니다.' },
  {
    value: 'SCHEDULE',
    label: '예약 발행',
    desc: '시간 단위로 예약하며, 예약 시각 이후 1시간 간격 배치에서 완료 처리합니다.',
  },
  { value: 'HOLD', label: '미발행 유지', desc: '발행하지 않고 임시 저장 상태로 둡니다.' },
]

const hourSelectOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, '0')
  return { label: `${hour}시`, value: hour }
})

const alertSelectOptions = [
  { label: '알림 없음', value: '0' },
  { label: '1시간 전', value: '1' },
  { label: '3시간 전', value: '3' },
  { label: '6시간 전', value: '6' },
]

const STEP_TRACK = [
  { key: 'waiting', label: '미발행' },
  { key: 'queued', label: '예약' },
  { key: 'done', label: '완료' },
] as const

const STATE_LABELS: Record<MarketingScheduleStateCd, string> = {
  WAITING: '미발행 유지',
  QUEUED: '발행 예약됨',
  DONE: '발행 완료',
  FAILED: '발행 실패',
}

const STEP_INDEX: Record<MarketingScheduleStateCd, number> = {
  WAITING: 0,
  QUEUED: 1,
  DONE: 2,
  FAILED: 2,
}

const { currentContent, displayTitle, scheduleSetting, isSavingSchedule, handleSaveSchedule } = useMarketingStore()

const contentId = computed(() => currentContent.value?.contentId ?? '')
const publishType = ref<MarketingPublishType>(scheduleSetting.value?.publishType ?? 'HOLD')
const scheduleDate = ref(scheduleSetting.value?.publishScheduledDt?.slice(0, 10) ?? '')
const scheduleHour = ref(scheduleSetting.value?.publishScheduledDt?.slice(11, 13) || '10')
const alertHour = ref(scheduleSetting.value?.alertHour ?? 0)
const canSaveSchedule = computed(
  () =>
    !isSavingSchedule.value &&
    (publishType.value === 'HOLD' || currentContent.value?.approval?.approvedYn === 'Y') &&
    (publishType.value !== 'SCHEDULE' || !!scheduleDate.value),
)

const parseYyyyMmDdToDateValue = (value: string): DateValue | undefined => {
  if (!value) return undefined
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!year || !month || !day) return undefined
  return new CalendarDate(year, month, day)
}

const formatDateValueToYyyyMmDd = (value: DateValue | undefined): string => {
  if (!value) return ''
  const { year, month, day } = toCalendarDateTime(value)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const scheduleDateValue = computed<DateValue | undefined>({
  get: () => parseYyyyMmDdToDateValue(scheduleDate.value),
  set: (value) => {
    scheduleDate.value = formatDateValueToYyyyMmDd(value)
  },
})

const onSelectHour = (value: string | number) => {
  scheduleHour.value = String(value)
}

const onSelectAlert = (value: string | number) => {
  alertHour.value = Number(value)
}

const stepIndex = computed(() => (scheduleSetting.value ? STEP_INDEX[scheduleSetting.value.scheduleStateCd] : -1))

const summaryDtLabel = computed(() => {
  const saved = scheduleSetting.value
  if (!saved) return '-'
  if (saved.publishType === 'SCHEDULE') return saved.publishScheduledDt || '-'
  return PUBLISH_TYPE_OPTIONS.find((option) => option.value === saved.publishType)?.label ?? '-'
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
    alertHour: alertHour.value,
  })
  if (ok) openToast({ message: '발행 설정을 저장했습니다.' })
}
</script>
