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

const { loginHistoryList, loginHistoryLoading, loginHistoryError } = useMyPageStore()
</script>
