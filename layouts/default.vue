<template>
  <div class="layout-default">
    <AppSidebar class="sidebar" />
    <div class="main">
      <AppHeader class="header" />
      <main class="content">
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
  overflow: hidden;

  .sidebar {
    width: $sidebar-width;
    flex-shrink: 0;
    border-right: 1px solid $color-border;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .header {
    height: $header-height;
    flex-shrink: 0;
    border-bottom: 1px solid $color-border;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
  }
}
</style>
