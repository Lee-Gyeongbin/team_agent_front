<template>
  <div class="doc-dataset-source-panel">
    <!-- 헤더: 체크박스 + 카운트 -->
    <div
      class="doc-dataset-source-panel-header"
      @click="isExpanded = !isExpanded"
    >
      <UiCheckbox
        :model-value="useUrl"
        @update:model-value="$emit('update:useUrl', $event)"
        @click.stop
      >
        <span class="doc-dataset-source-panel-label">
          URL
          <span class="doc-dataset-source-panel-count">
            (<strong>{{ selectedUrlIds.length }}개</strong> 선택 / {{ urlList.length }}개 사용가능)
          </span>
        </span>
      </UiCheckbox>
      <span
        class="doc-dataset-source-panel-arrow"
        :class="{ 'is-expanded': isExpanded }"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <!-- 본문 -->
    <div
      v-if="isExpanded && useUrl"
      class="doc-dataset-source-panel-body"
    >
      <!-- 검색 -->
      <div class="doc-dataset-source-search-row">
        <UiInput
          v-model="searchKeyword"
          placeholder="URL명으로 검색..."
          size="sm"
          class="doc-dataset-source-search-input"
        >
          <template #icon-right>
            <i class="icon-search size-16" />
          </template>
        </UiInput>
      </div>

      <!-- 2분할: 카테고리 트리(좌) + URL 리스트(우) -->
      <div class="doc-dataset-source-doc-split">
        <!-- 좌측: 카테고리 트리 -->
        <div class="doc-dataset-source-doc-tree">
          <div
            class="doc-dataset-category-all"
            :class="{ 'is-selected': !selectedCategoryId }"
            @click="selectedCategoryId = ''"
          >
            <i class="icon icon-folder-close size-16" />
            <span>전체</span>
          </div>
          <ul class="category-tree">
            <CategoryTreeNode
              v-for="cat in categoryTree"
              :key="cat.categoryId"
              :item="cat"
              :depth="1"
              selectable
              :selected-ids="selectedCategoryId ? [selectedCategoryId] : []"
              :show-check-icon="false"
              :menu-items="[]"
              reorder-disabled
              @toggle="onCategoryTreeToggle"
              @select="onCategoryTreeSelect"
            />
          </ul>
        </div>

        <!-- 우측: URL 리스트 -->
        <div class="doc-dataset-source-doc-files">
          <div
            v-for="item in filteredList"
            :key="item.urlId"
            class="doc-dataset-source-doc-file-item"
            @click="toggleSelect(item.urlId)"
          >
            <span
              class="ui-checkbox"
              :class="{ 'is-checked': selectedUrlIds.includes(item.urlId) }"
            >
              <span class="ui-checkbox-box">
                <svg
                  v-if="selectedUrlIds.includes(item.urlId)"
                  class="ui-checkbox-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </span>
            <span class="doc-dataset-source-url-name-wrap">
              <span class="doc-dataset-source-doc-file-name">{{ item.urlName || '-' }}</span>
              <span class="doc-dataset-source-url-addr">{{ item.urlAddr }}</span>
            </span>
          </div>

          <UiEmpty
            v-if="filteredList.length === 0"
            title="URL이 없습니다."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import CategoryTreeNode from '~/components/repository/CategoryTreeNode.vue'
import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { CategoryItem, DocDatasetSelectedUrl } from '~/types/doc-dataset'
import type { CategoryTreeItem } from '~/types/repository'

interface Props {
  useUrl: boolean
  selectedUrlIds: string[]
  urlList: DocDatasetSelectedUrl[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:useUrl': [value: boolean]
  'update:selectedUrlIds': [value: string[]]
}>()

const { fetchCategoryList } = useRepositoryApi()

const isExpanded = ref(true)
const searchKeyword = ref('')
const selectedCategoryId = ref('')

// ===== 카테고리 트리 =====
const categoryTree = ref<CategoryTreeItem[]>([])

function buildCategoryTree(flat: CategoryItem[]): CategoryTreeItem[] {
  const byId = new Map<string, CategoryTreeItem>()
  for (const row of flat) {
    byId.set(row.categoryId, {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      parnCatId: row.parnCatId ?? null,
      catLvl: String(row.catLvl ?? 1),
      sortOrd: String(row.sortOrd ?? 0),
      sortPath: '',
      depth: String(row.catLvl ?? 1),
      children: [],
      expanded: true,
    })
  }
  const roots: CategoryTreeItem[] = []
  for (const row of flat) {
    const node = byId.get(row.categoryId)
    if (!node) continue
    const parentId = row.parnCatId
    if (!parentId) {
      roots.push(node)
    } else if (byId.has(parentId)) {
      byId.get(parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortSiblings = (nodes: CategoryTreeItem[]) => {
    nodes.sort((a, b) => {
      const ao = Number(a.sortOrd) || 0
      const bo = Number(b.sortOrd) || 0
      if (ao !== bo) return ao - bo
      return String(a.sortPath).localeCompare(String(b.sortPath), undefined, { numeric: true })
    })
    for (const n of nodes) if (n.children?.length) sortSiblings(n.children)
  }
  const computeSortPaths = (nodes: CategoryTreeItem[], parentPath = '') => {
    for (const n of nodes) {
      const padded = String(Number(n.sortOrd) || 0).padStart(10, '0')
      n.sortPath = parentPath ? `${parentPath}.${padded}` : padded
      if (n.children?.length) computeSortPaths(n.children, n.sortPath)
    }
  }
  sortSiblings(roots)
  computeSortPaths(roots)
  sortSiblings(roots)
  return roots
}

onMounted(async () => {
  const res = await fetchCategoryList()
  categoryTree.value = buildCategoryTree((res.dataList ?? []) as CategoryItem[])
})

function findTreeNode(nodes: CategoryTreeItem[], id: string): CategoryTreeItem | null {
  for (const n of nodes) {
    if (n.categoryId === id) return n
    if (n.children?.length) {
      const found = findTreeNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

const onCategoryTreeToggle = (item: CategoryTreeItem) => {
  const node = findTreeNode(categoryTree.value, item.categoryId)
  if (node?.children?.length) node.expanded = !node.expanded
}

const onCategoryTreeSelect = (item: CategoryTreeItem) => {
  selectedCategoryId.value = selectedCategoryId.value === item.categoryId ? '' : item.categoryId
}

// ===== 필터링 =====
const filteredList = computed(() => {
  return props.urlList.filter((u) => {
    const isMatchedCategory = !selectedCategoryId.value || String(u.categoryId ?? '') === selectedCategoryId.value
    if (!isMatchedCategory) return false
    if (!searchKeyword.value) return true
    const keyword = searchKeyword.value.toLowerCase()
    return (
      String(u.urlName || '').toLowerCase().includes(keyword) ||
      String(u.urlAddr || '').toLowerCase().includes(keyword)
    )
  })
})

// 선택 토글
const toggleSelect = (id: string) => {
  const ids = [...props.selectedUrlIds]
  const index = ids.indexOf(id)
  if (index > -1) {
    ids.splice(index, 1)
  } else {
    ids.push(id)
  }
  emit('update:selectedUrlIds', ids)
}
</script>
