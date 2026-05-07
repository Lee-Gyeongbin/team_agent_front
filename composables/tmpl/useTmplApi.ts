import { useApi } from '~/composables/com/useApi'
import type { TmplBaseInfo, TmplFormSavePayload } from '~/types/tmpl'

export const useTmplApi = () => {
  const { get, post } = useApi()

  /** 사용자 문서 템플릿 목록 조회 */
  const fetchTmplList = async (): Promise<{ dataList: TmplBaseInfo[] }> => {
    return get<{ dataList: TmplBaseInfo[] }>('/tmpl/list.do')
  }

  /** 템플릿 상세 조회 (필드 정의 포함, tmplType `T`일 때 사용) */
  const fetchTmplDetail = async (tmplId: string): Promise<{ data: TmplBaseInfo }> => {
    const res = await post<{ tmplDetail: TmplBaseInfo | null; tmplFieldList?: TmplBaseInfo['fields'] }>(
      '/tmpl/detail.do',
      {
        tmplId,
      },
    )
    const detail = res.tmplDetail
    return {
      data: {
        ...(detail ?? {
          tmplId,
          tmplNm: '',
          tmplType: 'T',
          description: '',
          llmPromptSmry: '',
          llmPrompt: '',
          tmplHtml: '',
          sysTmplYn: 'N',
          useYn: 'Y',
          createDt: '',
          modifyDt: '',
          fields: [],
        }),
        fields: res.tmplFieldList ?? [],
      },
    }
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
    fetchTmplDetail,
    fetchSaveTmpl,
    fetchDeleteTmpl,
  }
}
