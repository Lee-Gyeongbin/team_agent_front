<template>
  <main class="app-error-page">
    <div class="app-error">
      <div
        class="app-error__icon-wrap"
        aria-hidden="true"
      >
        <i class="icon-warning-triangle size-48" />
      </div>

      <h1 class="app-error__title">{{ title }}</h1>
      <p class="app-error__desc">{{ description }}</p>

      <div class="app-error__actions">
        <UiButton
          variant="primary"
          size="xlg"
          full-width
          @click="onGoBack"
        >
          돌아가기
        </UiButton>

        <UiButton
          variant="outline"
          size="xlg"
          full-width
          @click="onSecondaryAction"
        >
          {{ secondaryActionLabel }}
        </UiButton>
      </div>

      <div class="app-error__footer">
        <p class="app-error__help">
          <i
            class="icon-info size-16"
            aria-hidden="true"
          />
          <span>오류가 계속되면 관리자에게 문의해 주세요.</span>
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { initTheme } = useTheme()
onMounted(() => initTheme())

const statusCode = computed(() => Number(props.error?.statusCode) || 0)
const isServiceUnavailable = computed(() => [502, 503, 504].includes(statusCode.value))
const isNotFound = computed(() => statusCode.value === 404)

const title = computed(() => {
  if (isServiceUnavailable.value) return '서비스를 일시적으로 이용할 수 없습니다'
  if (isNotFound.value) return '요청하신 페이지를 찾을 수 없습니다'
  return '페이지를 표시할 수 없습니다'
})

const description = computed(() => {
  if (isServiceUnavailable.value) {
    return '시스템 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (isNotFound.value) {
    return '주소가 잘못되었거나 삭제된 페이지입니다. 주소를 다시 확인해 주세요.'
  }
  return '일시적인 오류로 페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
})

const secondaryActionLabel = computed(() => (isServiceUnavailable.value ? '로그인 페이지로 이동' : '홈으로 이동'))
const fallbackPath = computed(() => (isServiceUnavailable.value ? '/login' : '/chat'))

const getPreviousPath = (): string | null => {
  if (!import.meta.client) return null

  const previousPath = window.history.state?.back
  return typeof previousPath === 'string' && previousPath.startsWith('/') ? previousPath : null
}

const onGoBack = () => {
  void clearError({ redirect: getPreviousPath() ?? fallbackPath.value })
}

const onSecondaryAction = () => {
  void clearError({ redirect: fallbackPath.value })
}
</script>

<style lang="scss" scoped>
.app-error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $spacing-xl $spacing-lg;
  background: $color-background;
}

.app-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  text-align: center;
}

.app-error__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: $spacing-xl;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.app-error__title {
  margin: 0 0 $spacing-sm;
  @include typo($body-2xlarge-bold, $color-text-heading);
  letter-spacing: -0.02em;
}

.app-error__desc {
  margin: 0 0 32px;
  width: 100%;
  @include typo($body-large, $color-text-secondary);
}

.app-error__actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  width: 100%;
  max-width: 280px;
  margin-bottom: 40px;
}

.app-error__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  padding-top: $spacing-lg;
  border-top: 1px solid $color-border;
}

.app-error__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  @include typo($body-small, $color-text-secondary);
  line-height: 1.5;
}
</style>
