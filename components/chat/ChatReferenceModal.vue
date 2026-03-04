<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay class="chat-ref-overlay" />
      <DialogContent class="chat-ref-modal">
        <!-- header -->
        <div class="chat-ref-header">
          <DialogTitle class="chat-ref-title">관련자료</DialogTitle>
          <div class="chat-ref-header-actions">
            <button
              class="btn btn-icon"
              title="전체화면"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 5.5V2.5H5.5M10.5 2.5H13.5V5.5M13.5 10.5V13.5H10.5M5.5 13.5H2.5V10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="btn btn-icon"
              title="코드보기"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 4.5L1.5 8L5 11.5M11 4.5L14.5 8L11 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <DialogClose class="btn btn-icon" title="닫기">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </DialogClose>
          </div>
        </div>
        <!-- body: PDF 플러그인 영역 -->
        <div class="chat-ref-body">
          <!-- 🔽 더미 데이터 — 백엔드 연결 시 PDF 플러그인으로 교체 -->
          <div class="chat-ref-pdf-area"></div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'radix-vue'

interface Props {
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>
