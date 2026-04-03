<template>
  <section class="my-page-sub-tab">
    <div class="my-page-sub-tab__scroll">
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
        v-else-if="!list.length"
        class="my-page-empty"
      >
        <p>로그인 이력이 없습니다.</p>
      </div>

      <UiTable
        v-else
        :columns="myPageColumns"
        :data="list"
        empty-text="로그인 이력이 없습니다."
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { myPageColumns, type MyPageLoginHistoryItem } from '~/types/my-page'

defineProps<{
  list: MyPageLoginHistoryItem[]
  isLoading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  reload: []
}>()

const onReload = () => {
  emit('reload')
}
</script>
