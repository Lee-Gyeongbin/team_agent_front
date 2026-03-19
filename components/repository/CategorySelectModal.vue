<template>
  <UiModal
    :is-open="isOpen"
    title="카테고리 선택"
    position="center"
    :max-width="'720px'"
    custom-class="modal-category-select"
    @close="onClose"
  >
    <div class="modal-category-select__body">
      <!-- 검색 -->
      <div class="modal-category-select__search">
        <UiInput
          v-model="searchKeyword"
          type="search"
          placeholder="카테고리 검색"
          class="search-input"
          @search="onSearch"
          @enter="onSearch"
        />
      </div>

      <!-- 카테고리 트리 (CategoryTreeNode selectable 모드 재사용) -->
      <div class="modal-category-select__tree-wrap category-panel">
        <ul class="category-tree">
          <CategoryTreeNode
            v-for="cat in categoryTree"
            :key="cat.id"
            :item="cat"
            :depth="1"
            selectable
            :selected-ids="selectedIds"
            @toggle="toggleExpand"
            @select="toggleSelect"
          />
        </ul>
      </div>
    </div>

    <!-- 푸터 -->
    <template #footer>
      <div class="modal-category-select__footer">
        <UiButton
          variant="outline"
          size="xlg"
          class="btn-modal-dialog"
          @click="onClose"
        >
          닫기
        </UiButton>
        <UiButton
          variant="primary"
          size="xlg"
          class="btn-modal-dialog"
          @click="onConfirm"
        >
          확인
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { CategoryItem } from '~/types/repository'
import CategoryTreeNode from '~/components/repository/CategoryTreeNode.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

// 🔽 퍼블용 더미 데이터 — 백엔드 연결 시 API로 교체
const searchKeyword = ref('')
const selectedIds = ref<string[]>(['cat-modal-1', 'cat-modal-1-1', 'cat-modal-1-1-1'])
const categoryTree = ref<CategoryItem[]>([
  {
    id: 'cat-modal-1',
    name: '1depth 카테고리명임',
    expanded: true,
    children: [
      {
        id: 'cat-modal-1-1',
        name: '2depth 카테고리명임',
        expanded: true,
        children: [
          {
            id: 'cat-modal-1-1-1',
            name: '3depth 카테고리명임',
            expanded: true,
            children: [{ id: 'cat-modal-1-1-1-1', name: '4depth 카테고리명' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cat-modal-2',
    name: '1depth 카테고리명임',
    expanded: false,
    children: [{ id: 'cat-modal-2-1', name: '2depth 카테고리명임' }],
  },
  { id: 'cat-modal-3', name: '1depth 카테고리명임' },
  { id: 'cat-modal-4', name: '1depth 카테고리명임' },
  { id: 'cat-modal-5', name: '1depth 카테고리명임' },
  {
    id: 'cat-modal-6',
    name: '1depth 카테고리명임',
    expanded: true,
    children: [{ id: 'cat-modal-6-1', name: '2depth 카테 고리명임' }],
  },
])

// 퍼블용 — 추후 API 연동 시 검색 요청으로 교체
const onSearch = () => {}
const toggleExpand = (item: CategoryItem) => {
  if (item?.children?.length) item.expanded = !item.expanded
}
const toggleSelect = (item: CategoryItem) => {
  const idx = selectedIds.value.indexOf(item.id)
  if (idx > -1) {
    selectedIds.value = selectedIds.value.filter((id) => id !== item.id)
  } else {
    selectedIds.value = [...selectedIds.value, item.id]
  }
}
const onClose = () => emit('close')
const onConfirm = () => {
  emit('confirm')
  emit('close')
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

:deep(.modal-dialog-content) {
  max-width: 720px;
  border-radius: 12px;
}

:deep(.modal-dialog-body) {
  display: block;
  min-height: 0;
  padding: 0;
}

.modal-category-select__body {
  padding: 0;
}

.modal-category-select__search {
  margin-bottom: 12px;
  margin-top: 12px;

  .search-input {
    width: 100%;
  }
}

.modal-category-select__tree-wrap {
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
  // category-panel 스타일 상속 + 모달 전용 오버라이드
  border: none;
  padding: 0;
  width: 100%;
  height: auto;
}

.modal-category-select__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}
</style>
