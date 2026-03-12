<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="currentToast"
        class="ui-toast"
      >
        <p class="ui-toast__message">{{ currentToast.message }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { currentToast } = useToastState()
</script>

<style lang="scss" scoped>
.ui-toast {
  position: fixed;
  bottom: $spacing-xl;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-toast;
  padding: $spacing-sm $spacing-lg;
  background: $color-text-heading;
  color: #fff;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  border-radius: $border-radius-base;
  box-shadow: $shadow-lg;
  max-width: calc(100vw - #{$spacing-xl} * 2);
}

.ui-toast__message {
  margin: 0;
  white-space: pre-line;
  text-align: center;
}
</style>

<style lang="scss">
.toast-enter-active {
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}

.toast-leave-active {
  transition: opacity 400ms ease-in, transform 400ms ease-in;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
