<template>
  <div class="user-manage-index wide-center">
    <!-- 헤더 -->
    <div class="user-manage-header flex justify-between items-center">
      <p class="user-manage-description">사용자를 조회하고 관리할 수 있습니다.</p>
      <div class="user-manage-header__right flex items-center">
        <p class="user-manage-header__total">
          총 <strong>{{ userManageFilteredList.length }}명</strong>
        </p>
        <div class="user-manage-header__input-wrap shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="userManageSearchKeyword"
            type="search"
            placeholder="사용자 ID, 사용자 이름 검색"
            @search="handleFetchUserManageList"
            @enter="handleFetchUserManageList"
          />
        </div>
        <UiButton
          variant="ghost"
          size="md"
          @click="handleFetchUserManageList"
        >
          <template #icon-left>
            <i class="icon icon-refresh size-16" />
          </template>
          새로고침
        </UiButton>
      </div>
    </div>

    <!-- 로딩 -->
    <div
      v-if="userManageIsLoading"
      class="user-manage-loading"
    >
      <div class="user-loading__spinner" />
      <p class="user-loading__text">사용자 리스트를 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div
      v-else-if="userManageErrorMessage"
      class="user-manage-error"
    >
      <p class="user-error__message">{{ userManageErrorMessage }}</p>
      <UiButton
        variant="outline"
        size="md"
        @click="handleFetchUserManageList"
      >
        다시 시도
      </UiButton>
    </div>

    <!-- 사용자 리스트 -->
    <div
      v-else
      class="user-manage-list-wrap"
    >
      <div class="user-manage-list-table-wrap">
        <UiTable
          :columns="userColumns"
          :data="userManageFilteredList"
          sticky-header
          max-height="calc(100vh - 220px)"
          empty-text="조회된 사용자가 없습니다."
        >
          <template #cell-phone="{ value }">
            {{ formatPhone(value) }}
          </template>
          <template #cell-acctStatusCd="{ value }">
            {{ getAcctStatusName(value) }}
          </template>
          <template #cell-actions="{ row }">
            <div
              class="user-manage-cell-actions"
              @click.stop
            >
              <UiButton
                variant="outline"
                size="xs"
                @click="openUserManageEditModal(row as UserItem)"
              >
                수정
              </UiButton>
              <UiButton
                variant="outline"
                size="xs"
                @click="handleToggleUserManageStatus(row as UserItem)"
              >
                {{ getAcctStatusName((row as UserItem).acctStatusCd) === '비활성' ? '복구' : '삭제' }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </div>
    </div>

    <!-- 사용자 수정 모달 -->
    <UserManageModal
      :is-open="isUserManageModalOpen"
      title="사용자 수정"
      :user="editingUserManage"
      @close="closeUserManageModal"
      @confirm="onUserModalConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { userColumns, type UserItem } from '~/types/user-manage'
import { useUserManageStore } from '~/composables/user-manage/useUserManageStore'

const {
  userManageSearchKeyword,
  userManageFilteredList,
  userManageIsLoading,
  userManageErrorMessage,
  isUserManageModalOpen,
  editingUserManage,
  openUserManageEditModal,
  closeUserManageModal,
  handleToggleUserManageStatus,
  handleUpdateUserManage,
  handleFetchUserManageList,
  handleFetchUserManageAcctStatusCodes,
  getAcctStatusName,
  formatPhone,
} = useUserManageStore()

const onUserModalConfirm = async (payload: Partial<UserItem> | undefined) => {
  if (!payload) return
  await handleUpdateUserManage(payload)
}

onMounted(() => {
  handleFetchUserManageAcctStatusCodes()
  handleFetchUserManageList()
})
</script>

<style lang="scss" scoped>
.user-manage-index {
  padding: $spacing-md;
  min-height: calc(100vh - #{$header-height});
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.user-manage-description {
  color: $color-text-secondary;
  font-size: $font-size-base;
}

.user-manage-header {
  padding: 12px 0;
  margin-bottom: $spacing-md;
}

.user-manage-header__right {
  gap: $spacing-sm;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;

  .user-manage-header__total {
    font-size: $font-size-base;
    color: $color-text-secondary;
    white-space: nowrap;

    strong {
      color: $color-text-primary;
    }
  }
}

.user-manage-header__input-wrap {
  min-width: 0;
}

.user-manage-list-table-wrap {
  width: 100%;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.user-manage-loading {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;
  min-height: 240px;

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid $color-border;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: user-manage-spin 0.8s linear infinite;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

@keyframes user-manage-spin {
  to {
    transform: rotate(360deg);
  }
}

.user-manage-cell-actions {
  display: flex;
  gap: $spacing-xs;
  justify-content: center;
}

.user-manage-error {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;
  min-height: 240px;

  &__message {
    font-size: $font-size-sm;
    color: $color-error;
  }
}
</style>
