import { useApi } from '~/composables/com/useApi'
import type { CodeGroupItem, CodeItem } from '~/types/codes'

/** 정렬순서 업데이트 요청 항목 */
export interface CodeSortOrderItem {
  codeId: string
  sortOrd: number
}

export const useCodesApi = () => {
  const { post } = useApi()

  /** 그룹코드 목록 조회 */
  const fetchCodeGroupList = async (): Promise<{ codesVO: Record<string, unknown>; dataList: CodeGroupItem[] }> => {
    return post<{ codesVO: Record<string, unknown>; dataList: CodeGroupItem[] }>('/codes/groupList.do', {})
  }

  /** 그룹코드 등록/수정 */
  const fetchSaveCodeGroup = async (
    codeGroupItem: CodeGroupItem,
  ): Promise<{ codesVO: Record<string, unknown>; data: CodeGroupItem }> => {
    return post<{ codesVO: Record<string, unknown>; data: CodeGroupItem }>('/codes/saveGroup.do', codeGroupItem)
  }

  /** 그룹코드 삭제 */
  const fetchDeleteCodeGroup = async (
    codeGrpId: string,
  ): Promise<{ codesVO: Record<string, unknown>; data: CodeGroupItem }> => {
    return post<{ codesVO: Record<string, unknown>; data: CodeGroupItem }>('/codes/deleteGroup.do', { codeGrpId })
  }

  /** 상세코드 목록 조회 */
  const fetchCodeList = async (
    codeGrpId: string,
  ): Promise<{ codesVO: Record<string, unknown>; dataList: CodeItem[] }> => {
    return post<{ codesVO: Record<string, unknown>; dataList: CodeItem[] }>('/codes/list.do', { codeGrpId })
  }

  /** 상세코드 등록/수정 */
  const fetchSaveCode = async (codeItem: CodeItem): Promise<{ codesVO: Record<string, unknown>; data: CodeItem }> => {
    return post<{ codesVO: Record<string, unknown>; data: CodeItem }>('/codes/saveCode.do', codeItem)
  }

  /** 상세코드 정렬순서 일괄 업데이트 */
  const fetchUpdateCodeSortOrder = async (codeGrpId: string, items: CodeSortOrderItem[]): Promise<void> => {
    await post('/codes/updateSortOrder.do', { codeGrpId, items })
  }

  return {
    fetchCodeGroupList,
    fetchSaveCodeGroup,
    fetchDeleteCodeGroup,
    fetchCodeList,
    fetchSaveCode,
    fetchUpdateCodeSortOrder,
  }
}
