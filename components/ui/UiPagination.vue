<template>
  <div class="ui-pagination">
    <p class="ui-pagination-total">
      총 <strong class="point-color">{{ totalCount }}</strong
      >{{ totalLabel }}
    </p>
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
            >…</span
          >
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: $spacing-sm;
  width: 100%;
}

.ui-pagination-total {
  @include typo($body-medium);
  color: #4d5462;
  position: absolute;
  left: 0;

  .point-color {
    color: #2d3139;
  }
}

.ui-pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ui-pagination-btn {
  padding: 5px 8px;
  height: 32px;
  border-radius: $border-radius-sm;
  @include typo($body-medium);
  color: #4d5462;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-background;
  }

  &:disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.ui-pagination-pages {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-pagination-page {
  min-width: 32px;
  height: 32px;
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  @include typo($body-medium);
  color: #5c6677;
  cursor: pointer;

  &.is-active {
    font-weight: 700;
    background: #4d5462;
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
  @include typo($body-medium);
  color: #5c6677;
  text-align: right;
  position: absolute;
  right: 0;
}
</style>
