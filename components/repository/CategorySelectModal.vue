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
            :key="cat.id"
            :item="cat"
            :depth="1"
            selectable
            :selected-ids="localSelectedIds"
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
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'

const emit = defineEmits<{
  close: []
  confirm: [selectedIds: string[]]
}>()

const props = defineProps<{
  isOpen: boolean
}>()

const { categoryList, visibleCategoryIds, handleSelectCategoryList } = useRepositoryStore()

const searchKeyword = ref('')
const localSelectedIds = ref<string[]>([])
// 모달 전용 로컬 복사본 (store 원본에 영향 안 줌)
const localCategoryList = ref<CategoryItem[]>([])

// 트리 deep copy
function deepCopyTree(items: CategoryItem[]): CategoryItem[] {
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
      localSelectedIds.value = [...visibleCategoryIds.value]
      localCategoryList.value = deepCopyTree(categoryList.value)
      if (!categoryList.value.length) handleSelectCategoryList()
    }
  },
)

// 검색 필터링 (로컬 복사본 기준)
const filteredCategoryList = computed(() => {
  if (!searchKeyword.value.trim()) return localCategoryList.value
  const kw = searchKeyword.value.toLowerCase()
  const filterTree = (items: CategoryItem[]): CategoryItem[] => {
    return items.reduce<CategoryItem[]>((acc, item) => {
      const childMatches = item.children ? filterTree(item.children) : []
      if (item.name.toLowerCase().includes(kw) || childMatches.length > 0) {
        acc.push({ ...item, expanded: true, children: childMatches.length > 0 ? childMatches : item.children })
      }
      return acc
    }, [])
  }
  return filterTree(localCategoryList.value)
})

const onSearch = () => {}

const toggleExpand = (item: CategoryItem) => {
  if (item?.children?.length) item.expanded = !item.expanded
}

const toggleSelect = (item: CategoryItem) => {
  // 자식 있는 카테고리 → 펼치기/접기만
  if (item.children?.length) {
    item.expanded = !item.expanded
    return
  }
  // 리프 카테고리만 체크 토글
  const idx = localSelectedIds.value.indexOf(item.id)
  if (idx > -1) {
    localSelectedIds.value = localSelectedIds.value.filter((id) => id !== item.id)
  } else {
    localSelectedIds.value = [...localSelectedIds.value, item.id]
  }
}

const onClose = () => emit('close')
const onConfirm = () => {
  emit('confirm', localSelectedIds.value)
  emit('close')
}
</script>
