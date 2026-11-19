<template>
  <div class="role-manage-index wide-center">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <RoleManageGroupTab
      v-if="activeTab === 'group'"
      @open-excel-upload="openExcelUploadModal"
    />
    <RoleManageUserTab
      v-else
      @open-excel-upload="openExcelUploadModal"
    />

    <RoleManageExcelUploadModal
      :is-open="isExcelUploadModalOpen"
      :kind="activeTab === 'group' ? 'role' : 'user'"
      @close="isExcelUploadModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { UiTab } from '@leechanyong/ispark-ui'
import RoleManageGroupTab from '~/components/role-manage/RoleManageGroupTab.vue'
import RoleManageUserTab from '~/components/role-manage/RoleManageUserTab.vue'
import RoleManageExcelUploadModal from '~/components/role-manage/RoleManageExcelUploadModal.vue'

definePageMeta({ layout: 'default', permission: 'read' })

const { activeTab, handleFetchRoleList, handleInitUserTab } = useRoleManageStore()

const tabItems = [
  { label: '권한 그룹', value: 'group' },
  { label: '사용자 지정', value: 'user' },
]

const isExcelUploadModalOpen = ref(false)
const openExcelUploadModal = (): void => {
  isExcelUploadModalOpen.value = true
}

watch(activeTab, (tab) => {
  if (tab === 'user') handleInitUserTab()
  else handleFetchRoleList()
})

onMounted(() => {
  activeTab.value = 'group'
  handleFetchRoleList()
})
</script>
