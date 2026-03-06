<template>
  <div
    class="modal-dialog"
    :class="{ 'is-show': isOpen }"
    @click.self="handleClose"
  >
    <!-- 오버레이 배경 -->
    <div
      class="modal-dialog-overlay"
      @click="handleClose"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div class="modal-dialog-content">
      <!-- 헤더 -->
      <div class="modal-dialog-header">
        <h2 class="modal-dialog-title">{{ title }}</h2>

        <!-- 닫기 버튼 -->
        <button
          class="btn btn-modal-close"
          @click="handleClose"
        >
          <i class="icon icon-close-gray size-20"></i>
        </button>
      </div>

      <!-- 본문 -->
      <div class="modal-dialog-body">
        <slot>
          {{ message }}
        </slot>
      </div>

      <!-- 푸터 -->
      <div class="modal-dialog-footer">
        <UiButton
          :variant="confirmVariant"
          :size="confirmSize"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen?: boolean
  title?: string
  message?: string
  confirmText?: string
  confirmVariant?: 'primary' | 'primary-dark' | 'secondary' | 'outline' | 'ghost'
  confirmSize?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xlg'
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '확인',
  message: '',
  confirmText: '확인',
  confirmVariant: 'primary',
  confirmSize: 'md',
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}
</script>

<style lang="scss" scoped>
// SCSS는 _modal.scss의 .modal-dialog 공통 클래스 사용
</style>
