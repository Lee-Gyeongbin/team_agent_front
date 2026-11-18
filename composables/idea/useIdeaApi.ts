import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type {
  IdeaAgent,
  IdeaCode,
  IdeaDetail,
  IdeaFormData,
  IdeaListItem,
  IdeaListResponse,
  IdeaManageFormData,
  IdeaResult,
  IdeaSearchParams,
} from '~/types/idea'

/** 아이디어 / 아이디어 관리 API (IdeaController — /idea) */
export const useIdeaApi = () => {
  const { post } = useApi()

  /** 목록 (15건 페이징) */
  const fetchIdeaList = (params: IdeaSearchParams) => post<IdeaListResponse>('/idea/list.do', params)

  /** 상세 (첨부파일·내 추천 여부 포함) */
  const fetchIdeaDetail = (ideaId: string) => post<IdeaResult<IdeaDetail>>('/idea/detail.do', { ideaId })

  /** 구분(ID000002)·진행상태(ID000001) 공통코드 + 에이전트 목록 */
  const fetchIdeaCodeList = () =>
    post<{ typeList: IdeaCode[]; statusList: IdeaCode[]; agentList: IdeaAgent[] }>('/idea/codeList.do', {})

  /** 등록·수정 — 폼 필드 + 새 파일(files) + 삭제할 저장 파일 ID(deleteFileIds) */
  const fetchSaveIdea = (form: IdeaFormData) => {
    const formData = new FormData()
    if (form.ideaId) formData.append('ideaId', form.ideaId)
    formData.append('ideaTypeCd', form.ideaTypeCd)
    formData.append('agentId', form.agentId)
    formData.append('title', form.title)
    formData.append('content', form.content)
    form.deleteFileIds.forEach((id) => formData.append('deleteFileIds', id))
    form.files.forEach(({ file }) => {
      if (file) formData.append('files', file)
    })
    return useApi_multipart<IdeaResult & { ideaId?: string }>('/idea/save.do', { method: 'POST', body: formData })
  }

  /** 삭제 (본인 글 + 코멘트 전) */
  const fetchDeleteIdea = (ideaId: string) => post<IdeaResult>('/idea/delete.do', { ideaId })

  /** 추천 / 추천 취소 */
  const fetchToggleIdeaLike = (ideaId: string) =>
    post<IdeaResult<Pick<IdeaDetail, 'ideaId' | 'likeCnt' | 'likedYn'>>>('/idea/like.do', { ideaId })

  /** 첨부파일 다운로드 URL */
  const fetchIdeaFileDownloadUrl = (ideaFileId: string) =>
    post<IdeaResult & { url?: string }>('/idea/fileDownloadUrl.do', { ideaFileId })

  /** [관리] 엑셀용 전체 목록 (현재 조회 조건) */
  const fetchIdeaExcelList = (params: Omit<IdeaSearchParams, 'pageIndex'>) =>
    post<{ dataList: IdeaListItem[] }>('/idea/manage/excelList.do', params)

  /** [관리] 진행상태·관리자 코멘트 저장 */
  const fetchSaveIdeaManage = (ideaId: string, form: IdeaManageFormData) =>
    post<IdeaResult>('/idea/manage/save.do', { ideaId, ...form })

  /** [관리] 삭제 (다른 사람 글 포함) */
  const fetchDeleteIdeaManage = (ideaId: string) => post<IdeaResult>('/idea/manage/delete.do', { ideaId })

  return {
    fetchIdeaList,
    fetchIdeaDetail,
    fetchIdeaCodeList,
    fetchSaveIdea,
    fetchDeleteIdea,
    fetchToggleIdeaLike,
    fetchIdeaFileDownloadUrl,
    fetchIdeaExcelList,
    fetchSaveIdeaManage,
    fetchDeleteIdeaManage,
  }
}
