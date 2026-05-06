<template>
  <div class="menu-detail-form">
    <div class="menu-form-header flex items-center justify-between">
      <h3 class="menu-form-title">{{ menuTitle }}</h3>
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
          :model-value="form.menuName"
          placeholder="메뉴명을 입력하세요"
          size="sm"
          @update:model-value="onPatch({ menuName: $event })"
        />
      </div>

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

      <!-- 상위 메뉴 (선택 시 menuPath를 ID 경로로 재계산) -->
      <div class="com-setting-field-row">
        <label class="com-setting-label"><span class="is-required">*</span>상위 메뉴</label>
        <div
          class="com-setting-field-input menu-parent-select-wrap"
          style="flex: 1"
        >
          <UiSelect
            :model-value="selectedParentMenuId"
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
            :model-value="form.srcPath"
            placeholder="예: /menu-manage"
            size="sm"
            @update:model-value="onPatch({ srcPath: $event })"
          />
        </div>
      </div>

      <!-- 아이콘 (Agent 기본 설정과 동일: 피커 + 모달) -->
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
          :model-value="form.description"
          placeholder="메뉴에 대한 설명을 입력하세요"
          :rows="4"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="8"
          @update:model-value="onPatch({ description: $event })"
        />
      </div>

      <!-- 사용 여부 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">사용 여부</label>
        <div class="menu-use-yn-field flex items-center gap-2">
          <UiToggle
            :model-value="form.useYnBool"
            @update:model-value="onPatch({ useYnBool: $event })"
          />
          <span class="menu-use-yn-label">{{ form.useYnBool ? '사용' : '미사용' }}</span>
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
import AgentIconSelectModal from '~/components/agent/AgentIconSelectModal.vue'
import { useAgentStore } from '~/composables/agent/useAgentStore'
import type { MenuManageFormValues, MenuTreeItem } from '~/types/menu'
import type { SelectOption } from '~/components/ui/UiSelect.vue'

interface Props {
  menuTitle: string
  /** 상위 메뉴 후보를 만들 트리 (편집 중인 메뉴·하위는 선택 불가) */
  menuTree: MenuTreeItem[]
  /** 현재 수정 중인 메뉴 ID — menuPath 끝단과 상위 해석에 사용 */
  editingMenuId: string
}

const props = defineProps<Props>()

const form = defineModel<MenuManageFormValues>('form', { required: true })

defineEmits<{
  reset: []
  save: []
}>()

const { themeIcons, themeColors, handleFetchThemeOptions } = useAgentStore()

const isIconModalOpen = ref(false)

const onPatch = (partial: Partial<MenuManageFormValues>) => {
  form.value = { ...form.value, ...partial }
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
  const root = findMenuItemById(props.menuTree, props.editingMenuId)
  const ids = new Set<string>()
  if (!root) return ids
  const collect = (item: MenuTreeItem) => {
    ids.add(item.menuId)
    for (const c of item.children ?? []) collect(c)
  }
  collect(root)
  return ids
})

/** menuPath(예: A/B/C)와 현재 메뉴 ID로 직계 상위 메뉴 ID 파싱 — 없으면 ''(최상위) */
const parseParentMenuId = (menuPath: string, menuId: string): string => {
  const parts = menuPath
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  const last = parts[parts.length - 1]
  const aligned = last === menuId
  if (!aligned && parts.includes(menuId)) {
    const idx = parts.lastIndexOf(menuId)
    return idx > 0 ? parts[idx - 1]! : ''
  }
  if (!aligned) return parts.length >= 2 ? parts[parts.length - 2]! : ''
  return parts.length >= 2 ? parts[parts.length - 2]! : ''
}

const selectedParentMenuId = computed(() => parseParentMenuId(form.value.menuPath, props.editingMenuId))

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

/** breadcrumb: ID는 노출하지 않고 메뉴명만 (현재 행은 입력 중인 메뉴명 반영) */
const breadcrumbSegments = computed(() => {
  const ids = form.value.menuPath
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  const nameMap = menuIdToNameMap.value
  const selfId = props.editingMenuId
  return ids.map((id, idx) => {
    const isSelf = id === selfId && idx === ids.length - 1
    if (isSelf) {
      const typed = form.value.menuName.trim()
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

const onParentMenuChange = (parentId: string | number) => {
  const pid = typeof parentId === 'number' ? String(parentId) : parentId
  const selfId = props.editingMenuId
  if (!selfId) return
  if (!pid) {
    onPatch({ menuPath: selfId })
    return
  }
  const parentNode = findMenuItemById(props.menuTree, pid)
  if (!parentNode) return
  const base = parentNode.menuPath.trim()
  onPatch({ menuPath: base ? `${base}/${selfId}` : `${pid}/${selfId}` })
}

const resolvedIconId = computed(() => {
  const cls = form.value.icon?.trim()
  if (!cls) return ''
  return themeIcons.value.find((i) => i.iconClassNm === cls)?.iconId ?? ''
})

const iconModalColorHex = computed(() => themeColors.value[0]?.colorHex ?? '#64748b')

/** AgentSettingBasic 과 동일: iconClassNm + size (마스크 아이콘) */
const pickerIconClasses = computed(() => {
  const cls = form.value.icon?.trim()
  if (!cls) return ['icon-plus', 'size-16']
  return [cls, 'size-16']
})

const isIconUnset = computed(() => !form.value.icon?.trim())

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

// AgentSettingBasic.vue 의 아이콘 피커와 동일 패턴
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
