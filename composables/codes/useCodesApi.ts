import { useApi } from '~/composables/com/useApi'
import type { CodeGroupItem } from '~/types/codes'

/** 정렬순서 업데이트 요청 항목 */
export interface CodeSortOrderItem {
  codeId: string
  sortOrder: number
}

export const useCodesApi = () => {
  const { post } = useApi()

  /** 공통코드 그룹 목록 조회 */
  const fetchCodeGroupList = async (): Promise<{ codesVO: Record<string, unknown>; dataList: CodeGroupItem[] }> => {
    return post<{ dataList: CodeGroupItem[] }>('/codes/groupList.do', {})
  }

  /** 공통코드 추가 */
  const fetchSaveCodeGroup = async (codeGroupItem: CodeGroupItem): Promise<{ data: CodeGroupItem }> => {
    return post<{ data: CodeGroupItem }>('/codes/saveGroup.do', codeGroupItem)
  }

  /** 공통코드 정렬순서 일괄 업데이트 */
  const fetchUpdateCodeSortOrder = async (groupCode: string, items: CodeSortOrderItem[]): Promise<void> => {
    await post('/codes/updateSortOrder.do', { groupCode, items })
  }

  return { fetchCodeGroupList, fetchSaveCodeGroup, fetchUpdateCodeSortOrder }
}
