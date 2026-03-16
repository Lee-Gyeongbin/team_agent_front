<template>
  <div
    class="ui-input-outer"
    :class="{ 'has-desc': !!desc }"
  >
    <div
      class="ui-input-wrap"
      :class="[
        `size-inp-${size}`,
        `radius-${radius}`,
        {
          'is-disabled': disabled,
          'is-focused': isFocused,
          'has-icon-left': !!$slots['icon-left'],
          'has-icon-right': !!$slots['icon-right'] || type === 'search',
        },
      ]"
    >
      <!-- 왼쪽 아이콘 -->
      <span
        v-if="$slots['icon-left']"
        class="ui-input-icon is-left"
      >
        <slot name="icon-left" />
      </span>

      <input
        :id="id"
        ref="inputRef"
        class="ui-input"
        :type="type === 'search' ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :name="name"
        @input="onInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter="$emit('enter', modelValue)"
      />

      <!-- 우측 아이콘: search 타입이면 검색 아이콘 자동 표시 -->
      <span
        v-if="type === 'search'"
        class="ui-input-icon is-right is-search"
        @click="$emit('search', modelValue)"
      >
        <i class="icon-search size-20" />
      </span>

      <!-- 우측 커스텀 아이콘 -->
      <span
        v-else-if="$slots['icon-right']"
        class="ui-input-icon is-right"
      >
        <slot name="icon-right" />
      </span>
    </div>
    <!-- 설명 텍스트 -->
    <p
      v-if="desc"
      class="ui-input-desc"
    >
      {{ desc }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: 'text' | 'search' | 'password' | 'number'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  name?: string
  id?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xlg'
  radius?: 'sm' | 'base' | 'lg'
  desc?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  name: undefined,
  id: undefined,
  size: 'md',
  radius: 'base',
  desc: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  enter: [value: string | number | undefined]
  search: [value: string | number | undefined]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// 외부에서 focus 호출용
const focus = () => inputRef.value?.focus()

defineExpose({ focus })
</script>

<style lang="scss" scoped>
.ui-input-outer {
  flex: 1;
  min-width: 0;
}

.ui-input-wrap {
  display: inline-flex;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  gap: 4px;

  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;
  transition: border-color $transition-base;

  &:hover:not(.is-disabled) {
    border-color: var(--color-primary);
  }

  &.is-focused:not(.is-disabled) {
    border-color: var(--color-primary);
  }

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

  // 사이즈
  &.size-inp-xs {
    height: $height-xs;
    font-size: $font-size-sm;
  }
  &.size-inp-sm {
    height: $height-sm;
    font-size: $font-size-base;
  }
  &.size-inp-md {
    height: $height-md;
    font-size: $font-size-base;
  }
  &.size-inp-lg {
    height: $height-lg;
    font-size: $font-size-base;
  }
  &.size-inp-xlg {
    height: $height-xlg;
    font-size: $font-size-lg;
  }

  // 비활성
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-input {
  @include input-reset;
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  font-size: inherit;
  font-weight: $font-weight-medium;
  color: $color-text-primary;

  &::placeholder {
    color: #aebccb;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.ui-input-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: $color-text-muted;

  &.is-search {
    cursor: pointer;
  }
}

.ui-input-desc {
  margin-top: 4px;
  @include typo($body-small);
  color: $color-text-disabled;
  line-height: 1.5;
}
</style>
