<template>
  <div
    :class="[positionClass, customClass, { 'is-show': isOpen }]"
    @click.self="handleOverlayClick"
  >
    <!-- 오버레이 배경 -->
    <div
      v-if="showOverlay"
      :class="overlayClass"
      @click="handleOverlayClick"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div
      :class="contentClass"
      :style="contentStyle"
    >
      <!-- 헤더 슬롯 -->
      <slot name="header">
        <div
          v-if="title"
          :class="headerClass"
        >
          <h2 :class="titleClass">{{ title }}</h2>

          <button
            v-if="showClose"
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>
      </slot>

      <!-- 본문 슬롯 -->
      <div :class="bodyClass">
        <slot></slot>
      </div>

      <!-- 푸터 슬롯 -->
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
type ModalPosition = 'center' | 'right'

interface Props {
  isOpen?: boolean
  position?: ModalPosition
  title?: string
  showOverlay?: boolean
  showClose?: boolean
  maxWidth?: string
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  position: 'center',
  title: '',
  showOverlay: true,
  showClose: true,
  maxWidth: '',
  customClass: '',
})

const emit = defineEmits<{
  close: []
}>()

// position에 따른 클래스 매핑
const positionClass = computed(() => {
  return props.position === 'right' ? 'modal-side' : 'modal-dialog'
})

const overlayClass = computed(() => {
  return props.position === 'right' ? 'modal-side-overlay' : 'modal-dialog-overlay'
})

const contentClass = computed(() => {
  return props.position === 'right' ? 'modal-side-content' : 'modal-dialog-content'
})

const headerClass = computed(() => {
  return props.position === 'right' ? 'modal-side-header' : 'modal-dialog-header'
})

const titleClass = computed(() => {
  return props.position === 'right' ? 'modal-side-title' : 'modal-dialog-title'
})

const bodyClass = computed(() => {
  return props.position === 'right' ? 'modal-side-body' : 'modal-dialog-body'
})

// maxWidth 커스텀 스타일
const contentStyle = computed(() => {
  if (!props.maxWidth) return {}
  return { maxWidth: props.maxWidth }
})

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
// SCSS는 _modal.scss의 .modal-dialog / .modal-side 공통 클래스 사용
</style>
