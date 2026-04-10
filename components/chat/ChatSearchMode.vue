<template>
  <div
    ref="dropdownRef"
    class="chat-search-mode"
  >
    <!-- 선택된 에이전트 태그 -->
    <button
      v-if="selectedAgent"
      class="chat-search-mode-tag"
      @click="onRemove"
    >
      <i :class="[selectedAgent.iconClassNm ? selectedAgent.iconClassNm : 'icon-search', 'size-20']" />
      <span class="ws-nowrap">{{ selectedAgent.agentNm }}</span>
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
    <UiMultiSelect
      v-if="isSearchModeActive && subOptions.length > 0"
      id="sub-option"
      :model-value="subOptionsUiModel"
      name="sub-option"
      :options="subOptionsWithAll"
      size="xlg"
      placeholder="참조 선택"
      class="w-155 ref-select"
      @update:model-value="onSubOptionsMultiChange"
    />

    <!-- 드롭다운 -->
    <div
      v-show="isOpen"
      class="chat-search-mode-dropdown"
    >
      <button
        v-for="agent in chatIndexAgents"
        :key="agent.agentId"
        class="chat-search-mode-item"
        @click="onSelect(agent)"
      >
        <i :class="[agent.iconClassNm ? agent.iconClassNm : 'icon-search', 'size-20']" />
        <span>{{ agent.agentNm }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent'

const {
  activeSearchModes,
  selectChatIndexAgent,
  chatIndexAgents,
  selectedChatAgentId,
  subOptions,
  selectedSubOptions,
} = useChatStore()

/** UiMultiSelect 전용 — API refId와 겹치지 않게 긴 sentinel 사용 */
const SUB_OPTION_ALL_KEY = '__chat_sub_option_select_all__'

const subOptionsWithAll = computed(() => [{ label: '전체', value: SUB_OPTION_ALL_KEY }, ...subOptions.value])

const subOptionRealIds = computed(() => subOptions.value.map((o) => String(o.value)))

/** 전체 선택 시 체크박스 동기화: 전체 + 각 항목이 모두 체크된 상태로 표시 */
const subOptionsUiModel = computed(() => {
  const reals = subOptionRealIds.value
  const cur = selectedSubOptions.value.map(String)
  if (!reals.length) return cur
  if (reals.length > 0 && reals.every((r) => cur.includes(r))) {
    return [SUB_OPTION_ALL_KEY, ...reals]
  }
  return cur
})

const onSubOptionsMultiChange = (next: Array<string | number>) => {
  const n = next.map(String)
  const reals = subOptionRealIds.value
  const prev = subOptionsUiModel.value.map(String)
  const hadAllKey = prev.includes(SUB_OPTION_ALL_KEY)
  const hasAllKey = n.includes(SUB_OPTION_ALL_KEY)

  if (hasAllKey && !hadAllKey) {
    selectedSubOptions.value = [...reals]
    return
  }
  // 전체 행만 해제한 경우: [전체,A,B,C] → [A,B,C] 로 오며, 이때는 참조를 모두 비움(다시 클릭 시 전체 해제)
  if (!hasAllKey && hadAllKey) {
    selectedSubOptions.value = []
    return
  }
  selectedSubOptions.value = n.filter((x) => x !== SUB_OPTION_ALL_KEY && reals.includes(x))
}

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedAgent = computed(() => {
  if (!selectedChatAgentId.value) return null
  return chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ?? null
})
const isSearchModeActive = computed(() => activeSearchModes.value.length > 0)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const onSelect = (agent: Agent) => {
  if (selectedChatAgentId.value === agent.agentId) {
    isOpen.value = false
    return
  }
  selectChatIndexAgent(agent)
  isOpen.value = false
}

const onRemove = () => {
  if (!selectedAgent.value) return
  selectChatIndexAgent(selectedAgent.value)
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
