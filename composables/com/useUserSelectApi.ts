import { useApi } from '~/composables/com/useApi'
import type { OrgItem, OrgUserItem } from '~/types/org-manage'

/** 사용자 선택 모달용 조직/사용자 API (공통 사용) */
export const useUserSelectApi = () => {
  const { get, post } = useApi()

  /** 전체 조직 목록 조회 */
  const fetchOrgList = async (): Promise<OrgItem[]> => {
    const res = await get<{ list?: OrgItem[] }>('/orgmanage/selectOrgList.do')
    return res.list ?? []
  }

  /** 특정 조직의 소속 사용자 목록 조회 */
  const fetchOrgUserList = async (orgId: string): Promise<OrgUserItem[]> => {
    const res = await post<{ list?: OrgUserItem[] }>('/orgmanage/selectUserList.do', { orgId })
    return res.list ?? []
  }

  return { fetchOrgList, fetchOrgUserList }
}
