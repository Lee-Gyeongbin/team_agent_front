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
      <i class="icon-sparkle size-24 marketing-preparing-status__ring-icon" />
    </div>
    <p class="marketing-preparing-status__title">{{ title }}</p>
    <p class="marketing-preparing-status__desc">{{ statusText }}</p>
    <div class="marketing-preparing-status__callout">
      <p>{{ callout }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createMarketingPreparingStatusCycle,
  MARKETING_PREPARING_CALLOUT,
  MARKETING_PREPARING_TITLE,
  resolveMarketingGeneratingStepText,
  type MarketingGeneratingStep,
  type MarketingPreparingMode,
} from '~/utils/marketing/marketingUtil'

const props = withDefaults(
  defineProps<{
    mode?: MarketingPreparingMode
    generatingStep?: MarketingGeneratingStep
    active?: boolean
    bordered?: boolean
  }>(),
  {
    mode: 'TEXT',
    generatingStep: '',
    active: true,
    bordered: true,
  },
)

const title = MARKETING_PREPARING_TITLE
const callout = MARKETING_PREPARING_CALLOUT
const stepText = computed(() => resolveMarketingGeneratingStepText(props.generatingStep))

const { text: cycleText, start, stop } = createMarketingPreparingStatusCycle()

const statusText = computed(() => stepText.value || cycleText.value)

watch(
  () => [props.active, props.mode, props.generatingStep] as const,
  ([active]) => {
    if (active) start()
    else stop()
  },
  { immediate: true },
)

onUnmounted(stop)
</script>
