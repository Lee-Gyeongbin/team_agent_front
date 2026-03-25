<template>
  <div
    class="library-detail-modal"
    :class="{ 'is-show': isOpen && !isTransitioning }"
  >
    <div
      ref="contentRef"
      class="library-detail-modal-content"
      @scroll="handleScroll"
    >
      <!-- 닫기 -->
      <button
        class="btn btn-modal-close type-library-detail"
        @click="handleClose"
      >
        <i class="icon icon-close-gray size-20"></i>
      </button>

      <!-- 상단 헤더 -->
      <div class="library-detail-modal-header">
        <!-- 뱃지 -->
        <div class="library-detail-modal-badge-wrapper flex">
          <UiBadge
            v-if="displayData?.svcTy === 'S'"
            variant="data-line"
          >
            <template #icon-left>
              <i class="icon icon-data-line-small size-14"></i>
            </template>
            데이터분석
          </UiBadge>
          <UiBadge
            v-else-if="displayData?.svcTy === 'C'"
            variant="basic-chat"
          >
            <template #icon-left>
              <i class="icon icon-comment-other size-14"></i>
            </template>
            기본대화
          </UiBadge>
          <UiBadge
            v-else-if="displayData?.svcTy === 'M'"
            variant="manual-ai"
          >
            <template #icon-left>
              <i class="icon icon-book size-14"></i>
            </template>
            매뉴얼AI
          </UiBadge>
        </div>

        <!-- 제목 및 액션 -->
        <div class="library-detail-modal-title-section">
          <div class="library-detail-modal-title-grp">
            <h2 class="library-detail-modal-title">{{ displayData?.title }}</h2>
            <p class="library-detail-modal-date">
              {{ formatDateTimeDisplay(displayData?.createDt ?? '') }}
            </p>
          </div>
          <div class="library-detail-modal-actions shrink-0">
            <!-- 변경 btn -->
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              class="btn-custom-white"
              @click="handleMove"
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
          <p>{{ displayData?.qcontent }}</p>
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

          <div
            v-html="toHtmlContent(displayData?.rcontent ?? '')"
            class="message-content"
          ></div>
        </div>

        <!-- SQL 코드 블록 -->
        <div
          v-if="displayData?.svcTy === 'S'"
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
          v-if="displayData?.svcTy === 'S'"
          :code="displayData?.ttsq"
        />

        <!-- 하단 태그 -->
        <div class="library-detail-modal-tags">
          <span
            v-for="tag in displayData?.tags?.split(',')"
            :key="tag"
            class="library-detail-modal-tag"
          >
            #{{ tag }}
          </span>
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
  </div>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { LibraryCardDetail } from '~/types/library'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    cardDetail?: LibraryCardDetail | null
  }>(),
  {
    isOpen: false,
    cardDetail: null,
  },
)

const emit = defineEmits<{
  close: []
  move: [card: LibraryCardDetail]
  delete: [card: LibraryCardDetail]
}>()

// 스크롤 상태
const contentRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

// 카드 전환 트랜지션 상태
const isTransitioning = ref(false)

// 내부 표시용 데이터 (트랜지션 타이밍 제어용)
const displayData = ref<LibraryCardDetail | null>(props.cardDetail ?? null)

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

// 카드 변경 시 모달 전체 슬라이드 재실행 + 스크롤 리셋
watch(
  () => props.cardDetail?.cardId,
  (newId, oldId) => {
    // 최초 열기 — 바로 표시
    if (!oldId) {
      displayData.value = props.cardDetail ?? null
      return
    }
    if (!newId || newId === oldId) return

    // 1) is-show 제거 → 기존 데이터 상태로 오른쪽으로 나감
    isTransitioning.value = true

    // 2) 나간 후 → 데이터 교체 → 다시 들어옴
    setTimeout(() => {
      displayData.value = props.cardDetail ?? null
      if (contentRef.value) {
        contentRef.value.scrollTo({ top: 0 })
        isScrolled.value = false
      }
      nextTick(() => {
        isTransitioning.value = false
      })
    }, 250)
  },
)

// 모달 닫힐 때 displayData도 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      displayData.value = null
    }
  },
)

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleMove = () => {
  if (!displayData.value) return
  emit('move', displayData.value)
}

const handleDelete = () => {
  if (!displayData.value) return
  emit('delete', displayData.value)
}

const handleCopyResponse = async () => {
  // 채팅 onCopy와 동일 — 태그 제거 후 클립보드
  const text = (displayData.value?.rcontent ?? '').replace(/<[^>]*>/g, '')
  await copyToClipboard(text)
  openToast({ message: '답변이 복사되었습니다.', duration: 1500 })
}
</script>
