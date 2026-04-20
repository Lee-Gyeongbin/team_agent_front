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

    <!-- 트리거 버튼 (선택된 모드가 없고, 채팅 상세일 때만 표시) -->
    <button
      v-if="activeSearchModes.length === 0 && !isChatIndex"
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

    <!-- dim 오버레이 + 패널: body로 Teleport하여 사이드 패널 위에 표시 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="chat-mode-overlay"
          @click="isOpen = false"
        />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="isOpen"
          class="chat-mode-panel"
        >
          <div class="chat-mode-panel-header">
            <h3 class="chat-mode-panel-title">에이전트 선택</h3>
            <button
              type="button"
              class="chat-mode-panel-close"
              @click="isOpen = false"
            >
              <i class="icon-close size-20" />
            </button>
          </div>
          <div class="chat-mode-panel-card-grp">
            <button
              v-for="agent in chatIndexAgents"
              :key="agent.agentId"
              type="button"
              class="chat-index-card"
              :class="{ 'is-active': selectedChatAgentId === agent.agentId }"
              :style="getChatIndexAgentColorStyle(agent.colorHex ?? '')"
              @click="onSelect(agent)"
            >
              <div class="chat-index-card-default">
                <span class="icon-circle"
                  ><i :class="[agent.iconClassNm ? agent.iconClassNm : 'icon-search', 'size-24']"
                /></span>
                <div class="chat-index-card-info">
                  <p class="chat-index-card-name">{{ agent.agentNm }}</p>
                  <p class="chat-index-card-sub">{{ getChatIndexAgentSubLabel(agent) }}</p>
                </div>
              </div>
              <div class="chat-index-card-hover">
                <p class="chat-index-card-hover-desc">{{ agent.description }}</p>
                <span class="chat-index-card-hover-action">시작하기 <i class="icon-chevron-right-sm size-12" /></span>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent'

const {
  activeSearchModes,
  selectChatIndexAgent,
  chatIndexAgents,
  getChatIndexAgentSubLabel,
  getChatIndexAgentColorStyle,
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

const route = useRoute()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedAgent = computed(() => {
  if (!selectedChatAgentId.value) return null
  return chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ?? null
})
const isSearchModeActive = computed(() => activeSearchModes.value.length > 0)

const isChatIndex = computed(() => route.path === '/chat')

const toggleDropdown = () => {
  if (isChatIndex.value) return
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
</script>
<style scoped lang="scss">
.ref-select {
  margin-left: 5px;
}
</style>
