<template>
  <UiModal
    :is-open="isOpen"
    title="비밀번호 변경"
    position="center"
    @close="onModalClose"
  >
    <div class="com-setting-form">
      <div class="url-reg-field password-field">
        <label class="url-reg-label password-field__label">기존 비밀번호 <span class="required">*</span></label>
        <UiInput
          v-model="oldPassword"
          type="password"
          placeholder="기존 비밀번호를 입력하세요"
          size="sm"
          class="password-field__input"
        />
      </div>
      <div class="url-reg-field password-field">
        <label class="url-reg-label password-field__label">새 비밀번호 <span class="required">*</span></label>
        <UiInput
          v-model="newPassword"
          type="password"
          placeholder="새 비밀번호를 입력하세요"
          size="sm"
          class="password-field__input"
        />
      </div>
      <div class="password-field-group">
        <div class="url-reg-field password-field">
          <label class="url-reg-label password-field__label">새 비밀번호 확인 <span class="required">*</span></label>
          <UiInput
            v-model="newPasswordConfirm"
            type="password"
            placeholder="새 비밀번호를 다시 입력하세요"
            size="sm"
            class="password-field__input"
          />
        </div>

        <p class="password-field__helper">비밀번호는 8자 이상 입력해 주세요.</p>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          @click="onModalClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          변경
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'

interface Props {
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [payload: { oldPassword: string; newPassword: string }]
}>()

const newPassword = ref('')
const newPasswordConfirm = ref('')
const oldPassword = ref('')

const canSubmit = computed(() => {
  return !!(
    oldPassword.value.trim() &&
    newPassword.value.trim() &&
    newPasswordConfirm.value.trim() &&
    oldPassword.value.length >= 8 &&
    newPassword.value.length >= 8 &&
    newPasswordConfirm.value.length >= 8
  )
})
const resetForm = () => {
  newPassword.value = ''
  newPasswordConfirm.value = ''
  oldPassword.value = ''
}

const onSubmit = () => {
  if (newPassword.value !== newPasswordConfirm.value) {
    openToast({ message: '새 비밀번호와 확인 값이 일치하지 않습니다.', type: 'warning' })
    return
  }

  emit('submit', { oldPassword: oldPassword.value, newPassword: newPassword.value })
  resetForm()
}

const onModalClose = () => {
  resetForm()
  emit('close')
}
</script>
