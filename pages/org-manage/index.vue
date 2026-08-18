<template>
  <div class="org-manage-index wide-center">
    <div class="org-manage-header">
      <div class="org-manage-header-actions">
        <UiDropdownMenu
          :items="excelMenuItems"
          align="start"
          @select="onExcelMenuSelect"
        >
          <template #trigger>
            <UiButton
              variant="ghost"
              size="md"
            >
              엑셀
              <template #icon-right>
                <UiIcon name="chevron-down" size="14" />
              </template>
            </UiButton>
          </template>
        </UiDropdownMenu>
        <div class="org-manage-header-search">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="조직/팀원 검색"
          />
        </div>
        <UiButton
          variant="ghost"
          size="md"
          @click="handleRefreshOrgManage"
        >
          <template #icon-left>
            <UiIcon name="refresh-cw" size="16" />
          </template>
          새로고침
        </UiButton>
      </div>
    </div>
    <div class="org-manage-split">
      <OrgManageOrgTreePanel :search-keyword="searchKeyword" />
      <OrgManageMemberPanel
        :selected-org-id="selectedOrgId"
        :selected-org-name="selectedOrgName"
        :org-user-list="filteredOrgUserList"
        :is-loading="orgUserListLoading"
        :error-message="orgUserErrorMessage"
        @retry="onRetryOrgUserList"
      />
    </div>
    <OrgManageExcelUploadModal
      :is-open="isExcelUploadModalOpen"
      @close="closeExcelUploadModal"
    />
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiDropdownMenu, UiIcon, UiInput } from '@leechanyong/ispark-ui'
import { computed, ref } from 'vue'
import OrgManageExcelUploadModal from '~/components/org-manage/OrgManageExcelUploadModal.vue'
import OrgManageMemberPanel from '~/components/org-manage/OrgManageMemberPanel.vue'
import OrgManageOrgTreePanel from '~/components/org-manage/OrgManageOrgTreePanel.vue'

definePageMeta({ layout: 'default' })

const {
  selectedOrgId,
  orgList,
  orgUserList,
  orgUserListLoading,
  orgUserErrorMessage,
  handleRefreshOrgManage,
  handleFetchOrgUserList,
  handleDownloadOrgExcel,
} = useOrgManageStore()

const searchKeyword = ref('')
const isExcelUploadModalOpen = ref(false)

const openExcelUploadModal = (): void => {
  isExcelUploadModalOpen.value = true
}

// 엑셀 드롭다운 (다운로드 / 업로드)
const excelMenuItems = [
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '업로드', value: 'upload', icon: 'icon-upload' },
]

const onExcelMenuSelect = (value: string): void => {
  if (value === 'download') handleDownloadOrgExcel()
  else if (value === 'upload') openExcelUploadModal()
}

const closeExcelUploadModal = (): void => {
  isExcelUploadModalOpen.value = false
}

const selectedOrgName = computed(() => {
  if (selectedOrgId.value == null) return ''
  return orgList.value.find((o) => o.orgId === selectedOrgId.value)?.orgNm ?? ''
})

const filteredOrgUserList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return orgUserList.value
  return orgUserList.value.filter((member) => {
    const userNm = String(member.userNm ?? '').toLowerCase()
    const userId = String(member.userId ?? '').toLowerCase()
    const email = String(member.email ?? '').toLowerCase()
    return userNm.includes(keyword) || userId.includes(keyword) || email.includes(keyword)
  })
})

const onRetryOrgUserList = (): void => {
  const id = selectedOrgId.value
  if (id) void handleFetchOrgUserList(id)
}

onMounted(() => {
  void handleRefreshOrgManage()
})
</script>
