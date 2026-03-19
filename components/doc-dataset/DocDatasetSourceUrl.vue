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
      <!-- 검색 + 카테고리 필터 -->
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
        <UiSelect
          v-model="selectedCategory"
          :options="categoryOptions"
          size="sm"
          class="doc-dataset-source-category-select"
        />
      </div>

      <!-- URL 리스트 -->
      <div class="doc-dataset-source-url-list">
        <div
          v-for="item in filteredList"
          :key="item.urlId"
          class="doc-dataset-source-url-item"
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
          <span class="doc-dataset-source-url-name">{{ item.urlName }}</span>
          <span class="doc-dataset-source-url-link">{{ item.urlAddr }}</span>
        </div>

        <UiEmpty
          v-if="filteredList.length === 0"
          title="URL이 없습니다."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryItem, DocDatasetSelectedUrl } from '~/types/doc-dataset'

interface Props {
  useUrl: boolean
  selectedUrlIds: string[]
  urlList: DocDatasetSelectedUrl[]
  categoryList: CategoryItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:useUrl': [value: boolean]
  'update:selectedUrlIds': [value: string[]]
}>()

const isExpanded = ref(true)
const searchKeyword = ref('')
const selectedCategory = ref('all')

// 카테고리 필터 옵션
const categoryOptions = computed(() => {
  return [
    { label: '전체 카테고리', value: 'all' },
    ...props.categoryList.map((c) => ({ label: c.categoryName, value: c.categoryId })),
  ].sort((a, b) => a.label.localeCompare(b.label))
})

// 필터링된 리스트
const filteredList = computed(() => {
  let list = props.urlList
  if (selectedCategory.value !== 'all') {
    list = list.filter((u) => u.categoryId === selectedCategory.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter((u) => u.urlName.toLowerCase().includes(keyword) || u.urlAddr.toLowerCase().includes(keyword))
  }
  return list
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
