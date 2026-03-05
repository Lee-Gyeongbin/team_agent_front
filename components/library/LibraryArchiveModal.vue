<template>
  <div
    class="library-archive-modal"
    :class="{ 'is-show': isOpen }"
    @click.self="handleClose"
  >
    <!-- 오버레이 배경 -->
    <div
      class="library-archive-modal-overlay"
      @click="handleClose"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div class="library-archive-modal-content">
      <!-- 상단 헤더 -->
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
        <div class="library-archive-modal-search inp-search-grp">
          <input
            type="text"
            class="inp inp-search w-full"
            placeholder="검색어를 입력하세요"
          />
          <button class="btn btn-search"><i class="icon icon-search size-20"></i></button>
        </div>
      </div>


      <!-- 보관된 아이템 리스트 -->
      <div class="library-archive-modal-body">
        <!-- 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 -->
        <div
          v-for="(item, index) in archiveList"
          :key="index"
          class="library-archive-item"
        >
          <!-- 태그 영역 -->
          <div class="library-archive-item-badges flex flex-wrap gap-4">
            <UiBadge :variant="item.badges[0].variant">
              <template #icon-left>
                <i :class="`icon ${item.badges[0].icon} size-14`"></i>
              </template>
              {{ item.badges[0].label }}
            </UiBadge>
            <UiBadge :variant="item.badges[1].variant">
              <template #icon-left>
                <i :class="`icon ${item.badges[1].icon} size-10`"></i>
              </template>
              {{ item.badges[1].label }}
            </UiBadge>
          </div>

          <!-- 제목 -->
          <h3 class="library-archive-item-title">{{ item.title }}</h3>

          <!-- 보관일 -->
          <p class="library-archive-item-date">보관일 {{ item.archiveDate }}</p>

          <!-- 카테고리 이동 버튼 -->
          <UiButton
            variant="secondary"
            size="sm"
            class="library-archive-item-action"
          >
            카테고리 이동
          </UiButton>
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
}>()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const archiveList = [
  {
    badges: [
      { variant: 'manual-ai' as const, icon: 'icon-book', label: '매뉴얼AI' },
      { variant: 'default' as const, icon: 'icon-diamond-small', label: '사내규정' },
    ],
    title: '인사규정 제 5장 복무관리',
    archiveDate: '2026.02.09 16:00',
  },
  {
    badges: [
      { variant: 'basic-chat' as const, icon: 'icon-comment-other', label: '기본대화' },
      { variant: 'default' as const, icon: 'icon-diamond-small', label: '인사이트' },
    ],
    title: '효과적인 보고서 작성 팁',
    archiveDate: '2026.02.09 16:00',
  },
  {
    badges: [
      { variant: 'data-line' as const, icon: 'icon-data-line-small', label: '데이터분석' },
      { variant: 'default' as const, icon: 'icon-diamond-small', label: '통계현황' },
    ],
    title: '2024년 분기별 매출 요약',
    archiveDate: '2026.02.09 16:00',
  },
]

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
@use '../../assets/styles/utils/variables' as *;
@use '../../assets/styles/utils/mixins' as *;

.library-archive-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity $transition-base,
    visibility $transition-base;

  &.is-show {
    opacity: 1;
    visibility: visible;

    .library-archive-modal-content {
      transform: translateX(0);
    }
  }

  // 오버레이 배경
  .library-archive-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(45, 49, 57, 0.4);
  }

  // 모달 컨텐츠
  .library-archive-modal-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 680px;
    height: 100vh;
    padding: 0;
    background: #fff;
    transform: translateX(20px);
    transition: transform $transition-base;
    overflow: hidden;
  }

  // 헤더
  .library-archive-modal-header {
    // height: 67px;
    padding: 24px 16px 16px;
    .header-top-grp{
      padding-bottom: 16px;
    }

    .library-archive-modal-title {
      color: #2D3139;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      line-height: 150%;
    }

    // 닫기 버튼
    .btn-modal-close {
      width: 20px;
      height: 20px;
    }
  }

  // 검색바
  .library-archive-modal-search {
    width: 100%;
  }

  // 본문
  .library-archive-modal-body {
    flex: 1;
    overflow-y: auto;
    height: calc(100vh - 113px);
    padding: 0 16px 16px;
    @include custom-scrollbar;
  }

  // 보관된 아이템
  .library-archive-item {
    position: relative;
    padding: 16px;
    background: #fff;
    border: 1px solid #ECF0F3;
    border-radius: $border-radius-base;
    margin-bottom: 12px;
    transition: border-color $transition-base;

    &:hover {
      border-color: #DCE4E9;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .library-archive-item-badges {
      margin-bottom: 12px;
    }

    .library-archive-item-title {
      color: #2D3139;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      line-height: 150%;
      margin-bottom: 8px;
    }

    .library-archive-item-date {
      color: #94A3B8;
      font-size: $font-size-sm;
      margin-bottom: 12px;
    }

    .library-archive-item-action {
      position: absolute;
      top: 16px;
      right: 16px;
    }
  }
}
</style>
