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
            (<strong>{{ selectedDocIds.length }}개</strong> 선택 / {{ docList.length }}개 사용가능)
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
        <div class="doc-dataset-source-search-wrap">
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
          <span
            v-if="searchKeyword"
            class="doc-dataset-source-search-badge"
          >
            {{ filteredList.length }}
          </span>
        </div>
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
            :key="item.id"
            class="doc-dataset-source-doc-file-item"
            @click="toggleSelect(item.id)"
          >
            <span
              class="ui-checkbox"
              :class="{ 'is-checked': selectedDocIds.includes(item.id) }"
            >
              <span class="ui-checkbox-box">
                <svg
                  v-if="selectedDocIds.includes(item.id)"
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
            <span class="doc-dataset-source-doc-file-name">{{ item.name }}</span>
            <span class="doc-dataset-source-doc-file-size">{{ item.size }}</span>
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
import type { DocFile } from '~/types/doc-dataset'

interface Props {
  useDocument: boolean
  selectedDocIds: string[]
  docList: DocFile[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:useDocument': [value: boolean]
  'update:selectedDocIds': [value: string[]]
}>()

const isExpanded = ref(true)
const searchKeyword = ref('')

// 필터링된 리스트
const filteredList = computed(() => {
  if (!searchKeyword.value) return props.docList
  const keyword = searchKeyword.value.toLowerCase()
  return props.docList.filter((d) => d.name.toLowerCase().includes(keyword))
})

// 선택 토글
const toggleSelect = (id: string) => {
  const ids = [...props.selectedDocIds]
  const index = ids.indexOf(id)
  if (index > -1) {
    ids.splice(index, 1)
  } else {
    ids.push(id)
  }
  emit('update:selectedDocIds', ids)
}
</script>
