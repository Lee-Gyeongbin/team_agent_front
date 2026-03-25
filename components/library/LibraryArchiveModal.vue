<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :show-close="false"
    custom-class="library-archive-modal"
    @close="handleClose"
  >
    <!-- 커스텀 헤더 -->
    <template #header>
      <div class="library-archive-modal-header">
        <div class="header-top-grp flex items-start justify-between">
          <h2 class="library-archive-modal-title">보관함</h2>

          <!-- 닫기 버튼 -->
          <button
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>

        <!-- 검색바 -->
        <div class="library-archive-modal-search">
          <UiInput
            type="search"
            placeholder="검색어를 입력하세요"
          />
        </div>
      </div>
    </template>

    <!-- 보관된 아이템 리스트 -->
    <div
      ref="bodyRef"
      class="library-archive-modal-body"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in archiveCardList"
        :key="index"
        class="library-archive-card"
        :class="{ 'is-show': expandedCards[index] }"
      >
        <div
          class="library-archive-card-content flex justify-between items-center gap-8"
          @click="toggleCard(index)"
        >
          <div>
            <!-- 태그 영역 -->
            <div class="library-archive-card-badges flex flex-wrap gap-4">
              <UiBadge :variant="getBadgeInfo(item.svcTy)?.variant">
                <template #icon-left>
                  <i :class="`icon ${getBadgeInfo(item.svcTy)?.icon} size-14`"></i>
                </template>
                {{ getBadgeInfo(item.svcTy)?.label }}
              </UiBadge>
            </div>
            <!-- 제목 -->
            <h3 class="library-archive-card-title">{{ item.title }}</h3>
            <!-- 보관일 -->
            <p class="library-archive-card-date">보관일 {{ item.archiveDt }}</p>
          </div>

          <!-- 보관해제 버튼 -->
          <UiButton
            variant="outline"
            size="sm"
            class="btn-library-archive-card-action"
            @click.stop
            @click="emit('unarchive', item)"
          >
            보관해제
          </UiButton>
        </div>

        <div class="library-archive-card-body">
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

            <!-- 답변 본문 — utils/chat/html toHtmlContent + v-html -->
            <!-- eslint-disable vue/no-v-html -- 채팅 답변과 동일(서버 저장 HTML/개행) -->
            <div
              class="message-content"
              v-html="toHtmlContent(item.rcontent ?? '')"
            ></div>
            <!-- eslint-enable vue/no-v-html -->
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
              v-for="tag in item.tags.split(',')"
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
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { LibraryCardDetail } from '~/types/library'
const { archiveCardList } = useLibraryStore()

interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  unarchive: [card: LibraryCardDetail]
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

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const sqlCode = `SELECT
TO_CHAR(sale_date, 'YYYY-MM') AS month,
ROUND(SUM(amount) / 100000000, 1) AS sales_억
FROM sales
WHERE EXTRACT (YEAR FROM sale_date) = 2025
GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
ORDER BY month;`
</script>
