<template>
  <div class="chat-style l-center">
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
            :style="
              selectedThemeKey === theme.key ? { borderColor: theme.primary, backgroundColor: theme.primaryBg } : {}
            "
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

      <!-- 하단 버튼 -->
      <div class="chat-style-actions">
        <UiButton
          variant="outline"
          size="lg"
          @click="onReset"
        >
          <i class="icon-refresh size-16" />
          초기화
        </UiButton>
        <UiButton
          variant="primary"
          size="lg"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </div>

    <!-- 우측: 미리보기 -->
    <div
      ref="previewRef"
      class="chat-style-preview"
    >
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
            <i class="icon-send size-20" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import type { ThemeColor } from '~/composables/useTheme'
import { openConfirm } from '~/composables/useDialog'

const { themeColors, currentThemeKey, previewTheme, applyTheme } = useTheme()

const previewRef = ref<HTMLElement | null>(null)

// 페이지 진입 시 저장된 테마 기억 (취소용)
const savedThemeKey = ref(currentThemeKey.value)
const selectedThemeKey = ref(currentThemeKey.value)

// 테마 설명
const themeDescriptions: Record<string, string> = {
  blue: '차분하고 신뢰감 있는',
  green: '자연스럽고 편안한',
  purple: '창의적이고 세련된',
  orange: '밝기차고 따뜻한',
}

// 테마 선택 → 미리보기 영역에만 반영 (전역 X, localStorage X)
const onSelectTheme = (theme: ThemeColor) => {
  selectedThemeKey.value = theme.key
  previewTheme(theme, previewRef.value)
}

// 저장 → confirm 후 localStorage에 확정
const onSave = async () => {
  const confirmed = await openConfirm({
    title: '테마 저장',
    message: '선택한 색상 테마를 저장하시겠습니까?',
  })
  if (!confirmed) return

  const theme = themeColors.find((t) => t.key === selectedThemeKey.value)
  if (theme) {
    applyTheme(theme)
    savedThemeKey.value = theme.key
  }
}

// 초기화 → 저장된 테마로 미리보기 복원
const onReset = () => {
  const theme = themeColors.find((t) => t.key === savedThemeKey.value)
  if (theme) {
    selectedThemeKey.value = theme.key
    previewTheme(theme, previewRef.value)
  }
}

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const previewMessages = [
  { id: '1', role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
  { id: '2', role: 'user', content: '챗봇 스타일을 변경하고 싶어요' },
  {
    id: '3',
    role: 'assistant',
    content:
      '좋습니다! 좌측에서 원하시는 색상과 레이아웃을 선택하시면 실시간으로 미리보기가 적용됩니다. 다양한 조합을 시도해보세요!',
  },
  { id: '4', role: 'user', content: '여러 색상과 레이아웃을 테스트 해볼게요' },
  {
    id: '5',
    role: 'assistant',
    content: '네, 천천히 확인해보시고 마음에 드는 스타일을 선택하신 후 저장 버튼을 눌러주세요.',
  },
]
</script>
