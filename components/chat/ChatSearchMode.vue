<template>
  <div
    ref="dropdownRef"
    class="chat-search-mode"
  >
    <!-- 선택된 모드 태그 -->
    <button
      v-for="mode in selectedOptions"
      :key="mode.value"
      class="chat-search-mode-tag"
      @click="onRemove(mode.value)"
    >
      <i class="icon-search size-20" />
      <span class="ws-nowrap">{{ mode.label }}</span>
      <i class="icon-refund-back size-20" />
    </button>

    <!-- 트리거 버튼 (선택된 모드가 없을 때만 표시) -->
    <button
      v-if="activeSearchModes.length === 0"
      class="chat-search-mode-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <i class="icon-search size-20" />
      <span>모드</span>
      <i
        class="icon-chevron-down size-20"
        :class="{ 'is-flipped': isOpen }"
      />
    </button>
    <UiSelect
      v-if="isSearchModeActive && subOptions.length > 0"
      id="sub-option"
      class="w-155 ref-select"
      name="sub-option"
      :model-value="selectedSubOption"
      :options="subOptions"
      size="xlg"
      @update:model-value="selectedSubOption = String($event)"
    />

    <!-- 드롭다운 -->
    <div
      v-show="isOpen"
      class="chat-search-mode-dropdown"
    >
      <button
        v-for="option in searchModeOptions"
        :key="option.value"
        class="chat-search-mode-item"
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

const { searchModeOptions, activeSearchModes, toggleSearchMode, subOptions, selectedSubOption } = useChatStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 선택된 모드의 옵션 정보
const selectedOptions = computed(() => searchModeOptions.filter((opt) => activeSearchModes.value.includes(opt.value)))
const isSearchModeActive = computed(() => activeSearchModes.value.length > 0)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const onSelect = (mode: SearchModeValue) => {
  if (!activeSearchModes.value.includes(mode)) {
    toggleSearchMode(mode)
  }
  isOpen.value = false
}

const onRemove = (mode: SearchModeValue) => {
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
<style scoped lang="scss">
.ref-select {
  margin-left: 5px;
}
</style>
