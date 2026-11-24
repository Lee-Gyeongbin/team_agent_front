<template>
  <div class="menu-detail-form">
    <div class="menu-form-header flex items-center justify-between">
      <h3 class="menu-form-title">{{ menu.menuName }}</h3>
      <div class="flex items-center gap-2">
        <UiButton
          variant="primary"
          size="sm"
          @click="$emit('save')"
        >
          저장
        </UiButton>
      </div>
    </div>

    <div class="menu-detail-form-body com-setting-form">
      <!-- 메뉴명 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span>메뉴명</label>
        <UiInput
          :model-value="menu.menuName"
          placeholder="메뉴명을 입력하세요"
          size="sm"
          @update:model-value="onPatch({ menuName: $event })"
        />
      </div>

      <!-- 메뉴 경로 (표시용: 메뉴명으로 조합, 저장 payload는 menuPath ID 경로 그대로 전달) -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">메뉴 경로</label>
        <div
          class="com-setting-field-input menu-path-field-wrap"
          style="flex: 1"
        >
          <UiInput
            class="menu-path-readonly-input"
            :model-value="breadcrumbDisplay"
            :title="breadcrumbDisplay"
            disabled
            size="sm"
          />
        </div>
      </div>

      <!-- 상위 메뉴 (선택 시 menuPath·parnMenuId 재계산) -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span>상위 메뉴</label>
        <div
          class="com-setting-field-input menu-parent-select-wrap"
          style="flex: 1"
        >
          <UiSelect
            :model-value="menu.parnMenuId ?? ''"
            :options="parentMenuSelectOptions"
            placeholder="상위 메뉴를 선택하세요"
            size="sm"
            @update:model-value="onParentMenuChange"
          />
        </div>
      </div>

      <!-- 소스 경로 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span>메뉴 URL</label>
        <div
          class="com-setting-field-input"
          style="flex: 1"
        >
          <UiInput
            :model-value="menu.srcPath"
            placeholder="예: /menu-manage"
            size="sm"
            @update:model-value="onPatch({ srcPath: $event })"
          />
        </div>
      </div>

      <!-- 아이콘 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">아이콘</label>
        <div
          class="com-setting-field-input menu-icon-field-wrap"
          style="flex: 1"
        >
          <div class="menu-icon-picker-row flex items-center gap-2">
            <div class="picker-wrap">
              <button
                type="button"
                class="picker-btn"
                :class="{ 'is-placeholder': isIconUnset }"
                title="아이콘 선택"
                @click="isIconModalOpen = true"
              >
                <i :class="pickerIconClasses" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 상세 설명 -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">상세 설명</label>
        <UiTextarea
          :model-value="menu.description"
          placeholder="메뉴에 대한 설명을 입력하세요"
          :rows="4"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="8"
          @update:model-value="onPatch({ description: $event })"
        />
      </div>

      <div v-if="canAssign" class="com-setting-field-row is-top">
        <label id="menu-role-groups-label" class="com-setting-label">권한그룹 지정</label>
        <div class="com-setting-field-input menu-role-permissions" role="group" aria-labelledby="menu-role-groups-label">
          <p v-if="rolesLoading">권한그룹을 불러오는 중입니다.</p>
          <p v-else-if="rolesError">
            {{ rolesError }}
            <UiButton variant="outline" size="sm" @click="loadRoles">다시 불러오기</UiButton>
          </p>
          <p v-else-if="!roles.length">사용 가능한 권한그룹이 없습니다.</p>
          <UiTable
            v-else
            class="menu-role-table"
            :columns="roleGroupColumns"
            :data="roles"
          >
            <template v-for="column in permissionColumns" :key="column.key" #[`header-${column.key}`]>
              <span class="role-perm-th" :title="column.tip">
                <UiCheckbox
                  :label="column.label"
                  :model-value="column.all"
                  :disabled="menu.useYn === 'N' || !column.targets.length"
                  @update:model-value="(checked) => setPermissions(column.targets, column.key, checked === true)"
                />
              </span>
            </template>
            <template v-for="column in permissionColumns" :key="column.key" #[`cell-${column.key}`]="{ row }">
              <UiCheckbox
                :label="`${(row as RoleItem).roleName} ${column.label}`"
                label-hidden
                :disabled="menu.useYn === 'N'"
                :model-value="permissions.get((row as RoleItem).roleId)?.[column.key] === 'Y'"
                @update:model-value="(checked) => setPermissions([(row as RoleItem).roleId], column.key, checked === true)"
              />
            </template>
          </UiTable>
        </div>
      </div>
      <div class="com-setting-field-row">
        <label class="com-setting-label">사용 여부</label>
        <div class="menu-use-yn-field flex items-center gap-2">
          <UiToggle
            :model-value="menu.useYn !== 'N'"
            @update:model-value="onPatch({ useYn: $event ? 'Y' : 'N' })"
          />
          <span class="menu-use-yn-label">{{ menu.useYn !== 'N' ? '사용' : '미사용' }}</span>
        </div>
      </div>
    </div>

    <AgentIconSelectModal
      :is-open="isIconModalOpen"
      :icons="themeIcons"
      :selected-icon-id="resolvedIconId"
      :selected-color-hex="iconModalColorHex"
      @close="isIconModalOpen = false"
      @select="onSelectIcon"
    />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiCheckbox, UiInput, UiSelect, UiTable, UiToggle } from '@leechanyong/ispark-ui'
import AgentIconSelectModal from '~/components/agent/AgentIconSelectModal.vue'
import { useAgentStore } from '~/composables/agent/useAgentStore'
import { useRoleManageApi } from '~/composables/role-manage/useRoleManageApi'
import type { MenuTreeItem } from '~/types/menu'
import { roleMenuColumns, rolePermItems } from '~/types/role-manage'
import type { RoleItem } from '~/types/role-manage'
import type { SelectOption } from '~/components/ui/UiSelect.vue'

interface Props {
  /** 상위 메뉴 후보를 만들 트리 (편집 중인 메뉴·하위는 선택 불가) */
  menuTree: MenuTreeItem[]
}

const props = defineProps<Props>()

const menu = defineModel<MenuTreeItem>('menu', { required: true })

defineEmits<{
  save: []
}>()

const { themeIcons, themeColors, handleFetchThemeOptions } = useAgentStore()

const isIconModalOpen = ref(false)

const onPatch = (partial: Partial<MenuTreeItem>) => {
  menu.value = { ...menu.value, ...partial }
}

const { canRead, canFunc } = usePermission()
const { fetchRoleList } = useRoleManageApi()
const canAssign = computed(() => !menu.value.menuId
  && canFunc('/menu-manage') && canRead('/role-manage') && canFunc('/role-manage'))
const roles = ref<RoleItem[]>([])
const rolesLoading = ref(false)
const rolesError = ref('')
const permissions = computed(() => new Map(menu.value.rolePermissions?.map((row) => [row.roleId, row])))

async function loadRoles() {
  if (rolesLoading.value) return
  rolesLoading.value = true
  rolesError.value = ''
  try {
    roles.value = (await fetchRoleList()).filter((role) => role.useYn === 'Y')
  } catch (error) {
    rolesError.value = error instanceof Error ? error.message : '권한그룹을 불러오지 못했습니다.'
  } finally {
    rolesLoading.value = false
  }
}

watch(canAssign, (visible) => {
  if (visible) void loadRoles()
}, { immediate: true })

const roleGroupColumns = roleMenuColumns.map((column) => {
  if (column.key === 'menuName') return { ...column, key: 'roleName', label: '권한그룹', headerAlign: 'center' as const }
  if (column.key === 'funcYn') return { ...column, label: '편집', width: '170px' }
  return { ...column, width: '100px' }
})

const permissionColumns = computed(() => rolePermItems.map((column) => {
  const targets = roles.value.map(({ roleId }) => roleId)
  const selected = targets.filter((roleId) => permissions.value.get(roleId)?.[column.key] === 'Y').length
  return { ...column, label: column.key === 'funcYn' ? '편집' : column.label, targets, all: selected > 0 && selected === targets.length }
}))

function setPermissions(roleIds: string[], key: 'readYn' | 'funcYn', enabled: boolean) {
  const next = new Map(permissions.value)
  for (const roleId of roleIds) {
    const row = next.get(roleId)
    if (key === 'readYn') {
      if (enabled) next.set(roleId, row ?? { roleId, readYn: 'Y', funcYn: 'N' })
      else next.delete(roleId)
    } else if (enabled) {
      next.set(roleId, { roleId, readYn: 'Y', funcYn: 'Y' })
    } else if (row) {
      next.set(roleId, { ...row, funcYn: 'N' })
    }
  }
  onPatch({ rolePermissions: [...next.values()] })
}

/** 트리에서 menuId → 메뉴명 */
const menuIdToNameMap = computed(() => {
  const map = new Map<string, string>()
  const walk = (nodes: MenuTreeItem[]) => {
    for (const n of nodes) {
      map.set(n.menuId, n.menuName)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(props.menuTree)
  return map
})

const findMenuItemById = (nodes: MenuTreeItem[], id: string): MenuTreeItem | null => {
  for (const n of nodes) {
    if (n.menuId === id) return n
    const found = findMenuItemById(n.children ?? [], id)
    if (found) return found
  }
  return null
}

/** 편집 중 메뉴 및 모든 하위 — 상위로 선택 불가 */
const excludedParentIds = computed(() => {
  const root = findMenuItemById(props.menuTree, menu.value.menuId)
  const ids = new Set<string>()
  if (!root) return ids
  const collect = (item: MenuTreeItem) => {
    ids.add(item.menuId)
    for (const c of item.children ?? []) collect(c)
  }
  collect(root)
  return ids
})

const flattenParentOptions = (
  nodes: MenuTreeItem[],
  depth: number,
  excluded: Set<string>,
  out: SelectOption[],
): void => {
  const indent = '\u3000'.repeat(depth)
  for (const n of nodes) {
    if (excluded.has(n.menuId)) continue
    out.push({ value: n.menuId, label: `${indent}${n.menuName}` })
    flattenParentOptions(n.children ?? [], depth + 1, excluded, out)
  }
}

const parentMenuSelectOptions = computed((): SelectOption[] => {
  const opts: SelectOption[] = [{ value: '', label: '최상위 메뉴' }]
  flattenParentOptions(props.menuTree, 0, excludedParentIds.value, opts)
  return opts
})

/** breadcrumb: 화면에는 메뉴명만 표시. 저장 API payload는 menu.menuPath(ID 경로)를 그대로 사용 */
const breadcrumbSegments = computed(() => {
  const ids = menu.value.menuPath
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  const nameMap = menuIdToNameMap.value
  const selfId = menu.value.menuId
  return ids.map((id, idx) => {
    const isSelf = id === selfId && idx === ids.length - 1
    if (isSelf) {
      const typed = menu.value.menuName.trim()
      return typed || nameMap.get(id) || '이 메뉴'
    }
    return nameMap.get(id) ?? '상위 메뉴'
  })
})

const breadcrumbDisplay = computed(() => {
  const parts = breadcrumbSegments.value
  if (!parts.length) return '경로 정보 없음'
  return parts.join(' › ')
})

/** 상위 메뉴 변경 시 menuPath·parnMenuId 동시 갱신 */
const onParentMenuChange = (parentId: string | number) => {
  const pid = typeof parentId === 'number' ? String(parentId) : parentId
  const selfId = menu.value.menuId

  if (!selfId) {
    onPatch({ parnMenuId: pid || null })
    return
  }

  if (!pid) {
    onPatch({ menuPath: selfId, parnMenuId: null })
    return
  }
  const parentNode = findMenuItemById(props.menuTree, pid)
  if (!parentNode) return
  const base = parentNode.menuPath.trim()
  onPatch({
    menuPath: base ? `${base}/${selfId}` : `${pid}/${selfId}`,
    parnMenuId: pid,
  })
}

const resolvedIconId = computed(() => {
  const cls = menu.value.icon?.trim()
  if (!cls) return ''
  return themeIcons.value.find((i) => i.iconClassNm === cls)?.iconId ?? ''
})

const iconModalColorHex = computed(() => themeColors.value[0]?.colorHex ?? '#64748b')

const pickerIconClasses = computed(() => {
  const cls = menu.value.icon?.trim()
  if (!cls) return ['icon-plus', 'size-16']
  return [cls, 'size-16']
})

const isIconUnset = computed(() => !menu.value.icon?.trim())

const onSelectIcon = (iconId: string) => {
  const item = themeIcons.value.find((i) => i.iconId === iconId)
  if (!item) return
  onPatch({ icon: item.iconClassNm })
  isIconModalOpen.value = false
}

onMounted(() => {
  void handleFetchThemeOptions()
})
</script>

<style lang="scss" scoped>
.menu-detail-form {
  --label-width: 120px;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.menu-detail-form-body {
  width: 100%;
}

.menu-role-permissions {
  flex: 1;
  min-width: 0;
}

.menu-role-table {
  width: 100%;

  :deep(.ui-table) {
    width: 100%;

    th,
    td {
      font-size: $font-size-base;
    }

    tbody td {
      height: 40px;
      padding-block: 6px;
    }
  }

  :deep(.ui-checkbox) {
    align-items: center;
  }

  :deep(.ui-checkbox-label) {
    font-size: $font-size-base;
  }

  :deep(thead th),
  :deep(thead .ui-checkbox-label) {
    font-weight: 700;
    text-align: center;
  }

  :deep(.ui-checkbox-box) {
    width: 15px;
    height: 15px;
    margin-top: 0;
  }
}

.menu-icon-picker-row {
  flex-wrap: wrap;
}

.menu-icon-class-text {
  @include typo($body-small);
  color: $color-text-muted;
  min-width: 0;
  word-break: break-all;
}

.menu-use-yn-field {
  min-height: 32px;

  .menu-use-yn-label {
    @include typo($body-medium);
    color: $color-text-primary;
  }
}

.picker-wrap {
  position: relative;
}

.picker-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #fff;
  transition: border-color 0.2s ease;
  cursor: pointer;
  color: $color-text-primary;

  &:hover {
    border-color: #c3ced6;
  }

  &.is-placeholder {
    border-style: dashed;
    border-color: #cbd5e1;
    background: #f8fafc;
    color: $color-text-muted;
  }
}

.menu-icon-field-wrap {
  min-width: 0;
}

.menu-path-field-wrap {
  min-width: 0;
}

.menu-path-readonly-input {
  width: 100%;
}

.menu-parent-select-wrap {
  min-width: 0;
  max-width: 100%;
}
</style>
