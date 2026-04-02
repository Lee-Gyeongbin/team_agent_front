<template>
  <section class="my-page-sub-tab my-page-security-tab">
    <div class="my-page-security-table-wrap">
      <table class="my-page-table">
        <tbody>
          <tr>
            <th scope="row">2단계 인증</th>
            <td>
              <div class="my-page-security-auth-wrap">
                <div class="my-page-security-auth-head">
                  <UiToggle v-model="isTwoFactorEnabled" />
                  <span class="my-page-field-text">{{ isTwoFactorEnabled ? '사용' : '미사용' }}</span>
                </div>
                <div class="my-page-security-auth-options">
                  <label
                    v-for="item in twoFactorOptions"
                    :key="item.value"
                    class="my-page-security-auth-option"
                    :class="{ 'is-disabled': !isTwoFactorEnabled }"
                  >
                    <input
                      v-model="selectedTwoFactorMethod"
                      type="radio"
                      class="my-page-security-auth-radio"
                      :value="item.value"
                      :disabled="!isTwoFactorEnabled"
                    />
                    <span>{{ item.label }}</span>
                  </label>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th scope="row">연동 기종 확인</th>
            <td>
              <ul class="my-page-security-device-list">
                <li
                  v-for="device in linkedDevices"
                  :key="device.id"
                  class="my-page-security-device-item"
                >
                  <span class="my-page-security-device-name">{{ device.name }}</span>
                  <span class="my-page-security-device-meta">{{ device.lastLogin }}</span>
                </li>
              </ul>
            </td>
          </tr>
          <tr>
            <th scope="row">로그아웃</th>
            <td>
              <UiButton
                variant="outline"
                size="sm"
                @click="onClickLogoutAll"
              >
                모든 장치에서 로그아웃
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-page-actions my-page-security-actions">
      <UiButton
        variant="primary"
        size="md"
        @click="onClickSaveSecurity"
      >
        저장
      </UiButton>
    </div>
  </section>
</template>

<script setup lang="ts">
type TwoFactorMethod = 'totp' | 'sms' | 'email'

const isTwoFactorEnabled = ref(false)
const selectedTwoFactorMethod = ref<TwoFactorMethod>('totp')

const twoFactorOptions: { label: string; value: TwoFactorMethod }[] = [
  { label: 'TOTP', value: 'totp' },
  { label: 'SMS', value: 'sms' },
  { label: 'EMAIL', value: 'email' },
]

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const linkedDevices = ref([
  { id: 'pc-1', name: 'Windows Chrome', lastLogin: '최근 접속: 2026-04-02 09:13' },
  { id: 'mb-1', name: 'Android App', lastLogin: '최근 접속: 2026-04-01 22:40' },
  { id: 'tb-1', name: 'iPad Safari', lastLogin: '최근 접속: 2026-03-31 11:02' },
])

watch(isTwoFactorEnabled, (enabled) => {
  if (!enabled) return
  if (!selectedTwoFactorMethod.value) {
    selectedTwoFactorMethod.value = 'totp'
  }
})

const onClickLogoutAll = async () => {
  const confirmed = await openConfirm({
    title: '전체 로그아웃',
    message: '현재 계정의 모든 기기에서 로그아웃하시겠습니까?',
  })
  if (!confirmed) return

  openToast({
    message: '전체 로그아웃 요청이 처리되었습니다.',
    type: 'success',
  })
}

const onClickSaveSecurity = async () => {
  // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
  const confirmed = await openConfirm({
    title: '보안 설정 저장',
    message: '보안 설정을 저장하시겠습니까?',
  })
  if (!confirmed) return

  openToast({
    message: '보안 설정이 저장되었습니다.',
    type: 'success',
  })
}
</script>
