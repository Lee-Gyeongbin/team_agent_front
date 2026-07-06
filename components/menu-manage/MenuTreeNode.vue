<!--
  메뉴 트리 노드 (재귀 컴포넌트)
  - depth로 들여쓰기, 자식 있으면 펼치기/접기
  - 클릭 시 해당 메뉴 선택
  - 같은 레벨 형제 간 드래그로 정렬 순서 변경 (검색 중 등에서는 비활성화)
-->
<template>
  <li
    class="menu-tree-item"
    :class="{ 'has-children': item.children?.length }"
  >
    <div
      class="menu-tree-row flex items-center"
      :class="rowStateClasses"
      :style="{ paddingLeft: `${(depth - 1) * 12}px` }"
      :draggable="!reorderDisabled"
      @click="$emit('select', item)"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- 리프(Y): 햄버거(사이드 메뉴와 동일 자산) / 그룹(N): 폴더 -->
      <span class="menu-tree-icon">
        <i
          :class="[
            'icon',
            'size-16',
            item.isLeaf === 'Y'
              ? 'icon-menu'
              : item.children?.length && item.expanded
                ? 'icon-folder-open'
                : 'icon-folder-close',
          ]"
        />
      </span>

      <!-- 메뉴명 -->
      <span class="menu-tree-name">{{ item.menuName }}</span>

      <!-- 사용 여부 뱃지 -->
      <span
        v-if="item.useYn === 'N'"
        class="menu-tree-badge"
      >
        미사용
      </span>

      <!-- 펼치기/접기 버튼 (자식 있을 때만) -->
      <UiButton
        v-if="item.children?.length"
        icon-only
        variant="ghost"
        size="xs"
        class="btn-menu-arrow"
        draggable="false"
        @click.stop="$emit('toggle', item)"
      >
        <template #icon-left>
          <i
            class="icon icon-arrow-down-gray size-20"
            :class="{ 'is-expanded': item.expanded }"
          />
        </template>
      </UiButton>

      <!-- 화살표 자리 맞춤용 placeholder -->
      <span
        v-else
        class="menu-toggle-placeholder"
      />
    </div>

    <!-- 자식 노드 재귀 렌더 -->
    <ul
      v-if="item.children?.length && item.expanded"
      class="menu-tree-children"
    >
      <MenuTreeNode
        v-for="child in item.children"
        :key="child.menuId"
        :item="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :reorder-disabled="reorderDisabled"
        :dragging-id="draggingId"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @reorder="$emit('reorder', $event)"
        @drag-start="$emit('dragStart', $event)"
        @drag-end="$emit('dragEnd')"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { UiButton } from '@leechanyong/ispark-ui'
import type { MenuTreeItem } from '~/types/menu'

/** 트리 D&D용 custom MIME — 브라우저 구분 */
const MENU_DRAG_MIME = 'application/x-teamagent-menu-id'

const props = defineProps<{
  item: MenuTreeItem
  depth: number
  selectedId?: string | null
  /** 검색 등으로 필터된 트리에서는 순서 변경 불가 */
  reorderDisabled?: boolean
  /** 드래그 중인 행 시각적 표시 */
  draggingId?: string | null
}>()

const emit = defineEmits<{
  toggle: [item: MenuTreeItem]
  select: [item: MenuTreeItem]
  reorder: [payload: { draggedId: string; targetId: string; position: 'before' | 'after' }]
  dragStart: [menuId: string]
  dragEnd: []
}>()

const dropPosition = ref<'before' | 'after' | null>(null)

const rowStateClasses = computed(() => ({
  'is-selected': props.selectedId === props.item.menuId,
  'is-dragging': props.draggingId === props.item.menuId,
  'is-drop-before': dropPosition.value === 'before',
  'is-drop-after': dropPosition.value === 'after',
}))

const onDragStart = (e: DragEvent) => {
  if (props.reorderDisabled) {
    e.preventDefault()
    return
  }
  e.dataTransfer?.setData(MENU_DRAG_MIME, props.item.menuId)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  emit('dragStart', props.item.menuId)
}

const onDragEnd = () => {
  dropPosition.value = null
  emit('dragEnd')
}

const onDragOver = (e: DragEvent) => {
  if (props.reorderDisabled) return
  if (!e.dataTransfer?.types.includes(MENU_DRAG_MIME)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const mid = rect.top + rect.height / 2
  dropPosition.value = e.clientY < mid ? 'before' : 'after'
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
  const draggedId = e.dataTransfer?.getData(MENU_DRAG_MIME)
  const position = dropPosition.value
  dropPosition.value = null
  if (!draggedId || !position || draggedId === props.item.menuId) return
  emit('reorder', { draggedId, targetId: props.item.menuId, position })
}
</script>
