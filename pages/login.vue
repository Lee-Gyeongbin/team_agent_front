<template>
  <div class="login-form flex items-center justify-center">
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
              for="login-id"
            >
              아이디
            </label>
            <UiInput
              id="login-id"
              v-model="loginId"
              size="auth"
              placeholder="아이디를 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <div class="input-grp">
            <label
              class="login-label"
              for="login-password"
            >
              비밀번호
            </label>
            <UiInput
              id="login-password"
              v-model="loginPassword"
              type="password"
              size="auth"
              placeholder="비밀번호를 입력하세요."
              @enter="onSubmit"
            />
          </div>

          <p
            v-if="sessionExpiredMessage"
            class="login-session-expired"
          >
            {{ sessionExpiredMessage }}
          </p>

          <p
            v-if="errorMessage"
            class="login-error"
          >
            {{ errorMessage }}
          </p>

          <!-- TODO: 로그인 정보 저장 체크박스 추가 -->
          <UiCheckbox
            v-model="saveLoginInfo"
            label="로그인 정보 저장"
            class="login-save-checkbox color-4B81E6"
          />
        </div>

        <div class="chat-index-input-bottom flex flex-col items-center w-full">
          <div class="login-actions flex items-center w-full">
            <UiButton
              type="button"
              variant="primary"
              size="lg"
              class="btn-login-submit"
              full-width
              :loading="isLoading"
              @click="onSubmit"
            >
              {{ isLoading ? '로그인 중...' : '로그인' }}
            </UiButton>
          </div>
          <NuxtLink
            to="/signup"
            class="login-signup-link"
          >
            아직 계정이 없으신가요? <b>회원가입</b>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const route = useRoute()

const loginId = ref('')
const loginPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const sessionExpiredMessage = ref('')
/** 로그인 정보 저장 (아이디 기억 등 — 백엔드/스토리지 연동 시 사용) */
const saveLoginInfo = ref(false)

if (route.query.expired === 'true') {
  sessionExpiredMessage.value = '세션이 만료되었습니다. 다시 로그인해주세요.'
}

const onSubmit = async () => {
  errorMessage.value = ''
  sessionExpiredMessage.value = ''

  if (!loginId.value || !loginPassword.value) {
    errorMessage.value = '아이디와 비밀번호를 입력해주세요.'
    return
  }

  isLoading.value = true
  try {
    const res = await login(loginId.value, loginPassword.value)

    if (res.success) {
      const redirect = (route.query.redirect as string) || '/chat'
      navigateTo(redirect)
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
  .login-session-expired {
    color: #dd6b20;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  .login-error {
    color: #e53e3e;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  // 로그인 메인 버튼: 전체 폭, 라벨 중앙 + 전송 아이콘 우측 정렬
  .btn-login-submit.ui-button {
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

  .login-signup-link {
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
