<template>
  <div
    class="ui-drag-table-wrap"
    :class="{ 'is-scrollable': !!maxHeight }"
    :style="maxHeight ? { maxHeight } : undefined"
  >
    <table class="ui-drag-table">
      <colgroup>
        <col
          v-for="col in columns"
          :key="col.key"
          :style="col.width ? { width: col.width } : undefined"
        />
      </colgroup>

      <thead :class="{ 'is-sticky': stickyHeader }">
        <tr>
          <th
            v-for="(col, idx) in columns"
            :key="col.key"
            :class="{ 'is-last': idx === columns.length - 1 }"
            :style="{ textAlign: col.headerAlign || 'center' }"
          >
            <slot
              :name="`header-${col.key}`"
              :column="col"
            >
              {{ col.label }}
            </slot>
          </th>
        </tr>
      </thead>

      <!-- 데이터 있을 때: 드래그 가능 tbody -->
      <draggable
        v-if="innerValue.length"
        v-model="innerValue"
        tag="tbody"
        :item-key="itemKey"
        :handle="handle"
        :animation="animation"
        class="ui-drag-table-tbody"
        @end="onDragEnd"
      >
        <template #item="{ element: row }">
          <tr class="ui-drag-table-row">
            <td
              v-for="(col, colIdx) in columns"
              :key="col.key"
              :class="{ 'is-last': colIdx === columns.length - 1 }"
              :style="{ textAlign: col.align || 'center' }"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="row[col.key]"
                :index="getRowIndex(row)"
              >
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </draggable>

      <!-- 빈 상태 -->
      <tbody v-else>
        <tr>
          <td
            :colspan="columns.length"
            class="ui-table-empty"
          >
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { TableColumn } from '~/types/table'

interface Props {
  columns: TableColumn[]
  modelValue: Record<string, unknown>[]
  stickyHeader?: boolean
  maxHeight?: string
  emptyText?: string
  itemKey?: string
  handle?: string
  animation?: number
}

const props = withDefaults(defineProps<Props>(), {
  stickyHeader: false,
  maxHeight: undefined,
  emptyText: '데이터가 없습니다.',
  itemKey: 'id',
  handle: '.drag-handle',
  animation: 200,
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>[]]
  'drag-end': []
}>()

/** v-model용 (드래그 시 부모 배열 업데이트) */
const innerValue = computed({
  get: () => props.modelValue ?? [],
  set: (val) => emit('update:modelValue', val),
})

const getRowIndex = (row: Record<string, unknown>) => {
  const idx = innerValue.value.findIndex((r) => r[props.itemKey] === row[props.itemKey])
  return idx >= 0 ? idx : 0
}

const onDragEnd = () => {
  emit('drag-end')
}
</script>

<style lang="scss" scoped>
.ui-drag-table-wrap {
  width: 100%;
  overflow: auto;
  @include custom-scrollbar;
}

.ui-drag-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;

  // 헤더
  thead {
    &.is-sticky {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    th {
      height: $height-lg;
      padding: 0 12px;
      background: $color-background;
      @include typo($body-medium-bold);
      color: $color-text-muted;
      white-space: nowrap;
      border-top: 1px solid $color-border;
      border-bottom: 1px solid $color-border;

      &:not(.is-last) {
        border-right: 1px solid $color-border;
      }
    }
  }

  // 바디 (드래그 tbody)
  :deep(.ui-drag-table-tbody) {
    tr {
      td {
        height: $height-lg;
        padding: 0 12px;
        background: #fff;
        border-bottom: 1px solid $color-border-light;
        @include typo($body-medium);
        color: $color-text-primary;

        &:not(.is-last) {
          border-right: 1px solid $color-border-light;
        }
      }
    }
  }

  // 빈 상태 tbody
  tbody {
    td.ui-table-empty {
      height: 120px;
      text-align: center !important;
      color: $color-text-disabled;
      @include typo($body-medium);
    }
  }
}

.ui-table-empty {
  height: 120px;
  text-align: center !important;
  color: $color-text-disabled;
  @include typo($body-medium);
}

// 드래그 중 고스트
:deep(.sortable-ghost) {
  opacity: 0.4;
}
</style>
