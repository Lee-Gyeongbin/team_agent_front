<template>
  <aside class="app-sidebar">
    <!-- 햄버거 메뉴 -->
    <button class="sidebar-btn">
      <i class="icon-menu size-20" />
    </button>

    <!-- 네비게이션 아이콘 -->
    <nav class="sidebar-nav">
      <!-- ============================================
      🔽 더미 데이터 — 백엔드 연결 시 API로 교체
      ============================================ -->
      <button
        v-for="item in navItems"
        :key="item.icon"
        class="sidebar-btn"
        :class="{ 'is-active': item.isActive }"
        :title="item.label"
      >
        <i
          class="size-20"
          :class="item.icon"
        />
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const navItems = [
  { icon: 'icon-ai-chat', label: 'AI 채팅', isActive: true },
  { icon: 'icon-settings', label: '설정', isActive: false },
  { icon: 'icon-chart', label: '대시보드', isActive: false },
  { icon: 'icon-system', label: '시스템', isActive: false },
  { icon: 'icon-group', label: '팀/그룹', isActive: false },
]
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: $sidebar-width;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background-color: #fff;
  border-right: 1px solid $color-border;
  gap: 12px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 10px;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  color: #4d5462;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover {
    background-color: #ecf0f3;
  }

  &.is-active {
    background-color: #ecf0f3;
    color: #2d3139;
  }
}
</style>
