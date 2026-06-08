<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="410px"
    custom-class="mail-login-modal-dialog"
    @close="emit('close')"
  >
    <template #header>
      <div class="mail-login-modal-header">
        <div class="mail-login-modal-icon">
          <i class="icon-mail size-28" />
        </div>
        <div>
          <h2 class="mail-login-modal-title">아마란스10 계정으로 로그인</h2>
          <p class="mail-login-modal-desc">이메일 계정을 연결하여 메일 브리핑을 시작하세요</p>
        </div>
        <button
          class="btn btn-modal-close"
          @click="emit('close')"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <div class="mail-login-modal-body">
      <!-- 이메일 입력 -->
      <div class="mail-login-modal-field">
        <label class="mail-login-modal-label">이메일</label>
        <div class="mail-login-modal-input-wrap">
          <input
            v-model="form.email"
            type="email"
            class="inp mail-login-modal-input"
            placeholder="이메일을 입력하세요"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
        </div>
      </div>

      <!-- 비밀번호 입력 -->
      <div class="mail-login-modal-field">
        <label class="mail-login-modal-label">비밀번호</label>
        <div class="mail-login-modal-input-wrap">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="inp mail-login-modal-input"
            placeholder="비밀번호를 입력하세요"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
          <button
            type="button"
            class="mail-login-modal-eye-btn"
            tabindex="-1"
            @click="showPassword = !showPassword"
          >
            <i
              :class="showPassword ? 'icon-eye-off' : 'icon-eye'"
              class="size-18"
            />
          </button>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <p
        v-if="errorMsg"
        class="mail-login-modal-error"
      >
        <i class="icon-warning size-14" />
        {{ errorMsg }}
      </p>

      <!-- 로그인 버튼 -->
      <button
        type="button"
        class="btn mail-login-modal-submit"
        :disabled="isLoading || !form.email || !form.password"
        @click="handleLogin"
      >
        <span
          v-if="isLoading"
          class="mail-login-spinner"
        />
        <span v-else>로그인</span>
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { useMailStore } from '~/composables/mail/useMailStore'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { handleMailAuth } = useMailStore()

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!form.email.trim() || !form.password.trim()) return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const ok = await handleMailAuth(form.email.trim(), form.password)
    if (ok) {
      form.email = ''
      form.password = ''
      emit('success')
    } else {
      errorMsg.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : '로그인 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 모달 닫힐 때 상태 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      form.email = ''
      form.password = ''
      errorMsg.value = ''
      showPassword.value = false
    }
  },
)
</script>

<style lang="scss" scoped>
.mail-login-modal-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  background: $color-surface;
  margin-bottom: 14px;
  padding: 13px 15px;
  border-radius: 8px;
  border: 1px solid $color-border-light;

  .btn.btn-modal-close {
    position: absolute;
    top: 8px;
    left: auto;
    right: 8px;
    margin-left: 0;
    flex-shrink: 0;
  }
}

.mail-login-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: $border-radius-lg;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.mail-login-modal-title {
  @include typo($body-large-bold, $color-text-heading);
  margin-bottom: 4px;
}

.mail-login-modal-desc {
  @include typo($body-small, $color-text-muted);
}

.mail-login-modal-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: 0;
  width: 100%;
}

.mail-login-modal-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.mail-login-modal-label {
  @include typo($body-small-bold, $color-text-dark);
}

.mail-login-modal-input-wrap {
  position: relative;
}

.mail-login-modal-input {
  width: 100%;
  height: $height-auth;
  padding: 0 $spacing-md;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  @include typo($body-medium);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-bg);
  }

  &:disabled {
    background: $color-surface;
    opacity: 0.7;
  }

  &::placeholder {
    color: $color-text-disabled;
  }
}

.mail-login-modal-eye-btn {
  position: absolute;
  right: $spacing-sm;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: $color-text-muted;

  &:hover {
    color: $color-text-dark;
  }
}

.mail-login-modal-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: $spacing-sm $spacing-md;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: $border-radius-base;
  @include typo($body-small);
  color: $color-error;
}

.mail-login-modal-submit {
  width: 100%;
  height: $height-auth;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: $border-radius-base;
  @include typo($body-medium-bold);
  cursor: pointer;
  transition: background $transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.mail-login-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: mail-spin 0.7s linear infinite;
}

@keyframes mail-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
