import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { OrgItem } from '~/types/org-manage'
import { useOrgManageApi } from '~/composables/org-manage/useOrgManageApi'

const orgList = ref<OrgItem[]>([])

export const useOrgManageStore = (): {
  orgList: Ref<OrgItem[]>
  handleFetchOrgList: () => Promise<void>
  orgOptions: ComputedRef<{ label: string; value: string }[]>
} => {
  const { fetchOrgList } = useOrgManageApi()

  const handleFetchOrgList = async (): Promise<void> => {
    try {
      const list = await fetchOrgList()
      orgList.value = list
    } catch {
      orgList.value = []
    }
  }

  const orgOptions = computed(() => orgList.value.map((item) => ({ label: item.orgNm, value: item.orgId })))

  return {
    orgList,
    handleFetchOrgList,
    orgOptions,
  }
}
