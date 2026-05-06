import { useApi } from '~/composables/com/useApi'
import type {
  InsertOrgPayload,
  OrgItem,
  OrgUserListResponse,
  UpdateOrgPayload,
  UpdateOrgSortOrderPayload,
} from '~/types/org-manage'

/** 조직 목록 조회 */
export const useOrgManageApi = () => {
  const { get, post } = useApi()

  const fetchOrgList = async (): Promise<OrgItem[]> => {
    const res = await get<{ list?: OrgItem[] }>('/orgmanage/selectOrgList.do')
    return res.list ?? []
  }

  const fetchSelectOrgUserList = async (orgId: string): Promise<OrgUserListResponse> => {
    return post<OrgUserListResponse>('/orgmanage/selectUserList.do', { orgId })
  }

  const fetchInsertOrg = async (payload: InsertOrgPayload): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/insertOrg.do', payload)
  }

  const fetchUpdateOrg = async (payload: UpdateOrgPayload): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/updateOrg.do', payload)
  }

  const fetchUpdateOrgOrder = async (
    payload: UpdateOrgSortOrderPayload,
  ): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/updateOrgSortOrder.do', payload)
  }

  const fetchDeleteOrg = async (orgId: string): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/deleteOrg.do', { orgId })
  }

  return { fetchOrgList, fetchSelectOrgUserList, fetchInsertOrg, fetchUpdateOrg, fetchUpdateOrgOrder, fetchDeleteOrg }
}
