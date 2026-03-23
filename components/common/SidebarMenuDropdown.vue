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
              <span class="sidebar-menu-sub-trigger__start">
                <i
                  v-if="subTriggerIconClass(item)"
                  :class="['icon', subTriggerIconClass(item), 'size-20']"
                />
                <span>{{ item.menuName }}</span>
              </span>
              <i class="icon-sidebar-arrow-right size-20" />
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                class="sidebar-dropdown-content sidebar-menu-sub-content"
                side="right"
                align="end"
                :side-offset="8"
                :align-offset="0"
              >
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
  DropdownMenuPortal,
  DropdownMenuRoot,
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

/** 서브 트리거(1depth) 전용: API icon 우선, 없으면 메뉴명별 폴백 */
const SUB_TRIGGER_ICON_BY_MENU_NAME: Record<string, string> = {
  AI운영: 'icon-sidebar-magic-wand',
  통계리포트: 'icon-chart',
  시스템: 'icon-system',
  커뮤니티: 'icon-group',
}

const subTriggerIconClass = (item: MenuItem): string | undefined => {
  const fromApi = item.icon?.trim()
  if (fromApi) return fromApi
  const name = item.menuName?.trim()
  if (name && SUB_TRIGGER_ICON_BY_MENU_NAME[name]) {
    return SUB_TRIGGER_ICON_BY_MENU_NAME[name]
  }
  return undefined
}

const hasChildren = (item: MenuItem) => Array.isArray(item.children) && item.children.length > 0

const onSelectItem = (e: Event, item: MenuItem) => {
  if (!item.srcPath) {
    e.preventDefault()
    return
  }
  navigateTo(item.srcPath)
}
</script>
