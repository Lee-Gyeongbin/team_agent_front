<template>
  <div
    class="library-detail-modal"
    :class="{ 'is-show': isOpen }"
  >
    <div class="library-detail-modal-content">
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
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              @click="handleRefresh"
            >
              <template #icon-left>
                <i class="icon icon-transfer size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
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
        <div class="content-box">
          <p>2025년 우리회사 월별매출액은 얼마지? 단위를 억 단위로 알려줘</p>
        </div>

        <!-- 시스템 응답 -->
        <div class="content-box type-response">
          <div class="library-detail-modal-response-header">
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              class="btn-copy"
              @click="handleCopyResponse"
            >
              <template #icon-left>
                <i class="icon icon-copy size-16"></i>
              </template>
            </UiButton>
          </div>

          <!-- 월별 데이터 -->
          <div>
            2025년 월별 매출액 조회 결과입니다.
              <br>
              <br>
              (단위: 억원)1월: 42.3억 / 2월: 38.7억 / 3월: 51.2억 / 4월: 49.8억 / 5월: 55.1억 / 6월: 60.4억 / 7월: 58.9억 / 8월: 52.3억 / 9월: 63.7억 / 10월: 71.2억 / 11월: 68.5억 / 12월: 74.8억
              <br>
              <br>
              연간 합계: 686.9억원
          </div>
        </div>

        <!-- SQL 코드 블록 -->
        <div class="library-detail-modal-code">
          <UiButton
            variant="ghost"
            size="xxs"
            icon-only
            class="btn-copy"
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
      </div>

      <!-- 하단 태그 -->
      <div class="library-detail-modal-footer">
        <div class="library-detail-modal-tags">
          <span class="library-detail-modal-tag">#매출</span>
          <span class="library-detail-modal-tag">#2025</span>
          <span class="library-detail-modal-tag">#월별통계</span>
        </div>
      </div>
    </div>
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

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleRefresh = () => {
  emit('refresh')
}

const handleDelete = () => {
  emit('delete')
}

const handleCopyResponse = () => {
  // TODO: 응답 내용 복사 로직
}

const handleCopyCode = () => {
  // TODO: SQL 코드 복사 로직
}
</script>

<style lang="scss" scoped>
@use '../../assets/styles/utils/variables' as *;
@use '../../assets/styles/utils/mixins' as *;

.library-detail-modal {
  position: fixed;
  top: auto;
  left: auto;
  right: 0;
  bottom: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity $transition-base,
    visibility $transition-base;

  &.is-show {
    opacity: 1;
    visibility: visible;

    .library-detail-modal-content {
      transform: translateY(0);
    }
  }

  .library-detail-modal-content {
    position: relative;
    z-index: 1;
    display: flex;
    overflow: hidden;
    flex-direction: column;
    width: 680px;
    height: calc(100vh - 102px);
    padding: 24px 16px;
    background: #fff;
    border-top: 1px solid #DCE4E9;
    border-left: 1px solid #DCE4E9;
    transform: translateY(20px);
    transition: transform $transition-base;
  }

  // 닫기 btn
  .btn-modal-close{
    position: absolute;
    top: 24px;
    right: 16px;
    width: 20px;
    height: 20px;

    .icon-close{
      background-color: #828FA9;
    }
  }

  // 헤더
  .library-detail-modal-header {
    background: #fff;

    .library-detail-modal-badge-wrapper {
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 4px;
    }

    .library-detail-modal-title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      padding-right: 8px;

      .library-detail-modal-title-grp {
        flex: 1;

        .library-detail-modal-title {
          color: #2D3139;
          font-size: $font-size-xl;
          font-weight: $font-weight-bold;
          margin-bottom: 4px;
          line-height: 150%;
        }

        .library-detail-modal-date {
          color: #94A3B8;
          font-size: $font-size-sm;
        }
      }

      .library-detail-modal-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
    }
  }


  // UiButton 커스텀 스타일 (24px 아이콘 버튼)
  .library-detail-modal-actions {
    :deep(.ui-button) {
      background: #fff;
      border-radius: 4px;

      &:hover:not(:disabled) {
        background: #ECF0F3;
      }

      .icon-delete-bg {
        background-color: #6F7A93;
      }
    }
  }

  // 본문
  .library-detail-modal-body {
    flex: 1;
    padding: 16px 0;
    overflow-y: auto;
    @include custom-scrollbar;

    .content-box {
      position: relative;
      margin-bottom: 12px;
      padding: 12px 16px;
      background: $color-chat-user-bg;
      border-radius: 8px;
      color: #2d3139;
      font-size: $font-size-base;
      line-height: $line-height-base;

      &.type-response {
        margin-bottom: 12px;
        background: #F4F7F9;
        color: #4D5462;
      }

      .btn-copy {
        position: absolute;
        top: 12px;
        right: 12px;

        :deep(.ui-button) {
          background: #fff;
          border-radius: 4px;

          &:hover:not(:disabled) {
            background: #DCE4E9;
          }
        }
      }
    }


    .library-detail-modal-code {
      background: #2d3139;
      border-radius: $border-radius-lg;
      overflow: hidden;
      position: relative;

      .btn-copy {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;

        :deep(.ui-button) {
          background: rgba(255, 255, 255, 0.1);
          border-radius: $border-radius-base;
          color: #fff;

          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
          }

          .icon {
            background-color: #fff;
          }
        }
      }

      .library-detail-modal-code-content {
        padding: 20px;
        margin: 0;
        overflow-x: auto;
        @include custom-scrollbar;

        code {
          display: block;
          color: #e2e8f0;
          font-family: $font-family-mono;
          font-size: $font-size-sm;
          line-height: $line-height-base;
          white-space: pre;
        }
      }
    }
  }

  // 푸터
  .library-detail-modal-footer {
    padding: 16px 20px;
    border-top: 1px solid $color-border;
    background: #fff;

    .library-detail-modal-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .library-detail-modal-tag {
        padding: 4px 12px;
        background: $color-background;
        color: $color-text-secondary;
        font-size: $font-size-sm;
        border-radius: $border-radius-full;
      }
    }
  }
}
</style>