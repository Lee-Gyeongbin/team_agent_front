<template>
  <aside
    class="focus-nav"
    :class="{ 'is-collapsed': isCollapsed }"
    aria-label="제안서 작성 단계"
  >
    <div
      v-show="!isCollapsed"
      class="focus-nav-inner"
    >
      <button
        type="button"
        class="focus-exit"
        @click="emit('exit')"
      >
        <UiIcon
          name="arrow-left"
          :size="16"
        />
        나가기
      </button>
      <nav
        id="proposal-focus-steps"
        class="focus-steps"
        aria-label="단계 이동"
      >
        <button
          v-for="(step, index) in steps"
          :key="step.key"
          type="button"
          class="focus-step"
          :class="{ 'is-current': step.status === 'current', 'is-done': step.status === 'done' }"
          :disabled="index > maxUnlockedStep"
          :aria-current="step.status === 'current' ? 'step' : undefined"
          :title="`${index + 1}. ${step.label} — ${step.sub}`"
          @click="emit('go-step', index)"
        >
          <span class="focus-step-number"
            ><UiIcon
              v-if="step.status === 'done'"
              name="check"
              :size="12"
            /><template v-else>{{ index + 1 }}</template></span
          >
          <span class="focus-step-label">{{ labels[index] ?? step.label }}</span>
        </button>
      </nav>
      <div
        class="focus-progress"
        aria-live="polite"
      >
        <span class="focus-progress-caption">현재 단계</span>
        <strong
          >{{ currentStepNumber }} <span>/ {{ steps.length }} 단계</span></strong
        >
        <UiProgress
          :value="currentStepNumber"
          :max="Math.max(steps.length, 1)"
          size="sm"
          :show-value="false"
          aria-label="현재 작성 단계"
        />
      </div>
    </div>
    <button
      type="button"
      class="focus-nav-toggle"
      :aria-expanded="!isCollapsed"
      aria-controls="proposal-focus-steps"
      :aria-label="isCollapsed ? '단계 메뉴 펼치기' : '단계 메뉴 접기'"
      :title="isCollapsed ? '단계 메뉴 펼치기' : '단계 메뉴 접기'"
      @click="isCollapsed = !isCollapsed"
    >
      <UiIcon
        :name="isCollapsed ? 'chevron-right' : 'chevron-left'"
        :size="16"
      />
    </button>
  </aside>
</template>

<script setup lang="ts">
import { UiIcon, UiProgress } from '@leechanyong/ispark-ui'
import type { PtStep } from '~/types/proposal'
const props = defineProps<{ steps: PtStep[]; maxUnlockedStep: number }>()
const currentStepNumber = computed(() => props.steps.findIndex((step) => step.status === 'current') + 1)
const emit = defineEmits<{ 'go-step': [index: number]; exit: [] }>()
const isCollapsed = ref(false)
const labels = [
  '요구사항 평가',
  '자사·경쟁사',
  '전략검토',
  '세부목차',
  '템플릿 설정',
  '템플릿 생성',
  '본문 생성',
  '출력',
]
</script>

<style lang="scss" scoped>
.focus-nav {
  position: relative;
  width: 94px;
  flex: 0 0 94px;
  min-height: 0;
  background: #eaf0f7;
  border-right: 1px solid #ccd7e6;
  transition:
    width 0.18s,
    flex-basis 0.18s;
  z-index: 2;
}
.focus-nav.is-collapsed {
  width: 16px;
  flex-basis: 16px;
}
.focus-nav-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 12px 6px;
  box-sizing: border-box;
}
.focus-exit {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 8px 0;
  background: transparent;
  border: 0;
  color: #566780;
  font-size: 13px;
  cursor: pointer;
}
.focus-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding-bottom: 20px;
  flex-shrink: 0;
}
.focus-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 62px;
  width: 100%;
  padding: 8px 2px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #596a83;
  cursor: pointer;
  flex-shrink: 0;
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: calc(50% - 0.5px);
    height: 8px;
    width: 1px;
    background: #c5d1e2;
    pointer-events: none;
  }
  &.is-done::after {
    background: #91cdb7;
  }
}
.focus-step:disabled {
  cursor: not-allowed;
  color: #8491a4;
}
.focus-step:not(:disabled):hover {
  background: #dfe8f5;
}
.focus-step.is-current {
  background: #dce7ff;
  color: #315bda;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px #d1dfff;
  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #4065e7;
  }
}
.focus-step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid #cbd6e5;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 12px;
  background: #f7f9fc;
}
.is-current .focus-step-number {
  background: #4065e7;
  color: white;
  border-color: #4065e7;
}
.is-done .focus-step-number {
  background: #d7f1e6;
  color: #16845c;
  border-color: #d7f1e6;
}
.focus-step-label {
  font-size: 12px;
  line-height: 1.4;
  word-break: keep-all;
}
.focus-nav-toggle {
  position: absolute;
  right: -11px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #c7d2e3;
  border-radius: 6px;
  background: white;
  color: #5b6b85;
  box-shadow: 0 2px 5px #1b305515;
  cursor: pointer;
}
.focus-progress {
  margin-top: auto;
  padding: 14px 6px 8px;
  border-top: 1px solid #d3ddea;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  strong {
    font-size: 14px;
    color: #315bda;
  }
  strong span {
    font-size: 10px;
    color: #687a92;
    font-weight: 400;
  }
}
.focus-progress-caption {
  font-size: 10px;
  color: #687a92;
}
button:focus-visible {
  outline: 2px solid #4065e7;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .focus-nav {
    transition: none;
  }
}
</style>
