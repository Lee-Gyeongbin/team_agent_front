<template>
  <div class="layout-default">
    <AppSidebar />
    <div class="main">
      <AppHeader />
      <main class="content content-inner">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.layout-default {
  display: flex;
  height: 100vh;
  min-width: 1024px; // PC 레이아웃 최소 너비 보장
  overflow-x: auto; // 축소 시 가로 스크롤
  overflow-y: hidden;

  @include mobile {
    min-width: auto; // 모바일은 유동 레이아웃
    overflow-x: hidden;
  }

  .main {
    width: calc(100% - #{$sidebar-width}); // 사이드바를 뺀 나머지 너비
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
  }
}
</style>
