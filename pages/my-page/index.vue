<template>
  <div class="my-page l-center">
    <!-- 헤더 -->
    <div class="my-page-header">
      <h1 class="my-page-title">마이페이지</h1>
      <p class="my-page-description">내 계정 정보를 확인하고 관리할 수 있습니다.</p>
    </div>

    <!-- 내용 -->
    <div class="my-page-panel">
      <!-- 로딩 -->
      <UiLoading
        v-if="isLoading"
        overlay
        text="내 정보를 불러오는 중..."
      />

      <!-- 에러 -->
      <div
        v-else-if="errorMessage"
        class="my-page-error"
      >
        <p class="my-page-error__message">{{ errorMessage }}</p>
        <UiButton
          variant="outline"
          size="md"
          @click="handleLoadMyPage"
        >
          다시 시도
        </UiButton>
      </div>

      <!-- 데이터 없음 -->
      <div
        v-else-if="!hasData"
        class="my-page-empty"
      >
        <p>표시할 사용자 정보가 없습니다.</p>
      </div>

      <!-- 데이터 있음 -->
      <div
        v-else
        class="my-page-content"
      >
        <div class="my-page-layout">
          <section class="my-page-main">
            <section class="my-page-tab-panel my-page-right">
              <UiTab
                v-model="activeTab"
                :tabs="myPageTabItems"
              />
              <div class="my-page-tab-panel__body">
                <MyPageInfo v-if="activeTab === 'account'" />
                <MyPageSec v-else-if="activeTab === 'security'" />
                <MyPageLoginHistory v-else-if="activeTab === 'login-history'" />
              </div>
            </section>
          </section>

          <!-- 내 정보 요약 (좌측 고정) -->
          <section class="my-page-left">
            <div class="my-page-profile">
              <div class="my-page-avatar">
                <input
                  ref="avatarFileInputRef"
                  type="file"
                  class="my-page-avatar-file-input"
                  accept="image/*"
                  @change="onAvatarFileChange"
                />
                <div class="my-page-avatar-icon">
                  <img
                    v-if="avatarPreviewUrl"
                    :src="avatarPreviewUrl"
                    alt=""
                    class="my-page-avatar-preview"
                  />
                  <i
                    v-else
                    class="icon-user size-32"
                  />
                </div>
                <UiButton
                  variant="ghost"
                  size="xs"
                  class="my-page-avatar-change-button"
                  @click="onClickChangePhoto"
                >
                  사진 변경
                </UiButton>
              </div>
              <div class="my-page-profile-text">
                <p class="my-page-profile-name">{{ form.userNm || '-' }}</p>
                <p class="my-page-profile-id">
                  {{ form.userId || '-' }}
                  <span
                    v-if="form.orgId"
                    class="my-page-profile-org"
                  >
                    · {{ currentOrgLabel }}
                  </span>
                </p>
              </div>
            </div>

            <dl class="my-page-summary-list">
              <div class="my-page-summary-item">
                <dt>아이디</dt>
                <dd>{{ form.userId || '-' }}</dd>
              </div>
              <div class="my-page-summary-item">
                <dt>이름</dt>
                <dd>{{ form.userNm || '-' }}</dd>
              </div>
              <div class="my-page-summary-item">
                <dt>조직</dt>
                <dd>{{ currentOrgLabel || '-' }}</dd>
              </div>
            </dl>

            <div class="my-page-password-button-wrap">
              <UiButton
                variant="outline"
                size="md"
                class="my-page-password-button"
                @click="openPasswordModal"
              >
                비밀번호 변경
              </UiButton>
            </div>
          </section>
        </div>
        <MyPagePasswordChangeModal
          :is-open="isPasswordModalOpen"
          @close="closePasswordModal"
          @submit="handleSubmitPasswordChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const activeTab = ref('account')

const myPageTabItems = [
  { label: '내 계정 정보', value: 'account' },
  { label: '보안', value: 'security' },
  { label: '로그인 이력', value: 'login-history' },
]

const {
  isLoading,
  errorMessage,
  hasData,
  form,
  currentOrgLabel,
  isPasswordModalOpen,
  avatarFileInputRef,
  avatarPreviewUrl,
  openPasswordModal,
  closePasswordModal,
  handleSubmitPasswordChange,
  onClickChangePhoto,
  onAvatarFileChange,
  handleLoadMyPage,
  handleInitializeMyPage,
  cleanupAvatarPreview,
} = useMyPageStore()

onMounted(() => {
  void handleInitializeMyPage()
})

onUnmounted(() => {
  cleanupAvatarPreview()
})
</script>
