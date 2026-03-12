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
      <!-- 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 -->
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
              <!-- <UiBadge :variant="item.badges[1].variant">
                <template #icon-left>
                  <i :class="`icon ${item.badges[1].icon} size-10`"></i>
                </template>
                {{ item.badges[1].label }}
              </UiBadge> -->
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
            <p>휴가 신청 방법이 뭐지?</p>
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
              휴가 신청은 업무포털 [근태관리] 메뉴에서 진행합니다.
              <br />
              1. 업무포털 로그인 → [근태관리] → [휴가신청]<br />
              2. 휴가 종류 선택 (연차/반차/병가/특별휴가)<br />
              3. 기간 선택 및 사유 입력<br />
              4. 대리인 지정 후 [상신]<br />
              5. 팀장 승인 → 인사팀 최종 확인
              <br />
              주의사항
              <br />
              - 연차는 최소 3일 전 신청 원칙<br />
              - 5일 이상 연속 휴가는 7일 전 신청 필요
            </div>
          </div>

          <div class="content-box type-sql">
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
          <UiCodeBlock :code="sqlCode" />

          <!-- 하단 태그 -->
          <div class="library-detail-modal-tags">
            <span class="library-detail-modal-tag">#매출</span>
            <span class="library-detail-modal-tag">#2025</span>
            <span class="library-detail-modal-tag">#월별통계</span>
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
import type { LibraryCard } from '~/types/library'
const { archiveCardList } = useLibraryStore()

interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  unarchive: [card: LibraryCard]
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
