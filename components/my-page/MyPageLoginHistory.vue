<template>
  <section class="my-page-sub-tab">
    <div class="my-page-sub-tab__scroll">
      <UiLoading
        v-if="loginHistoryLoading"
        overlay
        text="로그인 이력을 불러오는 중..."
      />

      <div
        v-else-if="loginHistoryError"
        class="my-page-error"
      >
        <p class="my-page-error__message">{{ loginHistoryError }}</p>
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
        :columns="myPageColumns"
        :data="loginHistoryList"
        empty-text="로그인 이력이 없습니다."
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { myPageColumns } from '~/types/my-page'

/** v-if로 탭 진입 시에만 마운트되므로, 마운트 시점에 로그인 이력 조회 */
const { loginHistoryList, loginHistoryLoading, loginHistoryError, handleLoadLoginHistory } = useMyPageStore()

onMounted(() => {
  void handleLoadLoginHistory()
})

const onReload = () => {
  void handleLoadLoginHistory()
}
</script>
