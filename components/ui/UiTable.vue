<template>
  <div
    class="ui-table-wrap"
    :class="{ 'is-scrollable': !!maxHeight }"
    :style="maxHeight ? { maxHeight } : undefined"
  >
    <table class="ui-table">
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

      <tbody>
        <!-- 빈 상태 -->
        <tr v-if="!data || data.length === 0">
          <td
            :colspan="columns.length"
            class="ui-table-empty"
          >
            {{ emptyText }}
          </td>
        </tr>

        <!-- 데이터 행 -->
        <tr
          v-for="(row, rowIdx) in data"
          v-else
          :key="rowIdx"
          :class="{ 'is-clickable': clickable, 'is-selected': isRowSelected(row) }"
          @click="onRowClick(row, rowIdx)"
        >
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
              :index="rowIdx"
            >
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'

interface Props {
  columns: TableColumn[]
  data: Record<string, any>[]
  stickyHeader?: boolean
  maxHeight?: string
  emptyText?: string
  clickable?: boolean
  /** 선택 행 강조용: row[selectedRowKey] === selectedRowValue 일 때 is-selected 클래스 적용 */
  selectedRowKey?: string
  selectedRowValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  stickyHeader: false,
  maxHeight: undefined,
  emptyText: '데이터가 없습니다.',
  clickable: false,
  selectedRowKey: undefined,
  selectedRowValue: undefined,
})

const isRowSelected = (row: Record<string, any>) =>
  props.selectedRowKey != null && props.selectedRowValue != null && row[props.selectedRowKey] === props.selectedRowValue

const emit = defineEmits<{
  'row-click': [row: Record<string, any>, index: number]
}>()

const onRowClick = (row: Record<string, any>, index: number) => {
  emit('row-click', row, index)
}
</script>

<style lang="scss" scoped>
.ui-table-wrap {
  width: 100%;
  overflow: auto;
  border-radius: 0;
  @include custom-scrollbar;
}

.ui-table {
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
      // border-top: 1px solid $color-border;
      // border-bottom: 1px solid $color-border;
      vertical-align: middle;

      // 컬럼 구분선 (마지막 제외)
      &:not(.is-last) {
        border-right: 1px solid $color-border;
      }
    }
  }

  // 바디
  tbody {
    tr {
      transition: background-color 0.15s;

      &:hover td {
        background: $color-background;
      }

      &.is-clickable {
        cursor: pointer;
      }

      &.is-selected td {
        background: rgba(var(--color-primary-rgb, 59, 130, 246), 0.08);
      }

      &.is-selected:hover td {
        background: rgba(var(--color-primary-rgb, 59, 130, 246), 0.12);
      }
    }

    td {
      height: $height-lg;
      padding: 0 12px;
      background: #fff;
      border-bottom: 1px solid $color-border-light;
      @include typo($body-medium);
      color: $color-text-primary;
      vertical-align: middle;

      // 컬럼 구분선 (마지막 제외)
      &:not(:last-of-type) {
        border-right: 1px solid $color-border-light;
      }
    }
  }

  // 첫 번째 셀(체크박스 등) 가운데 정렬
  th:first-child,
  td:first-child {
    text-align: center;
    vertical-align: middle;
  }
}

// 빈 상태
.ui-table-empty {
  height: 120px;
  text-align: center !important;
  color: $color-text-disabled;
  @include typo($body-medium);
}
</style>
