<template>
  <div class="login-form signup-form flex items-center justify-center">
    <div class="login-form-wrapper login-center">
      <div class="login-index-header">
        <img
          class="login-logo"
          src="~/assets/icons/svg/logo-teamagent-login.svg"
          alt="TeamAgent"
          @click="navigateTo('/')"
        />
      </div>

      <div class="chat-index-input-wrapper flex flex-col items-center w-full signup-form-width">
        <div class="chat-index-input-top flex flex-col w-full">
          <label
            class="signup-label"
            for="signup-id"
          >
            아이디
          </label>
          <input
            id="signup-id"
            v-model="form.userId"
            type="text"
            class="signup-input"
            placeholder="아이디를 입력하세요."
            @keyup.enter="onSubmit"
          />

          <label
            class="signup-label"
            for="signup-name"
          >
            이름
          </label>
          <input
            id="signup-name"
            v-model="form.userNm"
            type="text"
            class="signup-input"
            placeholder="이름을 입력하세요."
            @keyup.enter="onSubmit"
          />

          <label
            class="signup-label"
            for="signup-password"
          >
            비밀번호
          </label>
          <input
            id="signup-password"
            v-model="form.password"
            type="password"
            class="signup-input"
            placeholder="비밀번호를 입력하세요."
            @keyup.enter="onSubmit"
          />

          <label
            class="signup-label"
            for="signup-password-confirm"
          >
            비밀번호 확인
          </label>
          <input
            id="signup-password-confirm"
            v-model="form.passwordConfirm"
            type="password"
            class="signup-input"
            placeholder="비밀번호를 다시 입력하세요."
            @keyup.enter="onSubmit"
          />

          <label
            class="signup-label"
            for="signup-email"
          >
            이메일
          </label>
          <input
            id="signup-email"
            v-model="form.email"
            type="email"
            class="signup-input"
            placeholder="이메일을 입력하세요."
            @keyup.enter="onSubmit"
          />

          <label
            class="signup-label"
            for="signup-phone"
          >
            연락처
          </label>
          <input
            id="signup-phone"
            v-model="form.phone"
            type="tel"
            class="signup-input"
            placeholder="연락처를 입력하세요."
            @keyup.enter="onSubmit"
          />

          <p
            v-if="errorMessage"
            class="signup-error"
          >
            {{ errorMessage }}
          </p>
        </div>

        <div class="chat-index-input-bottom flex flex-col items-center w-full">
          <div class="signup-actions flex items-center w-full">
            <UiButton
              type="button"
              variant="primary"
              size="lg"
              class="btn-signup-submit"
              full-width
              :loading="isLoading"
              @click="onSubmit"
            >
              {{ isLoading ? '가입 중...' : '회원가입' }}
              <template #icon-right>
                <i class="icon-send size-20 icon-white" />
              </template>
            </UiButton>
          </div>
          <NuxtLink
            to="/login"
            class="signup-login-link"
          >
            이미 계정이 있으신가요? <b>로그인</b>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignupForm } from '~/types/auth'
import { createEmptySignupForm } from '~/types/auth'

definePageMeta({ layout: 'auth' })

const form = reactive<SignupForm>(createEmptySignupForm())
const { signup } = useSignup()
const errorMessage = ref('')
const isLoading = ref(false)

const onSubmit = async () => {
  errorMessage.value = ''

  if (!form.userId || !form.userNm || !form.password || !form.passwordConfirm || !form.email || !form.phone) {
    errorMessage.value = '모든 항목을 입력해주세요.'
    return
  }

  if (!checkEmail(form.email)) {
    errorMessage.value = '올바른 이메일 형식을 입력해주세요.'
    return
  }

  if (form.password !== form.passwordConfirm) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  if (form.password.length < 6) {
    errorMessage.value = '비밀번호는 6자 이상이어야 합니다.'
    return
  }

  isLoading.value = true

  const res = await signup(form)
  if (res.success) {
    openAlert({ message: '회원가입이 완료되었습니다.\n 로그인 후 이용해주세요.' })
    navigateTo('/login')
  } else {
    errorMessage.value = res.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
  isLoading.value = false
}
</script>

<style lang="scss" scoped>
.signup-form {
  .signup-form-width {
    max-width: 360px; // 회원가입 폼 영역 폭 제한 (auth 레이아웃에서 전체 폭 쓰지 않도록)
  }

  .chat-index-input-top {
    gap: 12px;
  }

  .signup-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
  }

  .signup-input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-base;
    border: 1px solid $color-border;
    font-size: $font-size-base;
  }

  .signup-error {
    color: #e53e3e;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  .chat-index-input-bottom {
    gap: 16px;
    margin-top: 4px;
  }

  .signup-actions {
    margin-top: 16px;
  }

  // 회원가입 메인 버튼: 로그인 제출 버튼과 동일 레이아웃
  .btn-signup-submit.ui-button {
    position: relative;
    height: 44px;
    min-height: 44px;
    padding: 0 20px;
    border-radius: 6px;
    justify-content: center;

    :deep(.ui-button-text) {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
    }

    :deep(.ui-button-icon) {
      position: absolute;
      right: 18px;
    }
  }

  .signup-login-link {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-decoration: none;
    transition: color $transition-base;

    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>
