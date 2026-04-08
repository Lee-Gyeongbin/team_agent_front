<template>
  <div class="login-form">
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

          <div
            v-if="sessionExpiredMessage"
            class="login-error"
          >
            <i class="icon-error size-16" />
            {{ sessionExpiredMessage }}
          </div>

          <div
            v-if="errorMessage"
            class="login-error"
          >
            <i class="icon-error size-16" />
            {{ errorMessage }}
          </div>

          <!-- TODO: 로그인 정보 저장 체크박스 추가 -->
          <UiCheckbox
            v-model="saveLoginInfo"
            label="로그인 정보 저장"
            class="login-save-checkbox"
          />
        </div>

        <div class="chat-index-input-bottom flex flex-col items-center w-full">
          <div class="login-actions flex items-center w-full">
            <UiButton
              type="button"
              variant="primary"
              size="lg"
              class="btn-auth-submit"
              full-width
              :loading="isLoading"
              @click="onSubmit"
            >
              {{ isLoading ? '로그인 중...' : '로그인' }}
            </UiButton>
          </div>
          <div class="login-btn-grp flex items-center justify-center">
            <button
              type="button"
              class="btn-login"
            >
              아이디 찾기
            </button>
            <span
              class="login-btn-sep"
              aria-hidden="true"
            />
            <button
              type="button"
              class="btn-login"
            >
              비밀번호 찾기
            </button>
            <span
              class="login-btn-sep"
              aria-hidden="true"
            />
            <button
              type="button"
              class="btn-login"
              @click="onNavigateSignup"
            >
              회원가입
            </button>
          </div>
        </div>

        <!-- 공지사항 -->
        <div class="login-notice-wrap">
          <div class="notice-list">
            <div
              v-for="notice in noticeList"
              :key="notice.id"
              class="notice-item"
            >
              <p class="notice-item-content title">{{ notice.content }}</p>
              <p class="notice-item-content date">{{ notice.date }}</p>
            </div>
          </div>
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

// 🔽 아이디/비밀번호 찾기 — 페이지 준비 시 라우트 연결
// const onFindId = () => {
//   navigateTo('/find-id')
// }

// const onFindPassword = () => {
//   navigateTo('/find-password')
// }

const onNavigateSignup = () => {
  navigateTo('/signup')
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

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const noticeList = ref([
  {
    id: 1,
    content: '[장애안내] TeamAgent 서비스 일시 접속 장애 안내드립니다.',
    date: '2026.04.03',
  },
  {
    id: 2,
    content: '[점검 완료 안내]TeamAgent 서비스 인프라 점검 안내드립니다.',
    date: '2026.04.02',
  },
  {
    id: 3,
    content: '[서비스 점검 안내]TeamAgent 인프라 점검 실시 안내드립니다.',
    date: '2026.04.01',
  },
])
</script>

<style lang="scss" scoped>
.login-form {
  // 로그인 폼 input만: 기본 1px 유지, 포커스 시 테두리 두께 2px
  :deep(.ui-input-wrap) {
    transition:
      border-color $transition-base,
      border-width $transition-base;
  }

  :deep(.ui-input-wrap.is-focused:not(.is-disabled)) {
    border-width: 2px;
  }
}
</style>
