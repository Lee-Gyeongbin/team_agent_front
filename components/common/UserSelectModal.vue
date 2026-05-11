<template>
  <!-- 사용자 선택 모달 (공통) -->
  <div
    class="user-select-modal"
    :class="{ 'is-show': isOpen }"
  >
    <!-- 오버레이 -->
    <div
      class="user-select-modal-overlay"
      @click="onClose"
    />

    <div class="user-select-modal-content">
      <!-- 헤더 -->
      <div class="user-select-modal-header">
        <h3 class="user-select-modal-title">{{ title }}</h3>
        <button
          class="btn btn-modal-close"
          @click="onClose"
        >
          <i class="icon icon-close-gray size-18"></i>
        </button>
      </div>

      <!-- 바디 (좌: 조직도 / 우: 선택된 사용자) -->
      <div class="user-select-modal-body">
        <!-- 왼쪽: 조직도 트리 + 사용자 목록 -->
        <div class="us-panel us-panel-org">
          <p class="us-panel-label">조직도</p>

          <!-- 로딩 -->
          <div
            v-if="orgListLoading"
            class="us-state-box"
          >
            <UiSpinner size="sm" />
          </div>

          <!-- 에러 -->
          <div
            v-else-if="orgListError"
            class="us-state-box"
          >
            <p class="us-state-text is-error">{{ orgListError }}</p>
            <UiButton
              size="xs"
              variant="outline"
              @click="handleFetchOrgList"
              >재시도</UiButton
            >
          </div>

          <!-- 조직 트리 + 사용자 목록 -->
          <template v-else>
            <!-- 조직 트리 -->
            <div class="us-org-tree">
              <div
                v-if="orgTree.length === 0"
                class="us-state-box"
              >
                <p class="us-state-text">조직 정보가 없습니다.</p>
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

            <!-- 선택된 조직의 사용자 목록 -->
            <div
              v-if="selectedOrgId"
              class="us-org-users"
            >
              <p class="us-panel-sub-label">소속 팀원</p>

              <!-- 사용자 목록 로딩 -->
              <div
                v-if="orgUserListLoading"
                class="us-state-box"
              >
                <UiSpinner size="sm" />
              </div>

              <!-- 사용자 목록 에러 -->
              <div
                v-else-if="orgUserListError"
                class="us-state-box"
              >
                <p class="us-state-text is-error">{{ orgUserListError }}</p>
              </div>

              <!-- 사용자 없음 -->
              <div
                v-else-if="orgUserList.length === 0"
                class="us-state-box"
              >
                <p class="us-state-text">소속 팀원이 없습니다.</p>
              </div>

              <!-- 사용자 항목 -->
              <ul
                v-else
                class="us-user-list"
              >
                <li
                  v-for="user in orgUserList"
                  :key="user.userId"
                  class="us-user-item"
                  :class="{ 'is-selected': isUserSelected(user.userId) }"
                  @click="onUserClick(user)"
                >
                  <UiAvatar
                    :src="user.profileImgUrl ?? ''"
                    :alt="user.userNm"
                    size="sm"
                  />
                  <div class="us-user-info">
                    <span class="us-user-name">{{ user.userNm }}</span>
                    <span class="us-user-email">{{ user.email }}</span>
                  </div>
                  <i
                    v-if="isUserSelected(user.userId)"
                    class="icon icon-check size-16 us-user-check-icon"
                  />
                </li>
              </ul>
            </div>
          </template>
        </div>

        <!-- 오른쪽: 선택된 사용자 목록 -->
        <div class="us-panel us-panel-selected">
          <div class="us-panel-label-row">
            <p class="us-panel-label">
              선택된 사용자
              <span
                v-if="selectedUsers.length > 0"
                class="us-selected-count"
                >{{ selectedUsers.length }}</span
              >
            </p>
            <button
              v-if="selectedUsers.length > 0"
              class="btn-us-clear"
              @click="clearSelectedUsers"
            >
              전체 해제
            </button>
          </div>

          <!-- 선택된 사용자 없음 -->
          <div
            v-if="selectedUsers.length === 0"
            class="us-state-box"
          >
            <p class="us-state-text">선택된 사용자가 없습니다.</p>
          </div>

          <!-- 선택된 사용자 목록 -->
          <ul
            v-else
            class="us-selected-list"
          >
            <li
              v-for="user in selectedUsers"
              :key="user.userId"
              class="us-selected-item"
            >
              <UiAvatar
                :src="user.profileImgUrl ?? ''"
                :alt="user.userNm"
                size="sm"
              />
              <div class="us-user-info">
                <span class="us-user-name">{{ user.userNm }}</span>
                <span class="us-user-email">{{ user.email }}</span>
              </div>
              <button
                class="btn-us-remove"
                @click="removeSelectedUser(user.userId)"
              >
                <i class="icon icon-close-gray size-14" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 푸터 -->
      <div class="user-select-modal-footer">
        <UiButton
          variant="outline"
          size="sm"
          @click="onClose"
          >취소</UiButton
        >
        <UiButton
          variant="primary"
          size="sm"
          :disabled="selectedUsers.length === 0"
          @click="onConfirm"
          >{{ confirmText }}</UiButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrgUserItem } from '~/types/org-manage'
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    /** 모달 제목 */
    title?: string
    /** 확인 버튼 텍스트 */
    confirmText?: string
  }>(),
  {
    isOpen: false,
    title: '사용자 선택',
    confirmText: '확인',
  },
)

const emit = defineEmits<{
  close: []
  confirm: [users: OrgUserItem[]]
}>()

const {
  orgTree,
  orgListLoading,
  orgListError,
  selectedOrgId,
  orgUserList,
  orgUserListLoading,
  orgUserListError,
  selectedUsers,
  handleFetchOrgList,
  handleSelectOrg,
  handleToggleOrgExpand,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
} = useUserSelectStore()

const isUserSelected = (userId: string) => selectedUsers.value.some((u) => u.userId === userId)

const onUserClick = (user: OrgUserItem) => {
  if (isUserSelected(user.userId)) {
    removeSelectedUser(user.userId)
  } else {
    addSelectedUser(user)
  }
}

const onClose = () => {
  emit('close')
}

const onConfirm = () => {
  emit('confirm', [...selectedUsers.value])
  emit('close')
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.user-select-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity $transition-base,
    visibility $transition-base;

  &.is-show {
    opacity: 1;
    visibility: visible;

    .user-select-modal-content {
      transform: scale(1);
      opacity: 1;
    }
  }

  // 오버레이
  .user-select-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(45, 49, 57, 0.4);
  }

  // 모달 본체
  .user-select-modal-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: 640px;
    max-width: calc(100vw - 32px);
    height: 480px;
    max-height: calc(100vh - 80px);
    background: #fff;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-lg;
    transform: scale(0.96);
    opacity: 0;
    transition:
      transform $transition-base,
      opacity $transition-base;
    overflow: hidden;
  }

  // 헤더
  .user-select-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;

    .user-select-modal-title {
      color: $color-text-heading;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
    }

    .btn-modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: $border-radius-sm;
      transition: background $transition-fast;

      &:hover {
        background: $color-background;
      }
    }
  }

  // 바디 (좌우 패널)
  .user-select-modal-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  // 푸터
  .user-select-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid $color-border;
    flex-shrink: 0;
  }
}

// 패널 공통
.us-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 14px 16px;

  &.us-panel-org {
    flex: 1;
    min-width: 0;
  }

  &.us-panel-selected {
    width: 220px;
    flex-shrink: 0;
    border-left: 1px solid $color-border;
  }
}

// 패널 라벨
.us-panel-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $color-text-heading-sub;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  margin-bottom: 10px;
  flex-shrink: 0;

  .us-selected-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: var(--color-primary, $color-primary);
    color: #fff;
    font-size: 10px;
    font-weight: $font-weight-bold;
    border-radius: $border-radius-full;
  }
}

.us-panel-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-shrink: 0;

  .us-panel-label {
    margin-bottom: 0;
  }
}

.btn-us-clear {
  color: $color-text-secondary;
  font-size: $font-size-xs;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color $transition-fast;
  white-space: nowrap;

  &:hover {
    color: $color-error;
  }
}

.us-panel-sub-label {
  color: $color-text-disabled;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  margin: 10px 0 6px;
  flex-shrink: 0;
}

// 조직 트리 영역
.us-org-tree {
  overflow-y: auto;
  max-height: 180px;
  flex-shrink: 0;
  @include custom-scrollbar;
}

// 조직 소속 사용자 영역
.us-org-users {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

// 상태 박스 (로딩/에러/빈상태)
.us-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  flex: 1;

  .us-state-text {
    color: $color-text-disabled;
    font-size: $font-size-sm;
    text-align: center;

    &.is-error {
      color: $color-error;
    }
  }
}

// 사용자 항목 공통
.us-user-list,
.us-selected-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  @include custom-scrollbar;
}

.us-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $color-background;
  }

  &.is-selected {
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.06);
  }

  .us-user-check-icon {
    margin-left: auto;
    flex-shrink: 0;
    background-color: var(--color-primary, $color-primary);
  }
}

.us-selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: $border-radius-base;

  &:hover .btn-us-remove {
    opacity: 1;
  }
}

.us-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  .us-user-name {
    color: $color-text-primary;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include ellipsis(1);
  }

  .us-user-email {
    color: $color-text-disabled;
    font-size: $font-size-xs;
    @include ellipsis(1);
  }
}

.btn-us-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: $border-radius-sm;
  opacity: 0.4;
  transition:
    opacity $transition-fast,
    background $transition-fast;

  &:hover {
    opacity: 1;
    background: $color-background;
  }
}
</style>
