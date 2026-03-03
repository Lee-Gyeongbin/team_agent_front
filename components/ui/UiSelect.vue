<template>
  <div
    class="ui-select-wrap"
    :class="[`size-${size}`, { 'is-disabled': disabled }]"
  >
    <select
      class="ui-select"
      :value="modelValue ?? options[0]?.value"
      :disabled="disabled"
      :name="name"
      :id="id"
      @change="onChange"
    >
      <option
        v-if="placeholder"
        value=""
        disabled
        selected
      >
        {{ placeholder }}
      </option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
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
  size?: 'sm' | 'md' | 'lg'
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

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<style lang="scss" scoped>
.ui-select-wrap {
  position: relative;
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
  color: $color-text-primary;
  background-color: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;

  cursor: pointer;
  outline: none;
  appearance: none;
  transition: border-color $transition-base;

  &:focus {
    border-color: $color-primary;
  }

  &:disabled {
    color: $color-text-disabled;
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
