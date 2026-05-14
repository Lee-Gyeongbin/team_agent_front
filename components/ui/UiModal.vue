<template>
  <!-- body로 이동: 조상의 transform(filter 등)이 있으면 position:fixed가 뷰포트가 아닌 해당 박스 기준이 됨 → 오버레이가 부모만 덮는 현상 방지 -->
  <Teleport to="body">
    <div :class="[positionClass, customClass, { 'is-show': isOpen, 'is-fullscreen': isFullscreen }]">
      <!-- 오버레이 배경 -->
      <div
        v-if="showOverlay"
        :class="overlayClass"
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

            <div class="btn-modal-header-actions">
              <button
                v-if="showFullscreen"
                class="btn btn-modal-fullscreen"
                :title="isFullscreen ? '축소' : '전체화면'"
                @click="toggleFullscreen"
              >
                <i
                  :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
                  class="size-20"
                />
              </button>
              <button
                v-if="showClose"
                class="btn btn-modal-close"
                @click="handleClose"
              >
                <i class="icon icon-close-gray size-20"></i>
              </button>
            </div>
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
  </Teleport>
</template>

<script setup lang="ts">
type ModalPosition = 'center' | 'right'

interface Props {
  isOpen?: boolean
  position?: ModalPosition
  title?: string
  showOverlay?: boolean
  showClose?: boolean
  showFullscreen?: boolean
  maxWidth?: string
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  position: 'center',
  title: '',
  showOverlay: true,
  showClose: true,
  showFullscreen: false,
  maxWidth: '',
  customClass: '',
})

const emit = defineEmits<{
  close: []
}>()

// 전체화면
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 닫을 때 전체화면 해제
watch(
  () => props.isOpen,
  (open) => {
    if (!open) isFullscreen.value = false
  },
)

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

// maxWidth 커스텀 스타일 (전체화면일 때 무시)
const contentStyle = computed(() => {
  if (isFullscreen.value || !props.maxWidth) return {}
  return { maxWidth: props.maxWidth }
})

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
// SCSS는 _modal.scss의 .modal-dialog / .modal-side 공통 클래스 사용
</style>
