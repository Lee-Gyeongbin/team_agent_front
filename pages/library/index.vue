<template>
  <div class="library-index">
    <div class="library-header-wrapper flex justify-between items-center">
      <div class="left-grp flex items-end">
        <h2 class="library-title">내지식창고</h2>
        <p class="library-description">대화 중 마음에 드는 지식을 저장하고 카테고리별로 관리하세요.</p>
      </div>
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
          <button
            class="btn btn-library btn-library-archive"
            @click="isArchiveModalOpen = true"
          >
            <i class="icon icon-archive size-16"></i>
            <span class="badge-num">23</span>
          </button>
          <button class="btn btn-library btn-library-trash">
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
          <!-- 드롭다운 메뉴 -->
          <div
            class="dropdown-wrapper"
            :class="{ 'is-show': isDropdownOpen }"
          >
            <button
              class="btn btn-library-card-add type-white"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <i class="icon icon-add-dot size-20"></i>
            </button>
            <div class="dropdown-menu">
              <button class="dropdown-item">
                <i class="icon icon-edit size-16"></i>
                <span>이름 변경</span>
              </button>
              <button class="dropdown-item">
                <i class="icon icon-trashcan size-16"></i>
                <span>카테고리 삭제</span>
              </button>
            </div>
          </div>
          <!-- .END 드롭다운 메뉴 -->
        </div>
        <div class="library-card-grp">
          <div
            v-for="card in 7"
            :key="card"
            class="library-card"
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
              <!-- 드롭다운 메뉴 -->
              <div
                class="dropdown-wrapper"
                :class="{ 'is-show': cardDropdownOpen[card] }"
                @click.stop
              >
                <button
                  class="btn btn-library-card-add type-white"
                  @click.stop="cardDropdownOpen[card] = !cardDropdownOpen[card]"
                >
                  <i class="icon icon-add-dot size-20"></i>
                </button>
                <div class="dropdown-menu">
                  <button class="dropdown-item">
                    <i class="icon icon-view size-16"></i>
                    <span>상세 보기</span>
                  </button>
                  <button class="dropdown-item">
                    <i class="icon icon-transfer size-16"></i>
                    <span>카테고리 이동</span>
                  </button>
                  <button class="dropdown-item">
                    <i class="icon icon-star-line size-16"></i>
                    <span>즐겨찾기 등록</span>
                  </button>
                  <button class="dropdown-item">
                    <i class="icon icon-star-fill size-16"></i>
                    <span>즐겨찾기 해제</span>
                  </button>
                  <button class="dropdown-item">
                    <i class="icon icon-copy-gray size-16"></i>
                    <span>답변 복사</span>
                  </button>
                  <button class="dropdown-item">
                    <i class="icon icon-archive size-16"></i>
                    <span>보관</span>
                  </button>
                  <button class="dropdown-item type-danger">
                    <i class="icon icon-delete size-16"></i>
                    <span>삭제</span>
                  </button>
                </div>
              </div>
              <!-- .END 드롭다운 메뉴 -->
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
          <!-- 드롭다운 메뉴 -->
          <div
            class="dropdown-wrapper"
            :class="{ 'is-show': isDropdownOpen }"
          >
            <button
              class="btn btn-library-card-add type-white"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <i class="icon icon-add-dot size-20"></i>
            </button>
            <div class="dropdown-menu">
              <button class="dropdown-item">
                <i class="icon icon-edit size-16"></i>
                <span>이름 변경</span>
              </button>
              <button class="dropdown-item">
                <i class="icon icon-trashcan size-16"></i>
                <span>카테고리 삭제</span>
              </button>
            </div>
          </div>
          <!-- .END 드롭다운 메뉴 -->
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
      @close="isModalOpen = false"
      @refresh="handleModalRefresh"
      @delete="handleModalDelete"
    />

    <!-- 보관함 모달 -->
    <LibraryArchiveModal
      :is-open="isArchiveModalOpen"
      @close="isArchiveModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const searchOptions = [
  { label: '직접설정순', value: 'custom' },
  { label: '최신순', value: 'latest' },
  { label: '이름순', value: 'name' },
]

// 드롭다운 토글 상태
const isDropdownOpen = ref(false)

// 카드별 드롭다운 토글 상태
const cardDropdownOpen = ref<Record<number, boolean>>({})

// 드래그 스크롤 적용
const { setupDragScroll } = useDragScroll()
const contentWrapperRef = ref<HTMLElement | null>(null)

// 가로 스크롤 (library-content-wrapper)
setupDragScroll(contentWrapperRef)

// 모달 상태
const isModalOpen = ref(false)
const isArchiveModalOpen = ref(false)

// 모달 열기
const openModal = (_cardId: number) => {
  isModalOpen.value = true
}

// 모달 이벤트 핸들러
const handleModalRefresh = () => {
  // TODO: 새로고침 로직
}

const handleModalDelete = () => {
  // TODO: 삭제 로직
  isModalOpen.value = false
}
</script>
