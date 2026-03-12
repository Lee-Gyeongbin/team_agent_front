<template>
  <aside
    class="app-sidebar"
    :class="{ 'is-expanded': isExpanded }"
  >
    <!-- 햄버거 메뉴 -->
    <button
      class="sidebar-btn sidebar-toggle-btn"
      @click="toggleExpanded"
    >
      <i class="sidebar-icon icon-menu size-20" />
    </button>

    <!-- 통합 네비게이션: 접힘/펼침 모두 동일 마크업, CSS로 표시 제어 -->
    <nav class="sidebar-nav">
      <div class="sidebar-nav-top">
        <button
          v-for="item in topNavItems"
          :key="item.menuId"
          class="sidebar-nav-item"
          :class="{ 'is-active': isNavItemActive(item) }"
          :title="!isExpanded ? item.label : undefined"
          @click="onClickNavItem(item)"
        >
          <i
            class="sidebar-icon sidebar-nav-icon size-20"
            :class="item.icon"
          />
          <span class="sidebar-nav-label">{{ item.label }}</span>
        </button>
      </div>

      <!-- 검색기록: 펼침 상태에서만 존재 -->
      <section
        v-if="isExpanded"
        class="sidebar-section"
      >
        <button
          class="sidebar-section-head"
          @click="isSearchHistoryOpen = !isSearchHistoryOpen"
        >
          <span class="sidebar-section-title">검색기록</span>
          <i
            class="icon-sidebar-arrow-down size-12 section-chevron"
            :class="{ 'is-open': isSearchHistoryOpen }"
          />
        </button>
        <div
          v-show="isSearchHistoryOpen"
          class="sidebar-section-body"
        >
          <div
            v-for="(entry, idx) in searchHistoryDummy"
            :key="idx"
            class="search-history-item"
            :class="{
              'is-active': selectedHistoryId === entry.id,
              'is-dropdown-open': openMoreDropdownId === entry.id,
            }"
            @click="selectedHistoryId = entry.id"
          >
            <span class="search-history-text">{{ entry.query }}</span>
            <DropdownMenuRoot
              :open="openMoreDropdownId === entry.id"
              @update:open="(open) => (openMoreDropdownId = open ? entry.id : null)"
            >
              <DropdownMenuTrigger as-child>
                <button
                  class="search-history-more"
                  type="button"
                  title="더보기"
                  @click.stop
                >
                  <i class="icon-sidebar-more size-20" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  class="search-history-context"
                  side="right"
                  align="end"
                  :side-offset="4"
                  :collision-padding="8"
                >
                  <DropdownMenuItem
                    class="context-item"
                    @select="onContextShare(entry)"
                  >
                    <i class="icon-transfer size-16" />
                    <span>대화공유</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="context-item"
                    @select="onContextPin(entry)"
                  >
                    <i class="icon-star-line size-16" />
                    <span>고정</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="context-item"
                    @select="onContextRename(entry)"
                  >
                    <i class="icon-edit size-16" />
                    <span>이름변경</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="context-item"
                    @select="onContextDelete(entry)"
                  >
                    <i class="icon-trashcan size-16" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
          </div>
        </div>
      </section>

      <!-- 하단: 설정 트리거 (아이콘 + 텍스트, 접힘 시 아이콘만) -->
      <div
        v-if="bottomMenu"
        class="sidebar-nav-bottom"
      >
        <SidebarMenuDropdown
          v-model:open="isSettingsDropdownOpen"
          :items="bottomMenu.children ?? []"
        >
          <template #trigger>
            <button
              class="sidebar-nav-item sidebar-settings-trigger"
              :class="{ 'is-active': isBottomMenuActive || isSettingsDropdownOpen }"
              :title="!isExpanded ? bottomMenu.menuName : undefined"
            >
              <i class="sidebar-icon sidebar-nav-icon size-20 icon-sidebar-settings" />
              <span class="sidebar-nav-label">{{ bottomMenu.menuName }}</span>
              <i class="sidebar-icon icon-arrow-right size-16 sidebar-settings-arrow" />
            </button>
          </template>
        </SidebarMenuDropdown>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue'
import type { MenuItem } from '~/types/menu'

const route = useRoute()
const { menuList } = useMenu()

const SETTING_MENU_ID = 'ME000003'
const KNOWLEDGE_MENU_LABEL = '내 지식창고'

const isExpanded = ref(false)
const isSearchHistoryOpen = ref(true)
const isSettingsDropdownOpen = ref(false)
/** 검색기록 항목 중 '더보기' 드롭다운이 열린 entry.id (열려 있으면 호버 배경 유지) */
const openMoreDropdownId = ref<string | null>(null)
const selectedHistoryId = ref<string | null>(null)

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const searchHistoryDummy = ref([
  { id: '1', query: '업무관리에서 칸반 보드는 어떻게...' },
  { id: '2', query: '회의실 예약 절차 알려주세요' },
  { id: '3', query: '휴가 신청 방법이 뭐지?' },
  { id: '4', query: '협업 업무를 내 보드로 가져오는 방...' },
  { id: '5', query: 'ERP에서 재고 조회는 어디서 하지?' },
  { id: '6', query: '전자결재 반려 후 재상신 방법 알려줘' },
  { id: '7', query: '2025년 우리회사 월별매출액은 얼...' },
  { id: '8', query: '부서별 인원 현황 조회해줘' },
  { id: '9', query: '최근 3개월 매출 추이 알려줘' },
])

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

const topNavItems = computed(() => {
  return menuList.value
    .filter((item: MenuItem) => item.menuId !== SETTING_MENU_ID)
    .map((item: MenuItem) => ({
      menuId: item.menuId,
      icon: item.menuName === KNOWLEDGE_MENU_LABEL ? 'icon-sidebar-database' : item.icon,
      label: item.menuName,
      path: item.srcPath,
    }))
})

const bottomMenu = computed(() => {
  return menuList.value.find((item: MenuItem) => item.menuId === SETTING_MENU_ID) ?? null
})

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

function onClickNavItem(item: NavItem) {
  if (item.path) navigateTo(item.path)
}

// 검색기록 컨텍스트 메뉴 액션 (더미 — 추후 연동)
function onContextShare(_entry: { id: string; query: string }) {}
function onContextPin(_entry: { id: string; query: string }) {}
function onContextRename(_entry: { id: string; query: string }) {}
function onContextDelete(_entry: { id: string; query: string }) {}
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: $sidebar-width-collapsed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 8px;
  background-color: #f4f7f9;
  border-right: 1px solid #ecf0f3;
  gap: 8px;
  transition: width $transition-base;

  &.is-expanded {
    width: $sidebar-width;
    align-items: stretch;
  }
}

// 사이드바 버튼 공통 값 (기본/호버/액티브)
$sidebar-btn-bg-hover: #dce4e9;
$sidebar-btn-bg-active: #dee9fb;

/* 토글 버튼: 기본 + 호버만 (is-active 없음) */
.sidebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: $border-radius-full;
  background: transparent;
  color: $color-text-primary;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover {
    background-color: $sidebar-btn-bg-hover;
  }
}

.sidebar-toggle-btn {
  flex-shrink: 0;
}

/* 버튼 내 아이콘: 부모 color 상속 → is-active 시 아이콘도 $color-primary */
.sidebar-btn .sidebar-icon,
.sidebar-nav-item .sidebar-icon {
  color: inherit;
}

/* 네비 아이템: 기본 + 호버 + is-active (접힘 시 원형) */
.sidebar-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: $border-radius-full;
  background: transparent;
  color: $color-text-primary;
  font-size: $font-size-base;
  font-weight: $font-weight-normal;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover {
    background-color: $sidebar-btn-bg-hover;
  }

  &.is-active {
    background-color: $sidebar-btn-bg-active;
    color: $color-primary;
  }

  &.is-active .icon-sidebar-database {
    font-size: 16px;
  }
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-nav-top,
.sidebar-nav-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sidebar-nav-icon {
  flex-shrink: 0;
}

.sidebar-nav-label {
  display: none;
}

.sidebar-settings-arrow {
  display: none;
}

/* 펼침: 풀 너비 메뉴, 라벨·화살표 표시 */
.app-sidebar.is-expanded {
  .sidebar-nav {
    align-items: stretch;
  }

  .sidebar-nav-top,
  .sidebar-nav-bottom {
    align-items: stretch;
  }

  .sidebar-nav-item {
    width: 100%;
    justify-content: flex-start;
    padding: 8px;
    max-height: none;
    border-radius: $border-radius-base;
    gap: 8px;
    text-align: left;

    &:hover {
      background-color: $color-border-light;
    }

    &.is-active {
      background-color: $color-chat-user-bg;
      color: $color-primary;
    }
  }

  .sidebar-nav-label {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 600;
  }

  .sidebar-settings-trigger .sidebar-settings-arrow {
    display: block;
    flex-shrink: 0;
    color: $color-text-secondary;
    opacity: 0.8;
  }

  .sidebar-nav-bottom {
    border-top: 1px solid $color-border-light;
    padding-top: 8px;
  }
}

.sidebar-section {
  margin-top: 8px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  height: 32px;
  padding: 7px 0;
  border: none;
  background: transparent;
  color: #828fa9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  .sidebar-section-title {
    text-align: left;
  }
}

.section-chevron {
  flex-shrink: 0;
  color: $color-text-secondary;
  transition: transform $transition-fast;
  transform: rotate(-90deg);

  &.is-open {
    transform: rotate(0);
  }
}

.sidebar-section-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  @include custom-scrollbar;
}

.search-history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 32px;
  padding: 4px 8px;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #2d3139;
  text-align: left;
  cursor: pointer;
  transition: background-color $transition-fast;

  .search-history-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-history-more {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 6px;
    border: none;
    background-color: transparent;
    color: $color-text-secondary;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity $transition-fast,
      background-color $transition-fast;
  }

  .icon-sidebar-more {
    background-color: $color-text-primary;
  }

  &:hover,
  &.is-dropdown-open {
    background-color: #dce4e9;
    .search-history-more {
      opacity: 1;
      background-color: #f4f7f9;
    }
  }

  &.is-active {
    background-color: $sidebar-btn-bg-active;
    color: $color-primary;

    .search-history-more {
      opacity: 1;
      background-color: #fff;
    }

    .icon-sidebar-more {
      background-color: $color-primary;
    }
  }
}

/* 검색기록 컨텍스트 메뉴 — Portal이라 scoped 제한 있음, 필요 시 :deep 또는 비-scoped */
:deep(.search-history-context) {
  min-width: 140px;
  padding: 6px;
  border-radius: $border-radius-base;
  background: #fff;
  border: 1px solid $color-border;
  box-shadow: $shadow-md;
  z-index: $z-dropdown;
}

:deep(.context-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: $border-radius-sm;
  font-size: $font-size-base;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;

  &:hover,
  &[data-highlighted] {
    background-color: $color-border-light;
  }
}
</style>
