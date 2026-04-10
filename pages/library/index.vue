<template>
  <div class="library-index">
    <!-- 에러 -->
    <div
      v-if="errorMessage"
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
        <p class="library-top-title">나의 지식 목록</p>
        <div class="right-grp flex items-center">
          <p class="total">
            총 <strong>{{ cardList.length }}개</strong>
          </p>
          <div class="library-input-grp shrink-0 grow-1 max-w-400">
            <UiInput
              v-model="searchTitle"
              type="search"
              placeholder="검색어를 입력하세요"
              @keyup.enter="handleFetchCardList"
              @search="handleFetchCardList"
            />
          </div>
          <div class="library-select-grp shrink-0 grow-1 max-w-140">
            <UiSelect
              id="sort-order"
              v-model="searchSort"
              name="sort-order"
              :options="searchOptions"
              size="md"
              @update:model-value="handleFetchCardList"
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
              @click="isTrashModalOpen = true"
            >
              <template #icon-left>
                <i class="icon icon-delete size-16"></i>
              </template>
              <span class="badge-num">{{ trashCardList.length }}</span>
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
                        <div class="library-card-img-grp">
                          <img
                            :src="resolveDataUrlImageSrc(card.thumbImg, defaultLibraryCardImg)"
                            alt="카드 이미지"
                            class="img"
                          />
                        </div>

                        <!-- 설명 -->
                        <div class="library-card-desc">
                          <!-- 상단 영역 -->
                          <div class="library-card-top flex justify-between items-center">
                            <!-- 제목 -->
                            <h3 class="library-card-title">{{ card.title }}</h3>

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

                          <div class="library-card-tags">
                            <span
                              v-for="tag in (card.tags || '').split(',').filter(Boolean)"
                              :key="tag"
                              class="library-card-tag"
                              >#{{ tag }}&nbsp;
                            </span>
                          </div>
                        </div>

                        <!-- 하단 메타 -->
                        <div class="library-card-meta flex items-center justify-between">
                          <div class="flex items-center gap-4">
                            <p class="library-card-date">{{ formatDateTimeDisplay(card.createDt) }}</p>
                            <span
                              v-if="card.newYn === 'Y'"
                              class="library-card-new-tag"
                              >NEW</span
                            >
                          </div>

                          <div class="flex items-center">
                            <!-- 데이터분석(S): 배지 없이 아이콘만 (다른 svcTy는 표시 없음) — 히트영역은 즐겨찾기 버튼과 동일 20×20 -->
                            <div
                              v-if="card.svcTy === 'S'"
                              class="library-card-svc-data"
                            >
                              <i
                                class="icon icon-data-line-small size-14 library-card-svc-data-icon"
                                role="img"
                                aria-label="데이터 분석"
                              />
                            </div>

                            <!-- 즐겨찾기 버튼 -->
                            <UiButton
                              icon-only
                              variant="ghost"
                              class="btn-star"
                              :class="{ 'is-active': card.pinYn === 'Y' }"
                              @click.stop="handleCardPin(card)"
                            >
                              <template #icon-left>
                                <i class="icon icon-star-fill size-14"></i>
                              </template>
                            </UiButton>
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
                          <i class="icon-chat-open-book size-20"></i>
                          <p>마음에 드는 지식을 저장해주세요</p>
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
        :ref-items="refItems"
        :table-data="tableData"
        :chart-stat-items="chartStatItems"
        :chart-detail-cd-items="chartDetailCdItems"
        @close="handleModalClose"
        @move="handleModalMove"
        @delete="handleModalDelete"
      />

      <!-- 보관함 모달 -->
      <LibraryArchiveModal
        :is-open="isArchiveModalOpen"
        @close="isArchiveModalOpen = false"
        @unarchive="handleUnarchiveCard"
      />

      <!-- 휴지통 모달 -->
      <LibraryTrashModal
        :is-open="isTrashModalOpen"
        @close="handleTrashModalClose"
        @restore="handleRestoreCard"
        @empty-trash="handleEmptyTrash"
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
import defaultLibraryCardImg from '~/assets/images/test_images.png'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
import { resolveDataUrlImageSrc } from '~/utils/global/imageUtil'

const {
  categoryList,
  categoryCards,
  searchOptions,
  listMenuItems,
  getCardMenuItems,
  cardList,
  archiveCardList,
  trashCardList,
  errorMessage,
  isModalOpen,
  isArchiveModalOpen,
  isTrashModalOpen,
  isRenameModalOpen,
  isMoveModalOpen,
  renamingCategory,
  movingCard,
  moveTargetOptions,
  selectedCardId,
  selectedCard,
  newCategoryNm,
  searchTitle,
  searchSort,
  refItems,
  tableData,
  chartStatItems,
  chartDetailCdItems,
  handleFetchCategoryList,
  handleFetchCardList,
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
  handleModalMove,
  handleModalDelete,
  handleAddCategory,
  handleUnarchiveCard,
  handleTrashModalClose,
  handleRestoreCard,
  handleEmptyTrash,
} = useLibraryStore()

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
