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

        <p class="password-field__helper">비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해 주세요.</p>
        <p class="password-field__helper">허용 특수문자 : ! @ # $ % ^ & * ( ) _ - + =</p>
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
defineProps<{ isOpen: boolean }>()

const emit = defineEmits<{
  close: []
  submit: [payload: { oldPassword: string; newPassword: string }]
}>()

const newPassword = ref('')
const newPasswordConfirm = ref('')
const oldPassword = ref('')
const MIN_PASSWORD_LEN = 8

const canSubmit = computed(() => {
  const oldPw = oldPassword.value.trim()
  const newPw = newPassword.value.trim()
  const confirmPw = newPasswordConfirm.value.trim()
  return oldPw.length >= MIN_PASSWORD_LEN && newPw.length >= MIN_PASSWORD_LEN && confirmPw.length >= MIN_PASSWORD_LEN
})
const resetForm = () => {
  newPassword.value = ''
  newPasswordConfirm.value = ''
  oldPassword.value = ''
}

const onSubmit = () => {
  emit('submit', { oldPassword: oldPassword.value, newPassword: newPassword.value })
  resetForm()
}

const onModalClose = () => {
  resetForm()
  emit('close')
}
</script>
