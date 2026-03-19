<template>
  <div class="ui-pagination">
    <span class="ui-pagination-total">총 {{ totalCount }}{{ totalLabel }}</span>
    <div class="ui-pagination-controls">
      <button
        type="button"
        class="ui-pagination-btn"
        :disabled="modelValue <= 1"
        @click="onPageChange(modelValue - 1)"
      >
        이전
      </button>
      <div class="ui-pagination-pages">
        <template
          v-for="(item, idx) in pageItems"
          :key="idx"
        >
          <span
            v-if="item === '...'"
            class="ui-pagination-ellipsis"
          >…</span>
          <button
            v-else
            type="button"
            class="ui-pagination-page"
            :class="{ 'is-active': item === modelValue }"
            @click="onPageChange(item as number)"
          >
            {{ item }}
          </button>
        </template>
      </div>
      <button
        type="button"
        class="ui-pagination-btn"
        :disabled="modelValue >= totalPages"
        @click="onPageChange(modelValue + 1)"
      >
        다음
      </button>
    </div>
    <span class="ui-pagination-range">{{ pageStart }}-{{ pageEnd }} / {{ totalCount }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number // currentPage
  totalCount: number
  pageSize?: number
  totalLabel?: string // "문서", "개" 등
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 5,
  totalLabel: '개',
})

const emit = defineEmits<{
  'update:modelValue': [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalCount / props.pageSize)))
const pageStart = computed(() => (props.totalCount === 0 ? 0 : (props.modelValue - 1) * props.pageSize + 1))
const pageEnd = computed(() => Math.min(props.modelValue * props.pageSize, props.totalCount))

// 페이지 번호 + '...' 생성
const pageItems = computed(() => {
  const total = totalPages.value
  const cur = props.modelValue

  // 총 페이지 7 이하면 전체 표시
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items: (number | string)[] = [1]

  if (cur > 4) items.push('...')

  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)

  for (let i = start; i <= end; i++) items.push(i)

  if (cur < total - 3) items.push('...')

  items.push(total)
  return items
})

const onPageChange = (page: number) => {
  const clamped = Math.max(1, Math.min(page, totalPages.value))
  if (clamped !== props.modelValue) {
    emit('update:modelValue', clamped)
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.ui-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.ui-pagination-total {
  @include typo($body-small);
  color: $color-text-secondary;
}

.ui-pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ui-pagination-btn {
  padding: 6px 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
  background: #fff;
  @include typo($body-small);
  color: $color-text-primary;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: $color-primary;
    color: $color-primary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-pagination-pages {
  display: flex;
  align-items: center;
}

.ui-pagination-page {
  min-width: 32px;
  padding: 6px 8px;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  @include typo($body-small);
  color: $color-text-primary;
  cursor: pointer;

  &.is-active {
    background: $color-primary;
    color: #fff;
  }

  &:hover:not(.is-active) {
    background: $color-background;
  }
}

.ui-pagination-ellipsis {
  min-width: 32px;
  padding: 6px 8px;
  @include typo($body-small);
  color: $color-text-muted;
  text-align: center;
}

.ui-pagination-range {
  @include typo($body-small);
  color: $color-text-muted;
}
</style>
