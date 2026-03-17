<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        class="sidebar-dropdown-content sidebar-settings-dropdown"
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
            <DropdownMenuSubTrigger class="sidebar-dropdown-item sidebar-menu-sub-trigger">
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
                  class="sidebar-dropdown-item"
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
            class="sidebar-dropdown-item"
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

<!-- Portal로 body에 렌더링되므로 scoped 미적용. 콘텐츠/아이템 공통 스타일은 layout/_sidebar.scss .sidebar-dropdown-content, .sidebar-dropdown-item 사용 -->
<style lang="scss">
@use '~/assets/styles/utils/variables' as *;

.sidebar-menu-sub-content {
  min-width: 180px;
  padding: 8px;
  border-radius: $border-radius-base;
  background: $color-surface;
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

.sidebar-menu-sub-trigger {
  justify-content: space-between;

  .icon-arrow-right {
    flex-shrink: 0;
    color: $color-text-secondary;
  }
}
</style>
