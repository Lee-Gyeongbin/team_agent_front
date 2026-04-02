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
          @click="onReload"
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
          <!-- 좌측: 현재 내 정보 요약 -->
          <section class="my-page-left">
            <div class="my-page-profile">
              <div class="my-page-avatar">
                <div class="my-page-avatar-icon">
                  <i class="icon-user size-32" />
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
                @click="handleOpenPasswordModal"
              >
                비밀번호 변경
              </UiButton>
            </div>
          </section>

          <!-- 우측: 확인 / 수정 폼 -->
          <section class="my-page-right">
            <h2 class="my-page-view-title">내 계정 정보</h2>
            <table class="my-page-table">
              <tbody>
                <tr class="my-page-row-double">
                  <th scope="row">아이디<span class="my-page-required">*</span></th>
                  <td>
                    <template v-if="isEditMode">
                      <UiInput
                        v-model="form.userId"
                        size="sm"
                        disabled
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ form.userId || '-' }}</span>
                    </template>
                  </td>
                  <th scope="row">성명<span class="my-page-required">*</span></th>
                  <td>
                    <template v-if="isEditMode">
                      <UiInput
                        v-model="form.userNm"
                        placeholder="성명을 입력하세요."
                        size="sm"
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ form.userNm || '-' }}</span>
                    </template>
                  </td>
                </tr>
                <tr class="my-page-row-double">
                  <th scope="row">조직</th>
                  <td>
                    <template v-if="isEditMode">
                      <UiSelect
                        v-model="form.orgId"
                        :options="orgOptions"
                        placeholder="조직 선택"
                        size="sm"
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ currentOrgLabel || '-' }}</span>
                    </template>
                  </td>
                  <th scope="row">계정 상태</th>
                  <td>
                    <span
                      v-if="acctStatusLabel"
                      class="my-page-status"
                      :class="acctStatusClass"
                    >
                      {{ acctStatusLabel }}
                    </span>
                    <span
                      v-else
                      class="my-page-field-text"
                    >
                      -
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">이메일<span class="my-page-required">*</span></th>
                  <td colspan="3">
                    <template v-if="isEditMode">
                      <UiInput
                        v-model="form.email"
                        placeholder="이메일을 입력하세요."
                        size="sm"
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ form.email || '-' }}</span>
                    </template>
                  </td>
                </tr>
                <tr>
                  <th scope="row">전화번호<span class="my-page-required">*</span></th>
                  <td colspan="3">
                    <template v-if="isEditMode">
                      <UiInput
                        v-model="phoneDisplay"
                        placeholder="'-' 없이 숫자만 입력하세요."
                        size="sm"
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ phoneDisplay || '-' }}</span>
                    </template>
                  </td>
                </tr>
                <tr>
                  <th scope="row">마지막 로그인 일시</th>
                  <td colspan="3">
                    <template v-if="isEditMode">
                      <UiInput
                        :model-value="form.lastLoginDt || ''"
                        size="sm"
                        disabled
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ form.lastLoginDt || '-' }}</span>
                    </template>
                  </td>
                </tr>
                <tr>
                  <th scope="row">비밀번호 변경 일시</th>
                  <td colspan="3">
                    <template v-if="isEditMode">
                      <UiInput
                        :model-value="form.pwdChgDt || ''"
                        size="sm"
                        disabled
                      />
                    </template>
                    <template v-else>
                      <span class="my-page-field-text">{{ form.pwdChgDt || '-' }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="my-page-actions">
              <template v-if="isEditMode">
                <UiButton
                  variant="primary"
                  size="md"
                  :disabled="!checkSave"
                  @click="handleSaveMyPage"
                >
                  저장
                </UiButton>
                <UiButton
                  variant="outline"
                  size="md"
                  @click="handleCancelEdit"
                >
                  취소
                </UiButton>
              </template>
              <template v-else>
                <UiButton
                  variant="primary"
                  size="md"
                  @click="handleStartEdit"
                >
                  정보 수정
                </UiButton>
              </template>
            </div>

            <MyPagePasswordChangeModal
              :is-open="isPasswordModalOpen"
              :user-id="String(form.userId ?? '')"
              @close="handleClosePasswordModal"
              @submit="handleSubmitPasswordChange"
            />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MyPagePasswordChangeModal from '~/components/my-page/MyPagePasswordChangeModal.vue'
import { openToast } from '~/composables/useToast'
import { useUserManageStore } from '~/composables/user-manage/useUserManageStore'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import { useMyPageStore } from '~/composables/my-page/useMyPageStore'

definePageMeta({ layout: 'default' })

const { formatPhone, toPhoneDigits } = useUserManageStore()
const { orgOptions, handleFetchOrgList } = useOrgManageStore()
const {
  isLoading,
  errorMessage,
  hasData,
  form,
  isEditMode,
  isPasswordModalOpen,
  checkSave,
  handleLoadMyPage,
  handleReloadMyPage,
  handleStartEdit,
  handleCancelEdit,
  handleOpenPasswordModal,
  handleClosePasswordModal,
  handleSaveMyPage,
  handleSubmitPasswordChange,
} = useMyPageStore()

const phoneDisplay = computed({
  get: () => formatPhone(form.value.phone ?? ''),
  set: (value: string) => {
    const digits = toPhoneDigits(value)
    form.value.phone = digits
  },
})

const currentOrgLabel = computed(() => {
  if (!form.value.orgId) return ''
  const found = orgOptions.value?.find((opt) => opt.value === form.value.orgId)
  return found?.label ?? ''
})

const acctStatusLabel = computed(() => form.value.acctStatusDesc?.trim() || '')

const acctStatusClass = computed(() => {
  const label = acctStatusLabel.value
  if (label === '잠금') return 'is-lock'
  if (label === '비활성') return 'is-inactive'
  return 'is-active'
})

const onClickChangePhoto = () => {
  openToast({
    message: 'to-do : 개발진행예정입니다.',
    type: 'info',
  })
}

const onReload = () => {
  handleReloadMyPage()
}

onMounted(async () => {
  await handleFetchOrgList()
  await handleLoadMyPage()
})
</script>
