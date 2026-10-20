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

const { pagePhase, currentContent, contentEditLock, isCurrentApprover, moveMarketingContentStep } = useMarketingStore()

/** 콘텐츠 상태로 도달한 단계까지만 이동할 수 있다 — 검수는 생성 완료, 승인은 검수 통과, 발행 설정은 승인 완료 이후 */
const STEPS: {
  phase: MarketingPagePhase
  label: string
  reachable: (statusCd: string, aiStatusCd: string) => boolean
}[] = [
  { phase: 'channelContent', label: '콘텐츠 작성', reachable: () => true },
  { phase: 'review', label: 'AI 검수', reachable: (_statusCd, aiStatusCd) => aiStatusCd === '003' },
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
    // 승인 진행 중 잠금이면 AI 검수 단계로 이동하지 않는다. 승인 완료 이후(APPROVED)는 검수 결과 보기로 들어갈 수 있다.
    // 승인 진행 중 지정 승인자는 승인·반려만 하므로 콘텐츠 작성·AI 검수로 이동하지 않는다
    canMove:
      !!currentContent.value &&
      step.reachable(statusCd, aiStatusCd) &&
      !(step.phase === 'review' && contentEditLock.value === 'APPROVAL') &&
      !(statusCd === '003' && isCurrentApprover.value && (step.phase === 'channelContent' || step.phase === 'review')),
  }))
})
</script>
