<template>
  <UiModal
    :is-open="isOpen"
    :title="persistent ? '비밀번호 변경 안내' : '비밀번호 변경'"
    :show-close="!persistent"
    @close="onRequestClose"
  >
    <div class="com-setting-form">
      <p
        v-if="persistent"
        class="password-change-notice"
      >
        비밀번호 변경 대상자입니다. 계속하려면 비밀번호를 변경해 주세요.
      </p>

      <div class="url-reg-field password-field">
        <label class="url-reg-label password-field__label">기존 비밀번호 <span class="required">*</span></label>
        <UiInput
          v-model="oldPassword"
          type="password"
          placeholder="기존 비밀번호를 입력하세요"
          size="sm"
          class="password-field__input"
          @keydown.enter="onSubmit"
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
          @keydown.enter="onSubmit"
        />
      </div>
      <div class="password-field-group">
        <div
          ref="confirmPasswordFieldRef"
          class="url-reg-field password-field"
        >
          <label class="url-reg-label password-field__label">새 비밀번호 확인 <span class="required">*</span></label>
          <UiInput
            ref="confirmPasswordInputRef"
            v-model="newPasswordConfirm"
            type="password"
            placeholder="새 비밀번호를 다시 입력하세요"
            size="sm"
            class="password-field__input"
            @keydown.enter="onSubmit"
          />
        </div>

        <p class="password-field__helper">비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해 주세요.</p>
        <p class="password-field__helper">허용 특수문자 : ! @ # $ % ^ & * ( ) _ - + =</p>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          v-if="!persistent"
          class="btn-modal-dialog"
          variant="outline"
          size="lg"
          @click="onRequestClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="lg"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="onSubmit"
        >
          변경
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiButton, UiInput, UiModal } from '@leechanyong/ispark-ui'

const props = defineProps<{
  isOpen: boolean
  /** 초기 비밀번호 변경. 닫기·취소 없음 */
  persistent?: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { fetchChangePassword } = useMyPageApi()

const oldPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const isSubmitting = ref(false)

const confirmPasswordFieldRef = ref<HTMLElement | null>(null)
const confirmPasswordInputRef = ref<{ focus?: () => void } | null>(null)

const resetForm = () => {
  oldPassword.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) resetForm()
  },
)

const focusConfirmField = () => {
  nextTick(() => {
    confirmPasswordFieldRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (typeof confirmPasswordInputRef.value?.focus === 'function') {
      confirmPasswordInputRef.value.focus()
      return
    }
    confirmPasswordFieldRef.value?.querySelector('input')?.focus()
  })
}

const onRequestClose = () => {
  if (props.persistent) return
  emit('close')
}

const onSubmit = async () => {
  if (isSubmitting.value) return

  // 확인 값은 changePassword.do로 전달되지 않으므로 화면에서만 비교한다
  if (newPassword.value !== newPasswordConfirm.value) {
    openToast({ message: '새 비밀번호가 일치하지 않습니다.', type: 'warning' })
    focusConfirmField()
    return
  }

  isSubmitting.value = true
  try {
    await fetchChangePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
    emit('success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.'
    openToast({ message, type: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.password-change-notice {
  margin: 0;
  font-size: $font-size-sm;
  line-height: 1.5;
  color: $color-text-secondary;
}
</style>
