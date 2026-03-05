<template>
  <div
    class="chat-pdf-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- header -->
    <div class="chat-pdf-header">
      <span class="chat-pdf-title">관련자료</span>
      <div class="chat-pdf-header-actions">
        <button
          class="btn btn-icon"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          ></i>
        </button>
        <button
          class="btn btn-icon"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>
    <!-- PDF 툴바: 페이지 네비게이션, 줌, 다운로드/인쇄, 탭 -->
    <!-- 🔽 더미 — 나중에 마크업 교체 -->
    <div class="chat-pdf-toolbar"></div>
    <!-- body: PDF 플러그인 영역 -->
    <div class="chat-pdf-body">
      <!-- 🔽 더미 데이터 — 백엔드 연결 시 PDF 플러그인으로 교체 -->
      <div class="chat-pdf-area"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('update:fullscreen', isFullscreen.value)
}

// 닫을 때 전체화면 해제
const onClose = () => {
  isFullscreen.value = false
  emit('update:fullscreen', false)
  emit('update:open', false)
}
</script>
