<!--
  카테고리 트리 노드 (재귀 컴포넌트)
  - depth로 들여쓰기, 자식 있으면 펼치기/접기 + 하위 노드 자기 자신으로 렌더
  - selectable 모드: 드롭다운 대신 ✓ 체크 표시, 클릭 시 선택 토글(리프·중간 노드 공통, 모달에서 사용)
-->
<template>
  <li
    class="category-item"
    :class="{ 'has-children': item.children?.length }"
  >
    <div
      class="category-row flex items-center"
      :class="rowStateClasses"
      :style="{ paddingLeft: `${(depth - 1) * 12}px` }"
      :draggable="!reorderDisabled"
      @click="selectable ? $emit('select', item) : undefined"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- 폴더 아이콘: 펼침 시 열림, 아니면 닫힘 -->
      <span class="category-item-file-icon">
        <i
          :class="[
            'icon',
            'size-16',
            item.children?.length && item.expanded ? 'icon-folder-open' : 'icon-folder-close',
          ]"
        />
      </span>

      <!-- 이름 수정 모드 -->
      <template v-if="editingCategoryId === item.categoryId">
        <UiInput
          ref="inputRef"
          v-model="localEditingName"
          type="text"
          class="category-name-input"
          placeholder="카테고리명 입력 (엔터키로 저장)"
          size="sm"
          radius="base"
          @click.stop
          @enter="onSaveRename"
        />
      </template>

      <!-- 카테고리명 텍스트 -->
      <span
        v-else
        class="category-name"
      >
        {{ item.categoryName }}
      </span>

      <!-- selectable 모드: 선택된 노드(리프·중간) 체크 표시 -->
      <i
        v-if="showCheckIcon && selectable && selectedIds.includes(item.categoryId)"
        class="icon icon-check size-16 category-check"
      />

      <!-- 더보기 메뉴 (표시할 항목이 있을 때만) -->
      <!-- @click.stop은 트리거 래퍼에만: 버튼에 .stop 두면 Radix Trigger(span)까지 버블이 안 가서 메뉴가 안 열림 -->
      <template v-if="displayedMenuItems.length > 0">
        <div
          class="category-more-wrap"
          @click.stop
        >
          <UiDropdownMenu
            v-model:open="isDropdownOpen"
            :items="displayedMenuItems"
            side="bottom"
            align="end"
            :side-offset="4"
            @select="(value) => $emit('menu-select', value, item)"
          >
            <template #trigger>
              <UiButton
                icon-only
                variant="ghost"
                size="xs"
                class="btn-category-more"
                :class="{ 'is-active': isDropdownOpen }"
              >
                <template #icon-left>
                  <i class="icon icon-add-dot size-20" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </div>
      </template>

      <!-- 자식이 있을 때만: 펼침/접기 버튼 -->
      <UiButton
        v-if="item.children?.length"
        icon-only
        variant="ghost"
        size="xs"
        class="btn-category-arrow-down"
        :aria-expanded="item.expanded"
        @click.stop="$emit('toggle', item)"
      >
        <template #icon-left>
          <i
            class="icon icon-arrow-down-gray size-20"
            :class="{ 'is-expanded': item.expanded }"
          />
        </template>
      </UiButton>

      <!-- 자식 없을 때: 화살표 자리 맞춤용 placeholder -->
      <span
        v-else
        class="category-toggle-placeholder"
      />
    </div>

    <!-- 하위 카테고리 추가 입력 -->
    <div
      v-if="showSubcategoryInput"
      class="category-sub-input-wrap"
      :style="{ paddingLeft: `${depth * 12}px` }"
      @click.stop
    >
      <UiInput
        ref="subcategoryInputRef"
        v-model="localCategoryInputValue"
        :placeholder="categoryInputPlaceholder"
        size="sm"
        @enter="$emit('add-subcategory')"
      />
    </div>

    <!-- 자식이 있고 펼쳐져 있을 때만: 하위 노드를 같은 컴포넌트로 재귀 렌더 -->
    <ul
      v-if="item.children?.length && item.expanded"
      class="category-children"
    >
      <CategoryTreeNode
        v-for="child in item.children"
        :key="child.categoryId"
        :item="child"
        :depth="depth + 1"
        :selectable="selectable"
        :selected-ids="selectedIds"
        :show-check-icon="showCheckIcon"
        :editing-category-id="editingCategoryId"
        :editing-name="editingName"
        :menu-items="menuItems"
        :max-category-depth="maxCategoryDepth"
        :is-category-input-visible="isCategoryInputVisible"
        :category-input-parent-id="categoryInputParentId"
        :category-input-value="categoryInputValue"
        :category-input-placeholder="categoryInputPlaceholder"
        :reorder-disabled="reorderDisabled"
        :dragging-id="draggingId"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @menu-select="(value, item) => $emit('menu-select', value, item)"
        @update:editing-name="$emit('update:editing-name', $event)"
        @save-rename="$emit('save-rename')"
        @update:category-input-value="$emit('update:category-input-value', $event)"
        @add-subcategory="$emit('add-subcategory')"
        @reorder="$emit('reorder', $event)"
        @drag-start="$emit('dragStart', $event)"
        @drag-end="$emit('dragEnd')"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import type { CategoryTreeItem } from '~/types/repository'

const CATEGORY_DRAG_MIME = 'application/x-teamagent-category-id'

const props = withDefaults(
  defineProps<{
    item: CategoryTreeItem
    depth: number
    selectable?: boolean
    selectedIds?: string[]
    /** 모달에서는 체크 아이콘 표시, 문서 페이지에서는 선택 배경만 사용 */
    showCheckIcon?: boolean
    editingCategoryId?: string | null
    editingName?: string
    menuItems?: { label: string; value: string; icon?: string; color?: 'danger' }[]
    /** 설정 시 depth가 이 값 이상인 노드에서 '하위 카테고리 추가'(addSubcategory) 메뉴 숨김 */
    maxCategoryDepth?: number
    isCategoryInputVisible?: boolean
    categoryInputParentId?: string | null
    categoryInputValue?: string
    categoryInputPlaceholder?: string
    reorderDisabled?: boolean
    draggingId?: string | null
  }>(),
  {
    selectable: false,
    selectedIds: () => [],
    showCheckIcon: true,
    editingCategoryId: null,
    editingName: '',
    menuItems: () => [],
    maxCategoryDepth: undefined,
    isCategoryInputVisible: false,
    categoryInputParentId: null,
    categoryInputValue: '',
    categoryInputPlaceholder: '하위 카테고리명 입력(엔터)',
    reorderDisabled: false,
    draggingId: null,
  },
)

const emit = defineEmits<{
  toggle: [item: CategoryTreeItem]
  select: [item: CategoryTreeItem]
  'menu-select': [value: string, item: CategoryTreeItem]
  'update:editing-name': [value: string]
  'save-rename': []
  'update:category-input-value': [value: string]
  'add-subcategory': []
  reorder: [payload: { draggedId: string; targetId: string; position: 'before' | 'after' | 'inside' }]
  dragStart: [categoryId: string]
  dragEnd: []
}>()

/** 최대 허용 깊이(루트=1) — maxCategoryDepth 이상이면 하위 추가 메뉴 제외 */
const displayedMenuItems = computed(() => {
  const items = props.menuItems
  const maxDepth = props.maxCategoryDepth
  if (maxDepth == null) return items
  return items.filter((row: (typeof items)[number]) => row.value !== 'addSubcategory' || props.depth < maxDepth)
})

const inputRef = ref<{ focus: () => void } | null>(null)
const subcategoryInputRef = ref<{ focus: () => void } | null>(null)
/** 드롭다운 열림 상태 — 호버 해제 시에도 트리거 버튼이 사라지지 않도록 is-active 유지용 */
const isDropdownOpen = ref(false)
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

const rowStateClasses = computed(() => ({
  'is-selected': props.selectable && props.selectedIds.includes(props.item.categoryId),
  'is-dragging': props.draggingId === props.item.categoryId,
  'is-drop-before': dropPosition.value === 'before',
  'is-drop-after': dropPosition.value === 'after',
  'is-drop-inside': dropPosition.value === 'inside',
}))

/** 부모 editingName과 양방향 바인딩 (인라인 수정용) */
const localEditingName = computed({
  get: () => props.editingName,
  set: (value: string) => emit('update:editing-name', value),
})

const localCategoryInputValue = computed({
  get: () => props.categoryInputValue,
  set: (value: string) => emit('update:category-input-value', value),
})

const showSubcategoryInput = computed(
  () => props.isCategoryInputVisible && props.categoryInputParentId === props.item.categoryId,
)

/** 엔터 시 저장 — 실제 저장 로직은 부모(RepositoryDocumentPage)에서 처리 */
const onSaveRename = () => {
  emit('save-rename')
}

/** 이 노드가 편집 대상이 되면 인풋에 포커스 */
watch(
  () => props.editingCategoryId === props.item.categoryId,
  (isEditing: boolean) => {
    if (isEditing) nextTick(() => inputRef.value?.focus())
  },
)

watch(showSubcategoryInput, (visible: boolean) => {
  if (visible) nextTick(() => subcategoryInputRef.value?.focus())
})

const onDragStart = (e: DragEvent) => {
  if (props.reorderDisabled) {
    e.preventDefault()
    return
  }
  e.dataTransfer?.setData(CATEGORY_DRAG_MIME, props.item.categoryId)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  emit('dragStart', props.item.categoryId)
}

const onDragEnd = () => {
  dropPosition.value = null
  emit('dragEnd')
}

const onDragOver = (e: DragEvent) => {
  if (props.reorderDisabled) return
  if (!e.dataTransfer?.types.includes(CATEGORY_DRAG_MIME)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const y = e.clientY - rect.top
  const h = rect.height
  if (y < h * 0.25) {
    dropPosition.value = 'before'
  } else if (y > h * 0.75) {
    dropPosition.value = 'after'
  } else {
    dropPosition.value = 'inside'
  }
}

const onDragLeave = (e: DragEvent) => {
  const el = e.currentTarget as HTMLElement
  const related = e.relatedTarget as Node | null
  if (related && el.contains(related)) return
  dropPosition.value = null
}

const onDrop = (e: DragEvent) => {
  if (props.reorderDisabled) return
  e.preventDefault()
  const draggedId = e.dataTransfer?.getData(CATEGORY_DRAG_MIME)
  const position = dropPosition.value
  dropPosition.value = null
  if (!draggedId || !position || draggedId === props.item.categoryId) return
  emit('reorder', { draggedId, targetId: props.item.categoryId, position })
}
</script>
