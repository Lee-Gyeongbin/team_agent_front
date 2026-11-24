<template>
  <div class="codes-split">
    <!-- 왼쪽: 권한 그룹 목록 -->
    <div class="codes-left">
      <div class="codes-left-header flex flex-wrap justify-between items-center gap-2">
        <p class="com-setting-section-title is-inline">권한 그룹 목록</p>
        <div class="role-list-actions flex flex-wrap items-center">
          <UiButton class="role-excel-button" variant="outline" size="sm" @click="handleDownloadExcel('role')">
            <template #icon-left><img :src="excelIcon" class="role-excel-icon" alt="" /></template>
            엑셀양식다운로드
          </UiButton>
          <UiButton v-if="hasFunc" class="role-excel-button" variant="outline" size="sm" @click="emit('open-excel-upload')">
            <template #icon-left><img :src="excelIcon" class="role-excel-icon" alt="" /></template>
            엑셀업로드
          </UiButton>
          <UiButton
            v-if="hasFunc"
            variant="primary"
            size="sm"
            @click="handleAddRole"
          >
            <template #icon-left>
              <i class="icon icon-plus size-14" />
            </template>
            권한 그룹 추가
          </UiButton>
        </div>
      </div>
      <div class="codes-left-table-wrap">
        <UiLoading
          v-if="isRoleListLoading"
          class="codes-panel-loading"
          text="권한 그룹을 불러오는 중..."
        />
        <div
          v-else-if="roleErrorMessage"
          class="role-manage-error"
        >
          <p class="role-manage-error__message">{{ roleErrorMessage }}</p>
          <UiButton
            variant="outline"
            size="md"
            @click="handleFetchRoleList"
          >
            다시 시도
          </UiButton>
        </div>
        <UiTable
          v-else
          :columns="roleColumns"
          :data="roleTableData"
          :clickable="true"
          sticky-header
          empty-text="등록된 권한 그룹이 없습니다."
          empty-description="권한 그룹을 추가하여 메뉴 접근 권한을 설정하세요."
          selected-row-key="roleId"
          :selected-row-value="isNewRole ? '' : selectedRoleId"
          @row-click="(row) => handleSelectRole(String(row.roleId))"
        >
          <template #cell-useYn="{ value }">
            <UiBadge :variant="value === 'Y' ? 'success' : 'default'">
              {{ value === 'Y' ? '사용' : '미사용' }}
            </UiBadge>
          </template>
          <template #cell-defaultYn="{ value }">
            <UiBadge :variant="value === 'Y' ? 'success' : 'default'">
              {{ value === 'Y' ? '적용' : '미적용' }}
            </UiBadge>
          </template>
        </UiTable>
      </div>
    </div>

    <!-- 오른쪽: 권한 그룹 정보 + 메뉴 접근 권한 -->
    <div class="codes-right">
      <template v-if="selectedRoleId || isNewRole">
        <div class="codes-right-header flex justify-between items-center">
          <p class="com-setting-section-title is-inline">권한 그룹 정보</p>
          <div class="codes-right-grp flex items-center shrink-0">
            <UiButton
              v-if="hasFunc && !isNewRole"
              variant="danger-line"
              size="sm"
              @click="handleDeleteRole"
            >
              삭제
            </UiButton>
            <UiButton
              v-if="hasFunc"
              variant="primary"
              size="sm"
              @click="handleSaveRole"
            >
              저장
            </UiButton>
          </div>
        </div>
        <div class="role-manage-detail-body">
          <div
            class="com-setting-form"
            style="--label-width: 80px"
          >
            <div class="com-setting-field-row">
              <label class="com-setting-label"><span class="is-required">*</span>권한그룹</label>
              <UiInput
                v-model="roleForm.roleName"
                placeholder="권한그룹을 입력하세요"
                size="sm"
                :disabled="!hasFunc"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">설명</label>
              <UiInput
                v-model="roleForm.description"
                placeholder="권한 그룹 설명을 입력하세요"
                size="sm"
                :disabled="!hasFunc"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">사용 여부</label>
              <UiSelect
                :model-value="roleForm.useYn"
                :options="useYnOptions"
                size="sm"
                :disabled="!hasFunc"
                @update:model-value="(value) => handleChangeRoleUseYn(String(value))"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">기본 적용</label>
              <UiCheckbox
                :model-value="roleForm.defaultYn === 'Y'"
                :disabled="!hasFunc || roleForm.useYn === 'N'"
                label="사용자 생성 시 기본 권한으로 적용"
                @update:model-value="(checked) => (roleForm.defaultYn = checked ? 'Y' : 'N')"
              />
            </div>
          </div>

          <div class="role-perm-head">
            <p class="com-setting-section-title is-inline">메뉴 접근 권한 설정</p>
            <div class="codes-input-grp shrink-0 grow-1 max-w-200">
              <UiInput
                v-model="menuSearchKeyword"
                type="search"
                size="sm"
                placeholder="메뉴명 검색..."
              />
            </div>
          </div>

          <div
            class="role-legend"
            :class="{ 'is-closed': !isLegendOpen }"
          >
            <button
              type="button"
              class="role-legend-head"
              :aria-expanded="isLegendOpen"
              @click="isLegendOpen = !isLegendOpen"
            >
              <i
                class="icon icon-arrow-down-gray size-20"
                :class="{ 'is-expanded': isLegendOpen }"
              />
              <strong>권한 설명</strong>
            </button>
            <div class="role-legend-body">
              <span><b>조회</b> — 메뉴 접근, 목록·상세 화면 조회, 엑셀 다운로드</span>
              <span
                ><b>편집</b> — 조회 외 모든 기능을 한 번에 허용 (데이터 등록·수정·삭제, 엑셀
                업로드)</span
              >
              <span class="role-legend-note">※ 데이터 범위(본인 데이터만 / 전체)는 메뉴별 업무 규칙에 따릅니다.</span>
            </div>
          </div>

          <div class="role-perm-scroll">
            <UiLoading
              v-if="isRoleDetailLoading"
              class="codes-panel-loading"
              text="메뉴 권한을 불러오는 중..."
            />
            <UiTable
              v-else
              :columns="accessMenuColumns"
              :data="menuRows"
              sticky-header
              empty-text="검색된 메뉴가 없습니다."
            >
              <template
                v-for="perm in accessPermissionItems"
                :key="perm.key"
                #[`header-${perm.key}`]
              >
                <span
                  class="role-perm-th"
                  :title="perm.tip"
                >
                  <UiCheckbox
                    :model-value="isAllChecked(perm.key)"
                    :indeterminate="isAllIndeterminate(perm.key)"
                    :label="perm.label"
                    :disabled="!hasFunc"
                    @update:model-value="(checked) => toggleAllPerm(perm.key, checked)"
                  />
                </span>
              </template>
              <template #cell-menuName="{ row }">
                <div
                  class="flex items-center"
                  :style="{ paddingLeft: `${(row as RoleMenuRow).depth * 12}px` }"
                >
                  <button
                    v-if="(row as RoleMenuRow).hasChildren"
                    type="button"
                    class="role-menu-arrow"
                    @click="toggleMenuExpanded((row as RoleMenuRow).menuId)"
                  >
                    <i
                      class="icon icon-arrow-down-gray size-20"
                      :class="{ 'is-expanded': (row as RoleMenuRow).expanded }"
                    />
                  </button>
                  <span
                    v-else
                    class="role-menu-arrow-placeholder"
                  />
                  <span>{{ (row as RoleMenuRow).menuName }}</span>
                </div>
              </template>
              <template
                v-for="perm in accessPermissionItems"
                :key="perm.key"
                #[`cell-${perm.key}`]="{ row }"
              >
                <UiCheckbox
                  :model-value="isMenuChecked((row as RoleMenuRow).menuId, perm.key)"
                  :indeterminate="isMenuIndeterminate((row as RoleMenuRow).menuId, perm.key)"
                  label-hidden
                  :label="`${(row as RoleMenuRow).menuName} ${perm.label}`"
                  :disabled="!hasFunc"
                  @update:model-value="(checked) => toggleMenuPerm((row as RoleMenuRow).menuId, perm.key, checked)"
                />
              </template>
            </UiTable>
          </div>
        </div>
      </template>
      <div
        v-else
        class="codes-right-table-wrap role-manage-empty"
      >
        <UiEmpty
          title="좌측에서 권한 그룹을 선택하세요"
          description="선택한 권한 그룹의 정보와 메뉴 접근 권한을 설정할 수 있습니다."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import excelIcon from '~/assets/icons/svg/xlsx_icon.svg'
import {
  UiBadge,
  UiButton,
  UiCheckbox,
  UiEmpty,
  UiInput,
  UiLoading,
  UiSelect,
  UiTable,
} from '@leechanyong/ispark-ui'
import type { RoleMenuRow } from '~/types/role-manage'
import { roleColumns, roleMenuColumns, rolePermItems } from '~/types/role-manage'
import { useYnOptions } from '~/composables/codes/useCodesStore'

const emit = defineEmits<{
  'open-excel-upload': []
}>()

const {
  roleList,
  isRoleListLoading,
  roleErrorMessage,
  selectedRoleId,
  isNewRole,
  roleForm,
  menuRows,
  menuSearchKeyword,
  isRoleDetailLoading,
  isLegendOpen,
  isMenuChecked,
  isMenuIndeterminate,
  toggleMenuPerm,
  isAllChecked,
  isAllIndeterminate,
  toggleAllPerm,
  toggleMenuExpanded,
  handleFetchRoleList,
  handleSelectRole,
  handleAddRole,
  handleChangeRoleUseYn,
  handleSaveRole,
  handleDeleteRole,
  handleDownloadExcel,
  hasFunc,
} = useRoleManageStore()

const roleTableData = computed(() => roleList.value.map((role, index) => ({ ...role, no: index + 1 })))

const accessPermissionItems = rolePermItems.map((item) =>
  item.key === 'funcYn' ? { ...item, label: '편집' } : item,
)

const accessMenuColumns = roleMenuColumns.map((column) =>
  column.key === 'funcYn' ? { ...column, label: '편집' } : column,
)
</script>

<style scoped lang="scss">
.role-list-actions {
  gap: $spacing-sm;
}

.role-list-actions > :deep(button) {
  box-sizing: border-box;
  height: $height-sm;
}
</style>
