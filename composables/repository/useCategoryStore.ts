import { ref, watch } from 'vue'
import type { CategoryItem, CategoryTreeItem } from '~/types/repository'
import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import { collectDescendantIds } from '~/utils/repository/categoryTreeUtil'

const {
  fetchCategoryList,
  fetchSaveCategory,
  fetchRenameCategory,
  fetchDeleteCategory,
  fetchSelectDocFileLibraryList,
} = useRepositoryApi()

/** 스토어 간 공유 — useRepositoryStore가 순환 없이 트리 참조 */
export const categoryList = ref<CategoryTreeItem[]>([])
export const filteredCategoryList = ref<CategoryTreeItem[]>([])
const visibleCategoryId = ref('')

function buildFilteredTree(items: CategoryTreeItem[], id: string): CategoryTreeItem[] {
  return items.reduce<CategoryTreeItem[]>((acc, item) => {
    const filteredChildren = item.children ? buildFilteredTree(item.children, id) : []
    if (item.categoryId === id || filteredChildren.length > 0) {
      acc.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children })
    }
    return acc
  }, [])
}

function updateFilteredCategoryList() {
  if (!visibleCategoryId.value) {
    filteredCategoryList.value = categoryList.value
  } else {
    filteredCategoryList.value = buildFilteredTree(categoryList.value, visibleCategoryId.value)
  }
}

watch([categoryList, visibleCategoryId], () => updateFilteredCategoryList(), { immediate: true, deep: true })

/** 루트 여부 (TB_CONTENT_CAT 루트는 PARN_CAT_ID IS NULL) */
function isRootParnCat(parnCatId: string | null | undefined): boolean {
  return parnCatId == null || parnCatId === ''
}

/**
 * 평면 카테고리 리스트 → 부모-자식 트리 (SORT_ORD / SORT_PATH 기준 정렬)
 */
function buildCategoryTreeFromFlat(flat: CategoryItem[]): CategoryTreeItem[] {
  if (!flat.length) return []
  const byId = new Map<string, CategoryTreeItem>()
  for (const row of flat) {
    byId.set(row.categoryId, { ...row, children: [] })
  }
  const roots: CategoryTreeItem[] = []
  for (const row of flat) {
    const node = byId.get(row.categoryId)
    if (!node) continue
    const parentId = row.parnCatId
    if (isRootParnCat(parentId)) {
      roots.push(node)
    } else if (parentId && byId.has(parentId)) {
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
    for (const n of nodes) {
      if (n.children?.length) sortSiblings(n.children)
    }
  }
  sortSiblings(roots)

  const pruneLeaves = (nodes: CategoryTreeItem[]): CategoryTreeItem[] =>
    nodes.map((n) => {
      const ch = n.children?.length ? pruneLeaves(n.children) : undefined
      return { ...n, children: ch }
    })
  return pruneLeaves(roots)
}

export const useCategoryStore = () => {
  const { fileSelectedCategoryId, fileCurrentPage, fileTotalCount, fileSearchKeyword, handleSelectFileLibraryList } =
    useRepositoryStore()
  // ===== 카테고리 =====
  const isCategoryInputVisible = ref(false)
  const isCategorySelectModalOpen = ref(false)
  const categoryInputValue = ref('')
  const categoryInputRef = ref<{ focus: () => void } | null>(null)
  /** 상단 입력으로 추가할 때 부모 카테고리 ID (null이면 최상위) */
  const categoryInputParentId = ref<string | null>(null)
  const editingCategoryId = ref<string | null>(null)
  const editingName = ref('')

  const categoryInputPlaceholder = computed(() =>
    categoryInputParentId.value ? '하위 카테고리명 입력(엔터)' : '카테고리명 입력(엔터)',
  )
  const categoryMenuItems = [
    { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
    { label: '하위 카테고리 추가', value: 'addSubcategory', icon: 'icon-folder-close' },
    { label: '카테고리 삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
  ]
  // 카테고리 선택 → 파일 필터링
  const selectedCategoryIds = computed(() => (fileSelectedCategoryId.value ? [fileSelectedCategoryId.value] : []))
  /** id로 categoryList 원본 노드 찾기 */
  const findCategoryNodeById = (items: CategoryTreeItem[], id: string): CategoryTreeItem | null => {
    for (const item of items) {
      if (item.categoryId === id) return item
      if (item.children?.length) {
        const found = findCategoryNodeById(item.children, id)
        if (found) return found
      }
    }
    return null
  }
  const onCategorySelect = (item: CategoryTreeItem) => {
    if (item.children?.length) {
      const node = findCategoryNodeById(categoryList.value, item.categoryId)
      if (node?.children?.length) node.expanded = !node.expanded
      fileSelectedCategoryId.value = item.categoryId
      fileCurrentPage.value = 1
      handleSelectFileLibraryList()
      return
    }
    fileSelectedCategoryId.value = item.categoryId
    fileCurrentPage.value = 1
    handleSelectFileLibraryList()
  }
  // 카테고리 펼침 토글
  const toggleExpand = (item: CategoryTreeItem) => {
    if (!item?.children?.length) return
    const node = findCategoryNodeById(categoryList.value, item.categoryId)
    if (node?.children?.length) node.expanded = !node.expanded
  }
  /** 카테고리 입력란에 포커스 */
  const focusCategoryInputField = () => {
    nextTick(() => {
      nextTick(() => categoryInputRef.value?.focus())
    })
  }
  const toggleCategoryInput = () => {
    isCategoryInputVisible.value = !isCategoryInputVisible.value
    if (!isCategoryInputVisible.value) {
      categoryInputValue.value = ''
      categoryInputParentId.value = null
    } else {
      categoryInputParentId.value = null
      focusCategoryInputField()
    }
  }
  const onCategoryInputEnter = async () => {
    if (!categoryInputValue.value.trim()) return
    const name = categoryInputValue.value.trim()
    const parentId = categoryInputParentId.value
    const wasSubcategory = parentId != null
    const ok = await handleSaveCategory({
      categoryId: '',
      categoryName: name,
      parnCatId: parentId ?? null,
    })
    if (!ok) return
    categoryInputValue.value = ''
    categoryInputParentId.value = null
    if (wasSubcategory) isCategoryInputVisible.value = false
  }
  const startCategoryRename = (item: CategoryTreeItem) => {
    editingCategoryId.value = item.categoryId
    editingName.value = item.categoryName
  }
  const saveCategoryRename = async () => {
    if (editingCategoryId.value && editingName.value.trim()) {
      const ok = await handleRenameCategory(editingCategoryId.value, editingName.value.trim())
      if (ok) editingCategoryId.value = null
    } else {
      editingCategoryId.value = null
    }
  }
  const onCategoryMenuSelect = async (value: string, cat: CategoryTreeItem) => {
    if (value === 'rename') {
      startCategoryRename(cat)
    } else if (value === 'addSubcategory') {
      categoryInputParentId.value = cat.categoryId
      isCategoryInputVisible.value = true
      categoryInputValue.value = ''
      focusCategoryInputField()
    } else if (value === 'delete') {
      if (fileSelectedCategoryId.value === cat.categoryId && fileTotalCount.value > 0) {
        openToast({ message: '파일이 등록된 카테고리는 삭제할 수 없습니다.', type: 'warning' })
        return
      }
      if (fileSelectedCategoryId.value !== cat.categoryId || fileSearchKeyword.value.trim() !== '') {
        openLoading({ text: '카테고리 삭제 가능 여부를 확인하는 중...' })
        let res: { totalCnt: number }
        try {
          res = await fetchSelectDocFileLibraryList({ categoryId: cat.categoryId, page: 1, pageSize: 1 })
        } finally {
          closeLoading()
        }
        if (res.totalCnt > 0) {
          openToast({ message: '파일이 등록된 카테고리는 삭제할 수 없습니다.', type: 'warning' })
          return
        }
      }
      const confirmed = await openConfirm({
        title: '카테고리 삭제',
        message: `'${cat.categoryName}' 카테고리를 삭제하시겠습니까?\n하위 카테고리도 함께 삭제됩니다.`,
      })
      if (confirmed) await handleDeleteCategory(cat.categoryId)
    }
  }
  const openCategorySelectModal = () => {
    isCategorySelectModalOpen.value = true
  }
  const onCategorySelectConfirm = (selectedId: string) => {
    visibleCategoryId.value = selectedId
    if (fileSelectedCategoryId.value && selectedId && fileSelectedCategoryId.value !== selectedId) {
      fileSelectedCategoryId.value = ''
      fileCurrentPage.value = 1
      handleSelectFileLibraryList()
    }
  }

  function collectExpandedCategoryIds(items: CategoryTreeItem[], acc: Set<string> = new Set()): Set<string> {
    for (const item of items) {
      if (item.expanded) acc.add(item.categoryId)
      if (item.children?.length) collectExpandedCategoryIds(item.children, acc)
    }
    return acc
  }

  function mergeCategoryExpandedState(items: CategoryTreeItem[], expandedIds: Set<string>): CategoryTreeItem[] {
    return items.map((item) => ({
      ...item,
      expanded: expandedIds.has(item.categoryId),
      children: item.children?.length ? mergeCategoryExpandedState(item.children, expandedIds) : item.children,
    }))
  }

  const handleSelectCategoryList = async (options?: { forceExpandIds?: string[]; preserveFileSelection?: boolean }) => {
    const expandedIds = collectExpandedCategoryIds(categoryList.value)
    for (const id of options?.forceExpandIds ?? []) {
      if (id) expandedIds.add(id)
    }
    openLoading({ text: '카테고리 목록을 불러오는 중...' })
    let res: { dataList: CategoryItem[] }
    try {
      res = await fetchCategoryList()
    } finally {
      closeLoading()
    }
    const tree = buildCategoryTreeFromFlat(res.dataList ?? [])
    categoryList.value = mergeCategoryExpandedState(tree, expandedIds)

    if (options?.preserveFileSelection) {
      await handleSelectFileLibraryList()
      return
    }
    const firstCategoryId = categoryList.value[0]?.categoryId ?? ''
    fileSelectedCategoryId.value = firstCategoryId
    fileCurrentPage.value = 1
    await handleSelectFileLibraryList()
  }

  const handleSaveCategory = async (data: { categoryId?: string; categoryName: string; parnCatId?: string | null }) => {
    const categoryName = String(data.categoryName ?? '').trim()
    const actionTitle = data.categoryId ? '카테고리 수정' : '카테고리 등록'
    const actionVerb = data.categoryId ? '수정' : '등록'
    const confirmed = await openConfirm({
      title: actionTitle,
      message: `${categoryName ? `'${categoryName}' ` : ''}카테고리를 ${actionVerb}하시겠습니까?`,
    })
    if (!confirmed) return false

    try {
      openLoading({ text: '카테고리를 저장하는 중...' })
      let res: { successYn: boolean }
      try {
        res = await fetchSaveCategory(data)
      } finally {
        closeLoading()
      }
      if (res.successYn) {
        openToast({ message: '카테고리가 저장되었습니다.', type: 'success' })
        const forceExpandIds = data.parnCatId ? [data.parnCatId] : []
        await handleSelectCategoryList({ forceExpandIds, preserveFileSelection: true })
        return true
      }
      openToast({ message: '카테고리 저장에 실패했습니다.', type: 'error' })
      return false
    } catch (error) {
      openToast({
        message: error instanceof Error ? error.message : '카테고리 저장에 실패했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const handleRenameCategory = async (categoryId: string, categoryName: string) => {
    const confirmed = await openConfirm({
      title: '카테고리 이름 수정',
      message: `'${String(categoryName ?? '').trim()}'을(를) 수정하시겠습니까?`,
    })
    if (!confirmed) return false

    try {
      openLoading({ text: '카테고리 이름을 변경하는 중...' })
      let res: { successYn: boolean }
      try {
        res = await fetchRenameCategory(categoryId, categoryName)
      } finally {
        closeLoading()
      }
      if (res.successYn) {
        openToast({ message: '카테고리가 수정되었습니다.', type: 'success' })
        await handleSelectCategoryList({ preserveFileSelection: true })
        return true
      }
      openToast({ message: '카테고리 수정에 실패했습니다.', type: 'error' })
      return false
    } catch (error) {
      openToast({
        message: error instanceof Error ? error.message : '카테고리 수정에 실패했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      openLoading({ text: '카테고리를 삭제하는 중...' })
      let res: { successYn: boolean }
      try {
        res = await fetchDeleteCategory(id)
      } finally {
        closeLoading()
      }
      if (res.successYn) {
        openToast({ message: '카테고리가 삭제되었습니다.', type: 'success' })
        await handleSelectCategoryList({ preserveFileSelection: true })
        return true
      }
      openToast({ message: '카테고리 삭제에 실패했습니다.', type: 'error' })
      return false
    } catch (error) {
      openToast({
        message: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
        type: 'error',
      })
    }
  }

  return {
    isCategoryInputVisible,
    isCategorySelectModalOpen,
    categoryInputValue,
    categoryInputRef,
    categoryInputParentId,
    editingCategoryId,
    editingName,
    categoryInputPlaceholder,
    categoryMenuItems,
    filteredCategoryList,
    selectedCategoryIds,
    onCategorySelectConfirm,
    handleSelectCategoryList,
    toggleExpand,
    onCategorySelect,
    onCategoryMenuSelect,
    saveCategoryRename,
    openCategorySelectModal,
    toggleCategoryInput,
    onCategoryInputEnter,
    handleSaveCategory,
    handleRenameCategory,
    handleDeleteCategory,
    collectDescendantIds,
    categoryList,
    visibleCategoryId,
  }
}
