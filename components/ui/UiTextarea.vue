<template>
  <textarea
    ref="textareaRef"
    class="inp ui-textarea"
    :class="[`radius-${radius}`, `size-textarea-${size}`, { 'has-border': border }]"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :maxlength="maxLength"
    :spellcheck="spellcheck"
    @input="onInput"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  autoResize?: boolean
  maxLength?: number
  maxRows?: number
  radius?: 'sm' | 'base' | 'lg'
  border?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** false면 브라우저 맞춤법 밑줄 비활성화 */
  spellcheck?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  rows: 1,
  autoResize: true,
  maxLength: undefined,
  maxRows: 10,
  radius: 'base',
  border: false,
  size: 'lg',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 한 줄 높이 계산
const getLineHeight = (): number => {
  const el = textareaRef.value
  if (!el) return 20
  const computed = window.getComputedStyle(el)
  return parseFloat(computed.lineHeight) || 20
}

// 높이 자동 조절
const adjustHeight = () => {
  const el = textareaRef.value
  if (!el || !props.autoResize) return

  // 높이 초기화 후 scrollHeight로 재계산
  el.style.height = 'auto'
  let newHeight = el.scrollHeight

  // maxRows 제한
  if (props.maxRows) {
    const lineHeight = getLineHeight()
    const paddingTop = parseFloat(window.getComputedStyle(el).paddingTop) || 0
    const paddingBottom = parseFloat(window.getComputedStyle(el).paddingBottom) || 0
    const maxHeight = lineHeight * props.maxRows + paddingTop + paddingBottom
    newHeight = Math.min(newHeight, maxHeight)
  }

  el.style.height = `${newHeight}px`
}

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  nextTick(() => adjustHeight())
}

// autoResize 활성 시 초기 높이 설정
onMounted(() => {
  if (props.autoResize) {
    adjustHeight()
  }
})

// 외부에서 modelValue 변경 시 높이 재조절
watch(
  () => props.modelValue,
  () => {
    if (props.autoResize) {
      nextTick(() => adjustHeight())
    }
  },
)
</script>

<style lang="scss" scoped>
.ui-textarea {
  font-family: inherit;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  background-color: #fff;
  resize: none;
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
  width: 100%;
  min-height: 84px;
  line-height: $line-height-base;
  font-size: $font-size-base;

  // 사이즈
  &.size-textarea-sm {
    font-size: $font-size-base;
  }
  &.size-textarea-md {
    font-size: $font-size-base;
  }
  &.size-textarea-lg {
    font-size: $font-size-lg;
  }

  &::placeholder {
    color: #aebccb;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    color: $color-text-disabled;
    cursor: not-allowed;
  }

  // border 있는 스타일
  &.has-border {
    border: 1px solid #c6d2db;
    padding: 6px 8px;
    transition: border-color $transition-base;

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
    }

    &:focus:not(:disabled) {
      border-color: var(--color-primary);
    }
  }
}
</style>
