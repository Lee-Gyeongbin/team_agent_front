<template>
  <div class="layout-default">
    <AppSidebar />
    <div class="main">
      <AppHeader />
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.layout-default {
  display: flex;
  height: 100vh;
  overflow: hidden;

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
