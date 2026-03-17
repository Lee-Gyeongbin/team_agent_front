import { useApi } from '~/composables/com/useApi'
import type { CodeItem } from '~/types/codes'

/** 공통코드 조회 API */
export const useCommonCodesApi = () => {
  const { post } = useApi()

  /**
   * 공통코드 목록 조회 (공통 사용)
   * - 코드그룹 ID 기준 상세코드 목록 반환
   */
  const fetchCodes = async (codeGrpId: string): Promise<{ codesVO: Record<string, unknown>; dataList: CodeItem[] }> => {
    return post<{ codesVO: Record<string, unknown>; dataList: CodeItem[] }>('/codes/list.do', { codeGrpId })
  }

  return {
    fetchCodes,
  }
}
