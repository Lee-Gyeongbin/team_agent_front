<template>
  <div class="org-manage-index wide-center">
    <div class="org-manage-header">
      <div class="org-manage-header-actions">
        <div class="org-manage-header-search">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="조직/팀원 검색"
          />
        </div>
        <UiButton
          variant="outline"
          size="md"
          @click="handleFetchOrgList"
        >
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import OrgManageMemberPanel from '~/components/org-manage/OrgManageMemberPanel.vue'
import OrgManageOrgTreePanel from '~/components/org-manage/OrgManageOrgTreePanel.vue'

definePageMeta({ layout: 'default' })

const {
  selectedOrgId,
  orgList,
  orgUserList,
  orgUserListLoading,
  orgUserErrorMessage,
  handleFetchOrgList,
  handleFetchOrgUserList,
} = useOrgManageStore()

const searchKeyword = ref('')

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

onMounted(async () => {
  await handleFetchOrgList()
})
</script>
