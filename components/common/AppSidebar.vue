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
  { id: '1', query: '업무관리에서 칸반 보드는 어떻게 하나요?' },
  { id: '2', query: '회의실 예약 절차 알려주세요' },
  { id: '3', query: '휴가 신청 방법이 뭐지?' },
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
