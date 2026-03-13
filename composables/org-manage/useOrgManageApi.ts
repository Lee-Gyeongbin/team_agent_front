import { useApi } from '~/composables/com/useApi'
import type { OrgItem } from '~/types/org-manage'

/** 조직 목록 조회 */
export const useOrgManageApi = () => {
  const { get } = useApi()

  const fetchOrgList = async (): Promise<OrgItem[]> => {
    const res = await get<{ list: OrgItem[] }>('/orgmanage/selectOrgList.do')
    return res.list
  }

  return { fetchOrgList }
}
