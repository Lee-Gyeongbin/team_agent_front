<template>
  <div class="layout-auth">
    <slot />
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '../assets/styles/utils/mixins' as *;

/* html/body overflow:hidden 전역 — 인증 페이지만 이 영역에서 세로 스크롤 */
.layout-auth {
  height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  @include custom-scrollbar;
}
</style>
