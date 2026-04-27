<template>
  <div
    ref="rootRef"
    class="meeting2-color-picker"
  >
    <button
      type="button"
      class="meeting2-editor-toolbar-btn meeting2-color-picker-trigger"
      :title="title"
      :class="{ 'is-active': !!currentColor }"
      @click="toggleOpen"
    >
      <span class="meeting2-color-picker-label">{{ label }}</span>
      <span
        class="meeting2-color-picker-bar"
        :style="{ background: currentColor || 'transparent' }"
      ></span>
    </button>

    <div
      v-if="isOpen"
      class="meeting2-color-picker-pop"
    >
      <div class="meeting2-color-picker-grid">
        <button
          v-for="color in colors"
          :key="color"
          type="button"
          class="meeting2-color-picker-swatch"
          :class="{ 'is-current': currentColor === color }"
          :style="{ background: color }"
          :title="color"
          @click="onSelect(color)"
        ></button>

        <!-- 커스텀 색상 (네이티브 color input 트리거) -->
        <label
          class="meeting2-color-picker-swatch is-custom"
          title="커스텀 색상"
        >
          <input
            type="color"
            class="meeting2-color-picker-custom-input"
            :value="customColorValue"
            @input="onCustomColor"
          />
          <span class="meeting2-color-picker-custom-icon">+</span>
        </label>
      </div>

      <div class="meeting2-color-picker-actions">
        <span
          v-if="currentColor"
          class="meeting2-color-picker-current"
        >
          현재:
          <span
            class="meeting2-color-picker-current-swatch"
            :style="{ background: currentColor }"
          ></span>
          <span class="meeting2-color-picker-current-hex">{{ currentColor }}</span>
        </span>
        <button
          type="button"
          class="meeting2-color-picker-clear"
          @click="onClear"
        >
          색 해제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 트리거 라벨 (예: 'A', '강조') */
  label: string
  /** 트리거 title (호버 툴팁) */
  title: string
  /** 색상 팔레트 */
  colors: string[]
  /** 현재 선택된 색 (없으면 null/undefined) */
  currentColor?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [color: string]
  clear: []
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

/** 네이티브 color input 기본값 — 현재 색이 있으면 그 색, 없으면 검정 */
const customColorValue = computed(() => props.currentColor || '#000000')

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const onSelect = (color: string) => {
  emit('select', color)
  isOpen.value = false
}

const onCustomColor = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  emit('select', value)
  // 팝오버는 닫지 않음 — 사용자가 색을 미세 조정할 수 있도록
}

const onClear = () => {
  emit('clear')
  isOpen.value = false
}

// 외부 클릭 시 닫기
const onDocClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
})
</script>
