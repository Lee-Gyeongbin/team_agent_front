<template>
  <div class="menu-manage-tab">
    <!-- 상단 toolbar -->
    <div class="menu-manage-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="searchKeyword"
        type="search"
        placeholder="메뉴명으로 검색..."
        class="menu-search-input"
        @search="onSearch"
        @enter="onSearch"
      />
      <UiButton
        variant="primary"
        size="md"
        class="btn-add-menu"
        @click="onAddMenu"
      >
        <template #icon-left>
          <i class="icon icon-plus size-16" />
        </template>
        메뉴 추가
      </UiButton>
    </div>

    <!-- 메인 컨텐츠: 좌측 트리 + 우측 폼 -->
    <section class="menu-manage-content-wrapper flex">
      <!-- 좌측: 메뉴 트리 패널 -->
      <aside class="menu-tree-panel">
        <div class="menu-panel-header flex justify-between items-center">
          <span class="menu-panel-title">메뉴 목록</span>
          <UiButton
            icon-only
            variant="ghost"
            size="xxs"
            @click="onExpandAll"
          >
            <template #icon-left>
              <i class="icon icon-sliders size-16" />
            </template>
          </UiButton>
        </div>

        <div class="menu-tree-wrap">
          <UiLoading
            v-if="isTreeLoading"
            text="불러오는 중..."
          />
          <div
            v-else-if="treeFetchError"
            class="menu-tree-panel-error"
          >
            <p class="menu-tree-panel-error__message">{{ treeFetchError }}</p>
            <UiButton
              variant="outline"
              size="md"
              @click="onRetryTreeFetch"
            >
              다시 시도
            </UiButton>
          </div>
          <UiEmpty
            v-else-if="filteredMenuList.length === 0"
            description="등록된 메뉴가 없습니다."
          />
          <ul
            v-else
            class="menu-tree"
          >
            <MenuTreeNode
              v-for="menu in filteredMenuList"
              :key="menu.menuId"
              :item="menu"
              :depth="1"
              :selected-id="selectedMenuId"
              :reorder-disabled="isReorderDisabled"
              :dragging-id="draggingMenuId"
              @toggle="onToggle"
              @select="onMenuSelect"
              @reorder="onTreeReorder"
              @drag-start="onTreeDragStart"
              @drag-end="onTreeDragEnd"
            />
          </ul>
        </div>
      </aside>

      <!-- 우측: 메뉴 상세 / 수정 폼 패널 -->
      <div class="menu-detail-panel">
        <template v-if="!selectedMenu">
          <UiEmpty description="좌측 목록에서 메뉴를 선택하면 상세 정보를 수정할 수 있습니다." />
        </template>

        <MenuDetailForm
          v-else
          v-model:menu="selectedMenu"
          :menu-tree="menuTreeList"
          @save="onSaveMenu"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { UiLoading } from '@leechanyong/ispark-ui'
import MenuDetailForm from '~/components/menu-manage/MenuDetailForm.vue'
import MenuTreeNode from '~/components/menu-manage/MenuTreeNode.vue'
import type { MenuTreeItem, MenuTreeReorderPayload } from '~/types/menu'

const {
  menuManageTreeList: menuTreeList,
  menuManageTreeLoading: isTreeLoading,
  menuManageTreeError: treeFetchError,
  selectedMenu,
  isNewMenu,
  handleFetchMenuManageTree,
  handleSelectMenu,
  handleAddMenu,
  handleUpdateMenuOrder,
  handleSaveMenu,
} = useMenuManageStore()

const onRetryTreeFetch = async (): Promise<void> => {
  selectedMenuId.value = null
  selectedMenu.value = null
  isNewMenu.value = false
  await handleFetchMenuManageTree()
}

// ===========================
// 검색
// ===========================
const searchKeyword = ref('')

const filterTree = (list: MenuTreeItem[], keyword: string): MenuTreeItem[] => {
  if (!keyword.trim()) return list
  const kw = keyword.trim().toLowerCase()
  return list.reduce<MenuTreeItem[]>((acc, item) => {
    const childMatch = filterTree(item.children ?? [], kw)
    const selfMatch = item.menuName.toLowerCase().includes(kw)
    if (selfMatch || childMatch.length > 0) {
      acc.push({ ...item, expanded: true, children: childMatch.length > 0 ? childMatch : item.children })
    }
    return acc
  }, [])
}

const filteredMenuList = computed(() => filterTree(menuTreeList.value, searchKeyword.value))

/** 검색 필터 적용 중에는 트리 일부만 보이므로 D&D 정렬 비활성화 */
const isReorderDisabled = computed(() => Boolean(searchKeyword.value.trim()))

const draggingMenuId = ref<string | null>(null)

const onTreeDragStart = (menuId: string) => {
  draggingMenuId.value = menuId
}

const onTreeDragEnd = () => {
  draggingMenuId.value = null
}

const onTreeReorder = async (payload: MenuTreeReorderPayload) => {
  draggingMenuId.value = null
  try {
    const ok = await handleUpdateMenuOrder(payload)
    if (!ok) {
      openToast({ message: '같은 단계의 메뉴끼리만 순서를 변경할 수 있습니다.', type: 'warning' })
      return
    }
    openToast({ message: '메뉴 순서가 저장되었습니다.', type: 'success' })
  } catch {
    await handleFetchMenuManageTree()
    openToast({ message: '메뉴 순서 저장에 실패했습니다.', type: 'error' })
  }
}

const onSearch = () => {
  selectedMenuId.value = null
  selectedMenu.value = null
  isNewMenu.value = false
}

// ===========================
// 트리 상태 (펼치기/접기, 선택)
// ===========================
const selectedMenuId = ref<string | null>(null)

const findAndToggle = (list: MenuTreeItem[], target: MenuTreeItem): boolean => {
  for (const item of list) {
    if (item.menuId === target.menuId) {
      item.expanded = !item.expanded
      return true
    }
    if (item.children?.length && findAndToggle(item.children, target)) return true
  }
  return false
}

const onToggle = (item: MenuTreeItem) => {
  findAndToggle(menuTreeList.value, item)
}

const onMenuSelect = (item: MenuTreeItem) => {
  selectedMenuId.value = item.menuId
  handleSelectMenu(item)
}

// ===========================
// 저장
// ===========================
const onSaveMenu = () => handleSaveMenu()

const onAddMenu = () => {
  selectedMenuId.value = null
  handleAddMenu()
}

const setAllExpanded = (list: MenuTreeItem[], value: boolean) => {
  for (const item of list) {
    item.expanded = value
    if (item.children?.length) setAllExpanded(item.children, value)
  }
}

const allExpanded = ref(true)
const onExpandAll = () => {
  allExpanded.value = !allExpanded.value
  setAllExpanded(menuTreeList.value, allExpanded.value)
}
</script>

<style lang="scss" scoped>
.menu-manage-tab {
  width: 100%;
}
</style>
