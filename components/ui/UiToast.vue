<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="ui-toast-container"
    >
      <div
        v-for="toast in toastList"
        :key="toast.id"
        :class="['ui-toast', `type-${toast.type}`]"
      >
        <!-- 타입별 인라인 SVG 아이콘 -->
        <svg
          class="ui-toast-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <!-- success: 체크 원 -->
          <template v-if="toast.type === 'success'">
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="#22c55e"
              opacity="0.12"
            />
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="#22c55e"
              stroke-width="1.2"
              fill="none"
            />
            <path
              d="M6.5 10.5L9 13L13.5 7.5"
              stroke="#22c55e"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </template>

          <!-- error: X 원 -->
          <template v-else-if="toast.type === 'error'">
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="#ef4444"
              opacity="0.12"
            />
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="#ef4444"
              stroke-width="1.2"
              fill="none"
            />
            <path
              d="M7.5 7.5L12.5 12.5M12.5 7.5L7.5 12.5"
              stroke="#ef4444"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </template>

          <!-- warning: 삼각형 느낌표 -->
          <template v-else-if="toast.type === 'warning'">
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="#f59e0b"
              opacity="0.12"
            />
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="#f59e0b"
              stroke-width="1.2"
              fill="none"
            />
            <path
              d="M10 6.5V11"
              stroke="#f59e0b"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle
              cx="10"
              cy="13.5"
              r="0.75"
              fill="#f59e0b"
            />
          </template>

          <!-- info: i 원 -->
          <template v-else>
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="#3b82f6"
              opacity="0.12"
            />
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="#3b82f6"
              stroke-width="1.2"
              fill="none"
            />
            <circle
              cx="10"
              cy="6.5"
              r="0.75"
              fill="#3b82f6"
            />
            <path
              d="M10 9V13.5"
              stroke="#3b82f6"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </template>
        </svg>

        <p class="ui-toast-message">{{ toast.message }}</p>
        <button
          class="ui-toast-close"
          @click="closeToast(toast.id)"
        >
          <i class="icon-close size-12" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
const { toastList } = useToastState()
</script>

<style lang="scss" scoped>
.ui-toast-container {
  position: fixed;
  top: calc($header-height + $spacing-sm);
  right: $spacing-lg;
  z-index: $z-toast;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  pointer-events: none;
}

.ui-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 440px;
  padding: $spacing-md $spacing-lg;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  pointer-events: auto;

  &.type-success {
    border-left: 3px solid $color-success;
  }

  &.type-error {
    border-left: 3px solid $color-error;
  }

  &.type-warning {
    border-left: 3px solid $color-warning;
  }

  &.type-info {
    border-left: 3px solid $color-info;
  }
}

.ui-toast-icon {
  flex-shrink: 0;
}

.ui-toast-message {
  flex: 1;
  margin: 0;
  @include typo($body-medium);
  color: $color-text-heading;
  word-break: keep-all;
}

.ui-toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: $color-text-disabled;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: color $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}
</style>

<style lang="scss">
.toast-enter-active {
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

.toast-leave-active {
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-move {
  transition: transform 250ms ease;
}
</style>
