<template>
  <div
    class="marketing-preparing-status"
    :class="{ 'is-bordered': bordered }"
    role="status"
    aria-live="polite"
  >
    <div
      class="marketing-preparing-status__ring"
      aria-hidden="true"
    >
      <span class="marketing-preparing-status__ring-track" />
      <span class="marketing-preparing-status__ring-arc" />
      <UiIcon
        name="sparkle"
        size="24"
        class="marketing-preparing-status__ring-icon"
      />
    </div>
    <p class="marketing-preparing-status__title">{{ title }}</p>
    <p class="marketing-preparing-status__desc">{{ statusText }}</p>
    <div class="marketing-preparing-status__callout">
      <p>{{ callout }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
import {
  createMarketingPreparingStatusCycle,
  MARKETING_PREPARING_CALLOUT,
  MARKETING_PREPARING_TITLE,
  resolveMarketingGeneratingStepText,
} from '~/utils/marketing/marketingUtil'
import type { MarketingGeneratingStep } from '~/types/marketing'

const props = withDefaults(
  defineProps<{
    generatingStep?: MarketingGeneratingStep
    active?: boolean
    bordered?: boolean
  }>(),
  {
    generatingStep: '',
    active: true,
    bordered: true,
  },
)

const title = MARKETING_PREPARING_TITLE
const callout = MARKETING_PREPARING_CALLOUT

const { text: cycleText, start, stop } = createMarketingPreparingStatusCycle()

/** 서버 진행 단계가 오면 그 문구를, 아니면 순환 안내 문구를 보여준다 */
const statusText = computed(() => resolveMarketingGeneratingStepText(props.generatingStep) || cycleText.value)

watch(
  () => props.active,
  (active) => {
    if (active) start()
    else stop()
  },
  { immediate: true },
)

onUnmounted(stop)
</script>
