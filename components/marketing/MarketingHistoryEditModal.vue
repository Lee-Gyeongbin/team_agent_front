<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    max-width="420px"
    title="제작 내역 수정"
    custom-class="marketing-history-edit-modal"
    @close="onClose"
  >
    <div class="marketing-form-field">
      <label class="marketing-form-label">
        이름
        <span class="marketing-req">*</span>
      </label>
      <UiInput
        ref="titleInputRef"
        v-model="titleValue"
        placeholder="제작 내역 이름"
        @keydown.enter.prevent="onSubmit"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">발행 예정 일시</label>
      <UiDatePicker
        v-model="scheduledValue"
        type="datetime"
        size="sm"
      />
    </div>
    <div class="marketing-history-edit-modal__tip">
      <i class="icon-info size-16" />
      <p>예정 시각이 다가오면 알림 배지로 알려드립니다.</p>
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
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { apiStringFromDateValue, dateValueFromApiString } from '~/utils/global/dateUtil'
import { focusMarketingField } from '~/utils/marketing/marketingUtil'

interface Props {
  isOpen: boolean
  isSaving?: boolean
  contentTitle?: string
  /** 현재 지정된 발행 예정일시(YYYY-MM-DD HH:mm:ss) — 없으면 빈 문자열 */
  publishScheduledDt?: string
}

export type MarketingHistoryEditPayload = {
  title: string
  publishScheduledDt: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  contentTitle: '',
  publishScheduledDt: '',
})

const emit = defineEmits<{
  close: []
  submit: [payload: MarketingHistoryEditPayload]
}>()

const titleInputRef = ref<{ $el?: HTMLElement } | null>(null)
const titleValue = ref(props.contentTitle)

// UiDatePicker는 DateValue 인스턴스를 다룬다. ref()에 바로 넣으면 Vue 반응형 언래핑으로 타입이 깨지므로
// computed get/set으로 감싼다 (ChatGuideMaintenance.vue 점검 일시와 동일).
const scheduledApiString = ref(props.publishScheduledDt)
const scheduledValue = computed<DateValue | undefined>({
  get: () => dateValueFromApiString(scheduledApiString.value),
  set: (v) => {
    scheduledApiString.value = apiStringFromDateValue(v)
  },
})

const onClose = () => emit('close')

const onSubmit = async () => {
  const title = titleValue.value.trim()
  if (!title) {
    openToast({ message: '제작 내역 이름을 입력해 주세요.', type: 'warning' })
    const root = titleInputRef.value?.$el ?? titleInputRef.value
    await focusMarketingField(root instanceof HTMLElement ? root : null, null)
    return
  }
  emit('submit', {
    title,
    publishScheduledDt: scheduledApiString.value.trim() || null,
  })
}
</script>
