<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    max-width="480px"
    :title="isEditMode ? '마케팅 프로젝트 수정' : '새 마케팅 프로젝트'"
    custom-class="marketing-new-modal"
    @close="onClose"
  >
    <div class="marketing-form-field">
      <label class="marketing-form-label">프로젝트명 <span class="marketing-req">*</span></label>
      <UiInput
        v-model="form.projectNm"
        placeholder="예) 여름 시즌 신제품 SNS 캠페인"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">고객사</label>
      <UiInput
        v-model="form.orgNm"
        placeholder="예) 올리브영"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">캠페인 개요</label>
      <UiTextarea
        v-model="form.summary"
        placeholder="캠페인 목적, 타깃, 핵심 메시지를 간단히 입력하세요 (선택)"
        :rows="3"
        border
        size="sm"
        :auto-resize="false"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">마감일</label>
      <UiDatePicker
        v-model="dueDtValue"
        size="sm"
      />
    </div>
    <div
      v-if="isEditMode"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">진행 상태</label>
      <div
        class="marketing-filter-chips"
        role="group"
        aria-label="진행 상태"
      >
        <button
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          type="button"
          :class="['marketing-filter-chip', { 'is-active': form.statusCd === option.value }]"
          @click="form.statusCd = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          :disabled="isSaving"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :loading="isSaving"
          @click="onSubmit"
        >
          {{ isEditMode ? '저장' : '시작' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import { openToast } from '~/composables/useToast'
import type { MarketingProject } from '~/types/marketing'

interface Props {
  isOpen: boolean
  isSaving?: boolean
  /** 수정 시 기존 프로젝트. 없으면 신규 */
  project?: MarketingProject | null
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  project: null,
})

const emit = defineEmits<{
  close: []
  submit: [
    form: {
      marketingProjectId?: string
      projectNm: string
      orgNm: string
      summary: string
      dueDt: string
      statusCd: string
    },
  ]
}>()

/** PT000002 — 작성중→검수중은 마감일이 지나면 서버 스케줄러가 자동 전환, 완료/보류는 여기서 직접 지정 */
const STATUS_OPTIONS = [
  { value: '001', label: '작성중' },
  { value: '002', label: '검수중' },
  { value: '003', label: '완료' },
  { value: '004', label: '보류' },
]

const defaultForm = () => ({
  projectNm: '',
  orgNm: '',
  summary: '',
  dueDt: '',
  statusCd: '001',
})

const form = ref(defaultForm())

const isEditMode = computed(() => !!props.project?.marketingProjectId)

/** 마감일 YYYY-MM-DD ↔ DateValue */
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
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${monthText}-${dayText}`
}

const dueDtValue = computed<DateValue | undefined>({
  get: () => parseYyyyMmDdToDateValue(form.value.dueDt),
  set: (value) => {
    form.value.dueDt = formatDateValueToYyyyMmDd(value)
  },
})

const syncFormFromProject = () => {
  if (!props.project) {
    form.value = defaultForm()
    return
  }
  form.value = {
    projectNm: props.project.projectNm ?? '',
    orgNm: props.project.orgNm ?? '',
    summary: props.project.projectOverview ?? '',
    dueDt: props.project.dueDt ?? '',
    statusCd: props.project.statusCd ?? '001',
  }
}

watch(
  () => [props.isOpen, props.project] as const,
  ([isOpen]) => {
    if (isOpen) syncFormFromProject()
  },
)

const onClose = () => {
  form.value = defaultForm()
  emit('close')
}

const onSubmit = () => {
  if (!form.value.projectNm.trim()) {
    openToast({ message: '프로젝트명을 입력해 주세요.', type: 'warning' })
    return
  }
  emit('submit', {
    ...form.value,
    ...(props.project?.marketingProjectId ? { marketingProjectId: props.project.marketingProjectId } : {}),
  })
}
</script>
