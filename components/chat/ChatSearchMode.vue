<template>
  <div
    ref="dropdownRef"
    class="chat-search-mode"
  >
    <!-- 선택된 에이전트 태그 -->
    <button
      v-if="selectedAgent"
      class="chat-search-mode-tag"
      :disabled="disabled"
      @click="onRemove"
    >
      <i :class="[selectedAgent.iconClassNm ? selectedAgent.iconClassNm : 'icon-search', 'size-20']" />
      <span class="ws-nowrap">{{ selectedAgent.agentNm }}</span>
      <i class="icon-close-bg size-16" />
    </button>

    <!-- 트리거 버튼 (선택된 모드가 없고, 채팅 상세일 때만 표시) -->
    <button
      v-if="activeSearchModes.length === 0 && !isChatIndex"
      class="chat-search-mode-trigger"
      :class="{ 'is-open': isOpen }"
      :disabled="disabled"
      @click="toggleDropdown"
    >
      <i class="icon-search size-20" />
      <span>일반질의</span>
      <i
        class="icon-chevron-down size-20"
        :class="{ 'is-flipped': isOpen }"
      />
    </button>
    <UiMultiSelect
      v-if="isSearchModeActive && subOptions.length > 0"
      id="sub-option"
      :model-value="selectedSubOptions"
      name="sub-option"
      :options="subOptions"
      size="xlg"
      placeholder="참조 선택"
      class="w-155 ref-select"
      :disabled="disabled"
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
          :style="chatModePanelThemeStyle"
        >
          <div class="chat-mode-panel-header">
            <h3 class="chat-mode-panel-title">에이전트 선택</h3>
            <button
              type="button"
              class="chat-mode-panel-close"
              @click="isOpen = false"
            >
              <i class="icon-close-bg size-20" />
            </button>
          </div>
          <div class="chat-mode-panel-theme-nav">
            <button
              v-for="theme in CHAT_THEMES"
              :key="theme.key"
              type="button"
              class="chat-mode-panel-theme-tab"
              :class="{ 'is-active': panelActiveThemeKey === theme.key }"
              :style="panelActiveThemeKey === theme.key ? { '--tab-color': theme.primary } : undefined"
              @click="onSelectPanelTheme(theme.key)"
            >
              <i :class="[theme.iconClassNm, 'size-16']" />
              <span>{{ theme.label }}</span>
            </button>
          </div>
          <p class="chat-mode-panel-theme-tagline">
            {{ panelActiveTheme?.tagline ?? '' }}
          </p>
          <div class="chat-mode-panel-card-grp">
            <button
              v-for="agent in panelThemeAgents"
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
            <div
              v-if="panelThemeAgents.length === 0"
              class="chat-mode-panel-empty"
            >
              <i class="icon-search size-24" />
              <p>이 테마에 사용 가능한 에이전트가 없습니다.</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent'
import { isSurveyAgent } from '~/utils/chat/surveyUtil'
import { isRecommendAgent } from '~/utils/chat/recommendAgentUtil'
import { CHAT_THEMES, findThemeByKey, getInitialThemeKey, groupAgentsByTheme } from '~/utils/chat/chatThemeUtil'

interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

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
const { resetNextQuestions } = useChatMessages()

const disabled = computed(() => props.disabled)

const MAX_SUB_OPTIONS = 3

const subOptionRealIds = computed(() => subOptions.value.map((o) => String(o.value)))

const onSubOptionsMultiChange = (next: Array<string | number>) => {
  if (disabled.value) return
  const filtered = next.map(String).filter((id) => subOptionRealIds.value.includes(id))
  if (filtered.length > MAX_SUB_OPTIONS) {
    openToast({ message: '참조는 최대 3개까지 선택할 수 있습니다.', type: 'warning' })
    return
  }
  selectedSubOptions.value = filtered
}

const route = useRoute()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const panelActiveThemeKey = ref(CHAT_THEMES[0].key)
const THEME_PANEL_FADE_MS = 1000
const panelThemeBgBase = ref('none')
const panelThemeBgOverlay = ref('none')
const panelThemeBgOverlayOpacity = ref('0')
const panelThemeBgOverlayScale = ref('0')
let panelThemeFadeTimer: ReturnType<typeof window.setTimeout> | null = null

const selectedSurveyAgent = computed(
  () => chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value && isSurveyAgent(a)) ?? null,
)

const selectedAgent = computed(() => {
  if (!selectedChatAgentId.value) return null
  if (selectedSurveyAgent.value) return null
  return chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ?? null
})
const isSearchModeActive = computed(() => activeSearchModes.value.length > 0)

const isChatIndex = computed(() => route.path === '/chat')
const groupedAgentsByTheme = computed(() => groupAgentsByTheme(chatIndexAgents.value))

const panelActiveTheme = computed(() => findThemeByKey(panelActiveThemeKey.value))

const panelThemeAgents = computed(() => groupedAgentsByTheme.value[panelActiveThemeKey.value] ?? [])

const chatModePanelThemeStyle = computed(() => ({
  '--chat-mode-panel-theme-bg-base': panelThemeBgBase.value,
  '--chat-mode-panel-theme-bg-overlay': panelThemeBgOverlay.value,
  '--chat-mode-panel-theme-bg-overlay-opacity': panelThemeBgOverlayOpacity.value,
  '--chat-mode-panel-theme-bg-overlay-scale': panelThemeBgOverlayScale.value,
}))

watch(
  panelActiveTheme,
  async (theme) => {
    const nextBg = theme?.bgGradient ?? 'none'
    if (!panelThemeBgBase.value || panelThemeBgBase.value === 'none') {
      panelThemeBgBase.value = nextBg
      panelThemeBgOverlay.value = 'none'
      panelThemeBgOverlayOpacity.value = '0'
      panelThemeBgOverlayScale.value = '0'
      return
    }
    if (panelThemeBgBase.value === nextBg) return

    // 새 테마를 base에 즉시 반영하고, 이전 테마 overlay를 위에서 아래로 걷어낸다.
    const prevBg = panelThemeBgBase.value
    panelThemeBgBase.value = nextBg
    panelThemeBgOverlay.value = prevBg
    panelThemeBgOverlayOpacity.value = '1'
    panelThemeBgOverlayScale.value = '1'
    await nextTick()
    panelThemeBgOverlayScale.value = '0'

    if (panelThemeFadeTimer) window.clearTimeout(panelThemeFadeTimer)
    panelThemeFadeTimer = window.setTimeout(() => {
      panelThemeBgOverlayOpacity.value = '0'
      panelThemeBgOverlayScale.value = '0'
      panelThemeFadeTimer = null
    }, THEME_PANEL_FADE_MS)
  },
  { immediate: true },
)

watch(disabled, (nextDisabled) => {
  if (nextDisabled) isOpen.value = false
})

watch(
  isOpen,
  (opened) => {
    if (!opened) return
    const selectedThemeKey = chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value)?.cncptTy
    if (selectedThemeKey && groupedAgentsByTheme.value[selectedThemeKey]?.length) {
      panelActiveThemeKey.value = selectedThemeKey
      return
    }
    panelActiveThemeKey.value = getInitialThemeKey(groupedAgentsByTheme.value)
  },
  { immediate: true },
)

const toggleDropdown = () => {
  if (disabled.value) return
  if (isChatIndex.value) return
  const willOpen = !isOpen.value
  isOpen.value = willOpen
  if (willOpen) resetNextQuestions()
}

const onSelect = (agent: Agent) => {
  if (disabled.value) return
  if (selectedChatAgentId.value === agent.agentId && !isSurveyAgent(agent) && !isRecommendAgent(agent)) {
    isOpen.value = false
    return
  }
  selectChatIndexAgent(agent)
  isOpen.value = false
}

const onRemove = () => {
  if (disabled.value) return
  if (!selectedAgent.value) return
  selectChatIndexAgent(selectedAgent.value)
}

const onSelectPanelTheme = (themeKey: string) => {
  panelActiveThemeKey.value = themeKey
}

onUnmounted(() => {
  if (panelThemeFadeTimer) {
    window.clearTimeout(panelThemeFadeTimer)
    panelThemeFadeTimer = null
  }
})
</script>
<style scoped lang="scss">
.ref-select {
  margin-left: 5px;
}
</style>
