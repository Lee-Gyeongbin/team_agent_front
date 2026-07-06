<template>
  <div class="user-manage-index wide-center">
    <!-- 헤더 -->
    <div class="user-manage-header flex justify-between items-center">
      <div class="user-manage-header__right flex items-center">
        <UiButton
          variant="outline"
          size="md"
          @click="handleDownloadUserExcel"
        >
          <template #icon-left>
            <i class="icon icon-download size-16" />
          </template>
          엑셀 다운로드
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="openExcelUploadModal"
        >
          <template #icon-left>
            <i class="icon icon-document-search size-16" />
          </template>
          엑셀 업로드
        </UiButton>
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
        <UiButton
          variant="primary"
          size="md"
          @click="openUserManageEditModal(null)"
        >
          <template #icon-left>
            <i class="icon icon-plus size-16" />
          </template>
          사용자 추가
        </UiButton>
      </div>
    </div>

    <!-- 로딩 -->
    <UiLoading
      v-if="userManageIsLoading"
      overlay
      text="사용자 리스트를 불러오는 중..."
    />

    <!-- 에러 -->
    <div
      v-else-if="userManageErrorMessage"
      class="user-manage-error"
    >
      <p class="user-manage-error__message">{{ userManageErrorMessage }}</p>
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
          <template #cell-orgId="{ value }">
            {{ getOrgName(value) }}
          </template>
          <template #cell-acctStatusDesc="{ row }">
            <span
              class="user-manage-status"
              :class="
                (row as UserItem).acctStatusDesc === '잠금'
                  ? 'is-lock'
                  : (row as UserItem).acctStatusDesc === '비활성'
                    ? 'is-inactive'
                    : 'is-active'
              "
            >
              {{ (row as UserItem).acctStatusDesc }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div
              class="user-manage-cell-actions"
              @click.stop
            >
              <UiButton
                variant="outline"
                size="xs"
                @click="handleResetUserPassword(row as UserItem)"
              >
                비밀번호 초기화
              </UiButton>
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
                {{ (row as UserItem).acctStatusDesc === '비활성' ? '복구' : '삭제' }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </div>
    </div>

    <!-- 엑셀 업로드 모달 -->
    <UserManageExcelUploadModal
      :is-open="isExcelUploadModalOpen"
      @close="closeExcelUploadModal"
    />

    <!-- 사용자 추가/수정 모달 -->
    <UserManageModal
      :key="editingUserManage?.userId || (isUserManageModalOpen ? 'create' : 'closed')"
      :is-open="isUserManageModalOpen"
      :title="editingUserManage?.userId ? '사용자 수정' : '사용자 추가'"
      :user="editingUserManage"
      @close="closeUserManageModal"
      @confirm="onUserModalConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { UiLoading, UiTable } from '@leechanyong/ispark-ui'
import { userColumns, type UserItem } from '~/types/user-manage'
import { useUserManageStore } from '~/composables/user-manage/useUserManageStore'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import UserManageExcelUploadModal from '~/components/user-manage/UserManageExcelUploadModal.vue'

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
  handleResetUserPassword,
  handleDownloadUserExcel,
  getOrgName,
  formatPhone,
} = useUserManageStore()

const isExcelUploadModalOpen = ref(false)

const openExcelUploadModal = (): void => {
  isExcelUploadModalOpen.value = true
}

const closeExcelUploadModal = (): void => {
  isExcelUploadModalOpen.value = false
}

const { handleFetchOrgList } = useOrgManageStore()

const onUserModalConfirm = async (payload: Partial<UserItem> | undefined) => {
  if (!payload) return
  await handleUpdateUserManage(payload)
}

onMounted(() => {
  handleFetchUserManageList()
  handleFetchOrgList()
})
</script>
