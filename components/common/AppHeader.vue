<template>
  <header class="app-header">
    <div class="header-title-wrap">
      <img
        class="header-logo"
        src="~/assets/icons/svg/logo-teamagent.svg"
        alt="TeamAgent"
        @click="navigateTo('/')"
      >
      <span
        v-if="currentPageTitle"
        class="header-page-title"
      >{{ currentPageTitle }}</span>
    </div>
    <div class="header-actions">
      <!-- 테마 색상 -->
      <div class="theme-picker-wrap">
        <button
          class="header-btn"
          title="테마 색상"
          @click="toggleThemePicker"
        >
          <i class="icon-notification size-20" />
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

      <!-- 유저 프로필 -->
      <button
        class="header-btn"
        :title="user?.userNm + ' [' + user?.email + ']' || '로그인'"
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

const isThemePickerOpen = ref(false)

const toggleThemePicker = () => {
  isThemePickerOpen.value = !isThemePickerOpen.value
}

const onSelectTheme = (theme: ThemeColor) => {
  applyTheme(theme)
  isThemePickerOpen.value = false
}

// 외부 클릭 시 닫기
const onClickOutside = (e: MouseEvent) => {
  const wrap = document.querySelector('.theme-picker-wrap')
  if (wrap && !wrap.contains(e.target as Node)) {
    isThemePickerOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const onClickLogout = () => {
  logout()
}
</script>
