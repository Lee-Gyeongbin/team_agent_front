<template>
  <div class="chat-message-actions">
    <UiButton
      v-if="!isShare"
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': chatLogReaction?.satisYn === 'Y' }"
      title="좋아요"
      @click="emit('on-like')"
    >
      <template #icon-left>
        <i class="icon-thumbs-up size-20" />
      </template>
    </UiButton>
    <UiButton
      v-if="!isShare"
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': chatLogReaction?.satisYn === 'N' }"
      title="싫어요"
      @click="emit('on-dislike')"
    >
      <template #icon-left>
        <i class="icon-thumbs-down size-20" />
      </template>
    </UiButton>
    <UiButton
      v-if="!isShare"
      variant="ghost"
      size="xs"
      icon-only
      title="재생성"
      @click="emit('on-regenerate')"
    >
      <template #icon-left>
        <i class="icon-chat-refresh size-20" />
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
        <i class="icon-chat-copy size-20" />
      </template>
    </UiButton>
    <!-- 답변 → 라이브러리 카테고리 선택 UI (저장 API는 개발자가 페이지/스토어에서 @on-select-category 로 연결) -->
    <UiDropdownMenu
      title="카테고리 선택"
      :items="categoryMenuItems"
      content-class="type-large-icons type-title"
      align="end"
      open-on-hover
      @select="onSelectCategory"
    >
      <template #trigger>
        <UiButton
          variant="ghost"
          size="xs"
          icon-only
          title="카테고리 선택"
          @pointerdown.stop.prevent
          @click="onClickCategory"
        >
          <template #icon-left>
            <i class="icon-chat-open-book size-20" />
          </template>
        </UiButton>
      </template>
    </UiDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import type { ChatLogReaction, KnowledgeItem } from '~/types/chat'
interface Props {
  chatLogReaction?: ChatLogReaction
  knowledgeList?: KnowledgeItem[]
  /** 공유 보기 페이지: 복사·카테고리만 표시 (원본/시각화는 ChatMessageItem 패널 버튼) */
  isShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  knowledgeList: () => [],
  isShare: false,
})

const emit = defineEmits<{
  'on-copy': []
  'on-like': []
  'on-dislike': []
  'on-regenerate': []
  'on-favorite': []
  /** 라이브러리 카테고리 선택 — value만 전달 (어느 메시지인지는 상위 ChatMessageItem에서 logId와 합침) */
  'on-select-category': [value: string]
}>()

const categoryMenuItems = computed<DropdownMenuItemDef[]>(() =>
  props.knowledgeList.map((item) => ({
    label: item.categoryNm,
    value: item.categoryId,
    icon: 'icon-dropdown-category',
  })),
)

const onSelectCategory = (value: string) => {
  emit('on-select-category', value)
}

const onClickCategory = () => {
  if (categoryMenuItems.value.length > 0) {
    onSelectCategory(categoryMenuItems.value[0].value)
  }
}
</script>
