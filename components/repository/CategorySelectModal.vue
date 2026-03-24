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
            v-for="cat in filteredCategoryList"
            :key="cat.categoryId"
            :item="cat"
            :depth="1"
            selectable
            :selected-ids="localSelectedId ? [localSelectedId] : []"
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
import type { CategoryTreeItem } from '~/types/repository'
import CategoryTreeNode from '~/components/repository/CategoryTreeNode.vue'
import { useCategoryStore } from '~/composables/repository/useCategoryStore'
const emit = defineEmits<{
  close: []
  confirm: [selectedId: string]
}>()

const props = defineProps<{
  isOpen: boolean
}>()

const { categoryList, visibleCategoryId, handleSelectCategoryList } = useCategoryStore()

const searchKeyword = ref('')
const localSelectedId = ref('')
// 모달 전용 로컬 복사본 (store 원본에 영향 안 줌)
const localCategoryList = ref<CategoryTreeItem[]>([])

// 트리 deep copy
function deepCopyTree(items: CategoryTreeItem[]): CategoryTreeItem[] {
  return items.map((item) => ({
    ...item,
    expanded: false,
    children: item.children?.length ? deepCopyTree(item.children) : undefined,
  }))
}

// 모달 열릴 때 로컬 복사본 생성 + 선택값 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      localSelectedId.value = visibleCategoryId.value
      localCategoryList.value = deepCopyTree(categoryList.value)
      if (!categoryList.value.length) handleSelectCategoryList()
    }
  },
)

// 검색 필터링 (로컬 복사본 기준)
const filteredCategoryList = computed(() => {
  if (!searchKeyword.value.trim()) return localCategoryList.value
  const kw = searchKeyword.value.toLowerCase()
  const filterTree = (items: CategoryTreeItem[]): CategoryTreeItem[] => {
    return items.reduce<CategoryTreeItem[]>((acc, item) => {
      const childMatches = item.children ? filterTree(item.children) : []
      if (item.categoryName.toLowerCase().includes(kw) || childMatches.length > 0) {
        acc.push({ ...item, expanded: true, children: childMatches.length > 0 ? childMatches : item.children })
      }
      return acc
    }, [])
  }
  return filterTree(localCategoryList.value)
})

const onSearch = () => {}

const toggleExpand = (item: CategoryTreeItem) => {
  if (item?.children?.length) item.expanded = !item.expanded
}

const toggleSelect = (item: CategoryTreeItem) => {
  // 단일 선택: 항상 하나만 유지 (같은 항목 재클릭 시 해제)
  if (localSelectedId.value === item.categoryId) {
    localSelectedId.value = ''
  } else {
    localSelectedId.value = item.categoryId
  }
}

const onClose = () => emit('close')
const onConfirm = () => {
  emit('confirm', localSelectedId.value)
  emit('close')
}
</script>
