import type { MaybeRefOrGetter, Ref } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

export type MarketingWizardStepMeta = {
  key: string
  title: string
  question: string
  description?: string
  navHint?: string
}

export const useMarketingWizardSteps = (options: {
  /** 고정 숫자 또는 outputs에 따라 변하는 getter */
  stepCount: MaybeRefOrGetter<number>
  isStepFilled: (stepIndex: number) => boolean
  onPrevAtFirst?: () => void
  bodyRef?: Ref<HTMLElement | null>
}) => {
  const currentStep = ref(0)
  const maxReachedStep = ref(0)
  const isSummaryEditMode = ref(false)

  const resolvedStepCount = computed(() => {
    const raw = Number(toValue(options.stepCount))
    if (!Number.isFinite(raw) || raw < 1) return 1
    return Math.floor(raw)
  })

  const isLastStep = computed(() => currentStep.value >= resolvedStepCount.value - 1)

  const canNavigateToStep = (index: number) => options.isStepFilled(index) || index <= maxReachedStep.value

  const scrollBodyTop = async () => {
    await nextTick()
    options.bodyRef?.value?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clampStepToCount = () => {
    const last = Math.max(0, resolvedStepCount.value - 1)
    if (currentStep.value > last) currentStep.value = last
    if (maxReachedStep.value > last) maxReachedStep.value = last
  }

  watch(resolvedStepCount, () => {
    clampStepToCount()
  })

  const onEditSummary = () => {
    isSummaryEditMode.value = !isSummaryEditMode.value
  }

  const onJumpToSummaryStep = (stepIndex: number) => {
    if (!isSummaryEditMode.value) return
    if (!canNavigateToStep(stepIndex)) return
    isSummaryEditMode.value = false
    currentStep.value = stepIndex
  }

  const onSelectStep = (index: number) => {
    if (!canNavigateToStep(index)) return
    if (index !== resolvedStepCount.value - 1) isSummaryEditMode.value = false
    currentStep.value = index
  }

  const onDetailPrev = () => {
    if (currentStep.value === 0) {
      options.onPrevAtFirst?.()
      return
    }
    isSummaryEditMode.value = false
    currentStep.value -= 1
  }

  const advanceAfterValidate = async () => {
    if (isLastStep.value) return false
    isSummaryEditMode.value = false
    currentStep.value += 1
    maxReachedStep.value = Math.max(maxReachedStep.value, currentStep.value)
    await scrollBodyTop()
    return true
  }

  const resetWizard = () => {
    currentStep.value = 0
    maxReachedStep.value = 0
    isSummaryEditMode.value = false
  }

  return {
    currentStep,
    maxReachedStep,
    isSummaryEditMode,
    isLastStep,
    resolvedStepCount,
    canNavigateToStep,
    onEditSummary,
    onJumpToSummaryStep,
    onSelectStep,
    onDetailPrev,
    advanceAfterValidate,
    resetWizard,
    scrollBodyTop,
    clampStepToCount,
  }
}
