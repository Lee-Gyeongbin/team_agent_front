<template>
  <div class="chat-style">
    <!-- 좌측: 설정 패널 -->
    <div class="chat-style-settings">
      <div>
        <h1 class="chat-style-title">챗봇스타일</h1>
        <p class="chat-style-subtitle">레이아웃, 색상 등 챗봇 UI 스타일을 선택합니다.</p>
      </div>

      <!-- 색상 테마 -->
      <div class="chat-style-section">
        <h2 class="chat-style-section-title">색상 테마</h2>
        <div class="chat-style-color-grid">
          <button
            v-for="theme in themeColors"
            :key="theme.key"
            class="chat-style-color-card"
            :class="{ 'is-active': selectedThemeKey === theme.key }"
            @click="onSelectTheme(theme)"
          >
            <span
              class="chat-style-color-dot"
              :style="{ background: theme.primary }"
            />
            <div class="chat-style-color-info">
              <span class="chat-style-color-name">{{ theme.name }}</span>
              <span class="chat-style-color-desc">{{ themeDescriptions[theme.key] }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 레이아웃 -->
      <div class="chat-style-section">
        <h2 class="chat-style-section-title">레이아웃</h2>
        <div class="chat-style-layout-list">
          <button
            v-for="layout in layoutOptions"
            :key="layout.key"
            class="chat-style-layout-card"
            :class="{ 'is-active': selectedLayout === layout.key }"
            @click="selectedLayout = layout.key"
          >
            <div
              class="chat-style-layout-icon"
              v-html="layout.icon"
            />
            <div class="chat-style-layout-info">
              <span class="chat-style-layout-name">{{ layout.name }}</span>
              <span class="chat-style-layout-desc">{{ layout.desc }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="chat-style-actions">
        <UiButton
          variant="outline"
          size="lg"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="lg"
        >
          저장
        </UiButton>
      </div>
    </div>

    <!-- 우측: 미리보기 -->
    <div class="chat-style-preview">
      <h2 class="chat-style-preview-title">미리보기</h2>

      <div class="chat-style-preview-messages">
        <div
          v-for="msg in previewMessages"
          :key="msg.id"
          class="chat-style-msg"
          :class="msg.role === 'assistant' ? 'role-assistant' : 'role-user'"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="chat-style-msg-avatar"
          >
            <i class="icon-bot size-24" />
          </div>
          <div class="chat-style-msg-bubble">{{ msg.content }}</div>
        </div>
      </div>

      <!-- 미리보기 입력 (비활성) -->
      <div class="chat-style-preview-input">
        <div class="chat-style-preview-input-left">
          <i class="icon-sparkle size-20" />
          <span class="chat-style-preview-input-placeholder">메시지를 입력하세요...</span>
        </div>
        <div class="chat-style-preview-input-right">
          <span class="chat-style-preview-model">
            GPT 4o
            <i class="icon-chevron-down size-16" />
          </span>
          <span class="chat-style-preview-send">
            <i class="icon-send size-16" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import type { ThemeColor } from '~/composables/useTheme'

const { themeColors, currentThemeKey, applyTheme } = useTheme()

const selectedThemeKey = ref(currentThemeKey.value)
const selectedLayout = ref<'default' | 'compact' | 'wide'>('default')

// 테마 설명
const themeDescriptions: Record<string, string> = {
  blue: '차분하고 신뢰감 있는',
  green: '자연스럽고 편안한',
  purple: '창의적이고 세련된',
  orange: '밝기차고 따뜻한',
}

// 테마 선택 시 미리보기에 즉시 반영
const onSelectTheme = (theme: ThemeColor) => {
  selectedThemeKey.value = theme.key
  applyTheme(theme)
}

// 레이아웃 옵션
const layoutOptions = [
  {
    key: 'default' as const,
    name: '기본 레이아웃',
    desc: '일반적인 대화형 인터페이스로 메시지가 위에서 아래로 쌓입니다.',
    icon: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="10" y="12" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="4" y="18" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="10" y="24" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.4"/></svg>',
  },
  {
    key: 'compact' as const,
    name: '컴팩트 레이아웃',
    desc: '여백을 줄여 더 많은 대화를 한 화면에 표시합니다.',
    icon: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.6"/><rect x="12" y="10" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.4"/><rect x="4" y="15" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.6"/><rect x="12" y="20" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.4"/><rect x="4" y="25" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.6"/></svg>',
  },
  {
    key: 'wide' as const,
    name: '넓은 레이아웃',
    desc: '여유로운 여백으로 가독성을 높인 레이아웃입니다.',
    icon: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="7" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="8" y="15" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="2" y="23" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.6"/></svg>',
  },
]

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const previewMessages = [
  { id: '1', role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
  { id: '2', role: 'user', content: '챗봇 스타일을 변경하고 싶어요' },
  { id: '3', role: 'assistant', content: '좋습니다! 좌측에서 원하시는 색상과 레이아웃을 선택하시면 실시간으로 미리보기가 적용됩니다. 다양한 조합을 시도해보세요!' },
  { id: '4', role: 'user', content: '여러 색상과 레이아웃을 테스트 해볼게요' },
  { id: '5', role: 'assistant', content: '네, 천천히 확인해보시고 마음에 드는 스타일을 선택하신 후 저장 버튼을 눌러주세요.' },
]
</script>
