<template>
  <div
    class="pt-stepbar"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <!-- 접힌 상태: 현재 단계 요약 -->
    <div
      v-if="isCollapsed"
      class="pt-stepbar-summary"
    >
      <template v-if="currentStep">
        <span
          class="pt-stepbar-icon"
          style="background: var(--color-primary); color: #fff"
        >
          <span>{{ currentStepIdx + 1 }}</span>
        </span>
        <span class="pt-stepbar-summary-label">{{ currentStepIdx + 1 }}. {{ currentStep.label }}</span>
        <span class="pt-stepbar-summary-status">{{ statusLabel(currentStep.status) }}</span>
      </template>
    </div>

    <!-- 펼친 상태: 전체 단계 목록 -->
    <template v-else>
      <template
        v-for="(step, idx) in steps"
        :key="step.key"
      >
        <button
          class="pt-stepbar-item"
          :class="{
            'is-current': step.status === 'current',
            'is-done': step.status === 'done',
            'is-locked': idx > maxUnlockedStep,
          }"
          :disabled="idx > maxUnlockedStep"
          @click="onClickStep(idx)"
        >
          <span
            class="pt-stepbar-icon"
            :class="{ 'is-done': step.status === 'done', 'is-current': step.status === 'current' }"
          >
            <i
              v-if="step.status === 'done'"
              class="icon-check size-14"
            />
            <span v-else>{{ idx + 1 }}</span>
          </span>
          <div class="pt-stepbar-text">
            <span class="pt-stepbar-label">{{ idx + 1 }}. {{ step.label }}</span>
            <span class="pt-stepbar-sub">{{ step.sub }}</span>
          </div>
        </button>
        <span
          v-if="idx < steps.length - 1"
          class="pt-stepbar-arrow"
        >
          <i class="icon-arrow-right size-16" />
        </span>
      </template>
    </template>

    <!-- 접기/펼치기 버튼 -->
    <button
      type="button"
      class="pt-stepbar-toggle"
      :title="isCollapsed ? '펼치기' : '접기'"
      @click="isCollapsed = !isCollapsed"
    >
      <i
        class="icon-arrow-down-gray size-16 pt-stepbar-toggle-icon"
        :class="{ 'is-collapsed': isCollapsed }"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PtStep } from '~/types/proposal'

interface Props {
  steps: PtStep[]
  maxUnlockedStep: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'go-step': [idx: number] }>()

const isCollapsed = ref(false)

const currentStep = computed(() => props.steps.find((s) => s.status === 'current') ?? null)
const currentStepIdx = computed(() => props.steps.findIndex((s) => s.status === 'current'))

const statusLabel = (status: string) => {
  if (status === 'current') return '진행 중'
  if (status === 'done') return '완료'
  return '대기'
}

const onClickStep = (idx: number) => {
  if (idx > props.maxUnlockedStep) return
  emit('go-step', idx)
}
</script>
