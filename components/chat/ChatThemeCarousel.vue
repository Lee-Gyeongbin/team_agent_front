<template>
  <div class="chat-theme-carousel">
    <!-- 테마 탭 (화살표 제거 — 전역 고정 버튼으로 이동) -->
    <div class="chat-theme-carousel__nav">
      <div class="chat-theme-carousel__tabs" role="tablist">
        <button
          v-for="theme in CHAT_THEMES"
          :key="theme.key"
          type="button"
          role="tab"
          :aria-selected="activeKey === theme.key"
          class="chat-theme-carousel__tab"
          :class="{ 'is-active': activeKey === theme.key }"
          :style="activeKey === theme.key ? { '--tab-color': theme.primary } : undefined"
          @click="moveTo(CHAT_THEMES.findIndex((t) => t.key === theme.key))"
        >
          <i :class="[theme.iconClassNm, 'size-16']" />
          <span>{{ theme.label }}</span>
        </button>
      </div>
    </div>

    <!-- 태그라인 -->
    <p class="chat-theme-carousel__tagline">
      {{ activeTheme?.tagline }}
    </p>

    <!-- 슬라이드 뷰포트 -->
    <div
      ref="viewportRef"
      class="chat-theme-carousel__viewport"
    >
      <div
        class="chat-theme-carousel__track"
        :class="{ 'is-dragging': isDragging }"
        :style="trackStyle"
      >
        <div
          v-for="theme in CHAT_THEMES"
          :key="theme.key"
          role="tabpanel"
          class="chat-theme-carousel__panel"
        >
          <!-- 로딩 -->
          <div v-if="isLoading" class="chat-theme-carousel__panel-loading">
            <div
              v-for="n in 4"
              :key="n"
              class="chat-index-card chat-index-card--skeleton"
            />
          </div>

          <!-- 빈 상태 -->
          <div
            v-else-if="groupedAgents[theme.key]?.length === 0"
            class="chat-theme-carousel__empty"
          >
            <i class="icon-search size-24" />
            <p>이 테마에 사용 가능한 에이전트가 없습니다.</p>
          </div>

          <!-- 에이전트 카드 그리드 -->
          <div
            v-else
            class="chat-theme-carousel__card-grp"
            :class="{ 'is-few': (groupedAgents[theme.key]?.length ?? 0) <= 3 }"
          >
            <button
              v-for="agent in groupedAgents[theme.key]"
              :key="agent.agentId"
              type="button"
              class="chat-index-card"
              :class="{ 'is-active': selectedAgentId === agent.agentId }"
              :style="getChatIndexAgentColorStyle(agent.colorHex ?? '')"
              @click="emit('select', agent)"
            >
              <div class="chat-index-card-default">
                <span class="icon-circle">
                  <i :class="[agent.iconClassNm ? agent.iconClassNm : 'icon-search', 'size-24']" />
                </span>
                <div class="chat-index-card-info">
                  <p class="chat-index-card-name">{{ agent.agentNm }}</p>
                  <p class="chat-index-card-sub">{{ getChatIndexAgentSubLabel(agent) }}</p>
                </div>
              </div>
              <div class="chat-index-card-hover">
                <p class="chat-index-card-hover-desc">{{ agent.description }}</p>
                <span class="chat-index-card-hover-action">
                  시작하기 <i class="icon-chevron-right-sm size-12" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 도트 인디케이터 -->
    <div class="chat-theme-carousel__dots" aria-hidden="true">
      <span
        v-for="(theme, i) in CHAT_THEMES"
        :key="theme.key"
        class="chat-theme-carousel__dot"
        :class="{ 'is-active': i === activeIndex }"
        :style="i === activeIndex ? { backgroundColor: activeTheme?.primary } : undefined"
      />
    </div>
  </div>

</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent'
import {
  CHAT_THEMES,
  groupAgentsByTheme,
  findThemeByKey,
} from '~/utils/chat/chatThemeUtil'

interface Props {
  agents: Agent[]
  selectedAgentId: string | null
  isLoading: boolean
  activeKey: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:activeKey': [key: string]
  'select': [agent: Agent]
}>()

const { getChatIndexAgentSubLabel, getChatIndexAgentColorStyle } = useChatStore()

const viewportRef = ref<HTMLElement | null>(null)

/** 그룹핑된 에이전트 */
const groupedAgents = computed(() => groupAgentsByTheme(props.agents))

/** 현재 활성 테마 인덱스 */
const activeIndex = computed(() =>
  CHAT_THEMES.findIndex((t) => t.key === props.activeKey),
)

/** 현재 활성 테마 객체 */
const activeTheme = computed(() => findThemeByKey(props.activeKey))

/** 특정 인덱스로 이동 */
const moveTo = (index: number) => {
  if (index < 0 || index >= CHAT_THEMES.length) return
  emit('update:activeKey', CHAT_THEMES[index].key)
}

// ===== 드래그 제스처 =====
const DRAG_THRESHOLD = 50 // px

let pointerId = -1
let startX = 0
const dragDelta = ref(0)
const isDragging = ref(false)

const setDraggingClass = (active: boolean) => {
  document.querySelector('.chat-page-wrap')?.classList.toggle('is-theme-dragging', active)
}

const resetDragState = () => {
  isDragging.value = false
  dragDelta.value = 0
  pointerId = -1
  setDraggingClass(false)
}

const onPointerDown = (e: PointerEvent) => {
  if (e.button !== 0) return
  // 이미 다른 포인터 추적 중이면 무시
  if (pointerId !== -1) return
  pointerId = e.pointerId
  startX = e.clientX
  dragDelta.value = 0
  isDragging.value = false
}

const onPointerMove = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return
  const delta = e.clientX - startX
  if (!isDragging.value && Math.abs(delta) > 8) {
    isDragging.value = true
    setDraggingClass(true)
  }
  if (isDragging.value) {
    dragDelta.value = delta
  }
}

const onPointerUp = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return
  const delta = dragDelta.value
  if (isDragging.value && Math.abs(delta) >= DRAG_THRESHOLD) {
    if (delta < 0) {
      moveTo(activeIndex.value + 1)
    } else {
      moveTo(activeIndex.value - 1)
    }
  }
  resetDragState()
}

const onPointerCancel = () => {
  resetDragState()
}

// 브라우저 밖으로 포인터가 나가거나 창 포커스를 잃는 경우 강제 해제
const onWindowBlur = () => {
  if (pointerId !== -1) resetDragState()
}

const onVisibilityChange = () => {
  if (document.hidden && pointerId !== -1) resetDragState()
}

// 드래그 이벤트를 .content 영역(사이드바 제외)에만 등록
let dragTarget: Element | Document = document

onMounted(() => {
  dragTarget = document.querySelector('.content') ?? document
  dragTarget.addEventListener('pointerdown', onPointerDown as EventListener)
  dragTarget.addEventListener('pointermove', onPointerMove as EventListener)
  dragTarget.addEventListener('pointerup', onPointerUp as EventListener)
  dragTarget.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('pointerup', onPointerUp as EventListener)
  window.addEventListener('pointercancel', onPointerCancel as EventListener)
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  dragTarget.removeEventListener('pointerdown', onPointerDown as EventListener)
  dragTarget.removeEventListener('pointermove', onPointerMove as EventListener)
  dragTarget.removeEventListener('pointerup', onPointerUp as EventListener)
  dragTarget.removeEventListener('pointercancel', onPointerCancel)
  window.removeEventListener('pointerup', onPointerUp as EventListener)
  window.removeEventListener('pointercancel', onPointerCancel as EventListener)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  resetDragState()
  dragTarget = document
})

/** 트랙 transform 스타일 */
const trackStyle = computed(() => {
  const baseOffset = activeIndex.value * 100
  const trackWidth = viewportRef.value?.clientWidth ?? window.innerWidth
  const dragPercent = (dragDelta.value / trackWidth) * 100
  return {
    transform: `translateX(calc(-${baseOffset}% + ${isDragging.value ? dragPercent : 0}%))`,
  }
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.chat-theme-carousel {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

// ===== 상단 내비게이션(탭) =====
.chat-theme-carousel__nav {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: $chat-max-width;
  margin-bottom: 6px;
}

.chat-theme-carousel__tabs {
  display: flex;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.chat-theme-carousel__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1.5px solid $color-border;
  border-radius: 999px;
  background: #fff;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  cursor: pointer;
  transition:
    border-color $transition-fast,
    color $transition-fast,
    background $transition-fast;

  i {
    color: currentColor;
    flex-shrink: 0;
  }

  &:hover:not(.is-active) {
    border-color: #b0bec5;
    background: $color-surface;
    color: $color-text-primary;
  }

  &.is-active {
    border-color: var(--tab-color, var(--color-primary));
    background: var(--tab-color, var(--color-primary));
    color: #fff;

    i {
      color: #fff;
    }
  }
}

// ===== 뷰포트 커서 — 드래그 가능 표시 제거 (전역 드래그이므로 불필요) =====

// ===== 태그라인 =====
.chat-theme-carousel__tagline {
  @include typo($body-small);
  color: $color-text-muted;
  margin-top: 3px;
  margin-bottom: 16px;
  height: 18px;
  text-align: center;
  transition: opacity $transition-base;
}

// ===== 슬라이드 뷰포트 =====
.chat-theme-carousel__viewport {
  width: 100%;
  max-width: $chat-max-width;
  overflow: hidden;
  touch-action: pan-y;
}

// ===== 슬라이드 트랙 =====
.chat-theme-carousel__track {
  display: flex;
  width: 100%;
  transition: transform $transition-slow;
  will-change: transform;

  &.is-dragging {
    transition: none;
  }
}

// ===== 개별 패널 =====
.chat-theme-carousel__panel {
  flex: 0 0 100%;
  min-width: 0;
}

// ===== 로딩 스켈레톤 =====
.chat-theme-carousel__panel-loading {
  display: flex;
  gap: 12px;
  width: 100%;
}

.chat-index-card--skeleton {
  pointer-events: none;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2eaf0 50%, #f0f4f8 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  .chat-index-card-default,
  .chat-index-card-hover {
    opacity: 0;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ===== 빈 상태 =====
.chat-theme-carousel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 140px;
  color: $color-text-muted;

  p {
    @include typo($body-small);
  }
}

// ===== 카드 그리드 (패널 내부) =====
.chat-theme-carousel__card-grp {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding-right: 6px;
  // 1행(4개)만 기본 노출하고 초과는 내부 세로 스크롤
  max-height: 140px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  @include custom-scrollbar;

  // 카드 너비 고정: 4열 기준 고정값 (카드 수 적어도 늘어나지 않음)
  .chat-index-card {
    flex: 0 0 calc((100% - 12px * 3) / 4);
    width: calc((100% - 12px * 3) / 4);
    cursor: pointer; // grab 커서 재정의
  }
}

// ===== 도트 인디케이터 =====
.chat-theme-carousel__dots {
  display: flex;
  gap: 6px;
  margin-top: 16px;
}

.chat-theme-carousel__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $color-border;
  transition:
    background-color $transition-base,
    transform $transition-base;

  &.is-active {
    transform: scale(1.4);
  }
}
</style>

