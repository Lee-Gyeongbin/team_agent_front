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
        title="프로필"
      >
        <i class="icon-user size-20" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts"></script>
