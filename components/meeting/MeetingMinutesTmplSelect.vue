<template>
  <div class="meeting2-tmpl-select">
    <div
      class="meeting2-tmpl-notice"
      :class="{ 'is-error': isCreateMode && minutesState === 'error' }"
    >
      <UiIcon
        name="info"
        size="16"
      />
      <span v-if="!isCreateMode">
        현재 회의록을 선택한 양식으로 다시 생성합니다.
        <template v-if="hasEditedContent">직접 편집한 내용은 새 회의록으로 바뀝니다.</template>
      </span>
      <span v-else-if="minutesState === 'error'">
        회의록 생성에 실패했습니다. {{ minutesStatusMessage }} 다시 시도해 주세요.
      </span>
      <span v-else>
        화자 이름을 정리했다면 양식·문체·분량을 고른 뒤 회의록을 생성하세요. 화자 이름은 회의록에 그대로 쓰입니다.
      </span>
    </div>

    <div class="meeting2-tmpl-body">
      <UiLoading
        v-if="isProcessing"
        overlay
        text="회의록을 생성하고 있습니다. 회의 길이에 따라 1~3분 걸릴 수 있습니다."
      />

      <!-- 문체 · 분량 -->
      <div class="meeting2-tmpl-options">
        <div class="meeting2-tmpl-option">
          <p class="meeting2-tmpl-label">문체</p>
          <div
            class="meeting2-tmpl-segment"
            role="radiogroup"
            aria-label="문체"
          >
            <button
              v-for="tone in TONE_OPTIONS"
              :key="tone.value"
              type="button"
              role="radio"
              :aria-checked="form.toneCd === tone.value"
              :class="{ 'is-active': form.toneCd === tone.value }"
              @click="form.toneCd = tone.value"
            >
              {{ tone.label }}
              <span class="meeting2-tmpl-segment-hint">{{ tone.hint }}</span>
            </button>
          </div>
          <p class="meeting2-tmpl-example">{{ selectedTone.example }}</p>
        </div>

        <div class="meeting2-tmpl-option">
          <p class="meeting2-tmpl-label">분량</p>
          <div
            class="meeting2-tmpl-segment"
            role="radiogroup"
            aria-label="분량"
          >
            <button
              v-for="length in LENGTH_OPTIONS"
              :key="length.value"
              type="button"
              role="radio"
              :aria-checked="form.lengthCd === length.value"
              :class="{ 'is-active': form.lengthCd === length.value }"
              @click="form.lengthCd = length.value"
            >
              {{ length.label }}
            </button>
          </div>
          <p class="meeting2-tmpl-example">{{ selectedLength.example }}</p>
        </div>
      </div>

      <!-- 양식 -->
      <div class="meeting2-tmpl-option">
        <p class="meeting2-tmpl-label">양식</p>

        <UiLoading
          v-if="isLoadingMinutesTmpl"
          text="양식을 불러오는 중..."
        />
        <div
          v-else-if="minutesTmplErrorMessage"
          class="meeting2-tmpl-state"
        >
          <p class="meeting2-tmpl-state-error">{{ minutesTmplErrorMessage }}</p>
          <UiButton
            variant="outline"
            size="sm"
            @click="handleSelectMinutesTmplList(true)"
          >
            다시 시도
          </UiButton>
        </div>
        <UiEmpty
          v-else-if="!minutesTmplList?.length"
          title="사용할 수 있는 회의록 양식이 없습니다."
        />
        <div
          v-else
          class="meeting2-tmpl-list"
          role="radiogroup"
          aria-label="회의록 양식"
        >
          <label
            v-for="tmpl in minutesTmplList"
            :key="tmpl.minutesTmplCd"
            class="meeting2-tmpl-item"
            :class="{ 'is-active': form.tmplCd === tmpl.minutesTmplCd }"
          >
            <input
              type="radio"
              name="meeting-minutes-tmpl"
              :value="tmpl.minutesTmplCd"
              :checked="form.tmplCd === tmpl.minutesTmplCd"
              @change="onSelectTmpl(tmpl)"
            />
            <span class="meeting2-tmpl-item-main">
              <span class="meeting2-tmpl-item-name">
                {{ tmpl.tmplNm }}
                <UiBadge
                  v-if="tmpl.defaultYn === 'Y'"
                  variant="default"
                >
                  기본
                </UiBadge>
                <UiBadge
                  v-if="tmpl.minutesTmplCd === currentTmplCd"
                  variant="primary"
                >
                  현재
                </UiBadge>
              </span>
              <span
                v-if="tmpl.tmplDescription"
                class="meeting2-tmpl-item-desc"
              >
                {{ tmpl.tmplDescription }}
              </span>
              <span
                v-if="tmpl.recommendTxt"
                class="meeting2-tmpl-item-meta"
              >
                <strong>추천</strong>{{ tmpl.recommendTxt }}
              </span>
              <span
                v-if="tmpl.fieldNmList.length"
                class="meeting2-tmpl-item-meta"
              >
                <strong>구성</strong>{{ tmpl.fieldNmList.join(' · ') }}
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>

    <div class="meeting2-tmpl-footer">
      <span class="meeting2-tmpl-summary">
        <template v-if="selectedTmpl">
          {{ selectedTmpl.tmplNm }} · {{ selectedTone.label }} · 분량 {{ selectedLength.label }}
        </template>
      </span>
      <div class="meeting2-tmpl-footer-btns">
        <UiButton
          v-if="!isCreateMode"
          variant="outline"
          size="md"
          :disabled="isProcessing"
          @click="emit('cancel')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :disabled="!selectedTmpl || isProcessing"
          @click="onStart"
        >
          <template #icon-left>
            <UiIcon
              :name="isCreateMode ? 'sparkles' : 'refresh-cw'"
              size="16"
            />
          </template>
          {{ isCreateMode ? '회의록 생성' : '이 양식으로 다시 생성' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { UiBadge, UiButton, UiEmpty, UiIcon, UiLoading } from '@leechanyong/ispark-ui'
import { openConfirm } from '~/composables/useDialog'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingMinutesLengthCd, MeetingMinutesTmpl, MeetingMinutesToneCd } from '~/types/meeting'

const props = withDefaults(
  defineProps<{
    /** create: 회의록이 없을 때 처음 생성 / regenerate: 양식 변경 후 다시 생성 */
    mode?: 'create' | 'regenerate'
  }>(),
  { mode: 'regenerate' },
)

const emit = defineEmits<{
  cancel: []
  /** 생성 시작 (서버가 백그라운드로 생성 — 완료는 store 의 minutesState 로 확인) */
  started: []
}>()

const isCreateMode = computed(() => props.mode === 'create')

/** 문체·분량 코드는 DB 컬럼 값과 1:1 고정 — 규칙 문구 자체는 TB_PROMPT 에 있다 */
const TONE_OPTIONS: { value: MeetingMinutesToneCd; label: string; hint: string; example: string }[] = [
  { value: 'bullet', label: '개조식', hint: '~함', example: '예) 재무 관점 중복 지표를 하나로 통합하기로 함' },
  { value: 'plain', label: '서술형', hint: '~했다', example: '예) 재무 관점 중복 지표를 하나로 통합하기로 했다.' },
  {
    value: 'polite',
    label: '경어체',
    hint: '~했습니다',
    example: '예) 재무 관점 중복 지표를 하나로 통합하기로 했습니다.',
  },
]
const LENGTH_OPTIONS: { value: MeetingMinutesLengthCd; label: string; example: string }[] = [
  { value: 'normal', label: '표준', example: '안건별 핵심 논의 위주로, 독립된 안건과 요청은 빠짐없이' },
  { value: 'long', label: '상세', example: '논의 근거·수치·반대 및 보완 의견까지 자세히' },
]

const {
  meetingDetail,
  minutesTmplList,
  isLoadingMinutesTmpl,
  minutesTmplErrorMessage,
  minutesState,
  minutesStatusMessage,
  handleSelectMinutesTmplList,
  handleStartMinutes,
} = useMeetingStore()

const isProcessing = computed(() => minutesState.value === 'processing')

const hasEditedContent = computed(() => Boolean(meetingDetail.value.minutes?.editedContent))

/** 회의에 저장된 양식 — 없으면 기본 양식 (회의록이 기본 양식으로 생성됨) */
const currentTmplCd = computed<string | null>(() => {
  const saved = meetingDetail.value.meeting?.minutesTmplCd
  const list = minutesTmplList.value ?? []
  if (saved && list.some((t) => t.minutesTmplCd === saved)) return saved
  return list.find((t) => t.defaultYn === 'Y')?.minutesTmplCd ?? list[0]?.minutesTmplCd ?? null
})

const form = reactive<{ tmplCd: string | null; toneCd: MeetingMinutesToneCd; lengthCd: MeetingMinutesLengthCd }>({
  tmplCd: null,
  toneCd: 'bullet',
  lengthCd: 'normal',
})

/**
 * 서버는 NULL 문자열을 "" 로 내려준다 → `??` 로는 걸러지지 않으므로 허용 값인지로 판단한다
 */
const toToneCd = (value: unknown): MeetingMinutesToneCd | null =>
  TONE_OPTIONS.some((t) => t.value === value) ? (value as MeetingMinutesToneCd) : null
const toLengthCd = (value: unknown): MeetingMinutesLengthCd | null =>
  LENGTH_OPTIONS.some((l) => l.value === value) ? (value as MeetingMinutesLengthCd) : null

/** 현재 회의의 양식·문체·분량으로 선택값 초기화 (저장값 없으면 양식 기본 문체 / 표준 분량) */
const resetForm = (): void => {
  const meeting = meetingDetail.value.meeting
  const tmpl = minutesTmplList.value?.find((t) => t.minutesTmplCd === currentTmplCd.value)
  form.tmplCd = currentTmplCd.value
  form.toneCd = toToneCd(meeting?.minutesToneCd) ?? toToneCd(tmpl?.defaultToneCd) ?? 'bullet'
  form.lengthCd = toLengthCd(meeting?.minutesLengthCd) ?? 'normal'
}

// 양식 목록이 늦게 도착해도 선택값을 채운다
watch(minutesTmplList, resetForm, { immediate: true })

const selectedTmpl = computed(() => minutesTmplList.value?.find((t) => t.minutesTmplCd === form.tmplCd) ?? null)
const selectedTone = computed(() => TONE_OPTIONS.find((t) => t.value === form.toneCd) ?? TONE_OPTIONS[0]!)
const selectedLength = computed(() => LENGTH_OPTIONS.find((l) => l.value === form.lengthCd) ?? LENGTH_OPTIONS[0]!)

/** 양식을 바꾸면 그 양식의 기본 문체로 맞춘다 (이후 직접 변경 가능) */
const onSelectTmpl = (tmpl: MeetingMinutesTmpl): void => {
  form.tmplCd = tmpl.minutesTmplCd
  form.toneCd = toToneCd(tmpl.defaultToneCd) ?? form.toneCd
}

/** 회의록 생성 / 다시 생성 시작 — 서버가 백그라운드로 생성하고, 진행은 store 가 상태를 확인한다 */
const onStart = async (): Promise<void> => {
  const meetingId = meetingDetail.value.meeting?.meetingId
  if (!meetingId || !selectedTmpl.value) return

  if (!isCreateMode.value && hasEditedContent.value) {
    const confirmed = await openConfirm({
      title: '회의록 다시 생성',
      message: '직접 편집한 내용은 새 회의록으로 바뀝니다. 계속하시겠습니까?',
    })
    if (!confirmed) return
  }

  const ok = await handleStartMinutes({
    meetingId,
    minutesTmplCd: selectedTmpl.value.minutesTmplCd,
    minutesToneCd: form.toneCd,
    minutesLengthCd: form.lengthCd,
  })
  if (ok) emit('started')
}
</script>
