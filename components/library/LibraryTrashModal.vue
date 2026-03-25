<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :show-close="false"
    custom-class="library-trash-modal"
    @close="handleClose"
  >
    <!-- 커스텀 헤더 -->
    <template #header>
      <div class="library-trash-modal-header">
        <div class="header-top-grp flex items-start justify-between">
          <h2 class="library-trash-modal-title">휴지통</h2>

          <!-- 닫기 버튼 -->
          <button
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>

        <!-- 검색바 -->
        <div class="library-trash-modal-search">
          <UiInput
            type="search"
            placeholder="검색어를 입력하세요"
          />
        </div>
      </div>
    </template>

    <!-- 삭제된 아이템 리스트 -->
    <div
      ref="bodyRef"
      class="library-trash-modal-body"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in trashCardList"
        :key="index"
        class="library-trash-card"
        :class="{ 'is-show': expandedCards[index] }"
      >
        <div
          class="library-trash-card-content flex justify-between items-center gap-8"
          @click="toggleCard(index)"
        >
          <div>
            <!-- 태그 영역 -->
            <div class="library-trash-card-badges flex flex-wrap gap-4">
              <UiBadge :variant="getBadgeInfo(item.svcTy)?.variant">
                <template #icon-left>
                  <i :class="`icon ${getBadgeInfo(item.svcTy)?.icon} size-14`"></i>
                </template>
                {{ getBadgeInfo(item.svcTy)?.label }}
              </UiBadge>
            </div>
            <!-- 제목 -->
            <h3 class="library-trash-card-title">{{ item.title }}</h3>
            <!-- 삭제일 -->
            <p class="library-trash-card-date">삭제일 {{ item.modifyDt }}</p>
          </div>

          <!-- 복원 버튼 -->
          <UiButton
            variant="outline"
            size="sm"
            class="btn-library-trash-card-action"
            @click.stop
            @click="emit('restore', item)"
          >
            복원
          </UiButton>
        </div>

        <div class="library-trash-card-body">
          <!-- 사용자 질문 -->
          <div class="content-box type-question">
            <p>{{ item.qcontent }}</p>
          </div>

          <!-- 시스템 응답 -->
          <div class="content-box type-response">
            <div
              class="message-content"
              v-html="toHtmlContent(item.rcontent ?? '')"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 탑 버튼 -->
    <button
      class="btn btn-modal-top"
      :class="{ 'is-show': isScrolled }"
      @click="handleScrollToTop"
    >
      <i class="icon icon-arrow-down size-20"></i>
    </button>
  </UiModal>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { LibraryCardDetail } from '~/types/library'
const { trashCardList } = useLibraryStore()

interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  restore: [card: LibraryCardDetail]
}>()

const getBadgeInfo = (svcTy: string) => {
  switch (svcTy) {
    case 'M':
      return { variant: 'manual-ai' as const, icon: 'icon-book', label: '매뉴얼AI' }
    case 'C':
      return { variant: 'basic-chat' as const, icon: 'icon-comment-other', label: '기본대화' }
    case 'S':
      return { variant: 'data-line' as const, icon: 'icon-data-line-small', label: '데이터분석' }
  }
}

// 카드 확장 상태 관리
const expandedCards = ref<Record<number, boolean>>({})

// 스크롤 상태
const bodyRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  if (!bodyRef.value) return
  isScrolled.value = bodyRef.value.scrollTop > 50
}

// 탑 버튼 클릭 핸들러
const handleScrollToTop = () => {
  if (!bodyRef.value) return
  bodyRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 카드 토글 핸들러
const toggleCard = (index: number) => {
  expandedCards.value[index] = !expandedCards.value[index]
}

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}
</script>
