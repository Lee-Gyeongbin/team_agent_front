<template>
  <header class="app-header">
    <div class="header-title-wrap">
      <img
        class="header-logo"
        src="~/assets/icons/svg/logo-teamagent.svg"
        alt="TeamAgent"
        @click="navigateTo('/')"
      />
      <span
        v-if="currentPageTitle"
        class="header-page-title"
        >{{ currentPageTitle }}</span
      >
    </div>
    <div class="header-actions">
      <!-- 테마 색상 -->
      <div class="theme-picker-wrap">
        <button
          class="header-btn theme-trigger-btn"
          :class="{ 'is-active': isThemePickerOpen }"
          title="테마 색상"
          @click="toggleThemePicker"
        >
          <span
            class="theme-current-dot"
            :style="{ backgroundColor: currentThemeColor?.primary }"
          />
        </button>
        <!-- 테마 팔레트 드롭다운 -->
        <div
          v-if="isThemePickerOpen"
          class="theme-picker"
        >
          <button
            v-for="theme in themeColors"
            :key="theme.key"
            class="theme-color-btn"
            :class="{ 'is-active': currentThemeKey === theme.key }"
            :style="{ backgroundColor: theme.primary }"
            :title="theme.name"
            @click="onSelectTheme(theme)"
          />
        </div>
      </div>

      <!-- 알림 -->
      <div
        ref="notificationWrapRef"
        class="notification-wrap"
      >
        <button
          class="header-btn notif-trigger-btn"
          :class="{ 'is-active': isNotificationOpen }"
          title="알림"
          @click="toggleNotification"
        >
          <i class="icon-notification size-20" />
          <span
            v-if="unreadCount > 0"
            class="notif-badge"
          />
        </button>

        <!-- 알림 패널 -->
        <div
          v-if="isNotificationOpen"
          class="notification-panel"
        >
          <div class="notif-panel-header">
            <span class="notif-panel-title">
              알림
              <em
                v-if="unreadCount > 0"
                class="notif-count"
                >{{ unreadCount }}</em
              >
            </span>
            <button
              class="notif-read-all-btn"
              @click="handleMarkAllRead"
            >
              모두 읽음
            </button>
          </div>

          <div
            v-if="notifyList.length > 0"
            class="notif-list"
          >
            <div
              v-for="item in notifyList"
              :key="item.notifyId"
              class="notif-item"
              :class="{ 'is-unread': item.readYn === 'N' }"
              @click="handleMarkRead(item.notifyId)"
            >
              <div
                class="notif-avatar"
                :style="{ backgroundColor: getAvatarColor(item.sendUserId) }"
              >
                {{ getInitials(item) }}
              </div>
              <div class="notif-body">
                <div class="notif-meta">
                  <span class="notif-sender">{{ item.sendUserNm ?? item.sendUserId }}</span>
                  <span class="notif-time">{{ item.createDt }}</span>
                </div>
                <div class="notif-title">{{ item.title }}</div>
                <p class="notif-message">{{ item.content }}</p>
              </div>
              <button
                class="notif-dismiss-btn"
                title="닫기"
                @click.stop="handleDismissNotify(item.notifyId)"
              >
                <i class="icon-close size-12" />
              </button>
            </div>
          </div>

          <div
            v-else-if="notifyLoading"
            class="notif-empty"
          >
            알림을 불러오는 중입니다...
          </div>

          <div
            v-else
            class="notif-empty"
          >
            새로운 알림이 없습니다.
          </div>
        </div>
      </div>

      <!-- 유저 프로필 -->
      <button
        class="header-btn"
        :title="user?.userNm + ' [' + user?.email + ']' || '로그인'"
        @click="navigateTo('/my-page')"
      >
        <i class="icon-user size-20" />
      </button>

      <!-- 로그아웃 (로그인 세션 있을 때만 표시) -->
      <button
        v-if="isLoggedIn"
        class="header-btn"
        title="로그아웃"
        @click="onClickLogout"
      >
        <i class="icon-logout size-20" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { ThemeColor } from '~/composables/useTheme'
import type { MenuItem } from '~/types/menu'

const route = useRoute()
const { user, isLoggedIn, logout } = useAuth()
const { menuList } = useMenu()
const { themeColors, currentThemeKey, applyTheme } = useTheme()

// 헤더 타이틀 제외 목록 (검색하기 등 별도 헤더를 가진 페이지)
const EXCLUDE_TITLES = ['검색하기']

// 현재 라우트에 매칭되는 메뉴명 추출
const currentPageTitle = computed(() => {
  const path = route.path
  const result = { name: '', pathLen: 0 }
  const search = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.srcPath && (path === item.srcPath || path.startsWith(`${item.srcPath}/`))) {
        if (item.srcPath.length > result.pathLen) {
          result.name = item.menuName
          result.pathLen = item.srcPath.length
        }
      }
      if (item.children?.length) search(item.children)
    }
  }
  search(menuList.value)
  if (!result.name || EXCLUDE_TITLES.includes(result.name)) return ''
  return result.name
})

// ── 테마 피커 ──────────────────────────────────────────
const currentThemeColor = computed(() => themeColors.find((t) => t.key === currentThemeKey.value))

const isThemePickerOpen = ref(false)

const toggleThemePicker = () => {
  isThemePickerOpen.value = !isThemePickerOpen.value
}

const onSelectTheme = (theme: ThemeColor) => {
  applyTheme(theme)
  isThemePickerOpen.value = false
}

// ── 알림 ──────────────────────────────────────────────
const {
  notifyList,
  notifyLoading,
  unreadCount,
  getInitials,
  getAvatarColor,
  handleMarkRead,
  handleMarkAllRead,
  handleDismissNotify,
} = useNotifyStore()

const isNotificationOpen = ref(false)
const notificationWrapRef = ref<HTMLElement | null>(null)

const toggleNotification = () => {
  isNotificationOpen.value = !isNotificationOpen.value
}

// ── 외부 클릭 시 닫기 ─────────────────────────────────
const onClickOutside = (e: MouseEvent) => {
  const themeWrap = document.querySelector('.theme-picker-wrap')
  if (themeWrap && !themeWrap.contains(e.target as Node)) {
    isThemePickerOpen.value = false
  }
  if (notificationWrapRef.value && !notificationWrapRef.value.contains(e.target as Node)) {
    isNotificationOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const onClickLogout = () => {
  logout()
}
</script>
