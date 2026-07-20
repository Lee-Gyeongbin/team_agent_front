<template>
  <div class="pt-stepbar">
    <button
      v-for="(step, idx) in steps"
      :key="step.key"
      :class="[
        'pt-stepbar-item',
        {
          'is-done': step.status === 'done',
          'is-current': step.status === 'current',
          'is-locked': idx > maxUnlockedStep,
        },
      ]"
      :disabled="idx > maxUnlockedStep"
      @click="onClickStep(idx)"
    >
      <span class="pt-stepbar-num">
        <i
          v-if="step.status === 'done'"
          class="icon-check size-12"
        />
        <span v-else>{{ idx + 1 }}</span>
      </span>
      <span class="pt-stepbar-text">
        <b>{{ idx + 1 }}. {{ step.label }}</b>
        <small>{{ step.sub }}</small>
      </span>
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

const emit = defineEmits<{
  'go-step': [idx: number]
}>()

const onClickStep = (idx: number) => {
  if (idx > props.maxUnlockedStep) return
  emit('go-step', idx)
}
</script>
