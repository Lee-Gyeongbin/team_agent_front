<template>
  <header class="app-header">
    <div class="header-actions">
      <!-- 알림 -->
      <button
        class="header-btn"
        title="알림"
      >
        <i class="icon-notification size-20" />
        <!-- 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 -->
        <span class="status-dot" />
      </button>

      <!-- 유저 프로필 -->
      <button
        class="header-btn"
        :title="user?.userNm + ' [' + user?.deptNm + ']' || '로그인'"
        @click="onClickProfile"
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
const { user, isLoggedIn, logout } = useAuth()

const onClickProfile = () => {
  // 세션에 사용자 정보가 있으면 현재 페이지(/chat 등) 유지, 없으면 로그인으로
  if (!isLoggedIn.value) {
    navigateTo('/login')
  }
  // 로그인 상태일 때는 추후 프로필 메뉴/드롭다운 등으로 확장 가능
}

const onClickLogout = () => {
  logout()
}
</script>
