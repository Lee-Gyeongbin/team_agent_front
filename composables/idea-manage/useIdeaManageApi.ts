import { useApi } from '~/composables/com/useApi'
import type { IdeaExcelItem, IdeaManageFormData, IdeaResult, IdeaSearchParams } from '~/types/idea'

export const useIdeaManageApi = () => {
  const { post } = useApi()

  /** [관리] 엑셀용 전체 목록 (현재 조회 조건) */
  const fetchIdeaExcelList = (params: Omit<IdeaSearchParams, 'pageIndex'>) =>
    post<{ dataList: IdeaExcelItem[] }>('/idea/manage/excelList.do', params)

  /** [관리] 진행상태·관리자 코멘트 저장 */
  const fetchSaveIdeaManage = (ideaId: string, form: IdeaManageFormData) =>
    post<IdeaResult>('/idea/manage/save.do', { ideaId, ...form })

  /** [관리] 삭제 (다른 사람 글 포함) */
  const fetchDeleteIdeaManage = (ideaId: string) => post<IdeaResult>('/idea/manage/delete.do', { ideaId })

  return {
    fetchIdeaExcelList,
    fetchSaveIdeaManage,
    fetchDeleteIdeaManage,
  }
}
