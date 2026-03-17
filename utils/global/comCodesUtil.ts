import { useCommonCodesApi } from '~/composables/com/useCommonCodesApi'
import type { CodeItem } from '~/types/codes'

/**
 * 공통코드 전역 유틸리티
 * - composable 자동 임포트 설정으로 어디서나 직접 호출 가능
 */
export const getCodes = async (codeGrpId: string): Promise<CodeItem[]> => {
  const { fetchCodes } = useCommonCodesApi()
  const res = await fetchCodes(codeGrpId)
  return (res.dataList ?? []) as CodeItem[]
}
