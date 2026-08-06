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
  resolveMarketingPreparingCallout,
  resolveMarketingPreparingStatusTexts,
  resolveMarketingPreparingTitle,
  type MarketingPreparingMode,
  type MarketingPreparingPhase,
} from '~/utils/chat/marketingAuthoringUtil'

const props = withDefaults(
  defineProps<{
    mode?: MarketingPreparingMode
    phase?: MarketingPreparingPhase
    active?: boolean
    bordered?: boolean
  }>(),
  {
    mode: 'TEXT',
    phase: 'TEXT',
    active: true,
    bordered: true,
  },
)

const title = computed(() => resolveMarketingPreparingTitle(props.mode, props.phase))
const callout = computed(() => resolveMarketingPreparingCallout(props.mode, props.phase))

const {
  text: statusText,
  start,
  stop,
} = createMarketingPreparingStatusCycle(() => resolveMarketingPreparingStatusTexts(props.mode, props.phase))

watch(
  () => [props.active, props.mode, props.phase] as const,
  ([active]) => {
    if (active) start()
    else stop()
  },
  { immediate: true },
)

onUnmounted(stop)
</script>
