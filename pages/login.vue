<template>
  <div class="chat-index login-form flex flex-col items-center justify-center">
    <div class="chat-index-header">
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">로그인</p>
    </div>

    <div class="chat-index-input-wrapper flex flex-col items-center w-full login-form-width">
      <div class="chat-index-input-top flex flex-col w-full">
        <label
          class="login-label"
          for="login-id"
        >
          아이디
        </label>
        <input
          id="login-id"
          v-model="loginId"
          type="text"
          class="login-input"
          placeholder="아이디를 입력하세요."
          @keyup.enter="onSubmit"
        />

        <label
          class="login-label"
          for="login-password"
        >
          비밀번호
        </label>
        <input
          id="login-password"
          v-model="loginPassword"
          type="password"
          class="login-input"
          placeholder="비밀번호를 입력하세요."
          @keyup.enter="onSubmit"
        />

        <p
          v-if="errorMessage"
          class="login-error"
        >
          {{ errorMessage }}
        </p>
      </div>

      <div class="chat-index-input-bottom flex justify-end items-center w-full">
        <button
          class="btn btn-chat-index btn-login"
          type="button"
          :disabled="isLoading"
          @click="onSubmit"
        >
          <span class="icon-circle">
            <i class="icon-user size-20" />
          </span>
          <p>{{ isLoading ? '로그인 중...' : '로그인' }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()

const loginId = ref('')
const loginPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const onSubmit = async () => {
  errorMessage.value = ''

  if (!loginId.value || !loginPassword.value) {
    errorMessage.value = '아이디와 비밀번호를 입력해주세요.'
    return
  }

  isLoading.value = true
  try {
    const res = await login(loginId.value, loginPassword.value)

    if (res.success) {
      navigateTo('/chat')
    } else {
      errorMessage.value = res.message || '로그인에 실패했습니다.'
    }
  } catch {
    errorMessage.value = '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-form {
  .login-form-width {
    max-width: 360px; // 로그인 폼 영역 폭 제한 (auth 레이아웃에서 전체 폭 쓰지 않도록)
  }

  .chat-index-input-top {
    gap: 12px;
  }

  .login-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
  }

  .login-input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-base;
    border: 1px solid $color-border;
    font-size: $font-size-base;
  }

  .login-error {
    color: #e53e3e;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  .btn-login {
    width: 130px;
    height: 60px;
    margin-top: 20px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
