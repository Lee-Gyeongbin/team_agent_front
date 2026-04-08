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
        :inputmode="numberOnly ? 'numeric' : undefined"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :name="name"
        :maxlength="maxLength"
        :min="min"
        :max="max"
        :step="step"
        :spellcheck="spellcheck"
        @input="onInput"
        @compositionupdate="onCompositionUpdate"
        @focus="onFocus"
        @blur="onBlur"
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
  type?: 'text' | 'search' | 'password' | 'email' | 'tel'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  name?: string
  id?: string
  maxLength?: number
  /** number/range 등 네이티브 제약과 동일한 의미. `number-only`는 type=text라 blur 시 아래 로직으로 보정 */
  min?: string | number
  max?: string | number
  step?: string | number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xlg' | 'auth'
  radius?: 'sm' | 'base' | 'lg'
  desc?: string
  numberOnly?: boolean
  allowDecimal?: boolean
  allowNegative?: boolean
  /** false면 브라우저 맞춤법 밑줄 비활성화 */
  spellcheck?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  name: undefined,
  id: undefined,
  maxLength: undefined,
  min: undefined,
  max: undefined,
  step: undefined,
  size: 'md',
  radius: 'base',
  desc: '',
  numberOnly: false,
  allowDecimal: false,
  allowNegative: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  enter: [value: string | number | undefined]
  search: [value: string | number | undefined]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// 숫자 외 문자 제거
const stripNonNumeric = (val: string): string => {
  let pattern = '0-9'
  if (props.allowDecimal) pattern += '.'
  if (props.allowNegative) pattern += '-'
  const regex = new RegExp(`[^${pattern}]`, 'g')
  return val.replace(regex, '')
}

/** number-only + min/max/step: type=text라 네이티브 제약이 없어 blur 시 보정 */
const applyNumericConstraints = (raw: string): string => {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  const cleaned = stripNonNumeric(trimmed)
  if (cleaned === '' || cleaned === '-') return cleaned

  let num = parseFloat(cleaned)
  if (Number.isNaN(num)) return cleaned

  const minV = props.min !== undefined ? Number(props.min) : undefined
  const maxV = props.max !== undefined ? Number(props.max) : undefined
  const stepV = props.step !== undefined ? Number(props.step) : undefined

  if (minV !== undefined && !Number.isNaN(minV)) num = Math.max(num, minV)
  if (maxV !== undefined && !Number.isNaN(maxV)) num = Math.min(num, maxV)

  if (stepV !== undefined && stepV > 0 && !Number.isNaN(stepV)) {
    const base = minV !== undefined && !Number.isNaN(minV) ? minV : 0
    num = base + Math.round((num - base) / stepV) * stepV
    const stepDecimals = (String(props.step).split('.')[1] || '').length
    const minDecimals = (String(props.min ?? '').split('.')[1] || '').length
    const decimals = Math.max(stepDecimals, minDecimals, props.allowDecimal ? 2 : 0)
    num = Number(num.toFixed(decimals))
  }

  return String(num)
}

const onFocus = () => {
  isFocused.value = true
}

const onBlur = (e: FocusEvent) => {
  isFocused.value = false
  const input = e.target as HTMLInputElement
  if (!props.numberOnly) return
  if (props.min === undefined && props.max === undefined && props.step === undefined) return

  const next = applyNumericConstraints(input.value)
  if (next !== input.value) {
    input.value = next
    emit('update:modelValue', next)
  }
}

const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (props.numberOnly) {
    const cleaned = stripNonNumeric(input.value)
    input.value = cleaned
    emit('update:modelValue', cleaned)
  } else {
    emit('update:modelValue', input.value)
  }
}

// 한글 IME 조합 중 즉시 제거
const onCompositionUpdate = (e: CompositionEvent) => {
  if (props.numberOnly) {
    const input = e.target as HTMLInputElement
    const cleaned = stripNonNumeric(input.value)
    input.value = cleaned
    emit('update:modelValue', cleaned)
  }
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
  padding: 0;
  gap: 0;
  overflow: hidden;

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

  /** 로그인·회원가입: 44px, 16px/400, 테두리·플레이스홀더 스펙 */
  &.size-inp-auth {
    height: $height-auth;
    font-size: $font-size-lg;

    .ui-input {
      padding: 6px 8px;
      font-weight: 400;
      color: $color-text-dark;
      // input-reset 기본은 transparent — 로그인 등에서 필드 자체를 흰색으로 고정 (autofill 배경 덮음)
      background-color: #fff;

      &::placeholder {
        color: #94a3b8;
      }

      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px #fff inset;
        -webkit-text-fill-color: $color-text-dark;
      }
    }

    &.has-icon-left .ui-input {
      padding-left: 4px;
    }

    &.has-icon-right .ui-input {
      padding-right: 4px;
    }
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
  padding: 0 10px;
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

  &.is-left {
    padding-left: 10px;

    & + .ui-input {
      padding-left: 4px;
    }
  }

  &.is-right {
    padding-right: 10px;
  }

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
