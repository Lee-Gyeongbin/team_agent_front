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
        :class="{ 'is-active': isNavItemActive(item) }"
        :title="item.label"
        @click="onClickNavItem(item)"
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
const route = useRoute()

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const navItems = [
  { icon: 'icon-ai-chat', label: 'AI 채팅', path: '/chat' },
  { icon: 'icon-knowledge', label: '내지식창고', path: '/library' },
  { icon: 'icon-database', label: '로그인이력', path: '/login-history' },
]

// 현재 라우트 기준으로 active 판단 (URL 직접 입력, 뒤로가기 시에도 정확히 반영)
const isNavItemActive = (item: (typeof navItems)[number]) => {
  const path = route.path
  if (item.path === '/') return path === '/'
  return path === item.path || path.startsWith(`${item.path}/`)
}

const onClickNavItem = (item: (typeof navItems)[number]) => {
  navigateTo(item.path)
}
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
