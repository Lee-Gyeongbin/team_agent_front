import { useApi } from '~/composables/com/useApi'
import type { TmplBaseInfo, TmplFormSavePayload } from '~/types/tmpl'

export const useTmplApi = () => {
  const { get, post } = useApi()

  /** 사용자 문서 템플릿 목록 조회 */
  const fetchTmplList = async (): Promise<{ dataList: TmplBaseInfo[] }> => {
    return get<{ dataList: TmplBaseInfo[] }>('/tmpl/list.do')
  }

  /** 템플릿 저장 */
  const fetchSaveTmpl = async (payload: TmplFormSavePayload) => {
    return post<{ data: TmplBaseInfo }>('/tmpl/save.do', payload)
  }

  /** 템플릿 삭제 */
  const fetchDeleteTmpl = async (tmplId: string) => {
    return post<{ data: { tmplId: string } }>('/tmpl/delete.do', { tmplId })
  }

  return {
    fetchTmplList,
    fetchSaveTmpl,
    fetchDeleteTmpl,
  }
}
