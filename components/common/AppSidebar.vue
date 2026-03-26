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
            v-for="(entry, idx) in chatRoomList"
            :key="idx"
            class="search-history-item"
            :class="{
              'is-active': activeRoomId === String(entry.roomId),
              'is-dropdown-open': openMoreDropdownId === entry.roomId,
              'is-pinned': entry.fixYn === 'Y',
            }"
            @click="onClickHistory(entry)"
          >
            <i
              v-if="entry.fixYn === 'Y'"
              class="icon-sidebar-pin size-16"
            />
            <span class="search-history-text">{{ entry.title }}</span>
            <DropdownMenuRoot
              :open="openMoreDropdownId === entry.roomId"
              @update:open="(open) => (openMoreDropdownId = open ? entry.roomId : null)"
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
                  class="sidebar-dropdown-content sidebar-history-context-menu"
                  side="bottom"
                  align="start"
                  :side-offset="4"
                  :collision-padding="8"
                >
                  <DropdownMenuItem
                    class="sidebar-dropdown-item"
                    @select="onContextShare(entry)"
                  >
                    <i class="icon-sidebar-share size-20" />
                    <span>대화공유</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="sidebar-dropdown-item"
                    @select="onContextPin(entry)"
                  >
                    <i class="icon-sidebar-pin size-20" />
                    <span>{{ entry.fixYn === 'Y' ? '고정 해제' : '고정' }}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="sidebar-dropdown-item"
                    @select="onContextRename(entry)"
                  >
                    <i class="icon-sidebar-edit size-20" />
                    <span>이름변경</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="sidebar-dropdown-item type-red"
                    @select="onContextDelete(entry)"
                  >
                    <i class="icon-sidebar-delete size-20" />
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

  <!-- 검색기록 타이틀 변경 모달 -->
  <UiModal
    :is-open="isRenameModalOpen"
    title="검색기록 타이틀 변경"
    position="center"
    max-width="420px"
    @close="handleRenameModalClose"
  >
    <ChatRoomRenameModal
      :room="renamingRoom"
      @save="handleSaveRename"
      @close="handleRenameModalClose"
    />
  </UiModal>
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
import type { ChatRoom } from '~/types/chat'
const { chatRoomList, selectChatRoomList, handleRenameChatRoom, handleDeleteChatRoom, handlePinChatRoom } =
  useChatRooms()
const route = useRoute()
const { menuList } = useMenu()
const SETTING_MENU_ID = 'ME000003'

const isExpanded = ref(false)
const isSearchHistoryOpen = ref(true)
const isSettingsDropdownOpen = ref(false)
/** 검색기록 항목 중 '더보기' 드롭다운이 열린 entry.id (열려 있으면 호버 배경 유지) */
const openMoreDropdownId = ref<string | null>(null)

// route.params.id를 단일 진실 원천으로 사용
const activeRoomId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

// 사이드바 너비를 CSS 변수로 전달 (채팅 패널 레이아웃 계산용)
watch(
  isExpanded,
  (val) => {
    document.documentElement.style.setProperty('--sidebar-width', val ? `${260}px` : `${64}px`)
  },
  { immediate: true },
)

function onClickHistory(entry: ChatRoom) {
  navigateTo(`/chat/${entry.roomId}`)
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

const topNavItems = computed(() => {
  return menuList.value
    .filter((item: MenuItem) => item.menuId !== SETTING_MENU_ID)
    .map((item: MenuItem) => ({
      menuId: item.menuId,
      icon: item.icon,
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

// 대화방 이름 변경 모달
const isRenameModalOpen = ref(false)
const renamingRoom = ref<ChatRoom | null>(null)

function handleRenameModalClose() {
  isRenameModalOpen.value = false
  renamingRoom.value = null
}

async function handleSaveRename(roomTitle: string) {
  if (!renamingRoom.value) return
  await handleRenameChatRoom(renamingRoom.value, roomTitle)
  handleRenameModalClose()
}

// 검색기록 컨텍스트 메뉴 액션
function onContextShare(_entry: ChatRoom) {}
async function onContextPin(_entry: ChatRoom) {
  await handlePinChatRoom(_entry)
}
function onContextRename(entry: ChatRoom) {
  renamingRoom.value = entry
  isRenameModalOpen.value = true
}
async function onContextDelete(entry: ChatRoom) {
  await handleDeleteChatRoom(entry)
}

onMounted(async () => {
  // 채팅방 목록 조회
  await selectChatRoomList()
})
</script>
