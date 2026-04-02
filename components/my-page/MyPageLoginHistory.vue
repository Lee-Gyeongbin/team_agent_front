<template>
  <section class="my-page-sub-tab">
    <UiLoading
      v-if="isLoading"
      overlay
      text="로그인 이력을 불러오는 중..."
    />

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

    <div
      v-else-if="!loginHistoryList.length"
      class="my-page-empty"
    >
      <p>로그인 이력이 없습니다.</p>
    </div>

    <UiTable
      v-else
      :columns="myPageLoginHistoryColumns"
      :data="loginHistoryList"
      empty-text="로그인 이력이 없습니다."
    />
  </section>
</template>

<script setup lang="ts">
import { myPageLoginHistoryColumns } from '~/types/my-page'

interface LoginHistoryItem {
  userId: string
  ipAddr: string
  userAgent: string
  result: string
  failRson: string
  createDt: string
}

const isLoading = ref(false)
const errorMessage = ref('')

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const loginHistoryList = ref<LoginHistoryItem[]>([
  {
    userId: 'ta_admin',
    ipAddr: '203.0.113.12',
    userAgent: 'Chrome 135',
    result: '성공',
    failRson: '-',
    createDt: '2026-04-02 09:13:18',
  },
  {
    userId: 'ta_admin',
    ipAddr: '203.0.113.12',
    userAgent: 'Edge 135',
    result: '성공',
    failRson: '-',
    createDt: '2026-04-01 18:42:07',
  },
  {
    userId: 'ta_admin',
    ipAddr: '198.51.100.22',
    userAgent: 'Chrome 134',
    result: '실패',
    failRson: '비밀번호 오류',
    createDt: '2026-03-30 08:22:55',
  },
])

const onReload = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await new Promise((resolve) => setTimeout(resolve, 200))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '로그인 이력을 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  onReload()
})
</script>

<style lang="scss" scoped></style>
