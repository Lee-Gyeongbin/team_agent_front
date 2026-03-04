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
  size?: 'xs' | 'sm' | 'md' | 'lg'
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

  // 화살표 아이콘
  &::after {
    content: '';
    position: absolute;
    right: 8px;
    top: 50%;
    width: 12px;
    height: 12px;
    transform: translateY(-50%);
    pointer-events: none;
    transition: transform $transition-base;

    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M9.86718 4.20252C10.0314 4.3503 10.0447 4.60321 9.89694 4.76743L6.29734 8.76743C6.22148 8.85172 6.11341 8.89985 6.00001 8.89986C5.88662 8.89986 5.77855 8.85173 5.70269 8.76744L2.10269 4.76744C1.9549 4.60324 1.96821 4.35032 2.13242 4.20254C2.29662 4.05476 2.54954 4.06807 2.69732 4.23227L5.99999 7.9019L9.30228 4.23229C9.45006 4.06808 9.70297 4.05475 9.86718 4.20252Z' fill='%23666666' stroke='%23666666' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E%0A");
    background-size: contain;
    background-repeat: no-repeat;
  }

  // 포커스 시 화살표 회전
  &:focus-within::after {
    transform: translateY(-50%) rotate(180deg);
  }

  &.is-disabled::after {
    opacity: 0.4;
  }

  // 사이즈
  &.size-sm .ui-select {
    height: 28px;
    line-height: 28px;
    font-size: $font-size-xs;
  }

  &.size-md .ui-select {
    height: 32px;
    line-height: 32px;
    font-size: $font-size-sm;
  }

  &.size-lg .ui-select {
    height: 36px;
    line-height: 36px;
    font-size: $font-size-base;
  }
}

.ui-select {
  width: 100%;
  padding: 0 28px 0 8px;

  font-weight: $font-weight-medium;
  color: #333;

  // 미선택(placeholder) 상태
  &[data-placeholder] {
    color: #94A3B8;
  }
  background-color: #fff;
  border: 1px solid #C6D2DB;
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

  // size, is-disabled → _form.scss 글로벌 공통 클래스 사용
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
