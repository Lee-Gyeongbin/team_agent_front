<template>
  <div
    class="library-detail-modal"
    :class="{ 'is-show': isOpen }"
  >
    <div
      ref="contentRef"
      class="library-detail-modal-content"
      @scroll="handleScroll"
    >
      <!-- 상단 헤더 -->
      <div class="library-detail-modal-header">
        <!-- 닫기 -->
        <button
          class="btn btn-modal-close"
          @click="handleClose"
        >
          <i class="icon icon-close-gray size-20"></i>
        </button>

        <!-- 뱃지 -->
        <div class="library-detail-modal-badge-wrapper flex">
          <UiBadge variant="default">
            <template #icon-left>
              <i class="icon icon-diamond-small size-10"></i>
            </template>
            통계현황
          </UiBadge>
          
          <UiBadge variant="data-line">
            <template #icon-left>
              <i class="icon icon-data-line-small size-14"></i>
            </template>
            데이터분석
          </UiBadge>
          <UiBadge variant="basic-chat">
            <template #icon-left>
              <i class="icon icon-comment-other size-14"></i>
            </template>
            기본대화
          </UiBadge>
          <UiBadge variant="manual-ai">
            <template #icon-left>
              <i class="icon icon-book size-14"></i>
            </template>
            매뉴얼AI
          </UiBadge>
        </div>

        <!-- 제목 및 액션 -->
        <div class="library-detail-modal-title-section">
          <div class="library-detail-modal-title-grp">
            <h2 class="library-detail-modal-title">2025년 우리회사 월별매출액</h2>
            <p class="library-detail-modal-date">2026.02.16 09:20</p>
          </div>
          <div class="library-detail-modal-actions shrink-0">
            <!-- 변경 btn -->
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              class="btn-custom-white"
              @click="handleRefresh"
            >
              <template #icon-left>
                <i class="icon icon-transfer size-16"></i>
              </template>
            </UiButton>
            <!-- 삭제 btn -->
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              class="btn-custom-light-gray"
              @click="handleDelete"
            >
              <template #icon-left>
                <i class="icon icon-delete-bg size-16"></i>
              </template>
            </UiButton>
          </div>
        </div>
      </div>

      <!-- 본문 -->
      <div class="library-detail-modal-body">
        <!-- 사용자 질문 -->
        <div class="content-box type-question">
          <p>2025년 우리회사 월별매출액은 얼마지? 단위를 억 단위로 알려줘</p>
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
            2025년 월별 매출액 조회 결과입니다.
            <br />
            <br />
            (단위: 억원)1월: 42.3억 / 2월: 38.7억 / 3월: 51.2억 / 4월: 49.8억 / 5월: 55.1억 / 6월: 60.4억 / 7월: 58.9억
            / 8월: 52.3억 / 9월: 63.7억 / 10월: 71.2억 / 11월: 68.5억 / 12월: 74.8억
            <br />
            <br />
            연간 합계: 686.9억원
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
        <div class="library-detail-modal-code">
          <UiButton
            variant="ghost"
            size="xxs"
            icon-only
            class="btn-copy btn-copy-dark"
            @click="handleCopyCode"
          >
            <template #icon-left>
              <i class="icon icon-copy size-16"></i>
            </template>
          </UiButton>
          
          <pre class="library-detail-modal-code-content"><code>
SELECT
TO_CHAR(sale_date, 'YYYY-MM') AS month,
ROUND(SUM(amount) / 100000000, 1) AS sales_억
FROM sales
WHERE EXTRACT (YEAR FROM sale_date) = 2025
GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
ORDER BY month;
</code></pre>
        </div>

        <!-- 하단 태그 -->
        <div class="library-detail-modal-tags">
          <span class="library-detail-modal-tag">#매출</span>
          <span class="library-detail-modal-tag">#2025</span>
          <span class="library-detail-modal-tag">#월별통계</span>
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

    <!-- 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isDeleteModalOpen"
      title="항목 삭제"
      message="이 항목을 라이브러리에서 삭제하시겠습니까?"
      cancel-text="취소"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @cancel="isDeleteModalOpen = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  refresh: []
  delete: []
}>()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const monthlyData = [
  { month: '1월', value: 42.3 },
  { month: '2월', value: 38.7 },
  { month: '3월', value: 51.2 },
  { month: '4월', value: 49.8 },
  { month: '5월', value: 55.1 },
  { month: '6월', value: 60.4 },
  { month: '7월', value: 58.9 },
  { month: '8월', value: 52.3 },
  { month: '9월', value: 63.7 },
  { month: '10월', value: 71.2 },
  { month: '11월', value: 68.5 },
  { month: '12월', value: 74.8 },
]

// 스크롤 상태
const contentRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

// 삭제 모달 상태
const isDeleteModalOpen = ref(false)

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  if (!contentRef.value) return
  isScrolled.value = contentRef.value.scrollTop > 50
}

// 탑 버튼 클릭 핸들러
const handleScrollToTop = () => {
  if (!contentRef.value) return
  contentRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleRefresh = () => {
  emit('refresh')
}

const handleDelete = () => {
  isDeleteModalOpen.value = true
}

const handleDeleteConfirm = () => {
  emit('delete')
  isDeleteModalOpen.value = false
}

const handleCopyResponse = () => {
  // TODO: 응답 내용 복사 로직
}

const handleCopyCode = () => {
  // TODO: SQL 코드 복사 로직
}
</script>