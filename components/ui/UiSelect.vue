<template>
  <div class="ui-select-wrap">
    <SelectRoot
      :model-value="String(modelValue ?? options[0]?.value ?? '')"
      :disabled="disabled"
      @update:model-value="onUpdate"
    >
      <SelectTrigger
        class="ui-select-trigger"
        :class="[`size-${size}`, `radius-${radius}`, { 'is-disabled': disabled }]"
      >
        <SelectValue
          :placeholder="placeholder || '선택'"
          class="ui-select-value"
        />
        <SelectIcon class="ui-select-icon">
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
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="ui-select-content"
          position="popper"
          side="bottom"
          :side-offset="4"
        >
          <SelectViewport>
            <SelectItem
              v-for="opt in options"
              :key="opt.value"
              :value="String(opt.value)"
              class="ui-select-item"
            >
              <SelectItemText>{{ opt.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue'

export interface SelectOption {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xlg'
  radius?: 'sm' | 'base' | 'lg'
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '',
  disabled: false,
  name: undefined,
  id: undefined,
  size: 'md',
  radius: 'base',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const onUpdate = (val: string) => {
  emit('update:modelValue', val)
}
</script>

<!-- 트리거: scoped -->
<style lang="scss" scoped>
.ui-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
  padding: 0 10px;
  gap: 4px;

  font-weight: $font-weight-medium;
  color: #333;

  // 미선택(placeholder) 상태
  &[data-placeholder] {
    color: #94a3b8;
  }
  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;

  // 라운드
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
    border-color: $color-primary;
  }

  &:focus,
  &[data-state='open'] {
    border-color: $color-primary;
  }

  // 사이즈
  &.size-xs {
    height: $height-xs;
    font-size: $font-size-sm;
  }

  &.size-sm {
    height: $height-sm;
    font-size: $font-size-sm;
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

.ui-select-value {
  @include ellipsis(1);
  min-width: 0;
}

.ui-select-icon {
  flex-shrink: 0;
  color: rgba(92, 102, 119, 1);
  transition: transform $transition-base;

  [data-state='open'] & {
    transform: rotate(180deg);
  }
}
</style>

<!-- 드롭다운(Portal): 글로벌 -->
<style lang="scss">
.ui-select-content {
  min-width: var(--radix-select-trigger-width);
  max-height: 240px;
  overflow-y: auto;

  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-shadow: $shadow-md;
  padding: $spacing-xs 0;
  z-index: $z-modal;
}

.ui-select-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-base;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;
  transition: background-color $transition-fast;

  &[data-highlighted] {
    background: $color-background;
  }

  &[data-state='checked'] {
    color: $color-primary;
    font-weight: $font-weight-semibold;
  }
}
</style>
