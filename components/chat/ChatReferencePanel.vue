<template>
  <div
    class="chat-ref-panel"
    :class="{ 'is-open': open }"
  >
    <!-- header -->
    <div class="chat-ref-header">
      <span class="chat-ref-title">관련자료</span>
      <div class="chat-ref-header-actions">
        <button
          class="btn btn-icon"
          title="전체화면"
        >
          <i class="icon-expand size-20"></i>
        </button>
        <button
          class="btn btn-icon"
          title="닫기"
          @click="emit('update:open', false)"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>
    <!-- body: PDF 플러그인 영역 -->
    <div class="chat-ref-body">
      <!-- 🔽 더미 데이터 — 백엔드 연결 시 PDF 플러그인으로 교체 -->
      <div class="chat-ref-pdf-area"></div>
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
}>()
</script>
