<template>
  <div
    v-if="isOpen"
    class="chart-y-modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="chart-y-modal">
      <div class="chart-y-modal-header">
        <span class="chart-y-modal-title">Y축 설정</span>
      </div>
      <div class="chart-y-modal-body">
        <!-- YL (왼쪽 Y축) -->
        <div class="chart-y-modal-row">
          <span class="chart-y-dot is-yl">●</span>
          <span class="chart-y-modal-label">YL (왼쪽 Y축)</span>
          <div class="chart-y-modal-select">
            <UiSelect
              v-model="tempYL"
              :options="options"
              placeholder="YL 선택"
              size="sm"
            />
          </div>
          <div class="chart-y-type-toggle">
            <button
              type="button"
              class="chart-y-type-btn"
              :class="{ 'is-active': tempYLType === 'bar' }"
              title="막대 차트"
              @click="tempYLType = 'bar'"
            >
              <i class="icon-bar-chart size-16"></i>
            </button>
            <button
              type="button"
              class="chart-y-type-btn"
              :class="{ 'is-active': tempYLType === 'line' }"
              title="라인 차트"
              @click="tempYLType = 'line'"
            >
              <i class="icon-line-chart size-16"></i>
            </button>
          </div>
        </div>
        <!-- YR (오른쪽 Y축) -->
        <div class="chart-y-modal-row">
          <span class="chart-y-dot is-yr">●</span>
          <span class="chart-y-modal-label">YR (오른쪽 Y축)</span>
          <div class="chart-y-modal-select">
            <UiSelect
              v-model="tempYR"
              :options="options"
              placeholder="YR 선택"
              size="sm"
            />
          </div>
          <div class="chart-y-type-toggle">
            <button
              type="button"
              class="chart-y-type-btn"
              :class="{ 'is-active': tempYRType === 'bar' }"
              title="막대 차트"
              @click="tempYRType = 'bar'"
            >
              <i class="icon-bar-chart size-16"></i>
            </button>
            <button
              type="button"
              class="chart-y-type-btn"
              :class="{ 'is-active': tempYRType === 'line' }"
              title="라인 차트"
              @click="tempYRType = 'line'"
            >
              <i class="icon-line-chart size-16"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="chart-y-modal-footer">
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :disabled="!canApply"
          @click="onApply"
        >
          적용
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
}

interface YAxisModalValue {
  yl: string
  yr: string
  ylChartType: 'bar' | 'line'
  yrChartType: 'bar' | 'line'
}

interface Props {
  isOpen: boolean
  options: SelectOption[]
  initialYL?: string
  initialYR?: string
  initialYLType?: 'bar' | 'line'
  initialYRType?: 'bar' | 'line'
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  options: () => [],
  initialYL: '',
  initialYR: '',
  initialYLType: 'bar',
  initialYRType: 'line',
})

const emit = defineEmits<{
  close: []
  apply: [value: YAxisModalValue]
}>()

const tempYL = ref(props.initialYL)
const tempYR = ref(props.initialYR)
const tempYLType = ref<'bar' | 'line'>(props.initialYLType)
const tempYRType = ref<'bar' | 'line'>(props.initialYRType)

const canApply = computed(() => !!tempYL.value && !!tempYR.value)

// 모달 열릴 때 초기값 동기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      tempYL.value = props.initialYL
      tempYR.value = props.initialYR
      tempYLType.value = props.initialYLType
      tempYRType.value = props.initialYRType
    }
  },
)

const onApply = () => {
  if (!canApply.value) return
  emit('apply', { yl: tempYL.value, yr: tempYR.value, ylChartType: tempYLType.value, yrChartType: tempYRType.value })
}
</script>
