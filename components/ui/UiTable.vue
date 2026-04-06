<template>
  <div
    class="ui-table-wrap"
    :class="[{ 'is-scrollable': !!maxHeight }, size === 'sm' ? 'is-sm' : '']"
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
            :class="{ 'is-last': idx === columns.length - 1, 'is-sortable': isColumnSortable(col) }"
            :style="{ textAlign: col.headerAlign || 'center' }"
          >
            <slot
              :name="`header-${col.key}`"
              :column="col"
              :is-sortable="isColumnSortable(col)"
              :sort-order="getSortOrder(col.key)"
              :on-sort="() => onSortColumn(col)"
            >
              <button
                v-if="isColumnSortable(col)"
                type="button"
                class="ui-table-sort-btn"
                @click="onSortColumn(col)"
              >
                <span>{{ col.label }}</span>
                <span
                  class="ui-table-sort-mark"
                  :class="{
                    'is-active': !!getSortOrder(col.key),
                    'is-desc': getSortOrder(col.key) === 'desc',
                  }"
                  >▲</span
                >
              </button>
              <template v-else>
                {{ col.label }}
              </template>
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
          v-for="(row, rowIdx) in displayedData"
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
  /** 테이블 크기: 'md'(기본) | 'sm'(컴팩트) */
  size?: 'md' | 'sm'
  /** 선택 행 강조용: row[selectedRowKey] === selectedRowValue 일 때 is-selected 클래스 적용 */
  selectedRowKey?: string
  selectedRowValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  stickyHeader: false,
  maxHeight: undefined,
  emptyText: '데이터가 없습니다.',
  clickable: false,
  size: 'md',
  selectedRowKey: undefined,
  selectedRowValue: undefined,
})

const isRowSelected = (row: Record<string, any>) =>
  props.selectedRowKey != null && props.selectedRowValue != null && row[props.selectedRowKey] === props.selectedRowValue

type SortOrder = 'asc' | 'desc' | ''
const sortState = ref<{ key: string; order: SortOrder }>({ key: '', order: '' })

const isColumnSortable = (col: TableColumn) => col.sortable === true

const getSortOrder = (key: string): SortOrder => (sortState.value.key === key ? sortState.value.order : '')

const onSortColumn = (col: TableColumn) => {
  if (!isColumnSortable(col)) return
  if (sortState.value.key !== col.key) {
    sortState.value = { key: col.key, order: 'asc' }
    return
  }
  if (sortState.value.order === 'asc') {
    sortState.value.order = 'desc'
    return
  }
  sortState.value = { key: '', order: '' }
}

const getComparableValue = (value: unknown, sortType: TableColumn['sortType']) => {
  const raw = value ?? ''
  if (sortType === 'string') return String(raw)
  if (sortType === 'number') {
    const num = Number(String(raw).replaceAll(',', ''))
    return Number.isNaN(num) ? Number.NEGATIVE_INFINITY : num
  }
  if (sortType === 'date') {
    const ts = Date.parse(String(raw))
    return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts
  }
  const maybeNum = Number(String(raw).replaceAll(',', ''))
  if (!Number.isNaN(maybeNum)) return maybeNum
  const maybeDate = Date.parse(String(raw))
  if (!Number.isNaN(maybeDate)) return maybeDate
  return String(raw)
}

const displayedData = computed(() => {
  const rows = [...props.data]
  const { key, order } = sortState.value
  if (!key || !order) return rows
  const col = props.columns.find((item) => item.key === key)
  if (!col) return rows

  return rows.sort((a, b) => {
    const va = getComparableValue(a[key], col.sortType ?? 'auto')
    const vb = getComparableValue(b[key], col.sortType ?? 'auto')
    const direction = order === 'asc' ? 1 : -1

    if (typeof va === 'string' && typeof vb === 'string') {
      return direction * va.localeCompare(vb, 'ko')
    }
    if (va === vb) return 0
    return direction * (va > vb ? 1 : -1)
  })
})

watch(
  () => props.columns,
  (columns) => {
    const key = sortState.value.key
    if (!key) return
    const target = columns.find((col) => col.key === key)
    if (!target || !isColumnSortable(target)) sortState.value = { key: '', order: '' }
  },
  { deep: true },
)

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
      height: 42px;
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
        td {
          cursor: pointer;
        }

        td:first-child {
          cursor: default;
        }
      }

      &.is-selected td {
        background: rgba(var(--color-primary-rgb, 59, 130, 246), 0.08);
      }

      &.is-selected:hover td {
        background: rgba(var(--color-primary-rgb, 59, 130, 246), 0.12);
      }
    }

    td {
      height: 42px;
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

.ui-table-sort-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.ui-table-sort-mark {
  font-size: 10px;
  color: $color-text-disabled;

  &.is-active {
    color: $color-primary;
  }

  &.is-desc {
    transform: rotate(180deg);
  }
}

// 빈 상태
.ui-table-empty {
  height: 120px;
  text-align: center !important;
  color: $color-text-disabled;
  @include typo($body-medium);
}

// ===== sm 사이즈 (컴팩트) =====
.ui-table-wrap.is-sm {
  .ui-table {
    thead th {
      height: auto;
      padding: 6px 8px;
      @include typo($body-medium-bold);
      font-weight: 500;
      color: #4d5462;
      background: #f4f7f9;
      border-right-color: #dce4e9;
    }

    tbody td {
      height: 28px;
      padding: 0 12px;
      @include typo($body-medium);
      color: #4d5462;
      border-bottom-color: #ecf0f3;

      &:not(:last-of-type) {
        border-right-color: #ecf0f3;
      }
    }
  }

  // 헤더/바디 상하 구분선
  .ui-table thead th {
    border-top: 1px solid #dce4e9;
    border-bottom: 1px solid #dce4e9;
  }
}
</style>
