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
      <label>성명</label>
      <div class="ur-filter-name">
        <UiInput
          v-model="nameKeyword"
          type="search"
          size="md"
          placeholder="성명·ID·이메일 입력"
          @search="handleSearchUser"
          @enter="handleSearchUser"
        />
      </div>
      <div class="ur-right">
        <UiDropdownMenu
          v-if="hasFunc"
          :items="excelMenuItems"
          align="end"
          @select="onExcelMenuSelect"
        >
          <template #trigger>
            <UiButton
              variant="ghost"
              size="md"
            >
              엑셀
              <template #icon-right>
                <UiIcon
                  name="chevron-down"
                  size="14"
                />
              </template>
            </UiButton>
          </template>
        </UiDropdownMenu>
        <UiButton
          variant="outline"
          size="md"
          @click="handleSearchUser"
        >
          <template #icon-left>
            <UiIcon
              name="search"
              size="16"
            />
          </template>
          검색
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
      <div class="codes-left ur-p">
        <div class="codes-left-header flex items-center">
          <p class="com-setting-section-title is-inline">인사조직</p>
        </div>
        <div class="ur-org-tree ur-scroll">
          <div
            v-if="orgTree.length === 0"
            class="ur-state-box"
          >
            <p class="ur-state-text">조직 정보가 없습니다.</p>
          </div>
          <UserSelectOrgTreeNode
            v-for="node in orgTree"
            :key="node.orgId"
            :node="node"
            :selected-org-id="selectedOrgId"
            @select="handleSelectOrg"
            @toggle="handleToggleOrgExpand"
          />
        </div>
      </div>

      <!-- 직원목록 -->
      <div class="codes-left ur-p">
        <div class="codes-left-header flex justify-between items-center">
          <p class="com-setting-section-title is-inline">
            직원목록 <span class="ur-count">{{ visibleOrgUserList.length }}</span>
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
            class="ur-user-item"
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
              <span class="ur-user-name">{{ user.userNm }}</span>
              <span class="ur-user-email">{{ user.email }}</span>
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
            선택직원 <span class="ur-count">{{ selectedUserList.length }}</span>
          </p>
          <button
            v-if="selectedUserList.length > 0"
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
            class="ur-user-item"
            :class="{ 'is-selected': highlightRightIds.includes(user.userId) }"
            @click="toggleHighlight('right', user.userId)"
            @dblclick="removeSelectedUsers([user.userId])"
          >
            <div class="ur-user-avatar"><i class="icon icon-user size-16" /></div>
            <div class="ur-user-info">
              <span class="ur-user-name">{{ user.userNm }}</span>
              <span class="ur-user-email">{{ user.email }}</span>
            </div>
            <button
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
import { UiButton, UiDropdownMenu, UiIcon, UiInput, UiSelect } from '@leechanyong/ispark-ui'
import UserSelectOrgTreeNode from '~/components/common/UserSelectOrgTreeNode.vue'

const emit = defineEmits<{
  'open-excel-upload': []
}>()

const {
  userRoleId,
  activeRoleOptions,
  orgTree,
  selectedOrgId,
  nameKeyword,
  visibleOrgUserList,
  selectedUserList,
  highlightLeftIds,
  highlightRightIds,
  isUserLoading,
  handleChangeUserRole,
  handleSelectOrg,
  handleToggleOrgExpand,
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

const excelMenuItems = [
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '업로드', value: 'upload', icon: 'icon-upload' },
]

const onExcelMenuSelect = (value: string): void => {
  if (value === 'download') handleDownloadExcel('user')
  else if (value === 'upload') emit('open-excel-upload')
}
</script>
