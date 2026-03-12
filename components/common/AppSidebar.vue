<template>
  <aside class="app-sidebar">
    <!-- 햄버거 메뉴 -->
    <button class="sidebar-btn">
      <i class="icon-menu size-20" />
    </button>

    <!-- 네비게이션 아이콘 -->
    <nav class="sidebar-nav">
      <!-- 상단: 설정 메뉴 제외한 일반 메뉴 -->
      <div class="sidebar-nav-top">
        <button
          v-for="item in topNavItems"
          :key="item.menuId"
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
      </div>

      <!-- 하단: 설정 메뉴 드롭다운 (children 구조) -->
      <div
        v-if="bottomMenu"
        class="sidebar-nav-bottom"
      >
        <SidebarMenuDropdown :items="bottomMenu.children ?? []">
          <template #trigger>
            <button
              class="sidebar-btn"
              :class="{ 'is-active': isBottomMenuActive }"
              :title="bottomMenu.menuName"
            >
              <i
                class="size-20"
                :class="bottomMenu.icon"
              />
            </button>
          </template>
        </SidebarMenuDropdown>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types/menu'

const route = useRoute()
const { menuList } = useMenu()

const SETTING_MENU_ID = 'ME000003' // 설정 메뉴 ID

// 상단 메뉴 목록
const topNavItems = computed(() => {
  return menuList.value
    .filter((item) => item.menuId !== SETTING_MENU_ID)
    .map((item) => ({
      menuId: item.menuId,
      icon: item.icon,
      label: item.menuName,
      path: item.srcPath,
    }))
})

// 하단 메뉴 목록
const bottomMenu = computed(() => {
  return menuList.value.find((item) => item.menuId === SETTING_MENU_ID) ?? null
})

// 현재 라우트 기준으로 active 판단
type NavItem = (typeof topNavItems)['value'][number]

function findActiveMenuId(items: MenuItem[], path: string): { menuId: string; pathLen: number } | null {
  let best: { menuId: string; pathLen: number } | null = null
  for (const item of items) {
    const p = item.srcPath
    if (p) {
      const isMatch = path === p || path.startsWith(`${p}/`)
      if (isMatch && (!best || p.length > best.pathLen)) {
        best = { menuId: item.menuId, pathLen: p.length }
      }
    }
    if (item.children?.length) {
      const childBest = findActiveMenuId(item.children, path)
      if (childBest && (!best || childBest.pathLen > best.pathLen)) {
        best = childBest
      }
    }
  }
  return best
}

const activeMenuId = computed(() => {
  const result = findActiveMenuId(menuList.value, route.path)
  return result?.menuId ?? null
})

const isNavItemActive = (item: NavItem) => item.menuId === activeMenuId.value

// 설정 메뉴 하위 메뉴(children/손자) 중 현재 경로와 매칭되면 active
const isBottomMenuActive = computed(() => {
  const menu = bottomMenu.value
  const children = menu?.children
  if (!children?.length) return false

  const hasMatchingDescendant = (items: MenuItem[]): boolean => {
    const path = route.path
    for (const item of items) {
      if (item.srcPath && (path === item.srcPath || path.startsWith(`${item.srcPath}/`))) {
        return true
      }
      if (item.children?.length && hasMatchingDescendant(item.children)) return true
    }
    return false
  }
  return hasMatchingDescendant(children)
})

const onClickNavItem = (item: NavItem) => {
  if (item.path) navigateTo(item.path)
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
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-nav-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.sidebar-nav-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
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
