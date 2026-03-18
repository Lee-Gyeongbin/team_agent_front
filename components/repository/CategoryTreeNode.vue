<!--
  카테고리 트리 노드 (재귀 컴포넌트)
  - depth로 들여쓰기, 자식 있으면 펼치기/접기 + 하위 노드 자기 자신으로 렌더
-->
<template>
  <li
    class="category-item"
    :class="{ 'has-children': item.children?.length }"
  >
    <!-- 한 행: 들여쓰기(depth) + 폴더 아이콘 + 이름(또는 인라인 수정) + 더보기 메뉴 + 펼침 화살표 -->
    <div
      class="category-row flex items-center"
      :style="{ paddingLeft: `${(depth - 1) * 20}px` }"
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

      <!-- 이름 수정 모드: 인풋 표시, 엔터 시 저장 emit -->
      <template v-if="editingCategoryId === item.id">
        <UiInput
          ref="inputRef"
          v-model="localEditingName"
          type="text"
          class="category-name-input"
          placeholder="카테고리명 입력 (엔터키로 저장)"
          size="sm"
          radius="base"
          @enter="onSaveRename"
        />
      </template>

      <!-- 일반 모드: 카테고리명 텍스트 -->
      <span
        v-else
        class="category-name"
      >
        {{ item.name }}
      </span>

      <!-- 더보기 메뉴 (이름 수정 / 카테고리 삭제) — 열림 중에는 버튼이 사라지지 않도록 is-active 유지 -->
      <UiDropdownMenu
        v-model:open="isDropdownOpen"
        :items="menuItems"
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
            @click.stop
          >
            <template #icon-left>
              <i class="icon icon-add-dot size-20" />
            </template>
          </UiButton>
        </template>
      </UiDropdownMenu>

      <!-- 자식이 있을 때만: 펼침/접기 버튼 (클릭 시 toggle emit) -->
      <UiButton
        v-if="item.children?.length"
        icon-only
        variant="ghost"
        size="xs"
        class="btn-category-arrow-down"
        :aria-expanded="item.expanded"
        @click="$emit('toggle', item)"
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

    <!-- 자식이 있고 펼쳐져 있을 때만: 하위 노드를 같은 컴포넌트로 재귀 렌더 -->
    <ul
      v-if="item.children?.length && item.expanded"
      class="category-children"
    >
      <CategoryTreeNode
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :depth="depth + 1"
        :editing-category-id="editingCategoryId"
        :editing-name="editingName"
        :menu-items="menuItems"
        @toggle="$emit('toggle', $event)"
        @menu-select="$emit('menu-select', $event[0], $event[1])"
        @update:editing-name="$emit('update:editing-name', $event)"
        @save-rename="$emit('save-rename')"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'

/** 카테고리 항목 (재귀 구조) */
export interface CategoryItem {
  id: string
  name: string
  expanded?: boolean
  children?: CategoryItem[]
}

const props = defineProps<{
  item: CategoryItem
  depth: number
  editingCategoryId: string | null
  editingName: string
  menuItems: { label: string; value: string; icon?: string; color?: 'danger' }[]
}>()

const emit = defineEmits<{
  toggle: [item: CategoryItem]
  'menu-select': [value: string, item: CategoryItem]
  'update:editing-name': [value: string]
  'save-rename': []
}>()

const inputRef = ref<{ focus: () => void } | null>(null)
/** 드롭다운 열림 상태 — 호버 해제 시에도 트리거 버튼이 사라지지 않도록 is-active 유지용 */
const isDropdownOpen = ref(false)

/** 부모 editingName과 양방향 바인딩 (인라인 수정용) */
const localEditingName = computed({
  get: () => props.editingName,
  set: (value: string) => emit('update:editing-name', value),
})

/** 엔터 시 저장 — 실제 저장 로직은 부모(RepositoryDocumentPage)에서 처리 */
const onSaveRename = () => {
  emit('save-rename')
}

/** 이 노드가 편집 대상이 되면 인풋에 포커스 */
watch(
  () => props.editingCategoryId === props.item.id,
  (isEditing: boolean) => {
    if (isEditing) nextTick(() => inputRef.value?.focus())
  },
)
</script>
