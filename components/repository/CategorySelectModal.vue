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

      <!-- 카테고리 트리 (더미) -->
      <div class="modal-category-select__tree-wrap">
        <ul class="modal-category-select__tree">
          <li
            v-for="(node, idx) in categoryTree"
            :key="idx"
            class="tree-item"
            :class="{ 'has-children': node.children?.length }"
          >
            <div
              class="tree-row flex items-center"
              :class="{ 'is-selected': node.checked }"
              :style="{ paddingLeft: `${(node.depth || 0) * 16 + 8}px` }"
              @click="toggleCheck(node)"
            >
              <button
                v-if="node.children?.length"
                type="button"
                class="tree-toggle"
                :aria-expanded="node.expanded"
                @click.stop="toggleExpand(node)"
              >
                <i
                  class="icon icon-chevron-down size-16"
                  :class="{ 'is-expanded': node.expanded }"
                />
              </button>
              <span
                v-else
                class="tree-toggle-placeholder"
              />
              <i class="icon icon-document size-16 tree-icon-folder" />
              <UiCheckbox
                :model-value="node.checked"
                class="tree-checkbox"
                @update:model-value="node.checked = $event"
                @click.stop
              />
              <span class="tree-name">{{ node.name }}</span>
              <span
                v-if="node.checked"
                class="tree-icon-check"
                aria-hidden="true"
                >✓</span
              >
            </div>
            <template v-if="node.children?.length && node.expanded">
              <li
                v-for="(child, cIdx) in node.children"
                :key="`${idx}-${cIdx}`"
                class="tree-item"
              >
                <div
                  class="tree-row flex items-center"
                  :class="{ 'is-selected': child.checked }"
                  :style="{ paddingLeft: `${((child.depth ?? node.depth ?? 0) + 1) * 16 + 8}px` }"
                  @click="toggleCheck(child)"
                >
                  <button
                    v-if="child.children?.length"
                    type="button"
                    class="tree-toggle"
                    :aria-expanded="child.expanded"
                    @click.stop="toggleExpand(child)"
                  >
                    <i
                      class="icon icon-chevron-down size-16"
                      :class="{ 'is-expanded': child.expanded }"
                    />
                  </button>
                  <span
                    v-else
                    class="tree-toggle-placeholder"
                  />
                  <i class="icon icon-document size-16 tree-icon-folder" />
                  <UiCheckbox
                    :model-value="child.checked"
                    class="tree-checkbox"
                    @update:model-value="child.checked = $event"
                    @click.stop
                  />
                  <span class="tree-name">{{ child.name }}</span>
                  <span
                    v-if="child.checked"
                    class="tree-icon-check"
                    aria-hidden="true"
                    >✓</span
                  >
                </div>
                <ul
                  v-if="child.children?.length && child.expanded"
                  class="tree-children"
                >
                  <li
                    v-for="(sub, sIdx) in child.children"
                    :key="`${idx}-${cIdx}-${sIdx}`"
                    class="tree-item"
                  >
                    <div
                      class="tree-row flex items-center"
                      :class="{ 'is-selected': sub.checked }"
                      :style="{ paddingLeft: `${((sub.depth ?? 0) + 2) * 16 + 8}px` }"
                      @click="toggleCheck(sub)"
                    >
                      <span class="tree-toggle-placeholder" />
                      <i class="icon icon-document size-16 tree-icon-folder" />
                      <UiCheckbox
                        :model-value="sub.checked"
                        class="tree-checkbox"
                        @update:model-value="sub.checked = $event"
                        @click.stop
                      />
                      <span class="tree-name">{{ sub.name }}</span>
                      <span
                        v-if="sub.checked"
                        class="tree-icon-check"
                        aria-hidden="true"
                        >✓</span
                      >
                    </div>
                  </li>
                </ul>
              </li>
            </template>
          </li>
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
interface CategoryNode {
  name: string
  checked: boolean
  expanded?: boolean
  depth?: number
  children?: CategoryNode[]
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const searchKeyword = ref('')
const categoryTree = ref<CategoryNode[]>([
  {
    name: '1depth',
    checked: true,
    expanded: true,
    depth: 0,
    children: [
      {
        name: '2depth 카테고리명임',
        checked: true,
        expanded: true,
        depth: 1,
        children: [
          {
            name: '3depth 카테고리명임',
            checked: true,
            expanded: true,
            depth: 2,
            children: [{ name: '4depth', checked: false, depth: 3 }],
          },
        ],
      },
    ],
  },
  {
    name: '1depth',
    checked: true,
    expanded: false,
    depth: 0,
    children: [{ name: '2depth 카테고리명임', checked: false, depth: 1 }],
  },
])

const onSearch = () => {}
const toggleExpand = (node: CategoryNode) => {
  if (node.children?.length) node.expanded = !node.expanded
}
const toggleCheck = (node: CategoryNode) => {
  node.checked = !node.checked
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

// 모달 크기·모서리 (UiModal content에 적용)
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
  margin-bottom: 16px;

  .search-input {
    width: 100%;
  }
}

.modal-category-select__tree-wrap {
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.modal-category-select__tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-item {
  margin: 0;
}

.tree-row {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(99, 102, 241, 0.08);
  }

  &.is-selected {
    background-color: rgba(99, 102, 241, 0.12);
  }
}

.tree-toggle,
.tree-toggle-placeholder {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tree-toggle {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  color: $color-text-secondary;
}
.tree-toggle-placeholder {
  flex-shrink: 0;
}
.tree-icon-folder {
  flex-shrink: 0;
  margin-right: 8px;
  color: $color-text-secondary;
}
.tree-checkbox {
  margin-right: 8px;
}
.tree-name {
  flex: 1;
  font-size: $font-size-base;
  color: $color-text-dark;
}
.tree-icon-check {
  flex-shrink: 0;
  color: $color-primary;
  font-size: 14px;
  font-weight: 700;
}

.icon-chevron-down.is-expanded {
  transform: rotate(-180deg);
}

.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
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
