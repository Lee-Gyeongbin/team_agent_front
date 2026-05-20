<template>
  <aside
    class="app-sidebar"
    :class="{ 'is-expanded': isExpanded }"
  >
    <!-- 사이드바 펼침/접힘 (기본: 패널 막대, 호버: > / <) -->
    <div class="sidebar-top">
      <button
        type="button"
        class="sidebar-btn sidebar-toggle-btn"
        :title="isExpanded ? '사이드바 닫기 (Ctrl + .)' : '사이드바 펼치기 (Ctrl + .)'"
        :aria-label="isExpanded ? '사이드바 닫기 (Ctrl + .)' : '사이드바 펼치기 (Ctrl + .)'"
        @click="toggleExpanded"
      >
        <i class="sidebar-icon sidebar-toggle-icon--default icon-sidebar-panel sidebar-toggle-icon-size" />
        <i
          class="sidebar-icon sidebar-toggle-icon--hover sidebar-toggle-icon-size"
          :class="isExpanded ? 'icon-sidebar-panel-collapse' : 'icon-sidebar-panel-expand'"
        />
      </button>
    </div>

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
          ref="searchHistoryScrollEl"
          class="sidebar-section-body"
          @scroll="onSearchHistoryScroll"
        >
          <div
            v-for="(entry, historyIdx) in displayedChatRooms"
            :key="chatRoomRowKey(entry, historyIdx)"
            class="search-history-item"
            :data-room-id="normalizeChatRoomId(entry.roomId)"
            :class="{
              'is-active': activeRoomId === normalizeChatRoomId(entry.roomId),
              'is-dropdown-open': openMoreDropdownId === normalizeChatRoomId(entry.roomId),
              'is-pinned': entry.fixYn === 'Y',
              'is-revealing': searchHistoryRevealIdSet.has(normalizeChatRoomId(entry.roomId)),
            }"
            @click="onClickHistory(entry)"
          >
            <i
              v-if="entry.fixYn === 'Y'"
              class="icon-sidebar-pin size-16"
            />
            <span class="search-history-text">{{ entry.title }}</span>
            <DropdownMenuRoot
              :open="openMoreDropdownId === normalizeChatRoomId(entry.roomId)"
              @update:open="onHistoryDropdownOpenChange(entry, $event)"
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
          <template v-if="isSearchHistoryLoadingMore">
            <div
              v-for="sk in searchHistorySkeletonSlots"
              :key="`search-history-sk-${sk}`"
              class="search-history-skeleton-row"
              aria-hidden="true"
            >
              <span class="search-history-skeleton-bar" />
            </div>
          </template>
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

  <!-- 첨부파일 공유 옵션 모달 -->
  <UiModal
    :is-open="isShareOptionModalOpen"
    title="공유 방식 선택"
    position="center"
    max-width="420px"
    @close="onShareOptionCancel"
  >
    <ChatRoomShareOptionModal
      :is-open="isShareOptionModalOpen"
      @confirm="onShareOptionConfirm"
      @cancel="onShareOptionCancel"
    />
  </UiModal>

  <!-- 대화 공유 링크 모달 -->
  <UiModal
    :is-open="isShareModalOpen"
    title="공유 가능한 공개 링크"
    position="center"
    max-width="480px"
    @close="handleShareModalClose"
  >
    <ChatRoomShareModal
      :share-token="sharingShareToken"
      @close="handleShareModalClose"
    />
  </UiModal>

  <!-- 검색기록 타이틀 변경 모달 -->
  <UiModal
    :is-open="isRenameModalOpen"
    title="검색기록 이름 변경"
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
import { normalizeChatRoomId, parseChatRoomIdFromChatPath } from '~/utils/chat/chatRoomIdUtil'
const {
  chatRoomList,
  selectChatRoomList,
  handleRenameChatRoom,
  handleDeleteChatRoom,
  handlePinChatRoom,
  handleCheckRoomAttachment,
  handleBuildShareToken,
} = useChatRooms()
const route = useRoute()
const { menuList } = useMenu()
const SETTING_MENU_ID = 'ME000003'

/** 검색기록: 초기 표시 개수, 스크롤 하단 시 추가 로드 단위 (클라이언트 슬라이스) */
const SEARCH_HISTORY_INITIAL = 30
const SEARCH_HISTORY_LOAD_MORE = 5
/** 스켈레톤 표시 후 실제 행을 붙이기까지 지연 (ms) */
const SEARCH_HISTORY_LOAD_DELAY_MS = 1420
/** 하단에서 이 px 이내면 추가 로드 시도 */
const SEARCH_HISTORY_NEAR_BOTTOM_PX = 40
/**
 * 로드 직후 맨 아래에서 띄울 여백(px).
 * 반드시 `SEARCH_HISTORY_NEAR_BOTTOM_PX`보다 커야, 힌트 적용 후에도 연속 로드가 다시 걸리지 않음.
 */
const SEARCH_HISTORY_TAIL_HINT_GAP_PX = SEARCH_HISTORY_NEAR_BOTTOM_PX + 24

const searchHistoryVisibleCount = ref(SEARCH_HISTORY_INITIAL)
const isSearchHistoryLoadingMore = ref(false)
const pendingSearchHistorySkeletonCount = ref(0)
const searchHistoryRevealIdSet = shallowRef<Set<string>>(new Set())

/** API가 숫자/문자 혼재로 내려줄 때 :key·활성 행·드롭다운 open 상태가 어긋나 DOM 재사용 버그가 나지 않도록 통일 */
function chatRoomRowKey(entry: ChatRoom, idx: number) {
  const id = normalizeChatRoomId(entry.roomId)
  return id ? id : `room-unknown-${idx}`
}

const displayedChatRooms = computed(() => {
  const list = chatRoomList.value
  const n = Math.min(searchHistoryVisibleCount.value, list.length)
  return list.slice(0, n)
})

const searchHistorySkeletonSlots = computed(() => {
  const n = pendingSearchHistorySkeletonCount.value
  if (n <= 0) return []
  return Array.from({ length: n }, (_, i) => i)
})

const searchHistoryScrollEl = ref<HTMLElement | null>(null)

let searchHistoryLoadMoreRaf = 0
let searchHistoryLoadMoreTimer: ReturnType<typeof setTimeout> | null = null
let searchHistoryRevealClearTimer: ReturnType<typeof setTimeout> | null = null

/** `scrollTop`을 코드에서 바꿀 때 생기는 scroll 이벤트로 인한 연속 로드 방지 (ms) */
const SEARCH_HISTORY_SUPPRESS_SCROLL_LOAD_MS = 72
let searchHistorySuppressLoadScrollUntil = 0

function applySearchHistoryScrollLayout(layout: () => void) {
  searchHistorySuppressLoadScrollUntil = performance.now() + SEARCH_HISTORY_SUPPRESS_SCROLL_LOAD_MS
  layout()
}

function pinSearchHistoryScrollToBottom() {
  const el = searchHistoryScrollEl.value
  if (!el) return
  applySearchHistoryScrollLayout(() => {
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
  })
}

/** 추가 로드 직후: 아직 숨겨진 검색기록이 있으면 스크롤을 살짝 올려 ‘더 있음’이 보이게 함 */
function adjustSearchHistoryScrollAfterLoadMore() {
  const el = searchHistoryScrollEl.value
  if (!el) return
  applySearchHistoryScrollLayout(() => {
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    const hasMoreBelow = searchHistoryVisibleCount.value < chatRoomList.value.length
    const gapPx = hasMoreBelow ? SEARCH_HISTORY_TAIL_HINT_GAP_PX : 0
    el.scrollTop = Math.max(0, maxScroll - gapPx)
  })
}

function resetSearchHistoryLoadMoreUi() {
  if (searchHistoryLoadMoreTimer) {
    clearTimeout(searchHistoryLoadMoreTimer)
    searchHistoryLoadMoreTimer = null
  }
  if (searchHistoryRevealClearTimer) {
    clearTimeout(searchHistoryRevealClearTimer)
    searchHistoryRevealClearTimer = null
  }
  isSearchHistoryLoadingMore.value = false
  pendingSearchHistorySkeletonCount.value = 0
  searchHistoryRevealIdSet.value = new Set()
}

watch(chatRoomList, resetSearchHistoryLoadMoreUi)

watch(
  () => chatRoomList.value.length,
  (len) => {
    if (searchHistoryVisibleCount.value > len) {
      searchHistoryVisibleCount.value = len
    }
  },
)

function finishSearchHistoryLoadMore() {
  searchHistoryLoadMoreTimer = null
  const list = chatRoomList.value
  const prev = searchHistoryVisibleCount.value
  const total = list.length
  const add = Math.min(SEARCH_HISTORY_LOAD_MORE, total - prev)
  if (add <= 0) {
    isSearchHistoryLoadingMore.value = false
    pendingSearchHistorySkeletonCount.value = 0
    return
  }
  const addedIds = list.slice(prev, prev + add).map((r) => normalizeChatRoomId(r.roomId))
  searchHistoryVisibleCount.value = prev + add
  isSearchHistoryLoadingMore.value = false
  pendingSearchHistorySkeletonCount.value = 0
  searchHistoryRevealIdSet.value = new Set(addedIds)
  if (searchHistoryRevealClearTimer) clearTimeout(searchHistoryRevealClearTimer)
  searchHistoryRevealClearTimer = setTimeout(() => {
    searchHistoryRevealClearTimer = null
    searchHistoryRevealIdSet.value = new Set()
  }, 1520)

  void nextTick(() => {
    requestAnimationFrame(() => {
      adjustSearchHistoryScrollAfterLoadMore()
    })
  })
}

function beginSearchHistoryLoadMore() {
  if (isSearchHistoryLoadingMore.value) return
  const prev = searchHistoryVisibleCount.value
  const total = chatRoomList.value.length
  if (prev >= total) return

  const add = Math.min(SEARCH_HISTORY_LOAD_MORE, total - prev)
  isSearchHistoryLoadingMore.value = true
  pendingSearchHistorySkeletonCount.value = add
  searchHistoryLoadMoreTimer = setTimeout(finishSearchHistoryLoadMore, SEARCH_HISTORY_LOAD_DELAY_MS)

  void nextTick(() => {
    requestAnimationFrame(() => {
      pinSearchHistoryScrollToBottom()
    })
  })
}

function onSearchHistoryScroll(ev: Event) {
  if (performance.now() < searchHistorySuppressLoadScrollUntil) return
  if (isSearchHistoryLoadingMore.value) return
  const el = ev.target as HTMLElement
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distanceFromBottom > SEARCH_HISTORY_NEAR_BOTTOM_PX) return
  if (searchHistoryVisibleCount.value >= chatRoomList.value.length) return
  if (searchHistoryLoadMoreRaf) return

  searchHistoryLoadMoreRaf = requestAnimationFrame(() => {
    searchHistoryLoadMoreRaf = 0
    if (searchHistoryVisibleCount.value >= chatRoomList.value.length) return
    beginSearchHistoryLoadMore()
  })
}

onUnmounted(() => {
  if (searchHistoryLoadMoreRaf) {
    cancelAnimationFrame(searchHistoryLoadMoreRaf)
    searchHistoryLoadMoreRaf = 0
  }
  resetSearchHistoryLoadMoreUi()
})

const isExpanded = ref(false)
const isSearchHistoryOpen = ref(true)
const isSettingsDropdownOpen = ref(false)
/** 검색기록 항목 중 '더보기' 드롭다운이 열린 roomId (normalize된 문자열) */
const openMoreDropdownId = ref<string | null>(null)

function onHistoryDropdownOpenChange(entry: ChatRoom, open: boolean) {
  openMoreDropdownId.value = open ? normalizeChatRoomId(entry.roomId) : null
}

// URL 경로 기준 활성 방 — 동적 라우트 전환 시 params 반영 타이밍보다 일관됨
const activeRoomId = computed(() => parseChatRoomIdFromChatPath(route.path))

// 사이드바 너비를 CSS 변수로 전달 (채팅 패널 레이아웃 계산용)
watch(
  isExpanded,
  (val) => {
    document.documentElement.style.setProperty('--sidebar-width', val ? `${260}px` : `${64}px`)
  },
  { immediate: true },
)

async function onClickHistory(entry: ChatRoom) {
  const id = normalizeChatRoomId(entry.roomId)
  if (!id) return
  // 다른 행 클릭 시 열려 있던 더보기·radix 상태가 클릭/네비를 방해하지 않도록 닫음
  openMoreDropdownId.value = null
  const targetPath = `/chat/${id}`
  if (route.path === targetPath || route.path === `${targetPath}/`) return
  await navigateTo({ path: targetPath })
}

/** 라우트상 활성 방이 클라이언트 슬라이스 밖이면 표시 개수를 늘려 하이라이트·클릭 대상이 일치하도록 함 */
function ensureSearchHistoryShowsRoom(roomIdNorm: string) {
  if (!roomIdNorm) return
  const idx = chatRoomList.value.findIndex((r) => normalizeChatRoomId(r.roomId) === roomIdNorm)
  if (idx < 0) return
  const need = idx + 1
  if (searchHistoryVisibleCount.value < need) {
    searchHistoryVisibleCount.value = Math.min(need, chatRoomList.value.length)
  }
}

function scrollActiveHistoryRowIntoView(roomIdNorm: string) {
  if (!isExpanded.value || !isSearchHistoryOpen.value || !roomIdNorm) return
  const container = searchHistoryScrollEl.value
  if (!container) return
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(roomIdNorm)
      : roomIdNorm.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const row = container.querySelector<HTMLElement>(`[data-room-id="${escaped}"]`)
  row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

watch([activeRoomId, chatRoomList, isExpanded, isSearchHistoryOpen], async ([id]) => {
  ensureSearchHistoryShowsRoom(id)
  await nextTick()
  requestAnimationFrame(() => scrollActiveHistoryRowIntoView(id))
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

/** 단축키 무시: 텍스트 입력 중에는 사이드바 토글하지 않음 */
function isSidebarShortcutWritingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return Boolean(target.closest('[contenteditable="true"]'))
}

/** 전역: Ctrl + . → 사이드바 펼침/접힘 (기본 레이아웃에서만 등록됨) */
const SIDEBAR_TOGGLE_SHORTCUT_OPTS: AddEventListenerOptions = { capture: true }
function onSidebarToggleShortcut(ev: KeyboardEvent) {
  if (!ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey) return
  if (ev.code !== 'Period' && ev.key !== '.') return
  if (isSidebarShortcutWritingTarget(ev.target)) return
  ev.preventDefault()
  toggleExpanded()
}

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onSidebarToggleShortcut, SIDEBAR_TOGGLE_SHORTCUT_OPTS)
  }
})

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

// 공유 옵션 모달 (첨부파일 있는 경우만 표시)
const isShareOptionModalOpen = ref(false)
const pendingShareRoomId = ref('')

// 공유 링크 모달
const isShareModalOpen = ref(false)
const sharingShareToken = ref('')

function handleShareModalClose() {
  isShareModalOpen.value = false
  sharingShareToken.value = ''
}

/** 토큰 발급 후 공유 링크 모달 오픈 */
async function proceedShareToken(roomId: string, includeAttachment: 'Y' | 'N') {
  const token = await handleBuildShareToken(roomId, includeAttachment)
  if (!token) return
  sharingShareToken.value = token
  isShareModalOpen.value = true
}

// 검색기록 컨텍스트 메뉴 액션
async function onContextShare(entry: ChatRoom) {
  const hasAttachment = await handleCheckRoomAttachment(entry.roomId)
  if (hasAttachment) {
    // 첨부파일 있음 → 옵션 모달 표시
    pendingShareRoomId.value = entry.roomId
    isShareOptionModalOpen.value = true
  } else {
    // 첨부파일 없음 → 바로 토큰 발급
    await proceedShareToken(entry.roomId, 'Y')
  }
}

async function onShareOptionConfirm(includeAttachment: 'Y' | 'N') {
  isShareOptionModalOpen.value = false
  await proceedShareToken(pendingShareRoomId.value, includeAttachment)
  pendingShareRoomId.value = ''
}

function onShareOptionCancel() {
  isShareOptionModalOpen.value = false
  pendingShareRoomId.value = ''
}
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
  if (import.meta.client) {
    window.addEventListener('keydown', onSidebarToggleShortcut, SIDEBAR_TOGGLE_SHORTCUT_OPTS)
  }
  // 채팅방 목록 조회
  await selectChatRoomList()
})
</script>
