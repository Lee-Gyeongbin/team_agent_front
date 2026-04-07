<template>
  <div class="login-form signup-form flex items-center justify-center">
    <div class="login-form-wrapper login-center">
      <div class="login-index-header">
        <img
          class="login-logo"
          src="~/assets/icons/svg/logo-teamagent.svg"
          alt="TeamAgent"
          @click="navigateTo('/')"
        />
      </div>

      <div class="chat-index-input-wrapper flex flex-col items-center w-full">
        <div class="chat-index-input-top flex flex-col w-full gap-16">
          <div class="input-grp">
            <label
              class="login-label"
              for="signup-id"
            >
              아이디
            </label>
            <UiInput
              id="signup-id"
              v-model="form.userId"
              size="auth"
              placeholder="아이디를 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="signup-name"
            >
              이름
            </label>
            <UiInput
              id="signup-name"
              v-model="form.userNm"
              size="auth"
              placeholder="이름을 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="signup-password"
            >
              비밀번호
            </label>
            <UiInput
              id="signup-password"
              v-model="form.password"
              type="password"
              size="auth"
              placeholder="비밀번호를 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="signup-password-confirm"
            >
              비밀번호 확인
            </label>
            <UiInput
              id="signup-password-confirm"
              v-model="form.passwordConfirm"
              type="password"
              size="auth"
              placeholder="비밀번호를 다시 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="signup-email"
            >
              이메일
            </label>
            <UiInput
              id="signup-email"
              v-model="form.email"
              type="email"
              size="auth"
              placeholder="이메일을 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="signup-phone"
            >
              연락처
            </label>
            <UiInput
              id="signup-phone"
              v-model="form.phone"
              type="tel"
              size="auth"
              placeholder="연락처를 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <p
            v-if="errorMessage"
            class="signup-error"
          >
            {{ errorMessage }}
          </p>
        </div>

        <div class="chat-index-input-bottom flex flex-col items-center w-full">
          <div class="login-actions flex items-center w-full">
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
  .signup-error {
    color: #e53e3e;
    font-size: $font-size-sm;
    margin-top: 4px;
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
