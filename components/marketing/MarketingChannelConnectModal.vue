<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    max-width="480px"
    :title="`${channelNm} 계정 연결`"
    custom-class="marketing-channel-connect-modal"
    @close="onClose"
  >
    <p class="marketing-channel-connect-desc">계정 정보를 입력하면 발행 권한을 확인하고 채널을 연결합니다.</p>
    <div
      ref="accountIdFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">아이디 / 이메일 <span class="marketing-req">*</span></label>
      <UiInput
        ref="accountIdInputRef"
        v-model="accountId"
        placeholder="계정 아이디 또는 이메일을 입력하세요"
        size="sm"
      />
    </div>
    <div
      ref="passwordFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">비밀번호 <span class="marketing-req">*</span></label>
      <UiInput
        ref="passwordInputRef"
        v-model="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        size="sm"
        @enter="onConnect"
      />
    </div>
    <div
      ref="agreeFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">API Access 권한 위임 <span class="marketing-req">*</span></label>
      <UiCheckbox
        v-model="isAccessAgreed"
        label="발행 · 게시 권한 위임에 동의합니다"
      />
    </div>
    <div class="marketing-channel-connect-note">
      <UiIcon
        name="info"
        size="16"
      />
      <p>입력한 정보는 로그인 및 채널 발행 권한 확인 용도로만 사용됩니다.</p>
    </div>
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          @click="onConnect"
        >
          연결하기
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiButton, UiCheckbox, UiIcon, UiInput, UiModal } from '@leechanyong/ispark-ui'

interface Props {
  isOpen: boolean
  channelNm: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  connect: []
}>()

const accountId = ref('')
const password = ref('')
const isAccessAgreed = ref(false)
const accountIdFieldRef = ref<HTMLElement | null>(null)
const passwordFieldRef = ref<HTMLElement | null>(null)
const agreeFieldRef = ref<HTMLElement | null>(null)
const accountIdInputRef = ref<{ focus: () => void } | null>(null)
const passwordInputRef = ref<{ focus: () => void } | null>(null)

const focusField = (fieldEl: HTMLElement | null, input: { focus: () => void } | null) => {
  fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input?.focus()
}

const focusAgree = () => {
  agreeFieldRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  agreeFieldRef.value?.querySelector<HTMLElement>('input')?.focus()
}

const onClose = () => {
  emit('close')
}

const onConnect = () => {
  if (!accountId.value.trim()) {
    openToast({ message: '아이디 / 이메일을 입력해 주세요.', type: 'warning' })
    focusField(accountIdFieldRef.value, accountIdInputRef.value)
    return
  }
  if (!password.value.trim()) {
    openToast({ message: '비밀번호를 입력해 주세요.', type: 'warning' })
    focusField(passwordFieldRef.value, passwordInputRef.value)
    return
  }
  if (!isAccessAgreed.value) {
    openToast({ message: 'API Access 권한 위임에 동의해 주세요.', type: 'warning' })
    focusAgree()
    return
  }
  emit('connect')
}
</script>
