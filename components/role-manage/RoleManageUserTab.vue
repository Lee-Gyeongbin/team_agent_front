<template>
  <div class="ur-wrap">
    <!-- 필터 -->
    <div class="ur-filter">
      <label>권한그룹</label>
      <div class="ur-filter-role">
        <UiSelect
          :model-value="userRoleId"
          :options="activeRoleOptions"
          placeholder="권한 그룹 선택"
          size="md"
          @update:model-value="(value) => handleChangeUserRole(String(value))"
        />
      </div>
      <label>검색</label>
      <div class="ur-filter-name">
        <UiInput
          v-model="nameKeyword"
          type="search"
          size="md"
          placeholder="성명 또는 아이디 검색"
          @search="handleSearchUser"
          @enter="handleSearchUser"
        />
      </div>
      <div class="ur-right">
        <UiButton class="role-excel-button" variant="outline" size="md" @click="handleDownloadExcel('user')">
          <template #icon-left><img :src="excelIcon" class="role-excel-icon" alt="" /></template>
          엑셀양식다운로드
        </UiButton>
        <UiButton v-if="hasFunc" class="role-excel-button" variant="outline" size="md" @click="emit('open-excel-upload')">
          <template #icon-left><img :src="excelIcon" class="role-excel-icon" alt="" /></template>
          엑셀업로드
        </UiButton>
        <UiButton
          v-if="hasFunc"
          variant="primary"
          size="md"
          @click="handleSaveRoleUser"
        >
          저장
        </UiButton>
      </div>
    </div>

    <div class="ur-panels">
      <!-- 인사조직 -->
      <OrgTreePanel
        class="ur-p"
        :selected-org-id="selectedOrgId"
        @select="handleSelectOrg"
        @loaded="setOrgPaths"
      />

      <!-- 직원목록 -->
      <div class="codes-left ur-p">
        <div class="codes-left-header flex justify-between items-center">
          <p class="com-setting-section-title is-inline">
            직원목록 <span class="ur-count">{{ highlightLeftIds.length }}</span>
          </p>
          <button
            v-if="visibleOrgUserList.length > 0"
            type="button"
            class="ur-link-btn"
            @click="highlightAllVisibleUsers"
          >
            전체 선택
          </button>
        </div>
        <div
          v-if="isUserLoading"
          class="ur-state-box"
        >
          <p class="ur-state-text">불러오는 중...</p>
        </div>
        <ul
          v-else-if="visibleOrgUserList.length > 0"
          class="ur-user-list ur-scroll"
        >
          <li
            v-for="user in visibleOrgUserList"
            :key="user.userId"
            class="ur-user-item org-manage-tree-item org-manage-tree-row flex items-center"
            :class="{
              'is-assigned': isUserSelected(user.userId),
              'is-selected': highlightLeftIds.includes(user.userId),
            }"
            :title="isUserSelected(user.userId) ? '이미 선택직원에 포함됨' : ''"
            @click="!isUserSelected(user.userId) && toggleHighlight('left', user.userId)"
            @dblclick="!isUserSelected(user.userId) && addSelectedUsers([user.userId])"
          >
            <div class="ur-user-avatar"><i class="icon icon-user size-16" /></div>
            <div class="ur-user-info">
              <div class="ur-user-identity">
                <span class="ur-user-name">{{ user.userNm }}</span>
                <span class="ur-user-secondary">{{ user.userId }}</span>
              </div>
              <span class="ur-user-secondary">{{ getOrgPath(user) }}</span>
            </div>
            <span
              v-if="isUserSelected(user.userId)"
              class="ur-assigned-tag"
              >선택됨</span
            >
            <i
              v-else-if="highlightLeftIds.includes(user.userId)"
              class="icon icon-check size-16 ur-check-icon"
            />
          </li>
        </ul>
        <div
          v-else
          class="ur-state-box"
        >
          <p class="ur-state-text">조건에 맞는 직원이 없습니다.</p>
        </div>
      </div>

      <!-- 이동 버튼 -->
      <div class="ur-mid">
        <UiButton
          class="ur-mid-btn"
          variant="primary"
          size="md"
          icon-only
          aria-label="선택직원에 추가"
          :disabled="!hasFunc"
          @click="addSelectedUsers()"
        >
          <template #icon-left>
            <UiIcon
              name="chevron-right"
              size="18"
            />
          </template>
        </UiButton>
        <UiButton
          class="ur-mid-btn"
          variant="primary-line"
          size="md"
          icon-only
          aria-label="선택직원에서 제외"
          :disabled="!hasFunc"
          @click="removeSelectedUsers()"
        >
          <template #icon-left>
            <UiIcon
              name="chevron-left"
              size="18"
            />
          </template>
        </UiButton>
      </div>

      <!-- 선택직원 -->
      <div class="codes-left ur-p">
        <div class="codes-left-header flex justify-between items-center">
          <p class="com-setting-section-title is-inline">
            선택직원 <span class="ur-count">{{ highlightRightIds.length }}</span>
          </p>
          <button
            v-if="hasFunc && selectedUserList.length > 0"
            type="button"
            class="ur-link-btn is-danger"
            @click="clearSelectedUsers"
          >
            전체 해제
          </button>
        </div>
        <ul
          v-if="selectedUserList.length > 0"
          class="ur-user-list ur-scroll"
        >
          <li
            v-for="user in selectedUserList"
            :key="user.userId"
            class="ur-user-item org-manage-tree-item org-manage-tree-row flex items-center"
            :class="{ 'is-selected': highlightRightIds.includes(user.userId) }"
            @click="toggleHighlight('right', user.userId)"
            @dblclick="removeSelectedUsers([user.userId])"
          >
            <div class="ur-user-avatar"><i class="icon icon-user size-16" /></div>
            <div class="ur-user-info">
              <div class="ur-user-identity">
                <span class="ur-user-name">{{ user.userNm }}</span>
                <span class="ur-user-secondary">{{ user.userId }}</span>
              </div>
              <span class="ur-user-secondary ur-selected-user-org">{{ getOrgPath(user) }}</span>
            </div>
            <button
              v-if="hasFunc"
              type="button"
              class="ur-remove-btn"
              aria-label="선택 해제"
              @click.stop="removeSelectedUsers([user.userId])"
            >
              <i class="icon icon-close-gray size-14" />
            </button>
          </li>
        </ul>
        <div
          v-else
          class="ur-state-box"
        >
          <p class="ur-state-text">선택된 직원이 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import excelIcon from '~/assets/icons/svg/xlsx_icon.svg'
import { UiButton, UiIcon, UiInput, UiSelect } from '@leechanyong/ispark-ui'
import OrgTreePanel from '~/components/common/OrgTreePanel.vue'
import type { OrgTreeItem } from '~/types/org-manage'
import type { RoleUserItem } from '~/types/role-manage'

const emit = defineEmits<{
  'open-excel-upload': []
}>()

const orgPaths = shallowRef(new Map<string, string>())

const getOrgPath = ({ orgId, orgNm }: RoleUserItem) =>
  (orgId && orgPaths.value.get(orgId)) || orgNm || '소속 조직 없음'

const setOrgPaths = (nodes: OrgTreeItem[]) => {
  const paths = new Map<string, string>()
  const visit = (items: OrgTreeItem[], parentPath = '') => {
    for (const item of items) {
      const path = [parentPath, item.orgNm].filter(Boolean).join(' > ')
      paths.set(item.orgId, path.replace(/^\(주\)이즈파크 > ISPARK > /, ''))
      visit(item.children ?? [], path)
    }
  }
  visit(nodes)
  orgPaths.value = paths
}

const {
  userRoleId,
  activeRoleOptions,
  selectedOrgId,
  nameKeyword,
  visibleOrgUserList,
  selectedUserList,
  highlightLeftIds,
  highlightRightIds,
  isUserLoading,
  handleChangeUserRole,
  handleSelectOrg,
  handleSearchUser,
  isUserSelected,
  toggleHighlight,
  addSelectedUsers,
  removeSelectedUsers,
  highlightAllVisibleUsers,
  clearSelectedUsers,
  handleSaveRoleUser,
  handleDownloadExcel,
  hasFunc,
} = useRoleManageStore()

</script>
