<template>
  <textarea
    ref="textareaRef"
    class="inp ui-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
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
  maxRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  rows: 1,
  autoResize: false,
  maxRows: undefined,
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
  resize: none;
  width: 100%;
  line-height: $line-height-base;
  font-size: $font-size-base;
  color: $color-text-primary;

  &:focus {
    outline: none;
  }

  &:disabled {
    color: $color-text-disabled;
    cursor: not-allowed;
  }
}
</style>
