<template>
  <div class="my-doc-header">
    <p class="my-doc-top-title">내 문서 보관함</p>
    <div class="my-doc-header-right">
      <p class="my-doc-total">
        총 <strong>{{ totalCount }}개</strong>
      </p>
      <div class="my-doc-search">
        <UiInput
          v-model="searchKeyword"
          type="search"
          placeholder="문서명 검색"
          @enter="emit('search')"
          @search="emit('search')"
        />
      </div>
      <div class="my-doc-sort">
        <UiSelect
          id="my-doc-sort"
          v-model="searchSort"
          name="my-doc-sort"
          :options="sortOptions"
          size="md"
          @update:model-value="emit('sortChange')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiInput, UiSelect } from '@leechanyong/ispark-ui'
import type { SelectOption } from '@leechanyong/ispark-ui'

interface Props {
  totalCount: number
  sortOptions: SelectOption[]
}

defineProps<Props>()

const searchKeyword = defineModel<string>('searchKeyword', { required: true })
const searchSort = defineModel<string>('searchSort', { required: true })

const emit = defineEmits<{
  search: []
  sortChange: []
}>()
</script>
