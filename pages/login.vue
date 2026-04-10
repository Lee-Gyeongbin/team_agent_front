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
          <p
            v-if="isLoginNoticeLoading"
            class="login-notice-status"
          >
            공지를 불러오는 중...
          </p>
          <div
            v-else-if="loginNoticeErrorMessage"
            class="login-notice-status login-notice-status--error"
          >
            <span>{{ loginNoticeErrorMessage }}</span>
            <button
              type="button"
              class="btn-login"
              @click="onRetryLoginNotice"
            >
              다시 시도
            </button>
          </div>
          <p
            v-else-if="loginNoticeList.length === 0"
            class="login-notice-status"
          >
            등록된 공지가 없습니다.
          </p>
          <div
            v-else
            class="notice-list"
          >
            <div
              v-for="notice in loginNoticeList"
              :key="notice.noticeId"
              class="notice-item"
            >
              <button
                type="button"
                class="notice-item-main"
                @click="onOpenNoticeDetail(notice)"
              >
                <span class="notice-item-content type">{{ getNoticeTypeBracketed(notice) }}</span>
                <span class="notice-item-content title">{{ notice.title }}</span>
              </button>
              <span class="notice-item-content date">{{ getNoticeDateLabel(notice.createDt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoginNoticeModal
      v-if="selectedNotice"
      :is-open="isNoticeDetailPanelOpen"
      :notice="selectedNotice"
      :notice-title="`${getNoticeTypeBracketed(selectedNotice)} ${selectedNotice.title}`.trim()"
      @close="isNoticeDetailPanelOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const route = useRoute()
const {
  loginNoticeList,
  isLoginNoticeLoading,
  loginNoticeErrorMessage,
  handleSelectLoginNoticeList,
  handleSelectNoticeTypeOptions,
  getNoticeTypeBracketed,
  getNoticeDateLabel,
  isNoticeDetailPanelOpen,
  selectedNotice,
  onOpenNoticeDetail,
} = useNoticeStore()

/** 로그인 정보 저장 쿠키 */
const savedLoginIdCookie = useCookie<string | null>('ta_saved_login_id', {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  default: () => null,
})

const loginId = ref('')
const loginPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const sessionExpiredMessage = ref('')
const saveLoginInfo = ref(false)

if (route.query.expired === 'true') {
  sessionExpiredMessage.value = '세션이 만료되었습니다. 다시 로그인해주세요.'
}

onMounted(() => {
  const saved = savedLoginIdCookie.value
  if (saved) {
    loginId.value = saved
    saveLoginInfo.value = true
  }
  void Promise.all([handleSelectNoticeTypeOptions(), handleSelectLoginNoticeList()])
})

const onRetryLoginNotice = () => {
  handleSelectLoginNoticeList()
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
      savedLoginIdCookie.value = saveLoginInfo.value ? loginId.value.trim() : null
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
  // 로그인 폼 input만: 기본 1px 유지, 포커스 시 테두리 두께 2px
  :deep(.ui-input-wrap) {
    transition:
      border-color $transition-base,
      border-width $transition-base;
  }

  :deep(.ui-input-wrap.is-focused:not(.is-disabled)) {
    border-width: 2px;
  }

  .login-notice-status {
    margin: 0;
    font-size: 14px;
    color: $color-text-muted;
    line-height: 150%;
  }

  .login-notice-status--error {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    color: $color-text-dark;
  }
}
</style>
