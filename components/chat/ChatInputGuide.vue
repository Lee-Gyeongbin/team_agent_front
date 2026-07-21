<template>
  <div
    v-if="isVisible"
    class="chat-input-guide"
    :class="{ 'is-collapsed': !isOpen }"
  >
    <div
      class="chat-input-guide__header"
      role="button"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? '가이드 접기' : '가이드 펼치기'"
      @click="onToggle"
      @keydown.enter.prevent="onToggle"
      @keydown.space.prevent="onToggle"
    >
      <div class="chat-input-guide__header-main">
        <span
          class="chat-input-guide__emoji"
          aria-hidden="true"
        >
          💡
        </span>
        <div class="chat-input-guide__titles">
          <h2 class="chat-input-guide__title">입력 방법 가이드</h2>
          <p class="chat-input-guide__subtitle">더 정확한 답변을 받는 질문 팁을 확인해보세요.</p>
        </div>
      </div>
      <span class="chat-input-guide__toggle">
        {{ isOpen ? '접기' : '펼치기' }}
        <i
          class="size-14 icon-chevron-down chat-input-guide__toggle-icon"
          :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }"
        />
      </span>
    </div>

    <Transition name="chat-input-guide-fold">
      <div
        v-if="isOpen"
        class="chat-input-guide__content"
      >
        <!-- 상단: 서비스 제한 안내 (스크롤) -->
        <section
          v-if="hasLimitation"
          class="chat-input-guide__panel chat-input-guide__panel--limit"
        >
          <div class="chat-input-guide__panel-head">
            <div class="chat-input-guide__panel-title">서비스 제한 안내</div>
          </div>
          <div class="chat-input-guide__panel-body chat-input-guide__panel-body--scroll">
            <p class="chat-input-guide__text">{{ limitationContent }}</p>
          </div>
        </section>

        <!-- 하단: 입력 방법 가이드 메시지 -->
        <section
          v-if="hasInputContent"
          class="chat-input-guide__panel chat-input-guide__panel--input"
        >
          <div class="chat-input-guide__panel-head">
            <div class="chat-input-guide__panel-title">질문 팁</div>
          </div>
          <div class="chat-input-guide__panel-body">
            <p class="chat-input-guide__text">{{ inputContent }}</p>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS } from '~/types/chat-guide'

const COLLAPSED_STORAGE_KEY = 'ta_chatInputGuideCollapsed'

const { getChatGuideByKey } = useChatGuide()
const { selectedChatAgentId, activeSearchModes, riskAgentActive } = useChatStore()

const inputGuide = computed(() => getChatGuideByKey(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.guide))
const limitationGuide = computed(() => getChatGuideByKey(CHAT_GUIDE_NOTICE_DEFAULT_GUIDE_KEYS.limitation))

const inputContent = computed(() => String(inputGuide.value?.content ?? '').trim())
const limitationContent = computed(() => String(limitationGuide.value?.content ?? '').trim())

const hasInputContent = computed(() => !!inputContent.value)
const hasLimitation = computed(() => limitationGuide.value?.enblYn === 'Y' && !!limitationContent.value)

/** 일반 채팅(에이전트 미선택) + 입력 가이드 활성 + 표시할 섹션이 있을 때만 */
const isVisible = computed(() => {
  if (inputGuide.value?.enblYn !== 'Y') return false
  if (!hasInputContent.value && !hasLimitation.value) return false
  if (selectedChatAgentId.value) return false
  if (riskAgentActive.value) return false
  if (activeSearchModes.value.length > 0) return false
  return true
})

const readCollapsed = (): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'Y'
}

const isOpen = ref(!readCollapsed())

const onToggle = () => {
  isOpen.value = !isOpen.value
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(COLLAPSED_STORAGE_KEY, isOpen.value ? 'N' : 'Y')
}
</script>

<style lang="scss" scoped>
.chat-input-guide {
  width: 100%;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #c6d2db;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  animation: chat-input-guide-drop 0.48s cubic-bezier(0.16, 1, 0.3, 1);

  &.is-collapsed .chat-input-guide__header {
    border-bottom: 0;
  }

  @keyframes chat-input-guide-drop {
    0% {
      opacity: 0;
      transform: translateY(-14px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.chat-input-guide__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  padding: 14px 20px;
  cursor: pointer;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
}

.chat-input-guide__header-main {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 0;
}

.chat-input-guide__emoji {
  flex-shrink: 0;
  font-size: 20px;
  line-height: 1.4;
}

.chat-input-guide__titles {
  min-width: 0;
}

.chat-input-guide__title {
  margin: 0;
  @include typo($body-large-bold, $color-text-heading);
  font-size: 16px;
}

.chat-input-guide__subtitle {
  margin: 2px 0 0;
  @include typo($body-small, $color-text-secondary);
}

.chat-input-guide__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  @include typo($body-small, $color-text-muted);
  white-space: nowrap;
}

.chat-input-guide__toggle-icon {
  transition: transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-input-guide__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: 4px 20px 16px;
}

.chat-input-guide__panel {
  min-width: 0;
}

.chat-input-guide__panel--limit {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f3f6f9;
  border: 1px solid #e3eaf0;
}

.chat-input-guide__panel--limit + .chat-input-guide__panel--input {
  padding-top: 4px;
  border-top: 1px solid #e8eef3;
}

.chat-input-guide__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  margin-bottom: 10px;
}

.chat-input-guide__panel-title {
  min-width: 0;
  @include typo($body-medium-bold, $color-text-heading);
}

.chat-input-guide__panel-body--scroll {
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
  @include custom-scrollbar;
}

.chat-input-guide__text {
  margin: 0;
  @include typo($body-medium, $color-text-dark);
  white-space: pre-line;
  line-height: 1.7;
}

.chat-input-guide-fold-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.chat-input-guide-fold-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.chat-input-guide-fold-enter-from,
.chat-input-guide-fold-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
