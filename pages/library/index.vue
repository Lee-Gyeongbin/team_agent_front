<template>
  <div class="library-index">
    <div class="library-header-wrapper flex justify-between items-center">
      <p class="library-description">대화 중 마음에 드는 지식을 저장하고 카테고리별로 관리하세요.</p>
      <div class="right-grp flex items-center">
        <p class="total">총 <strong>7개</strong></p>
        <div class="library-input-grp shrink-0 grow-1 max-w-400">
          <div class="inp-search-grp">
            <input
              type="text"
              class="inp inp-search w-full"
              placeholder="검색어를 입력하세요"
            />
            <button class="btn btn-search"><i class="icon icon-search size-20"></i></button>
          </div>
        </div>
        <div class="library-select-grp shrink-0 grow-1 max-w-140">
          <UiSelect
            id="sort-order"
            name="sort-order"
            :options="searchOptions"
            size="md"
          />
        </div>
        <div class="btn-grp">
          <!-- 보관함 btn -->
          <button
            class="btn btn-library btn-library-archive"
            @click="isArchiveModalOpen = true"
          >
            <i class="icon icon-archive size-16"></i>
            <span class="badge-num">23</span>
          </button>
          <!-- 삭제 btn -->
          <button
            class="btn btn-library btn-library-trash"
            @click="isTrashDeleteModalOpen = true"
          >
            <i class="icon icon-delete size-16"></i>
            <span class="badge-num">9</span>
          </button>
        </div>
      </div>
    </div>
    <div
      ref="contentWrapperRef"
      class="library-content-wrapper flex"
    >
      <div
        v-for="item in 5"
        :key="item"
        class="library-list-grp"
      >
        <div class="library-list-header flex justify-between items-center">
          <div class="left-grp flex items-center">
            <p class="list-title"><i class="icon-diamond size-8"></i>인사이트</p>
            <p class="card-count fw-700">3</p>
          </div>
          <!-- 카테고리 드롭다운 메뉴 -->
          <UiDropdownMenu
            :items="listMenuItems"
            align="end"
            @select="handleListMenuSelect"
          >
            <template #trigger>
              <button class="btn btn-library-card-add type-white">
                <i class="icon icon-add-dot size-20"></i>
              </button>
            </template>
          </UiDropdownMenu>
          <!-- .END 카테고리 드롭다운 메뉴 -->
        </div>
        <div class="library-card-grp">
          <div
            v-for="card in 7"
            :key="card"
            class="library-card"
            :class="{ 'is-active': selectedCardId === card }"
            @click="openModal(card)"
          >
            <!-- 상단 영역 -->
            <div class="library-card-top flex justify-between items-center">
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
              <!--
                카드 드롭다운: @click.stop 래퍼로 카드 클릭(openModal) 전파 차단.
                UiDropdownMenu 내부는 Portal로 body에 렌더링 → overflow 이슈 없음.
              -->
              <div @click.stop>
                <UiDropdownMenu
                  :items="cardMenuItems"
                  align="end"
                  @select="handleCardMenuSelect(card, $event)"
                >
                  <template #trigger>
                    <button class="btn btn-library-card-add type-white">
                      <i class="icon icon-add-dot size-20"></i>
                    </button>
                  </template>
                </UiDropdownMenu>
              </div>
            </div>
            <!-- 제목 -->
            <h3 class="library-card-title fw-600">2025년 우리회사 월별매출액 2025년 우리회사 월별매출액</h3>
            <!-- 설명 -->
            <p class="library-card-desc">
              전자결재가 반려된 경우 아래 절차로 재상신할 수 있습니다. 1. [전자결재] → [수신함] 메뉴에서 반려 글자테스트
            </p>

            <!-- 하단 메타 -->
            <div class="library-card-meta flex items-center justify-between">
              <p class="library-card-date ws-nowrap">2026.02.16 09:20</p>

              <div class="library-card-tags flex items-center">
                <span class="library-card-tag">#보고서</span>
                <span class="library-card-tag">#임원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 새 카테고리 -->
      <div class="library-list-grp">
        <div class="library-list-header flex justify-between items-center">
          <div class="left-grp flex items-center">
            <p class="list-title"><i class="icon-diamond size-8"></i>새 카테고리</p>
            <p class="card-count fw-700">0</p>
          </div>
          <!-- 카테고리 드롭다운 메뉴 -->
          <UiDropdownMenu
            :items="listMenuItems"
            align="end"
            @select="handleListMenuSelect"
          >
            <template #trigger>
              <button class="btn btn-library-card-add type-white">
                <i class="icon icon-add-dot size-20"></i>
              </button>
            </template>
          </UiDropdownMenu>
          <!-- .END 카테고리 드롭다운 메뉴 -->
        </div>
        <div class="library-card-grp">
          <div class="library-card type-new-card">
            <div class="library-card-new-card-content">
              <i class="icon icon-heart size-24"></i>
              <p>마음에 드는 날리지를 저장해주세요</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 카테고리 입력 -->
      <div class="library-list-grp">
        <div class="library-category-input-grp flex items-center">
          <input
            type="text"
            class="inp inp-category"
            placeholder="카테고리명을 입력하세요"
          />
          <UiButton
            size="md"
            class="btn-category-add w-57"
          >
            추가
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 모달 -->
    <LibraryDetailModal
      :is-open="isModalOpen"
      @close="handleModalClose"
      @refresh="handleModalRefresh"
      @delete="handleModalDelete"
    />

    <!-- 보관함 모달 -->
    <LibraryArchiveModal
      :is-open="isArchiveModalOpen"
      @close="isArchiveModalOpen = false"
    />

    <!-- 휴지통 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isTrashDeleteModalOpen"
      title="삭제"
      message="삭제 대기 중인 항목을 모두 삭제하시겠습니까?"
      cancel-text="취소"
      confirm-text="삭제"
      @close="isTrashDeleteModalOpen = false"
      @cancel="isTrashDeleteModalOpen = false"
      @confirm="handleTrashDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const searchOptions = [
  { label: '직접설정순', value: 'custom' },
  { label: '최신순', value: 'latest' },
  { label: '이름순', value: 'name' },
]

// 카테고리 헤더 드롭다운 메뉴 아이템
const listMenuItems: DropdownMenuItemDef[] = [
  { label: '이름 변경', icon: 'icon-edit', value: 'rename' },
  { label: '카테고리 삭제', icon: 'icon-trashcan', value: 'delete', color: 'danger' },
]

// 카드 드롭다운 메뉴 아이템
const cardMenuItems: DropdownMenuItemDef[] = [
  { label: '상세 보기', icon: 'icon-view', value: 'view' },
  { label: '카테고리 이동', icon: 'icon-transfer', value: 'move' },
  { label: '즐겨찾기 등록', icon: 'icon-star-line', value: 'favorite-add' },
  { label: '즐겨찾기 해제', icon: 'icon-star-fill', value: 'favorite-remove' },
  { label: '답변 복사', icon: 'icon-copy-gray', value: 'copy' },
  { label: '보관', icon: 'icon-archive', value: 'archive' },
  { label: '삭제', icon: 'icon-delete', value: 'delete', color: 'danger' },
]

// 카테고리 헤더 드롭다운 선택 핸들러
const handleListMenuSelect = (value: string) => {
  // TODO: 백엔드 연결 시 value에 따라 API 호출로 교체
  console.warn('[TODO] 카테고리 메뉴 선택:', value)
}

// 카드 드롭다운 선택 핸들러
const handleCardMenuSelect = (card: number, value: string) => {
  // TODO: 백엔드 연결 시 card ID와 value에 따라 API 호출로 교체
  console.warn('[TODO] 카드 메뉴 선택:', card, value)
}

// 드래그 스크롤 적용
const { setupDragScroll } = useDragScroll()
const contentWrapperRef = ref<HTMLElement | null>(null)

// 가로 스크롤 (library-content-wrapper)
setupDragScroll(contentWrapperRef)

// 모달 상태
const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)
const isTrashDeleteModalOpen = ref(false)
const selectedCardId = ref<number | null>(null)

// 모달 열기
const openModal = (cardId: number) => {
  selectedCardId.value = cardId
  isModalOpen.value = true
}

// 모달 이벤트 핸들러
const handleModalClose = () => {
  isModalOpen.value = false
  selectedCardId.value = null
}

const handleModalRefresh = () => {
  // TODO: 새로고침 로직
}

const handleModalDelete = () => {
  // TODO: 삭제 로직
  isModalOpen.value = false
  selectedCardId.value = null
}

const handleTrashDeleteConfirm = () => {
  // TODO: 백엔드 연결 시 삭제 대기 항목 전체 삭제 API 호출로 교체
  isTrashDeleteModalOpen.value = false
}
</script>
