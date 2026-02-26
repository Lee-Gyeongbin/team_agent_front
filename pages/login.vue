<template>
  <div class="login-page">
    <h1>로그인</h1>
    <div v-if="healthLoading" class="health-status">연결 확인 중...</div>
    <div v-else-if="healthError" class="health-status health-error">
      {{ healthError }}
    </div>
    <div v-else class="health-status">{{ healthData }}</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { get } = useApi()
const healthData = ref<string>('')
const healthLoading = ref(true)
const healthError = ref('')

onMounted(async () => {
  try {
    const data = await get<unknown>('/health.do')
    healthData.value =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  } catch (e) {
    healthError.value = e instanceof Error ? e.message : '연결에 실패했습니다'
  } finally {
    healthLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.login-page {
  padding: $spacing-xl;
}

.health-status {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $color-surface;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &.health-error {
    color: $color-error;
  }
}
</style>
