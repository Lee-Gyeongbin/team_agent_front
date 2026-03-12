<template>
  <div class="library-index">
    <!-- 로딩 -->
    <div
      v-if="isLoading"
      class="library-loading"
    >
      <div class="library-loading__spinner" />
      <p class="library-loading__text">라이브러리를 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div
      v-else-if="errorMessage"
      class="library-error"
    >
      <p class="library-error__message">{{ errorMessage }}</p>
      <UiButton
        variant="outline"
        size="md"
        @click="handleFetchCategoryList"
      >
        다시 시도
      </UiButton>
    </div>

    <!-- 메인 콘텐츠 -->
    <template v-else>
      <div class="library-header-wrapper flex justify-between items-center">
        <p class="library-description">대화 중 마음에 드는 지식을 저장하고 카테고리별로 관리하세요.</p>
        <div class="right-grp flex items-center">
          <p class="total">
            총 <strong>{{ cardList.length }}개</strong>
          </p>
          <div class="library-input-grp shrink-0 grow-1 max-w-400">
            <UiInput
              type="search"
              placeholder="검색어를 입력하세요"
            />
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
            <UiButton
              variant="ghost"
              size="md"
              class="btn btn-library btn-library-archive"
              @click="isArchiveModalOpen = true"
            >
              <template #icon-left>
                <i class="icon icon-archive size-16"></i>
              </template>
              <span class="badge-num">{{ archiveCardList.length }}</span>
            </UiButton>
            <!-- 삭제 btn -->
            <UiButton
              variant="ghost"
              size="md"
              class="btn btn-library btn-library-trash"
              @click="onTrashDeleteClick"
            >
              <template #icon-left>
                <i class="icon icon-delete size-16"></i>
              </template>
              <span class="badge-num">9</span>
            </UiButton>
          </div>
        </div>
      </div>
      <div class="library-content-area">
        <!-- 좌측 화살표 -->
        <button
          v-show="canScrollLeft"
          class="library-scroll-btn is-left"
          @click="onScrollLeft"
        >
          <span class="scroll-chevron" />
        </button>

        <!-- 우측 화살표 -->
        <button
          v-show="canScrollRight"
          class="library-scroll-btn is-right"
          @click="onScrollRight"
        >
          <span class="scroll-chevron" />
        </button>

        <div
          ref="contentWrapperRef"
          class="library-content-wrapper flex"
          @scroll="onContentScroll"
        >
          <draggable
            v-model="categoryList"
            class="library-category-draggable flex"
            item-key="categoryId"
            handle=".library-list-header"
            animation="200"
            @start="onCategoryDragStart"
            @end="onCategoryDragEnd"
          >
            <template #item="{ element: category }">
              <div class="library-list-grp">
                <div class="library-list-header flex justify-between items-center">
                  <div class="left-grp flex items-center">
                    <p class="list-title"><i class="icon-diamond size-8"></i>{{ category.categoryNm }}</p>
                    <p class="card-count fw-700">{{ categoryCards[category.categoryId]?.length || 0 }}</p>
                  </div>
                  <!-- 카테고리 드롭다운 메뉴 -->
                  <UiDropdownMenu
                    :items="listMenuItems"
                    align="end"
                    @select="(value) => handleListMenuSelect(category, value)"
                  >
                    <template #trigger>
                      <UiButton
                        icon-only
                        variant="ghost"
                        size="md"
                        class="btn btn-library-card-add type-white"
                      >
                        <template #icon-left>
                          <i class="icon icon-add-dot size-20"></i>
                        </template>
                      </UiButton>
                    </template>
                  </UiDropdownMenu>
                  <!-- .END 카테고리 드롭다운 메뉴 -->
                </div>
                <div class="library-card-grp">
                  <draggable
                    v-model="categoryCards[category.categoryId]"
                    class="library-card-draggable flex flex-col"
                    :group="{ name: 'library-cards' }"
                    item-key="cardId"
                    animation="200"
                    :delay="20"
                    :delay-on-touch-only="false"
                    :empty-insert-threshold="80"
                    @start="onCardDragStart"
                    @end="onCardDragEnd"
                  >
                    <template #item="{ element: card }">
                      <div
                        class="library-card"
                        :class="{ 'is-active': selectedCardId === card.cardId }"
                        @click="openModal(card.cardId)"
                      >
                        <!-- 상단 영역 -->
                        <div class="library-card-top flex justify-between items-center">
                          <div class="flex items-center gap-4">
                            <UiBadge
                              v-if="card.svcTy === 'S'"
                              variant="data-line"
                            >
                              <template #icon-left>
                                <i class="icon icon-data-line-small size-14"></i>
                              </template>
                              데이터분석
                            </UiBadge>
                            <UiBadge
                              v-if="card.svcTy === 'C'"
                              variant="basic-chat"
                            >
                              <template #icon-left>
                                <i class="icon icon-comment-other size-14"></i>
                              </template>
                              기본대화
                            </UiBadge>
                            <UiBadge
                              v-if="card.svcTy === 'M'"
                              variant="manual-ai"
                            >
                              <template #icon-left>
                                <i class="icon icon-book size-14"></i>
                              </template>
                              매뉴얼AI
                            </UiBadge>

                            <!-- 즐겨찾기 버튼 -->
                            <UiButton
                              icon-only
                              variant="ghost"
                              class="btn-star"
                              :class="{ 'is-active': card.pinYn === 'Y' }"
                              @click.stop="handleCardPin(card)"
                            >
                              <template #icon-left>
                                <i class="icon icon-star-fill size-12"></i>
                              </template>
                            </UiButton>
                          </div>

                          <!-- 카드 드롭다운 메뉴 -->
                          <div @click.stop>
                            <UiDropdownMenu
                              :items="getCardMenuItems(card)"
                              align="end"
                              @select="handleCardMenuSelect(card, $event)"
                            >
                              <template #trigger>
                                <UiButton
                                  icon-only
                                  variant="ghost"
                                  size="md"
                                  class="btn btn-library-card-add type-white"
                                >
                                  <template #icon-left>
                                    <i class="icon icon-add-dot size-20"></i>
                                  </template>
                                </UiButton>
                              </template>
                            </UiDropdownMenu>
                          </div>
                          <!-- END 카드 드롭다운 메뉴 -->
                        </div>
                        <!-- 제목 -->
                        <h3 class="library-card-title fw-600">{{ card.title }}</h3>
                        <!-- 설명 -->
                        <p class="library-card-desc">{{ card.qryRslt }}</p>

                        <!-- 하단 메타 -->
                        <div class="library-card-meta flex items-center justify-between">
                          <p class="library-card-date ws-nowrap">{{ formatDateTimeDisplay(card.createDt) }}</p>

                          <div class="library-card-tags flex items-center">
                            <span
                              v-for="tag in (card.tags || '').split(',').filter(Boolean)"
                              :key="tag"
                              class="library-card-tag"
                              >#{{ tag }}</span
                            >
                          </div>
                        </div>
                      </div>
                    </template>
                    <!-- 카드가 없을 때: drop 영역 확보 + 빈 상태 UI -->
                    <template #footer>
                      <div
                        v-if="(categoryCards[category.categoryId]?.length ?? 0) === 0"
                        class="library-card type-new-card"
                      >
                        <div class="library-card-new-card-content">
                          <i class="icon icon-heart size-24"></i>
                          <p>마음에 드는 날리지를 저장해주세요</p>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </template>
          </draggable>

          <!-- 카테고리 입력 -->
          <div class="library-list-grp">
            <div class="library-category-input-grp flex items-center">
              <UiInput
                v-model="newCategoryNm"
                type="text"
                class="inp-category"
                placeholder="카테고리명을 입력하세요"
              />
              <UiButton
                size="md"
                class="btn-category-add w-57"
                @click="handleAddCategory"
              >
                추가
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 카드 상세 모달 -->
      <LibraryDetailModal
        :is-open="isModalOpen"
        :card-detail="selectedCard"
        @close="handleModalClose"
        @refresh="handleModalRefresh"
        @delete="handleModalDelete"
      />

      <!-- 보관함 모달 -->
      <LibraryArchiveModal
        :is-open="isArchiveModalOpen"
        @close="isArchiveModalOpen = false"
        @unarchive="handleUnarchiveCard"
      />

      <!-- 카테고리명 변경 모달 -->
      <UiModal
        :is-open="isRenameModalOpen"
        title="카테고리명 변경"
        position="center"
        max-width="420px"
        @close="handleRenameModalClose"
      >
        <LibraryCategoryRenameModal
          :category="renamingCategory"
          @save="handleSaveRename"
          @close="handleRenameModalClose"
        />
      </UiModal>

      <!-- 카드 이동 모달 -->
      <UiModal
        :is-open="isMoveModalOpen"
        title="카테고리 이동"
        position="center"
        max-width="420px"
        @close="handleMoveModalClose"
      >
        <LibraryCardMoveModal
          :card="movingCard"
          :move-target-options="moveTargetOptions"
          @move="handleMoveCard"
          @close="handleMoveModalClose"
        />
      </UiModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useLibraryStore } from '~/composables/library/useLibraryStore'

const {
  categoryList,
  categoryCards,
  searchOptions,
  listMenuItems,
  getCardMenuItems,
  cardList,
  archiveCardList,
  isLoading,
  errorMessage,
  isModalOpen,
  isArchiveModalOpen,
  isRenameModalOpen,
  isMoveModalOpen,
  renamingCategory,
  movingCard,
  moveTargetOptions,
  selectedCardId,
  selectedCard,
  newCategoryNm,
  handleFetchCategoryList,
  handleListMenuSelect,
  handleRenameModalClose,
  handleSaveRename,
  handleMoveModalClose,
  handleMoveCard,
  handleCardMenuSelect,
  onCategoryDragStart,
  onCategoryDragEnd,
  onCardDragStart,
  onCardDragEnd,
  handleCardPin,
  openModal,
  handleModalClose,
  handleModalRefresh,
  handleModalDelete,
  handleTrashDeleteConfirm,
  handleAddCategory,
  handleUnarchiveCard,
} = useLibraryStore()

/** 휴지통 전체 삭제 클릭 */
const onTrashDeleteClick = async () => {
  const ok = await openConfirm({
    title: '삭제',
    message: '삭제 대기 중인 항목을 모두 삭제하시겠습니까?',
    confirmText: '삭제',
  })
  if (ok) handleTrashDeleteConfirm()
}

const contentWrapperRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

/** 스크롤 상태 업데이트 */
const updateScrollState = () => {
  const el = contentWrapperRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

const onContentScroll = () => updateScrollState()

/** 좌측 스크롤 */
const onScrollLeft = () => {
  contentWrapperRef.value?.scrollBy({ left: -680, behavior: 'smooth' })
}

/** 우측 스크롤 */
const onScrollRight = () => {
  contentWrapperRef.value?.scrollBy({ left: 680, behavior: 'smooth' })
}

onMounted(() => {
  handleFetchCategoryList()
  nextTick(() => updateScrollState())
})
</script>
