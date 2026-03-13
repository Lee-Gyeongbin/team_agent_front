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
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              class="btn-copy btn-copy-white"
              @click="handleCopyResponse"
            >
              <template #icon-left>
                <i class="icon icon-copy size-16"></i>
              </template>
            </UiButton>

            <!-- 월별 데이터 -->
            <div>
              <p>{{ item.rcontent }}</p>
            </div>
          </div>

          <div
            v-if="item.svcTy === 'S'"
            class="content-box type-sql"
          >
            <div class="sql-header flex items-center justify-end gap-4">
              <div class="regenerate"></div>
              <UiButton
                variant="ghost"
                size="xxs"
                icon-only
                class="btn-custom-white"
              >
                <template #icon-left>
                  <i class="icon icon-regenerate size-16"></i>
                </template>
              </UiButton>
              <UiButton
                variant="ghost"
                size="xxs"
                icon-only
                class="btn-custom-gray"
              >
                <template #icon-left>
                  <i class="icon icon-sql size-16"></i>
                </template>
              </UiButton>
            </div>

            <div class="content-box w-full sql-content"></div>
          </div>

          <!-- SQL 코드 블록 -->
          <UiCodeBlock
            v-if="item.svcTy === 'S'"
            :code="item.sqlCode"
          />

          <!-- 하단 태그 -->
          <div class="library-detail-modal-tags">
            <span
              v-for="tag in (item.tags || '').split(',').filter(Boolean)"
              :key="tag"
              class="library-detail-modal-tag"
            >
              #{{ tag }}
            </span>
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

// 복사 핸들러 (더미)
const handleCopyResponse = () => {
  // TODO: 응답 복사 기능 구현
}
</script>
