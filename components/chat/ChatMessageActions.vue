<template>
  <div class="chat-message-actions">
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': isLiked }"
      title="좋아요"
      @click="emit('on-like')"
    >
      <template #icon-left>
        <i class="icon-thumbs-up size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': isDisliked }"
      title="싫어요"
      @click="emit('on-dislike')"
    >
      <template #icon-left>
        <i class="icon-thumbs-down size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      title="재생성"
      @click="emit('on-regenerate')"
    >
      <template #icon-left>
        <i class="icon-refresh size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      title="복사"
      @click="emit('on-copy')"
    >
      <template #icon-left>
        <i class="icon-copy size-20" />
      </template>
    </UiButton>
    <!-- 답변 → 라이브러리 카테고리 선택 UI (저장 API는 개발자가 페이지/스토어에서 @on-select-category 로 연결) -->
    <UiDropdownMenu
      title="카테고리 선택"
      :items="categoryMenuItems"
      align="end"
      @select="onSelectCategory"
    >
      <template #trigger>
        <UiButton
          variant="ghost"
          size="xs"
          icon-only
          title="카테고리 선택"
        >
          <template #icon-left>
            <i class="icon-book size-20" />
          </template>
        </UiButton>
      </template>
    </UiDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

interface Props {
  isLiked?: boolean
  isDisliked?: boolean
  isFavorited?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'on-copy': []
  'on-like': []
  'on-dislike': []
  'on-regenerate': []
  'on-favorite': []
  /** 라이브러리 카테고리 선택 — value만 전달 (어느 메시지인지는 상위 ChatMessageItem에서 logId와 합침) */
  'on-select-category': [value: string]
}>()

// 🔽 더미 데이터 — 백엔드 연결 시 API 또는 useChatStore 등에서 목록 주입으로 교체 권장
const categoryMenuItems: DropdownMenuItemDef[] = [
  { label: '기본 카테고리', value: 'default', icon: 'icon-menu' },
  { label: '업무관리', value: 'task', icon: 'icon-document' },
  { label: '인사관리', value: 'hr', icon: 'icon-group' },
  { label: '회계관리', value: 'accounting', icon: 'icon-chart' },
  { label: '시스템관리', value: 'system', icon: 'icon-settings' },
]

const onSelectCategory = (value: string) => {
  emit('on-select-category', value)
}
</script>
