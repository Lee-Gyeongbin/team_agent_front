<template>
  <div class="doc-dataset-source-panel">
    <!-- 헤더: 체크박스 + 카운트 -->
    <div
      class="doc-dataset-source-panel-header"
      @click="isExpanded = !isExpanded"
    >
      <UiCheckbox
        :model-value="useDocument"
        @update:model-value="$emit('update:useDocument', $event)"
        @click.stop
      >
        <span class="doc-dataset-source-panel-label">
          문서
          <span class="doc-dataset-source-panel-count">
            (<strong>{{ selectedDocFileIds.length }}개</strong> 선택 / {{ docList.length }}개 사용가능)
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
      v-if="isExpanded && useDocument"
      class="doc-dataset-source-panel-body"
    >
      <!-- 검색 + 결과 수 뱃지 -->
      <div class="doc-dataset-source-search-row">
        <UiInput
          v-model="searchKeyword"
          placeholder="문서명으로 검색..."
          size="sm"
          class="doc-dataset-source-search-input"
        >
          <template #icon-right>
            <i class="icon-search size-16" />
          </template>
        </UiInput>
        <UiSelect
          v-model="selectedCategory"
          :options="categoryOptions"
          size="sm"
          class="doc-dataset-source-category-select"
        />
      </div>

      <!-- 2분할: 트리뷰(좌) + 파일리스트(우) -->
      <div class="doc-dataset-source-doc-split">
        <!-- 좌측: 트리뷰 영역 (TODO) -->
        <div class="doc-dataset-source-doc-tree">
          <span class="doc-dataset-source-doc-tree-placeholder">트리뷰 영역</span>
        </div>

        <!-- 우측: 파일 리스트 -->
        <div class="doc-dataset-source-doc-files">
          <div
            v-for="item in filteredList"
            :key="getSourceId(item)"
            class="doc-dataset-source-doc-file-item"
            @click="toggleSelect(getSourceId(item))"
          >
            <span
              class="ui-checkbox"
              :class="{ 'is-checked': isDocSelected(getSourceId(item)) }"
            >
              <span class="ui-checkbox-box">
                <svg
                  v-if="isDocSelected(getSourceId(item))"
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
            <span class="doc-dataset-source-doc-file-name-wrap">
              <span class="doc-dataset-source-doc-file-name">{{ item.fileName || item.docTitle || '-' }}</span>
            </span>
            <span class="doc-dataset-source-doc-file-size">{{ item.fileCount ?? 0 }}개</span>
          </div>

          <UiEmpty
            v-if="filteredList.length === 0"
            title="문서가 없습니다."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryItem, DocDatasetSelectedDoc } from '~/types/doc-dataset'

interface Props {
  useDocument: boolean
  selectedDocFileIds: string[]
  docList: DocDatasetSelectedDoc[]
  categoryList: CategoryItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:useDocument': [value: boolean]
  'update:selectedDocFileIds': [value: string[]]
}>()

const isExpanded = ref(true)
const searchKeyword = ref('')
const selectedCategory = ref('all')

// 카테고리 필터 옵션
const categoryOptions = computed(() => {
  const sortedCategoryOptions = props.categoryList
    .map((c) => ({ label: c.categoryName, value: c.categoryId }))
    .sort((a, b) => String(a.value).localeCompare(String(b.value)))

  return [{ label: '전체 카테고리', value: 'all' }, ...sortedCategoryOptions]
})
// 필터링된 리스트
const filteredList = computed(() => {
  return props.docList.filter((d) => {
    const isMatchedCategory = selectedCategory.value === 'all' || String(d.categoryId ?? '') === selectedCategory.value

    if (!isMatchedCategory) return false

    if (!searchKeyword.value) return true

    const keyword = searchKeyword.value.toLowerCase()
    return String(d.fileName || d.docTitle || '')
      .toLowerCase()
      .includes(keyword)
  })
})

const getSourceId = (item: DocDatasetSelectedDoc) => String(item.docFileId ?? '')

const isDocSelected = (docFileId: string | number) => {
  const id = String(docFileId)
  return (props.selectedDocFileIds ?? []).map(String).includes(id)
}

// 선택 토글 (API docFileId가 number로 올 수 있어 문자열로 통일)
const toggleSelect = (rawId: string | number) => {
  const id = String(rawId)
  const current = props.selectedDocFileIds ?? []
  const ids = current.map(String)
  const index = ids.indexOf(id)
  if (index > -1) {
    ids.splice(index, 1)
  } else {
    ids.push(id)
  }
  emit('update:selectedDocFileIds', ids)
}
</script>
