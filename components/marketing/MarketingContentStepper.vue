<template>
  <nav
    class="marketing-content-stepper"
    aria-label="콘텐츠 작성 단계"
  >
    <template
      v-for="(step, index) in steps"
      :key="step.phase"
    >
      <button
        type="button"
        class="marketing-content-stepper__step"
        :class="{ 'is-active': step.isActive, 'is-done': step.isDone }"
        :disabled="!step.canMove || step.isActive"
        :aria-current="step.isActive ? 'step' : undefined"
        @click="moveMarketingContentStep(step.phase)"
      >
        <span class="marketing-content-stepper__num">{{ index + 1 }}</span>
        {{ step.label }}
      </button>
      <span
        v-if="index < steps.length - 1"
        class="marketing-content-stepper__line"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingPagePhase } from '~/types/marketing'

const { pagePhase, currentContent, isCurrentApprover, moveMarketingContentStep } = useMarketingStore()

/** 콘텐츠 상태로 도달한 단계까지만 이동할 수 있다 — 검수는 생성 완료, 승인은 검수 통과, 발행 설정은 승인 완료 이후 */
const STEPS: {
  phase: MarketingPagePhase
  label: string
  reachable: (statusCd: string, aiStatusCd: string) => boolean
}[] = [
  { phase: 'channelContent', label: '콘텐츠 작성', reachable: () => true },
  {
    phase: 'review',
    label: 'AI 검수',
    reachable: (statusCd, aiStatusCd) => ['001', '002'].includes(statusCd) && aiStatusCd === '003',
  },
  { phase: 'approval', label: '승인', reachable: (statusCd) => ['003', '004', '005', '006', '007'].includes(statusCd) },
  { phase: 'schedule', label: '발행 설정', reachable: (statusCd) => ['004', '005', '006', '007'].includes(statusCd) },
]

const steps = computed(() => {
  const statusCd = currentContent.value?.statusCd ?? ''
  const aiStatusCd = currentContent.value?.aiStatusCd ?? ''
  const activeIndex = STEPS.findIndex((step) => step.phase === pagePhase.value)
  return STEPS.map((step, index) => ({
    ...step,
    isActive: index === activeIndex,
    isDone: index < activeIndex,
    // 승인 진입 후에는 역할과 관계없이 AI 검수로 돌아갈 수 없다. 지정 승인자는 작성 단계도 열 수 없다.
    canMove:
      !!currentContent.value &&
      step.reachable(statusCd, aiStatusCd) &&
      !(statusCd === '003' && isCurrentApprover.value && step.phase === 'channelContent'),
  }))
})
</script>
