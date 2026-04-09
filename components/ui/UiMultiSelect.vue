<template>
  <div class="ui-multi-select-wrap">
    <PopoverRoot v-model:open="isOpen">
      <PopoverTrigger as-child>
        <!-- as-child → Radix가 data-state="open|closed" 주입 -->
        <button
          type="button"
          class="ui-multi-select-trigger"
          :class="[`size-${size}`, `radius-${radius}`, { 'is-disabled': disabled }]"
          :disabled="disabled"
          :aria-label="triggerLabel"
        >
          <span
            class="ui-multi-select-value"
            :class="{ 'is-placeholder': !modelValue.length }"
          >
            {{ triggerLabel }}
          </span>
          <span
            class="ui-multi-select-icon"
            :class="{ 'is-open': isOpen }"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          class="ui-multi-select-content"
          side="bottom"
          :side-offset="4"
          align="start"
        >
          <div
            v-for="opt in options"
            :key="opt.value"
            class="ui-multi-select-item"
            :class="{ 'is-checked': isSelected(opt.value) }"
            tabindex="0"
            role="option"
            :aria-selected="isSelected(opt.value)"
            @click="toggleOption(opt.value)"
            @keydown.enter.prevent="toggleOption(opt.value)"
            @keydown.space.prevent="toggleOption(opt.value)"
          >
            <span class="ui-multi-select-checkbox-box">
              <svg
                v-if="isSelected(opt.value)"
                class="ui-multi-select-checkbox-icon"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="ui-multi-select-item-label">{{ opt.label }}</span>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue'

export interface MultiSelectOption {
  label: string
  value: string | number
}

interface Props {
  modelValue?: Array<string | number>
  options: MultiSelectOption[]
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xlg'
  radius?: 'sm' | 'base' | 'lg'
  /** 3개 이상 선택 시 "첫번째 외 N건" 축약 표시 기준 (기본 2개 초과부터) */
  maxLabels?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: '',
  disabled: false,
  name: undefined,
  id: undefined,
  size: 'md',
  radius: 'base',
  maxLabels: 2,
})

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number>]
}>()

const isOpen = ref(false)

const isSelected = (value: string | number) => props.modelValue.some((v) => String(v) === String(value))

const toggleOption = (value: string | number) => {
  const next = isSelected(value)
    ? props.modelValue.filter((v) => String(v) !== String(value))
    : [...props.modelValue, value]
  emit('update:modelValue', next)
}

const selectedLabels = computed(() =>
  props.modelValue.map((v) => props.options.find((o) => String(o.value) === String(v))?.label ?? String(v)),
)

const triggerLabel = computed(() => {
  const labels = selectedLabels.value
  if (!labels.length) return props.placeholder || '선택'
  if (labels.length <= props.maxLabels) return labels.join(', ')
  return `${labels[0]} 외 ${labels.length - 1}건`
})
</script>

<!-- 트리거: scoped -->
<style lang="scss" scoped>
.ui-multi-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
  padding: 0 10px;
  gap: 4px;

  font-weight: $font-weight-medium;
  color: #333;

  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;

  &.radius-sm {
    border-radius: $border-radius-sm;
  }
  &.radius-base {
    border-radius: $border-radius-base;
  }
  &.radius-lg {
    border-radius: $border-radius-lg;
  }

  cursor: pointer;
  outline: none;
  transition: border-color $transition-base;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus,
  &[data-state='open'] {
    border-color: var(--color-primary);
  }

  &.size-xs {
    height: $height-xs;
    font-size: $font-size-sm;
  }
  &.size-sm {
    height: $height-sm;
    font-size: $font-size-base;
  }
  &.size-md {
    height: $height-md;
    font-size: $font-size-base;
  }
  &.size-lg {
    height: $height-lg;
    font-size: $font-size-base;
  }
  &.size-xlg {
    height: $height-xlg;
    font-size: $font-size-lg;
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-multi-select-value {
  @include ellipsis(1);
  min-width: 0;

  &.is-placeholder {
    color: #94a3b8;
    font-weight: $font-weight-normal;
  }
}

.ui-multi-select-icon {
  flex-shrink: 0;
  color: rgba(92, 102, 119, 1);
  transition: transform $transition-base;

  &.is-open {
    transform: rotate(180deg);
  }
}
</style>

<!-- 드롭다운(Portal): 글로벌 -->
<style lang="scss">
.ui-multi-select-content {
  min-width: var(--radix-popover-trigger-width);
  max-height: 240px;
  overflow-y: auto;

  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-shadow: $shadow-md;
  padding: $spacing-xs 0;
  z-index: $z-modal;
}

.ui-multi-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-base;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;
  transition: background-color $transition-fast;
  user-select: none;

  &:hover,
  &:focus {
    background: $color-background;
  }

  &.is-checked {
    .ui-multi-select-item-label {
      color: var(--color-primary);
      font-weight: $font-weight-medium;
    }

    .ui-multi-select-checkbox-box {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }
  }
}

.ui-multi-select-checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border: 1.5px solid #c6d2db;
  border-radius: 4px;
  background: #fff;
  transition: all $transition-fast;
  color: #fff;
}

.ui-multi-select-checkbox-icon {
  display: block;
}

.ui-multi-select-item-label {
  @include ellipsis(1);
  min-width: 0;
  transition: color $transition-fast;
}
</style>
