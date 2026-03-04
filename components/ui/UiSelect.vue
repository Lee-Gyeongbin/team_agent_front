<template>
  <div class="ui-select-wrap">
    <SelectRoot
      :model-value="String(modelValue ?? options[0]?.value ?? '')"
      :disabled="disabled"
      @update:model-value="onUpdate"
    >
      <SelectTrigger
        class="ui-select-trigger"
        :class="[`size-${size}`, { 'is-disabled': disabled }]"
      >
        <SelectValue :placeholder="placeholder || '선택'" />
        <SelectIcon class="ui-select-icon">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M9.867 4.203a.4.4 0 0 1-.03.564L6.297 8.767a.4.4 0 0 1-.594 0L2.103 4.767a.4.4 0 1 1 .594-.535L6 7.902l3.302-3.67a.4.4 0 0 1 .565.03Z"
              fill="currentColor"
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
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '',
  disabled: false,
  name: undefined,
  id: undefined,
  size: 'md',
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
  width: 100%;
  padding: 0 16px;
  gap: 4px;

  font-weight: $font-weight-medium;
  color: #333;

  // 미선택(placeholder) 상태
  &[data-placeholder] {
    color: #94a3b8;
  }
  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-md;

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
    font-size: $font-size-xs;
  }

  &.size-sm {
    height: $height-sm;
    font-size: $font-size-xs;
  }

  &.size-md {
    height: $height-md;
    font-size: $font-size-sm;
  }

  &.size-lg {
    height: $height-lg;
    font-size: $font-size-sm;
  }

  &.size-xlg {
    height: $height-xlg;
    font-size: $font-size-base;
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-select-icon {
  flex-shrink: 0;
  color: $color-text-secondary;
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
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
  padding: $spacing-xs 0;
  z-index: $z-dropdown;
}

.ui-select-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;
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
