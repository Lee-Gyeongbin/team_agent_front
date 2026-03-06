<template>
  <div
    class="chat-search-mode"
    ref="dropdownRef"
  >
    <button
      class="chat-search-mode-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <i class="icon-search size-20" />
      <span>검색모드</span>
      <i
        class="icon-chevron-down size-20"
        :class="{ 'is-flipped': isOpen }"
      />
    </button>

    <div
      v-show="isOpen"
      class="chat-search-mode-dropdown"
    >
      <button
        v-for="option in searchModeOptions"
        :key="option.value"
        class="chat-search-mode-item"
        :class="{ 'is-active': activeSearchModes.includes(option.value) }"
        @click="onSelect(option.value)"
      >
        <i :class="[option.icon, 'size-20']" />
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchModeValue } from '~/types/chat'

const { searchModeOptions, activeSearchModes, toggleSearchMode } = useChatStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const onSelect = (mode: SearchModeValue) => {
  toggleSearchMode(mode)
}

// 외부 클릭 시 닫기
const onClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
