<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        class="sidebar-menu-dropdown"
        side="right"
        align="start"
        :side-offset="8"
        :collision-padding="8"
      >
        <template
          v-for="item in items"
          :key="item.menuId"
        >
          <!-- 자식이 있는 항목: SubTrigger로 서브메뉴 펼침 -->
          <DropdownMenuSub v-if="hasChildren(item)">
            <DropdownMenuSubTrigger class="sidebar-menu-sub-trigger">
              <span>{{ item.menuName }}</span>
              <i class="icon-arrow-right size-16" />
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                class="sidebar-menu-sub-content"
                :side-offset="4"
                :align-offset="-4"
              >
                <DropdownMenuLabel class="sidebar-menu-label">
                  {{ item.menuName }}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  v-for="child in item.children"
                  :key="child.menuId"
                  class="sidebar-menu-item"
                  @select="(e) => onSelectItem(e, child)"
                >
                  <i
                    v-if="child.icon"
                    :class="['icon', child.icon, 'size-16']"
                  />
                  <span>{{ child.menuName }}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <!-- 자식 없음: 레이블만 표시 (srcPath 있으면 클릭 시 이동) -->
          <DropdownMenuItem
            v-else
            class="sidebar-menu-item"
            :class="{ 'is-disabled': !item.srcPath }"
            @select="(e) => onSelectItem(e, item)"
          >
            <i
              v-if="item.icon"
              :class="['icon', item.icon, 'size-16']"
            />
            <span>{{ item.menuName }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'radix-vue'
import type { MenuItem } from '~/types/menu'

interface Props {
  items: MenuItem[]
}

defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })

const hasChildren = (item: MenuItem) => Array.isArray(item.children) && item.children.length > 0

const onSelectItem = (e: Event, item: MenuItem) => {
  if (!item.srcPath) {
    e.preventDefault()
    return
  }
  navigateTo(item.srcPath)
}
</script>

<!-- Portal로 body에 렌더링되므로 scoped 미적용 -->
<style lang="scss">
.sidebar-menu-dropdown {
  min-width: 180px;
  padding: 8px;
  border-radius: $border-radius-base;
  background: #fff;
  border: 1px solid $color-border;
  box-shadow: $shadow-md;
  z-index: $z-dropdown;

  &[data-state='open'] {
    animation: sidebar-menu-in 0.15s ease;
  }

  &[data-state='closed'] {
    animation: sidebar-menu-out 0.1s ease forwards;
  }
}

.sidebar-menu-sub-content {
  min-width: 180px;
  padding: 8px;
  border-radius: $border-radius-base;
  background: #fff;
  border: 1px solid $color-border;
  box-shadow: $shadow-md;
  z-index: $z-dropdown;
}

.sidebar-menu-label {
  padding: 8px 12px;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
}

.sidebar-menu-sub-trigger,
.sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: $border-radius-sm;
  font-size: $font-size-base;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;

  &:hover,
  &[data-highlighted] {
    background-color: $color-border-light;
  }

  &.is-disabled {
    color: $color-text-disabled;
    cursor: not-allowed;

    &:hover,
    &[data-highlighted] {
      background-color: transparent;
    }
  }
}

.sidebar-menu-sub-trigger {
  justify-content: space-between;

  .icon-arrow-right {
    flex-shrink: 0;
    color: $color-text-secondary;
  }
}

@keyframes sidebar-menu-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sidebar-menu-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-4px);
  }
}
</style>
