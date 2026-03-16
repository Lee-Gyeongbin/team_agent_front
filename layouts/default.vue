<template>
  <div class="layout-default">
    <AppSidebar />
    <div class="main">
      <AppHeader />
      <main
        ref="contentRef"
        class="content"
        @scroll="onScroll"
      >
        <slot />
      </main>
      <!-- 탑 버튼 -->
      <Transition name="fade">
        <button
          v-if="isShowTopBtn"
          class="top-btn"
          title="맨 위로"
          @click="onScrollTop"
        >
          <i class="icon-arrow-down size-20" />
        </button>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const contentRef = ref<HTMLElement | null>(null)
const isShowTopBtn = ref(false)
const isScrolled = ref(false)

// 스크롤 상태를 하위 컴포넌트에 공유
provide('isScrolled', isScrolled)

const onScroll = () => {
  if (!contentRef.value) return
  const scrollTop = contentRef.value.scrollTop
  isShowTopBtn.value = scrollTop > 200
  isScrolled.value = scrollTop > 10
}

const onScrollTop = () => {
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

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
    width: 100%;
    @include custom-scrollbar;
  }

  .top-btn {
    position: fixed;
    bottom: 32px;
    right: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid $color-border;
    border-radius: $border-radius-full;
    background: #fff;
    color: $color-text-secondary;
    cursor: pointer;
    box-shadow: $shadow-md;
    transition: all $transition-fast;
    z-index: $z-sticky;

    i {
      transform: rotate(180deg);
    }

    &:hover {
      color: $color-text-dark;
      border-color: #aebccb;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
